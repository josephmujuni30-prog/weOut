// Brevo (formerly Sendinblue) — free plan: 300 emails/day to ANY email address
// No custom domain required
// Get your API key at: https://app.brevo.com/settings/keys/api

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = 'noreply@weout.app'; // display only — Brevo sends from their servers
const FROM_NAME  = 'weOut';

function getBrevoKey(): string {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not set in .env.local');
  return key;
}

async function sendEmail(subject: string, toEmail: string, toName: string, html: string) {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': getBrevoKey(),
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${res.status} ${err}`);
  }
  return res.json();
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const CARD = `max-width:560px;margin:40px auto;background:#18181b;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);`;
const HEADER = `background:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%);padding:36px 40px 28px;`;
const BODY = `padding:32px 40px;`;
const FOOTER_S = `padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;`;
const LOGO = `font-size:32px;font-weight:900;font-style:italic;color:#7c3aed;letter-spacing:-1px;margin:0 0 16px;`;
const BTN = `display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px;`;
const MUTED = `color:rgba(255,255,255,0.4);font-size:12px;line-height:1.6;`;
const DIVIDER = `border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;`;

function wrap(content: string) {
  return `
    <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;margin:0;padding:0;">
      <div style="${CARD}">
        ${content}
        <div style="${FOOTER_S}">
          <p style="${MUTED}">weOut · Nairobi, Kenya<br/>
          You received this because you have a weOut account.</p>
        </div>
      </div>
    </body></html>`;
}

function infoRow(label: string, value: string) {
  return `<div style="margin-bottom:14px;">
    <p style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0;">${label}</p>
    <p style="color:#fff;font-size:15px;font-weight:600;margin:3px 0 0;">${value}</p>
  </div>`;
}

// ─── 1. Booking Confirmation ──────────────────────────────────────────────────
export interface BookingConfirmationData {
  toEmail: string; toName: string;
  eventTitle: string; eventDate: string; eventLocation: string;
  ticketType: string; quantity: number; totalAmount: number;
  qrCode: string; bookingId: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrCode)}&bgcolor=18181b&color=7c3aed`;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const html = wrap(`
    <div style="${HEADER}">
      <p style="${LOGO}">weOut</p>
      <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;">You're going! 🎉</h1>
      <p style="color:rgba(255,255,255,0.65);font-size:15px;margin:0;">Your booking is confirmed.</p>
    </div>
    <div style="${BODY}">
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 20px;">${data.eventTitle}</h2>
      ${infoRow('Date & Time', data.eventDate)}
      ${infoRow('Location', data.eventLocation)}
      ${infoRow('Ticket', `${data.ticketType} × ${data.quantity}`)}
      ${infoRow('Amount Paid', `KES ${data.totalAmount.toLocaleString()}`)}
      ${infoRow('Booking ID', data.bookingId.slice(0, 12).toUpperCase())}
      <hr style="${DIVIDER}"/>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">Your Entry QR Code</p>
        <img src="${qrUrl}" width="160" height="160" style="border-radius:16px;border:2px solid rgba(124,58,237,0.4);" alt="QR Code"/>
        <p style="color:rgba(255,255,255,0.3);font-size:11px;font-family:monospace;margin:10px 0 0;">${data.qrCode}</p>
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:8px 0 0;">Show this at the venue entrance</p>
      </div>
      <hr style="${DIVIDER}"/>
      <div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}/my-bookings" style="${BTN}">View My Tickets</a>
      </div>
    </div>
  `);

  return sendEmail(`Your tickets for ${data.eventTitle} ✅`, data.toEmail, data.toName, html);
}

// ─── 2. Event Reminder ────────────────────────────────────────────────────────
export interface EventReminderData {
  toEmail: string; toName: string;
  eventTitle: string; eventDate: string; eventLocation: string;
  hoursUntil: number; qrCode: string; eventId: string;
}

export async function sendEventReminder(data: EventReminderData) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrCode)}&bgcolor=18181b&color=7c3aed`;
  const timeLabel = data.hoursUntil <= 1 ? 'in less than an hour' : `in ${Math.round(data.hoursUntil)} hours`;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const html = wrap(`
    <div style="${HEADER}">
      <p style="${LOGO}">weOut</p>
      <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;">Your event is ${timeLabel}! ⏰</h1>
      <p style="color:rgba(255,255,255,0.65);font-size:15px;margin:0;">Don't forget — you have tickets to ${data.eventTitle}.</p>
    </div>
    <div style="${BODY}">
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 20px;">${data.eventTitle}</h2>
      ${infoRow('When', data.eventDate)}
      ${infoRow('Where', data.eventLocation)}
      <hr style="${DIVIDER}"/>
      <div style="text-align:center;margin:24px 0;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">Your Entry QR Code</p>
        <img src="${qrUrl}" width="160" height="160" style="border-radius:16px;border:2px solid rgba(124,58,237,0.4);" alt="QR Code"/>
        <p style="color:rgba(255,255,255,0.3);font-size:11px;font-family:monospace;margin:10px 0 0;">${data.qrCode}</p>
      </div>
      <hr style="${DIVIDER}"/>
      <div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}/events/${data.eventId}" style="${BTN}">View Event Details</a>
      </div>
    </div>
  `);

  return sendEmail(`Reminder: ${data.eventTitle} is ${timeLabel} 🎟️`, data.toEmail, data.toName, html);
}

// ─── 3. New Event Alert ───────────────────────────────────────────────────────
export interface NewEventAlertData {
  toEmail: string; toName: string; organizerName: string;
  eventTitle: string; eventDate: string; eventLocation: string;
  eventCategory: string; minPrice: number; coverImage?: string; eventId: string;
}

export async function sendNewEventAlert(data: NewEventAlertData) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const priceText = data.minPrice === 0 ? 'Free' : `From KES ${data.minPrice.toLocaleString()}`;
  const coverHtml = data.coverImage
    ? `<img src="${data.coverImage}" width="100%" style="display:block;max-height:200px;object-fit:cover;" alt="${data.eventTitle}"/>`
    : `<div style="height:100px;background:linear-gradient(135deg,#1e1b4b,#4c1d95);"></div>`;

  const html = wrap(`
    <div style="${HEADER}">
      <p style="${LOGO}">weOut</p>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">New event from ${data.organizerName} 🔔</h1>
      <p style="color:rgba(255,255,255,0.65);font-size:14px;margin:0;">An organizer you follow just posted something new.</p>
    </div>
    <div style="overflow:hidden;">${coverHtml}</div>
    <div style="${BODY}">
      <div style="display:inline-block;background:rgba(124,58,237,0.2);color:#a78bfa;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:4px 10px;border-radius:20px;margin-bottom:14px;">
        ${data.eventCategory}
      </div>
      <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 20px;">${data.eventTitle}</h2>
      ${infoRow('Date', data.eventDate)}
      ${infoRow('Location', data.eventLocation)}
      ${infoRow('Price', priceText)}
      <hr style="${DIVIDER}"/>
      <div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}/events/${data.eventId}" style="${BTN}">View Event & Get Tickets</a>
      </div>
    </div>
  `);

  return sendEmail(`${data.organizerName} just posted: ${data.eventTitle} 🎉`, data.toEmail, data.toName, html);
}

// ─── 4. Welcome Email ─────────────────────────────────────────────────────────
export interface WelcomeEmailData {
  toEmail: string; toName: string; role: 'attendee' | 'organizer';
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const isOrganizer = data.role === 'organizer';

  const tips = isOrganizer ? [
    ['➕', 'Create events with multiple ticket tiers'],
    ['📊', 'Track ticket sales and revenue in real-time'],
    ['✅', 'Check in attendees at the door with QR scanning'],
    ['📣', 'Your followers get notified when you post'],
  ] : [
    ['🔍', 'Browse events by category, date, or price'],
    ['🎟️', 'Book tickets and pay via M-Pesa or card'],
    ['🔔', 'Set reminders so you never miss an event'],
    ['❤️', 'Follow organizers to get notified of new events'],
  ];

  const tipsHtml = tips.map(([emoji, text]) => `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
      <span style="font-size:18px;">${emoji}</span>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:2px 0 0;line-height:1.5;">${text}</p>
    </div>`).join('');

  const html = wrap(`
    <div style="${HEADER}">
      <p style="${LOGO}">weOut</p>
      <h1 style="color:#fff;font-size:26px;font-weight:800;margin:0 0 8px;">Welcome, ${data.toName}! 👋</h1>
      <p style="color:rgba(255,255,255,0.65);font-size:15px;margin:0;">
        ${isOrganizer ? "You're all set to start creating events in Nairobi." : "Nairobi's best events are waiting for you."}
      </p>
    </div>
    <div style="${BODY}">
      <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 20px;">
        You've joined as a <strong style="color:#a78bfa;">${isOrganizer ? 'Organizer' : 'Attendee'}</strong>. Here's what you can do:
      </p>
      ${tipsHtml}
      <hr style="${DIVIDER}"/>
      <div style="text-align:center;margin-top:24px;">
        <a href="${isOrganizer ? `${appUrl}/create-event` : appUrl}" style="${BTN}">
          ${isOrganizer ? 'Create Your First Event →' : 'Explore Events →'}
        </a>
      </div>
    </div>
  `);

  return sendEmail(
    `Welcome to weOut${isOrganizer ? ' — Start creating events' : ' — Discover events in Nairobi'} 🎉`,
    data.toEmail, data.toName, html
  );
}
