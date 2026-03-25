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
  const { eventId } = req.body;
  if (!eventId) { res.status(400).json({ success: false }); return; }
  try {
    const db = getDb();
    const eventSnap = await db.collection('events').doc(eventId).get();
    const event = eventSnap.data();
    if (!event) { res.status(404).json({ success: false }); return; }
    const orgSnap = await db.collection('users').doc(event.organizerId).get();
    const organizer = orgSnap.data();
    const followers = organizer?.followers || [];
    if (followers.length === 0) { res.json({ success: true, sent: 0 }); return; }
    const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
    const minPrice = Math.min(...(event.ticketTypes || []).map(t => t.price));
    const appUrl = process.env.APP_URL || 'https://weout2026.vercel.app';
    let sent = 0;
    for (const followerId of followers) {
      try {
        const fSnap = await db.collection('users').doc(followerId).get();
        const follower = fSnap.data();
        if (!follower?.email) continue;
        const html = `<div style="font-family:sans-serif;background:#000;padding:40px;"><div style="max-width:560px;margin:0 auto;background:#18181b;border-radius:24px;padding:40px;border:1px solid rgba(255,255,255,0.1)"><p style="font-size:32px;font-weight:900;font-style:italic;color:#7c3aed;margin:0 0 20px">weOut</p><p style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px">New event from ${organizer?.displayName}</p><h1 style="color:#fff;font-size:22px;margin:0 0 16px">${event.title}</h1><p style="color:rgba(255,255,255,0.6);margin:0 0 6px">📅 ${eventDate.toLocaleDateString('en-KE', { dateStyle: 'full' })}</p><p style="color:rgba(255,255,255,0.6);margin:0 0 6px">📍 ${event.location?.address || ''}</p><p style="color:rgba(255,255,255,0.6);margin:0 0 24px">🎟️ ${minPrice === 0 ? 'Free' : 'From KES ' + minPrice.toLocaleString()}</p><a href="${appUrl}/events/${eventId}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700">View Event and Get Tickets</a></div></div>`;
        await sendBrevoEmail(follower.email, follower.displayName || 'there', `${organizer?.displayName} just posted: ${event.title} 🎉`, html);
        await db.collection('notifications').add({ userId: followerId, title: `New event from ${organizer?.displayName}`, message: `"${event.title}" has been posted!`, type: 'system', read: false, createdAt: admin.firestore.Timestamp.now(), eventId });
        sent++;
      } catch (e) { console.error(`Failed to notify ${followerId}:`, e); }
    }
    res.json({ success: true, sent });
  } catch (e) { console.error('New event alert error:', e); res.status(500).json({ success: false, message: e.message }); }
};
