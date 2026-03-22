import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// ─── Firebase Admin init ──────────────────────────────────────────────────────
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

// ─── M-Pesa helpers ───────────────────────────────────────────────────────────
const MPESA_ENV  = process.env.MPESA_ENV || 'sandbox';
const BASE_URL   = MPESA_ENV === 'production'
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

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0'))    return `254${clean.slice(1)}`;
  if (clean.startsWith('+'))   return clean.slice(1);
  if (clean.startsWith('254')) return clean;
  return `254${clean}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { phone, amount, bookingId, eventTitle } = req.body;

  if (!phone || !amount || !bookingId) {
    res.status(400).json({ success: false, message: 'phone, amount, and bookingId are required' });
    return;
  }

  try {
    const db = getDb();
    const token = await getMpesaToken();
    const { password, timestamp } = getMpesaPassword();
    const formattedPhone = formatPhone(phone);
    const callbackUrl = MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : `${process.env.APP_URL}/api/mpesa/callback`;

    const body = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `weOut-${bookingId.slice(0, 8)}`,
      TransactionDesc: eventTitle ? `Ticket: ${eventTitle}`.slice(0, 50) : 'weOut Ticket',
    };

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const stkData = await stkRes.json() as any;

    if (stkData.ResponseCode === '0' && stkData.CheckoutRequestID) {
      await db.collection('bookings').doc(bookingId).update({
        paymentStatus: 'pending',
        mpesaCheckoutRequestId: stkData.CheckoutRequestID,
      });
      res.json({ success: true, checkoutRequestId: stkData.CheckoutRequestID });
    } else {
      res.status(400).json({ success: false, message: stkData.errorMessage || 'STK Push failed' });
    }
  } catch (error: any) {
    console.error('STK Push error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
