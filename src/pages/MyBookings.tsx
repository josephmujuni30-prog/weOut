import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, db, doc, getDoc, updateDoc } from '../firebase';
import type { Booking, Event } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, MapPin, QrCode, Bell, BellOff, X, Share2, Copy } from 'lucide-react';
import { format } from 'date-fns';

// ─── QR Modal ─────────────────────────────────────────────────────────────────
function QRModal({ code, eventTitle, onClose }: { code: string; eventTitle: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-900">Your Ticket QR</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900"><X size={20} /></button>
        </div>
        <p className="text-xs text-stone-500 uppercase tracking-widest">{eventTitle}</p>
        <img src={qrUrl} alt="Ticket QR Code" className="mx-auto rounded-2xl border border-stone-100" />
        <p className="font-mono text-xs text-stone-400 bg-stone-50 px-3 py-2 rounded-xl break-all">{code}</p>
        <p className="text-xs text-stone-400">Show this at the venue entrance</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const url = `${window.location.origin}/events/${event.id}`;
  const text = `I'm going to "${event.title}" on weOut!`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-900 text-lg">Share event</h3>
          <button onClick={onClose}><X size={20} className="text-stone-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'WhatsApp', color: 'bg-green-500', href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
            { label: 'Twitter/X', color: 'bg-black', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
          ].map((opt) => (
            <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer"
              className={`${opt.color} text-white text-sm font-bold py-3 rounded-2xl text-center hover:opacity-90`}>
              {opt.label}
            </a>
          ))}
        </div>
        <button onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 border-2 border-stone-200 py-3 rounded-2xl text-sm font-bold hover:border-stone-900 transition-colors">
          <Copy size={16} /> {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyBookings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<(Booking & { event?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQR, setActiveQR] = useState<{ code: string; title: string } | null>(null);
  const [activeShare, setActiveShare] = useState<Event | null>(null);

  const toggleReminder = async (bookingId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        reminderEnabled: !currentStatus,
        ...(!currentStatus && { reminderSent: false }),
      });
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const addToCalendar = (event: Event) => {
    const start = format(event.date.toDate(), "yyyyMMdd'T'HHmmss");
    const title = encodeURIComponent(event.title);
    const location = encodeURIComponent(event.location.address);
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${start}&location=${location}`,
      '_blank'
    );
  };

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'bookings'), where('userId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const bookingsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      const bookingsWithEvents = await Promise.all(
        bookingsData.map(async (booking) => {
          const eventSnap = await getDoc(doc(db, 'events', booking.eventId));
          return {
            ...booking,
            event: eventSnap.exists() ? ({ id: eventSnap.id, ...eventSnap.data() } as Event) : undefined,
          };
        })
      );
      setBookings(bookingsWithEvents);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  if (loading) return <div className="animate-pulse h-screen bg-stone-200 rounded-3xl" />;

  return (
    <>
      <AnimatePresence>
        {activeQR && <QRModal code={activeQR.code} eventTitle={activeQR.title} onClose={() => setActiveQR(null)} />}
        {activeShare && <ShareModal event={activeShare} onClose={() => setActiveShare(null)} />}
      </AnimatePresence>

      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-stone-900">My Tickets</h1>
          <p className="text-stone-500">Your upcoming and past event bookings.</p>
        </div>

        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden"
              >
                {/* Event image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={booking.event?.coverImage || `https://picsum.photos/seed/${booking.eventId}/800/400`}
                    alt={booking.event?.title || 'Event'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg leading-tight">{booking.event?.title || 'Unknown Event'}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} />
                      {booking.event ? format(booking.event.date.toDate(), 'MMM d, yyyy • h:mm a') : 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} />
                      {booking.event?.location.address || 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Ticket</p>
                      <p className="font-bold text-stone-900">{booking.ticketType} × {booking.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Paid</p>
                      <p className="font-bold text-stone-900">KES {booking.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</p>
                      <p className="font-bold text-green-600 uppercase text-[10px] tracking-widest">{booking.paymentStatus}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => booking.qrCode && setActiveQR({ code: booking.qrCode, title: booking.event?.title || '' })}
                      disabled={!booking.qrCode}
                      className="flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all disabled:opacity-40"
                    >
                      <QrCode size={14} /> View QR
                    </button>
                    <button
                      onClick={() => booking.event && addToCalendar(booking.event)}
                      disabled={!booking.event}
                      className="flex items-center justify-center gap-2 border border-stone-200 text-stone-700 py-2.5 rounded-xl text-xs font-bold hover:border-stone-900 transition-all disabled:opacity-40"
                    >
                      <Calendar size={14} /> Add to Cal
                    </button>
                    <button
                      onClick={() => booking.event && setActiveShare(booking.event)}
                      className="flex items-center justify-center gap-2 border border-stone-200 text-stone-700 py-2.5 rounded-xl text-xs font-bold hover:border-stone-900 transition-all"
                    >
                      <Share2 size={14} /> Share
                    </button>
                    <button
                      onClick={() => toggleReminder(booking.id, !!booking.reminderEnabled)}
                      aria-pressed={!!booking.reminderEnabled}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        booking.reminderEnabled
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'border-stone-200 text-stone-500 hover:border-stone-900'
                      }`}
                    >
                      {booking.reminderEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                      {booking.reminderEnabled ? 'Reminder On' : 'Remind Me'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
            <Ticket size={48} className="mx-auto text-stone-200 mb-4" />
            <p className="text-stone-400 italic text-xl">You haven't booked any events yet.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-stone-900 font-bold hover:underline">
              Explore Events
            </button>
          </div>
        )}
      </div>
    </>
  );
}
