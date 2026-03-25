const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

function getDb() {
  if (!admin.apps.length) {
    const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf8'));
    admin.initializeApp({ credential: admin.credential.cert(sa), projectId: process.env.FIREBASE_PROJECT_ID });
  }
  const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf8'));
  return new Firestore({ projectId: process.env.FIREBASE_PROJECT_ID, databaseId: process.env.FIREBASE_DATABASE_ID || '(default)', credentials: sa });
}


async function sendBrevoEmail(toEmail, toName, subject, html) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY not set');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': key },
    body: JSON.stringify({
      sender: { name: 'weOut', email: 'noreply@weout.app' },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`Brevo error: ${res.status} ${err}`); }
  return res.json();
}


module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  const { userId } = req.body;
  if (!userId) { res.status(400).json({ success: false }); return; }
  try {
    const db = getDb();
    const snap = await db.collection('users').doc(userId).get();
    const user = snap.data();
    if (!user?.email) { res.status(404).json({ success: false }); return; }
    const isOrganizer = user.role === 'organizer';
    const appUrl = process.env.APP_URL || 'https://weout2026.vercel.app';
    const html = `<div style="font-family:sans-serif;background:#000;padding:40px;"><div style="max-width:560px;margin:0 auto;background:#18181b;border-radius:24px;padding:40px;border:1px solid rgba(255,255,255,0.1)"><p style="font-size:32px;font-weight:900;font-style:italic;color:#7c3aed;margin:0 0 20px">weOut</p><h1 style="color:#fff;font-size:26px;margin:0 0 12px">Welcome, ${user.displayName || 'there'}! 👋</h1><p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6">${isOrganizer ? "You are set up as an Organizer. Start creating events and build your audience in Nairobi." : "You are set up as an Attendee. Discover the best events happening around Nairobi."}</p><a href="${isOrganizer ? appUrl + '/create-event' : appUrl}" style="display:inline-block;margin-top:24px;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700">${isOrganizer ? 'Create Your First Event' : 'Explore Events'}</a></div></div>`;
    await sendBrevoEmail(user.email, user.displayName || 'there', `Welcome to weOut ${isOrganizer ? '— Start creating events' : '— Discover events in Nairobi'} 🎉`, html);
    res.json({ success: true });
  } catch (e) { console.error('Welcome email error:', e); res.status(500).json({ success: false, message: e.message }); }
};
