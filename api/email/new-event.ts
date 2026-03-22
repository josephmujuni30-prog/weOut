import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'module';
import { sendNewEventAlert } from '../../src/services/emailService.js';

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
  const { eventId } = req.body;
  if (!eventId) { res.status(400).json({ success: false }); return; }

  try {
    const db = getDb();
    const eventSnap = await db.collection('events').doc(eventId).get();
    const event = eventSnap.data();
    if (!event) { res.status(404).json({ success: false }); return; }

    const orgSnap = await db.collection('users').doc(event.organizerId).get();
    const organizer = orgSnap.data();
    const followers: string[] = organizer?.followers || [];

    if (followers.length === 0) { res.json({ success: true, sent: 0 }); return; }

    const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
    const minPrice = Math.min(...(event.ticketTypes || []).map((t: any) => t.price));
    let sent = 0;

    for (const followerId of followers) {
      try {
        const followerSnap = await db.collection('users').doc(followerId).get();
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

        await db.collection('notifications').add({
          userId: followerId,
          title: `New event from ${organizer?.displayName || 'an organizer'}`,
          message: `"${event.title}" has been posted!`,
          type: 'system', read: false,
          createdAt: admin.firestore.Timestamp.now(),
          eventId,
        });
        sent++;
      } catch (e) { console.error(`Failed to notify ${followerId}:`, e); }
    }

    res.json({ success: true, sent });
  } catch (e: any) {
    console.error('New event alert error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
}
