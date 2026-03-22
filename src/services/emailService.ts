import { Resend } from 'resend';

// Lazy initialization — only create Resend instance when actually sending
// This ensures dotenv has already loaded process.env.RESEND_API_KEY
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set in .env.local');
  return new Resend(key);
}

// With Resend's test domain you can only send to your own verified email.
// Once you add a domain at resend.com/domains, change this to: noreply@yourdomain.com
const FROM = 'weOut <onboarding@resend.dev>';

// ─── Shared styles ────────────────────────────────────────────────────────────
const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #000000;
  margin: 0; padding: 0;
`;
const CARD_STYLE = `
  max-width: 560px; margin: 40px auto; background: #18181b;
  border-radius: 24px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
`;
const LOGO_STYLE = `
  font-size: 32px; font-weight: 900; font-style: italic;
  color: #7c3aed; letter-spacing: -1px;
`;
const HEADER_STYLE = `
  background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%);
  padding: 36px 40px 28px;
`;
const BODY_STYLE = `padding: 32px 40px;`;
const FOOTER_STYLE = `
  padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.08);
  text-align: center;
`;
const BTN_STYLE = `
  display: inline-block; background: #7c3aed; color: #ffffff !important;
  text-decoration: none; padding: 14px 28px; border-radius: 12px;
  font-weight: 700; font-size: 14px; letter-spacing: 0.3px;
`;
const MUTED = `color: rgba(255,255,255,0.45); font-size: 12px; line-height: 1.6;`;
const HEADING = `color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;`;
const SUBTEXT = `color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0 0 24px;`;
const LABEL = `color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;`;
const VALUE = `color: #ffffff; font-size: 15px; font-weight: 600; margin: 2px 0 0;`;
const DIVIDER = `border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;`;

function footer() {
  return `
    <div style="${FOOTER_STYLE}">
      <p style="${MUTED}">
        weOut · Nairobi, Kenya<br/>
        You received this email because you have an account on weOut.<br/>
        <a href="#" style="color: #7c3aed; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
  `;
}

function infoRow(label: string, value: string) {
  return `
    <div style="margin-bottom: 16px;">
      <p style="${LABEL}">${label}</p>
      <p style="${VALUE}">${value}</p>
    </div>
  `;
}

// ─── 1. Booking Confirmation ──────────────────────────────────────────────────
interface BookingConfirmationData {
  toEmail: string;
  toName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  quantity: number;
  totalAmount: number;
  qrCode: string;
  bookingId: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrCode)}&bgcolor=18181b&color=7c3aed&format=png`;

  const html = `
    <html><body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        <div style="${HEADER_STYLE}">
          <p style="${LOGO_STYLE}">weOut</p>
          <h1 style="color:#fff;font-size:26px;font-weight:800;margin:16px 0 6px;">
            You're going! 🎉
          </h1>
          <p style="color:rgba(255,255,255,0.65);font-size:15px;margin:0;">
            Your booking is confirmed. See you there!
          </p>
        </div>

        <div style="${BODY_STYLE}">
          <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 20px;">
            ${data.eventTitle}
          </h2>

          <div style="display:grid;gap:0;">
            ${infoRow('Date & Time', data.eventDate)}
            ${infoRow('Location', data.eventLocation)}
            ${infoRow('Ticket', `${data.ticketType} × ${data.quantity}`)}
            ${infoRow('Amount Paid', `KES ${data.totalAmount.toLocaleString()}`)}
            ${infoRow('Booking ID', data.bookingId.slice(0, 12).toUpperCase())}
          </div>

          <hr style="${DIVIDER}"/>

          <!-- QR Code -->
          <div style="text-align:center;margin:24px 0;">
            <p style="${LABEL}; margin-bottom: 12px;">Your Entry QR Code</p>
            <img src="${qrUrl}" width="160" height="160"
              style="border-radius:16px;border:2px solid rgba(124,58,237,0.4);"
              alt="Ticket QR Code" />
            <p style="color:rgba(255,255,255,0.3);font-size:11px;font-family:monospace;margin:10px 0 0;">
              ${data.qrCode}
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:8px 0 0;">
              Show this at the venue entrance
            </p>
          </div>

          <hr style="${DIVIDER}"/>

          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/my-bookings" style="${BTN_STYLE}">
              View My Tickets
            </a>
          </div>
        </div>

        ${footer()}
      </div>
    </body></html>
  `;

  return getResend().emails.send({
    from: FROM,
    to: data.toEmail,
    subject: `Your tickets for ${data.eventTitle} ✅`,
    html,
  });
}

// ─── 2. Event Reminder ────────────────────────────────────────────────────────
interface EventReminderData {
  toEmail: string;
  toName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  hoursUntil: number;
  qrCode: string;
  eventId: string;
}

export async function sendEventReminder(data: EventReminderData) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qrCode)}&bgcolor=18181b&color=7c3aed&format=png`;
  const timeLabel = data.hoursUntil <= 1 ? 'in less than an hour' : `in ${Math.round(data.hoursUntil)} hours`;

  const html = `
    <html><body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        <div style="${HEADER_STYLE}">
          <p style="${LOGO_STYLE}">weOut</p>
          <h1 style="color:#fff;font-size:26px;font-weight:800;margin:16px 0 6px;">
            Your event is ${timeLabel}! ⏰
          </h1>
          <p style="color:rgba(255,255,255,0.65);font-size:15px;margin:0;">
            Don't forget — you have tickets to ${data.eventTitle}.
          </p>
        </div>

        <div style="${BODY_STYLE}">
          <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 20px;">
            ${data.eventTitle}
          </h2>

          ${infoRow('When', data.eventDate)}
          ${infoRow('Where', data.eventLocation)}

          <hr style="${DIVIDER}"/>

          <div style="text-align:center;margin:24px 0;">
            <p style="${LABEL}; margin-bottom: 12px;">Your Entry QR Code</p>
            <img src="${qrUrl}" width="160" height="160"
              style="border-radius:16px;border:2px solid rgba(124,58,237,0.4);"
              alt="Ticket QR Code" />
            <p style="color:rgba(255,255,255,0.3);font-size:11px;font-family:monospace;margin:10px 0 0;">
              ${data.qrCode}
            </p>
          </div>

          <hr style="${DIVIDER}"/>

          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/events/${data.eventId}"
              style="${BTN_STYLE}">
              View Event Details
            </a>
          </div>
        </div>

        ${footer()}
      </div>
    </body></html>
  `;

  return getResend().emails.send({
    from: FROM,
    to: data.toEmail,
    subject: `Reminder: ${data.eventTitle} is ${timeLabel} 🎟️`,
    html,
  });
}

// ─── 3. New Event Alert (to followers) ───────────────────────────────────────
interface NewEventAlertData {
  toEmail: string;
  toName: string;
  organizerName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventCategory: string;
  minPrice: number;
  coverImage?: string;
  eventId: string;
}

export async function sendNewEventAlert(data: NewEventAlertData) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const priceText = data.minPrice === 0 ? 'Free' : `From KES ${data.minPrice.toLocaleString()}`;
  const coverHtml = data.coverImage
    ? `<img src="${data.coverImage}" width="100%" style="display:block;max-height:200px;object-fit:cover;" alt="${data.eventTitle}" />`
    : `<div style="height:120px;background:linear-gradient(135deg,#1e1b4b,#4c1d95);"></div>`;

  const html = `
    <html><body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        <div style="${HEADER_STYLE}">
          <p style="${LOGO_STYLE}">weOut</p>
          <h1 style="color:#fff;font-size:22px;font-weight:800;margin:16px 0 6px;">
            New event from ${data.organizerName} 🔔
          </h1>
          <p style="color:rgba(255,255,255,0.65);font-size:14px;margin:0;">
            An organizer you follow just posted something new.
          </p>
        </div>

        <!-- Cover image -->
        <div style="overflow:hidden;">${coverHtml}</div>

        <div style="${BODY_STYLE}">
          <div style="display:inline-block;background:rgba(124,58,237,0.2);color:#a78bfa;
            font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;
            padding:4px 10px;border-radius:20px;margin-bottom:14px;">
            ${data.eventCategory}
          </div>

          <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 20px;line-height:1.3;">
            ${data.eventTitle}
          </h2>

          ${infoRow('Date', data.eventDate)}
          ${infoRow('Location', data.eventLocation)}
          ${infoRow('Price', priceText)}

          <hr style="${DIVIDER}"/>

          <div style="text-align:center;margin-top:24px;">
            <a href="${appUrl}/events/${data.eventId}" style="${BTN_STYLE}">
              View Event & Get Tickets
            </a>
          </div>
        </div>

        ${footer()}
      </div>
    </body></html>
  `;

  return getResend().emails.send({
    from: FROM,
    to: data.toEmail,
    subject: `${data.organizerName} just posted: ${data.eventTitle} 🎉`,
    html,
  });
}

// ─── 4. Welcome Email ─────────────────────────────────────────────────────────
interface WelcomeEmailData {
  toEmail: string;
  toName: string;
  role: 'attendee' | 'organizer';
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const isOrganizer = data.role === 'organizer';

  const attendeeTips = `
    <div style="margin-bottom:12px;">
      ${tip('🔍', 'Browse events by category, date, or price')}
      ${tip('🎟️', 'Book tickets and pay via M-Pesa or card')}
      ${tip('🔔', 'Set reminders so you never miss an event')}
      ${tip('❤️', 'Follow organizers to get notified of new events')}
    </div>
  `;

  const organizerTips = `
    <div style="margin-bottom:12px;">
      ${tip('➕', 'Create events with multiple ticket tiers')}
      ${tip('📊', 'Track ticket sales and revenue in real-time')}
      ${tip('✅', 'Check in attendees at the door with QR scanning')}
      ${tip('📣', 'Your followers get notified when you post')}
    </div>
  `;

  const html = `
    <html><body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        <div style="${HEADER_STYLE}">
          <p style="${LOGO_STYLE}">weOut</p>
          <h1 style="color:#fff;font-size:28px;font-weight:800;margin:16px 0 8px;">
            Welcome, ${data.toName}! 👋
          </h1>
          <p style="color:rgba(255,255,255,0.65);font-size:15px;margin:0;">
            ${isOrganizer
              ? "You're all set to start creating events in Nairobi."
              : "Nairobi's best events are waiting for you."}
          </p>
        </div>

        <div style="${BODY_STYLE}">
          <p style="${SUBTEXT}">
            ${isOrganizer
              ? `You've joined as an <strong style="color:#a78bfa;">Organizer</strong>. Here's what you can do:`
              : `You've joined as an <strong style="color:#a78bfa;">Attendee</strong>. Here's what you can do:`}
          </p>

          ${isOrganizer ? organizerTips : attendeeTips}

          <hr style="${DIVIDER}"/>

          <div style="text-align:center;margin-top:24px;">
            <a href="${isOrganizer ? `${appUrl}/create-event` : appUrl}" style="${BTN_STYLE}">
              ${isOrganizer ? 'Create Your First Event →' : 'Explore Events →'}
            </a>
          </div>
        </div>

        ${footer()}
      </div>
    </body></html>
  `;

  return getResend().emails.send({
    from: FROM,
    to: data.toEmail,
    subject: `Welcome to weOut${isOrganizer ? ' — Start creating events' : ' — Discover events in Nairobi'} 🎉`,
    html,
  });
}

function tip(emoji: string, text: string) {
  return `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
      <span style="font-size:18px;flex-shrink:0;">${emoji}</span>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:2px 0 0;line-height:1.5;">${text}</p>
    </div>
  `;
}
