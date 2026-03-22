// ─── Load env vars FIRST ──────────────────────────────────────────────────────
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

// ─── Imports ──────────────────────────────────────────────────────────────────
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cron from 'node-cron';
import { createRequire } from 'module';
import fs from 'fs';

// firebase-admin is CJS — load via createRequire so it works in ESM projects
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// ─── Load Firebase config ─────────────────────────────────────────────────────
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8')
);

const PROJECT_ID  = firebaseConfig.projectId;       // e.g. gen-lang-client-0555876362
const DATABASE_ID = firebaseConfig.firestoreDatabaseId; // e.g. ai-studio-ec0ee5a5-...

// ─── Firebase Admin init ──────────────────────────────────────────────────────
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

if (!admin.apps.length) {
  const appConfig: any = { projectId: PROJECT_ID };

  if (fs.existsSync(serviceAccountPath)) {
    appConfig.credential = admin.credential.cert(
      JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    );
    console.log('✅ Firebase Admin: using service account');
  } else {
    appConfig.credential = admin.credential.applicationDefault();
    console.warn('⚠️  serviceAccountKey.json not found — download from Firebase Console → Project Settings → Service accounts');
  }

  admin.initializeApp(appConfig);
}

// ─── Firestore: connect to named database ────────────────────────────────────
// Firebase Admin SDK v12+ supports named databases via getFirestore(app, databaseId)
let firestoreDb: any;
try {
  firestoreDb = admin.firestore(admin.app());
  // If a named (non-default) database is configured, use it
  if (DATABASE_ID && DATABASE_ID !== '(default)') {
    // Use the Firebase Admin REST client with the named database
    const { Firestore } = require('@google-cloud/firestore');
    firestoreDb = new Firestore({
      projectId: PROJECT_ID,
      databaseId: DATABASE_ID,
      credentials: fs.existsSync(serviceAccountPath)
        ? JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
        : undefined,
    });
    console.log(`✅ Firestore connected to database: ${DATABASE_ID}`);
  }
} catch (e) {
  console.error('Firestore init error:', e);
  firestoreDb = admin.firestore();
}

// ─── M-Pesa config ────────────────────────────────────────────────────────────
const MPESA_ENV             = process.env.MPESA_ENV || 'sandbox';
const MPESA_BASE_URL        = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';
const MPESA_CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE       = process.env.MPESA_SHORTCODE || '';
const MPESA_PASSKEY         = process.env.MPESA_PASSKEY || '';
const MPESA_CALLBACK_URL    = process.env.MPESA_CALLBACK_URL || '';

// ─── Email service ────────────────────────────────────────────────────────────
// Import using createRequire since emailService uses ESM but we need it in server
import {
  sendBookingConfirmation,
  sendEventReminder,
  sendNewEventAlert,
  sendWelcomeEmail,
} from './src/services/emailService.js';

const pendingPayments = new Map<string, string>();

// ─── Token cache (avoids re-fetching on every poll — Daraja rate limit is 5/min) ──
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getMpesaToken(): Promise<string> {
  // Reuse token if still valid (tokens last 3600s, we refresh after 3500s)
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error(`Daraja token error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { access_token: string; expires_in?: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (3500 * 1000); // cache for 3500 seconds
  return cachedToken;
}

function getMpesaPassword(): { password: string; timestamp: string } {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  return { password, timestamp };
}

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0'))    return `254${clean.slice(1)}`;
  if (clean.startsWith('+'))   return clean.slice(1);
  if (clean.startsWith('254')) return clean;
  return `254${clean}`;
}

// ─── Express ──────────────────────────────────────────────────────────────────
const expressApp = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
expressApp.use(express.json());

expressApp.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'ok', projectId: PROJECT_ID, databaseId: DATABASE_ID });
});

// ─── STK Push ─────────────────────────────────────────────────────────────────
expressApp.post('/api/mpesa/stk-push', async (req: any, res: any) => {
  const { phone, amount, bookingId, eventTitle } = req.body;

  if (!phone || !amount || !bookingId) {
    res.status(400).json({ success: false, message: 'phone, amount, and bookingId are required' });
    return;
  }
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY) {
    res.status(500).json({ success: false, message: 'M-Pesa not configured — check .env.local' });
    return;
  }

  try {
    const token = await getMpesaToken();
    const { password, timestamp } = getMpesaPassword();
    const formattedPhone = formatPhone(phone);

    const body = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      // Sandbox rejects ngrok/external URLs — use Safaricom's own endpoint as placeholder
      // Status is checked via STK Query polling instead of waiting for callbacks
      CallBackURL: MPESA_ENV === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : MPESA_CALLBACK_URL,
      AccountReference: `weOut-${bookingId.slice(0, 8)}`,
      TransactionDesc: eventTitle ? `Ticket: ${eventTitle}`.slice(0, 50) : 'weOut Ticket',
    };

    const stkRes = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const stkData = await stkRes.json() as any;
    console.log('STK Push response:', stkData);

    if (stkData.ResponseCode === '0' && stkData.CheckoutRequestID) {
      pendingPayments.set(stkData.CheckoutRequestID, bookingId);

      await firestoreDb.collection('bookings').doc(bookingId).update({
        paymentStatus: 'pending',
        mpesaCheckoutRequestId: stkData.CheckoutRequestID,
      });

      res.json({
        success: true,
        checkoutRequestId: stkData.CheckoutRequestID,
        message: 'STK Push sent — check your phone',
      });
    } else {
      res.status(400).json({
        success: false,
        message: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
      });
    }
  } catch (error) {
    console.error('STK Push error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── M-Pesa Callback (production) ────────────────────────────────────────────
expressApp.post('/api/mpesa/callback', async (req: any, res: any) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  try {
    const cb = req.body?.Body?.stkCallback;
    if (!cb) return;
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = cb;
    const bookingId = pendingPayments.get(CheckoutRequestID);
    if (!bookingId) return;

    if (ResultCode === 0) {
      const meta: Record<string, any> = {};
      (CallbackMetadata?.Item || []).forEach((item: any) => { meta[item.Name] = item.Value; });
      await firestoreDb.collection('bookings').doc(bookingId).update({
        paymentStatus: 'completed',
        mpesaReceiptNumber: meta.MpesaReceiptNumber || null,
        mpesaPhoneNumber: meta.PhoneNumber ? String(meta.PhoneNumber) : null,
        mpesaAmount: meta.Amount || null,
      });
      const bookingSnap = await firestoreDb.collection('bookings').doc(bookingId).get();
      const booking = bookingSnap.data();
      if (booking) {
        await firestoreDb.collection('notifications').add({
          userId: booking.userId,
          title: 'Payment Confirmed! 🎉',
          message: `M-Pesa payment received. Receipt: ${meta.MpesaReceiptNumber}`,
          type: 'booking', read: false,
          createdAt: admin.firestore.Timestamp.now(),
          eventId: booking.eventId,
        });
      }
    } else {
      await firestoreDb.collection('bookings').doc(bookingId).update({ paymentStatus: 'failed', mpesaResultDesc: ResultDesc });
    }
    pendingPayments.delete(CheckoutRequestID);
  } catch (e) { console.error('Callback error:', e); }
});

// ─── Status polling ───────────────────────────────────────────────────────────
expressApp.get('/api/mpesa/status/:checkoutRequestId', async (req: any, res: any) => {
  const cid = req.params.checkoutRequestId;
  try {
    // 1. Check Firestore first
    const snap = await firestoreDb.collection('bookings')
      .where('mpesaCheckoutRequestId', '==', cid)
      .get();

    if (!snap.empty) {
      const booking = snap.docs[0].data();
      if (booking.paymentStatus === 'completed' || booking.paymentStatus === 'failed') {
        res.json({ status: booking.paymentStatus, bookingId: snap.docs[0].id, receiptNumber: booking.mpesaReceiptNumber || null });
        return;
      }
    }

    // 2. Query Daraja directly (sandbox + production fallback)
    try {
      const token = await getMpesaToken();
      const { password, timestamp } = getMpesaPassword();
      const qRes = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ BusinessShortCode: MPESA_SHORTCODE, Password: password, Timestamp: timestamp, CheckoutRequestID: cid }),
      });
      const qData = await qRes.json() as any;
      console.log('STK Query:', qData);

      const code = String(qData.ResultCode ?? '');

      if (code === '0') {
        if (!snap.empty) {
          await firestoreDb.collection('bookings').doc(snap.docs[0].id).update({
            paymentStatus: 'completed',
            mpesaReceiptNumber: qData.MpesaReceiptNumber || 'SANDBOX-OK',
          });
          const booking = snap.docs[0].data();
          await firestoreDb.collection('notifications').add({
            userId: booking.userId,
            title: 'Payment Confirmed! 🎉',
            message: 'Your M-Pesa payment was received successfully.',
            type: 'booking', read: false,
            createdAt: admin.firestore.Timestamp.now(),
            eventId: booking.eventId,
          });
        }
        res.json({ status: 'completed', bookingId: snap.docs[0]?.id, receiptNumber: qData.MpesaReceiptNumber || 'SANDBOX-OK' });
        return;
      } else if (code === '1037') {
        // Timeout — user didn't respond. Let frontend know to show retry option
        res.json({ status: 'timeout', reason: 'Payment request timed out. Please try again.' });
        return;
      } else if (code !== '' && code !== '1032' && code !== '2001') {
        if (!snap.empty) {
          await firestoreDb.collection('bookings').doc(snap.docs[0].id).update({ paymentStatus: 'failed' });
        }
        res.json({ status: 'failed', reason: qData.ResultDesc || 'Payment not completed' });
        return;
      }
    } catch (qErr) { console.error('Query error:', qErr); }

    res.json({ status: 'pending' });
  } catch (e) {
    console.error('Status error:', e);
    res.status(500).json({ status: 'error' });
  }
});

// ─── New event alert endpoint (called from CreateEvent page after publish) ───
expressApp.post('/api/email/new-event', async (req: any, res: any) => {
  const { eventId } = req.body;
  if (!eventId) { res.status(400).json({ success: false }); return; }
  try {
    const eventSnap = await firestoreDb.collection('events').doc(eventId).get();
    const event = eventSnap.data();
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    // Get organizer's followers
    const orgSnap = await firestoreDb.collection('users').doc(event.organizerId).get();
    const organizer = orgSnap.data();
    const followers: string[] = organizer?.followers || [];

    if (followers.length === 0) { res.json({ success: true, sent: 0 }); return; }

    const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
    const minPrice = Math.min(...(event.ticketTypes || []).map((t: any) => t.price));
    let sent = 0;

    // Send to each follower
    for (const followerId of followers) {
      try {
        const followerSnap = await firestoreDb.collection('users').doc(followerId).get();
        const follower = followerSnap.data();
        if (!follower?.email) continue;

        await sendNewEventAlert({
          toEmail: follower.email,
          toName: follower.displayName || 'there',
          organizerName: organizer?.displayName || 'An organizer',
          eventTitle: event.title,
          eventDate: eventDate.toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' }),
          eventLocation: event.location?.address || '',
          eventCategory: event.category || 'Event',
          minPrice,
          coverImage: event.coverImage,
          eventId,
        });

        // Also create in-app notification
        await firestoreDb.collection('notifications').add({
          userId: followerId,
          title: `New event from ${organizer?.displayName || 'an organizer'}`,
          message: `"${event.title}" has been posted. Get your tickets now!`,
          type: 'system', read: false,
          createdAt: admin.firestore.Timestamp.now(),
          eventId,
        });

        sent++;
      } catch (e) { console.error(`Failed to notify follower ${followerId}:`, e); }
    }

    console.log(`📧 New event alerts sent to ${sent}/${followers.length} followers`);
    res.json({ success: true, sent });
  } catch (error) {
    console.error('New event alert error:', error);
    res.status(500).json({ success: false });
  }
});

// ─── Welcome email endpoint (called from AuthContext after role selection) ───
expressApp.post('/api/email/welcome', async (req: any, res: any) => {
  const { userId } = req.body;
  if (!userId) { res.status(400).json({ success: false }); return; }
  try {
    const userSnap = await firestoreDb.collection('users').doc(userId).get();
    const user = userSnap.data();
    if (!user?.email) { res.status(404).json({ success: false }); return; }

    await sendWelcomeEmail({
      toEmail: user.email,
      toName: user.displayName || 'there',
      role: user.role,
    });
    console.log(`📧 Welcome email sent to ${user.email}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({ success: false });
  }
});

// ─── Reminder cron ────────────────────────────────────────────────────────────
async function checkReminders(): Promise<void> {
  const now = new Date();
  try {
    const snap = await firestoreDb.collection('bookings')
      .where('reminderEnabled', '==', true)
      .where('reminderSent', '==', false)
      .get();
    for (const d of snap.docs) {
      const b = d.data();
      const eSnap = await firestoreDb.collection('events').doc(b.eventId).get();
      const ev = eSnap.data();
      if (!ev?.date) continue;
      const evDate = ev.date.toDate ? ev.date.toDate() : new Date(ev.date);
      const hrs = (evDate.getTime() - now.getTime()) / 3600000;
      if (hrs > 0 && hrs <= 24) {
        await firestoreDb.collection('notifications').add({
          userId: b.userId, title: 'Event Reminder 🎟️',
          message: `"${ev.title}" is happening in less than 24 hours!`,
          type: 'reminder', read: false,
          createdAt: admin.firestore.Timestamp.now(), eventId: b.eventId,
        });
        await firestoreDb.collection('bookings').doc(d.id).update({ reminderSent: true });

        // Send reminder email
        try {
          const userSnap = await firestoreDb.collection('users').doc(b.userId).get();
          const user = userSnap.data();
          if (user?.email) {
            const evDate = ev.date.toDate ? ev.date.toDate() : new Date(ev.date);
            await sendEventReminder({
              toEmail: user.email,
              toName: user.displayName || 'there',
              eventTitle: ev.title,
              eventDate: evDate.toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' }),
              eventLocation: ev.location?.address || '',
              hoursUntil: hrs,
              qrCode: b.qrCode || d.id,
              eventId: b.eventId,
            });
            console.log(`📧 Reminder sent to ${user.email} for "${ev.title}"`);
          }
        } catch (emailErr) { console.error('Reminder email error:', emailErr); }
      }
    }
  } catch (e) { console.error('Reminder error:', e); }
}
cron.schedule('0 * * * *', checkReminders);

// ─── Vite / static ────────────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: { ignored: ['**/*'] } },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*', (_req: any, res: any) => res.sendFile(path.join(distPath, 'index.html')));
  }

  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`\nweOut server → http://localhost:${PORT}`);
    console.log(`Project: ${PROJECT_ID} | Database: ${DATABASE_ID || '(default)'}`);
    if (!MPESA_CONSUMER_KEY) {
      console.warn('⚠️  MPESA_CONSUMER_KEY not set');
    } else {
      console.log(`✅ M-Pesa STK Push ready (${MPESA_ENV})`);
    }
  });
}

startServer();
