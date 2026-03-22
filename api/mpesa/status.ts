import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

function getDb() {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  const { Firestore } = require('@google-cloud/firestore');
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf8')
  );
  return new Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseId: process.env.FIREBASE_DATABASE_ID || '(default)',
    credentials: serviceAccount,
  });
}

const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const BASE_URL  = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getMpesaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json() as { access_token: string };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 3500 * 1000;
  return cachedToken;
}

function getMpesaPassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');
  return { password, timestamp };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const checkoutRequestId = req.query.id as string;
  if (!checkoutRequestId) { res.status(400).json({ status: 'error' }); return; }

  try {
    const db = getDb();

    // Check Firestore first
    const snap = await db.collection('bookings')
      .where('mpesaCheckoutRequestId', '==', checkoutRequestId)
      .get();

    if (!snap.empty) {
      const booking = snap.docs[0].data();
      if (booking.paymentStatus === 'completed' || booking.paymentStatus === 'failed') {
        res.json({ status: booking.paymentStatus, bookingId: snap.docs[0].id, receiptNumber: booking.mpesaReceiptNumber || null });
        return;
      }
    }

    // Query Daraja directly
    const token = await getMpesaToken();
    const { password, timestamp } = getMpesaPassword();
    const qRes = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password, Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });
    const qData = await qRes.json() as any;
    const code = String(qData.ResultCode ?? '');

    if (code === '0') {
      if (!snap.empty) {
        await db.collection('bookings').doc(snap.docs[0].id).update({
          paymentStatus: 'completed',
          mpesaReceiptNumber: qData.MpesaReceiptNumber || 'OK',
        });
        const booking = snap.docs[0].data();
        await db.collection('notifications').add({
          userId: booking.userId,
          title: 'Payment Confirmed! 🎉',
          message: 'Your M-Pesa payment was received.',
          type: 'booking', read: false,
          createdAt: admin.firestore.Timestamp.now(),
          eventId: booking.eventId,
        });
      }
      res.json({ status: 'completed', bookingId: snap.docs[0]?.id, receiptNumber: qData.MpesaReceiptNumber || 'OK' });
    } else if (code === '1037') {
      res.json({ status: 'timeout', reason: 'Payment timed out. Please try again.' });
    } else if (code !== '' && code !== '1032' && code !== '2001') {
      if (!snap.empty) await db.collection('bookings').doc(snap.docs[0].id).update({ paymentStatus: 'failed' });
      res.json({ status: 'failed', reason: qData.ResultDesc || 'Payment failed' });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (error: any) {
    console.error('Status error:', error);
    res.status(500).json({ status: 'error' });
  }
}
