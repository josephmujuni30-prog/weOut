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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always respond 200 immediately — Daraja retries if it doesn't get a quick response
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const cb = req.body?.Body?.stkCallback;
    if (!cb) return;
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = cb;
    const db = getDb();

    const snap = await db.collection('bookings')
      .where('mpesaCheckoutRequestId', '==', CheckoutRequestID)
      .get();

    if (snap.empty) return;

    if (ResultCode === 0) {
      const meta: Record<string, any> = {};
      (CallbackMetadata?.Item || []).forEach((item: any) => { meta[item.Name] = item.Value; });

      await db.collection('bookings').doc(snap.docs[0].id).update({
        paymentStatus: 'completed',
        mpesaReceiptNumber: meta.MpesaReceiptNumber || null,
        mpesaPhoneNumber: meta.PhoneNumber ? String(meta.PhoneNumber) : null,
        mpesaAmount: meta.Amount || null,
      });

      const booking = snap.docs[0].data();
      await db.collection('notifications').add({
        userId: booking.userId,
        title: 'Payment Confirmed! 🎉',
        message: `M-Pesa receipt: ${meta.MpesaReceiptNumber}`,
        type: 'booking', read: false,
        createdAt: admin.firestore.Timestamp.now(),
        eventId: booking.eventId,
      });
    } else {
      await db.collection('bookings').doc(snap.docs[0].id).update({
        paymentStatus: 'failed', mpesaResultDesc: ResultDesc,
      });
    }
  } catch (e) { console.error('Callback error:', e); }
}
