import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'module';
import { sendWelcomeEmail } from '../../src/services/emailService.js';

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
  if (req.method !== 'POST') { res.status(405).end(); return; }
  const { userId } = req.body;
  if (!userId) { res.status(400).json({ success: false }); return; }

  try {
    const db = getDb();
    const snap = await db.collection('users').doc(userId).get();
    const user = snap.data();
    if (!user?.email) { res.status(404).json({ success: false }); return; }

    await sendWelcomeEmail({
      toEmail: user.email,
      toName: user.displayName || 'there',
      role: user.role,
    });
    res.json({ success: true });
  } catch (e: any) {
    console.error('Welcome email error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
}
