import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, db, addDoc, collection, Timestamp } from '../firebase';
import type { Event, Booking, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, ChevronRight, CreditCard,
  Smartphone, CheckCircle2, Share2, Copy, X, QrCode, Tag,
  Users, Loader, AlertCircle, Phone,
} from 'lucide-react';
import { format } from 'date-fns';
import MapView from '../components/MapView';
import FollowButton from '../components/FollowButton';

// ─── QR Modal ─────────────────────────────────────────────────────────────────
function QRModal({ code, eventTitle, onClose }: { code: string; eventTitle: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-900">Your Ticket QR</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900"><X size={20} /></button>
        </div>
        <p className="text-xs text-stone-500 uppercase tracking-widest">{eventTitle}</p>
        <img src={qrUrl} alt="Ticket QR Code" className="mx-auto rounded-2xl border border-stone-100" />
        <p className="font-mono text-xs text-stone-400 bg-stone-50 px-3 py-2 rounded-xl">{code}</p>
        <p className="text-xs text-stone-400">Show this at the venue entrance</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const url = window.location.href;
  const text = `Check out "${event.title}" on weOut!`;
  const [copied, setCopied] = useState(false);
  const copyLink = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-900 text-lg">Share this event</h3>
          <button onClick={onClose}><X size={20} className="text-stone-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'WhatsApp', color: 'bg-green-500', href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
            { label: 'Twitter/X', color: 'bg-black', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
            { label: 'Facebook', color: 'bg-blue-600', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
            { label: 'LinkedIn', color: 'bg-blue-700', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
          ].map((opt) => (
            <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer"
              className={`${opt.color} text-white text-sm font-bold py-3 rounded-2xl text-center hover:opacity-90`}>{opt.label}</a>
          ))}
        </div>
        <button onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 border-2 border-stone-200 py-3 rounded-2xl text-sm font-bold hover:border-stone-900">
          <Copy size={16} />{copied ? 'Copied!' : 'Copy Link'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── M-Pesa STK Push payment step ────────────────────────────────────────────
interface MpesaStepProps {
  amount: number;
  bookingId: string;
  eventTitle: string;
  onSuccess: (receiptNumber: string) => void;
  onBack: () => void;
}

function MpesaStep({ amount, bookingId, eventTitle, onSuccess, onBack }: MpesaStepProps) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'waiting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startPolling = (cid: string) => {
    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      // Stop polling after 2 minutes (24 × 5s)
      if (pollCountRef.current > 12) {
        clearInterval(pollRef.current!);
        setStatus('error');
        setErrorMsg('Payment timed out. Please try again.');
        return;
      }
      try {
        const res = await fetch(`/api/mpesa/status/${cid}`);
        const data = await res.json();
        if (data.status === 'completed') {
          clearInterval(pollRef.current!);
          onSuccess(data.receiptNumber || 'N/A');
        } else if (data.status === 'timeout') {
          clearInterval(pollRef.current!);
          setStatus('error');
          setErrorMsg('Payment request timed out — the prompt may have expired. Please try again.');
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!);
          setStatus('error');
          setErrorMsg('Payment was cancelled or failed. Please try again.');
        }
        // If 'pending', keep polling
      } catch { /* network blip, keep polling */ }
    }, 15000); // Poll every 15 seconds (Daraja rate limit: 5 req/min)
  };

  const handleSendSTK = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) { setErrorMsg('Enter a valid Kenyan phone number'); return; }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, bookingId, eventTitle }),
      });
      const data = await res.json();

      if (data.success && data.checkoutRequestId) {
        setCheckoutId(data.checkoutRequestId);
        setStatus('waiting');
        startPolling(data.checkoutRequestId);
      } else {
        setStatus('error');
        setErrorMsg(data.message || 'Failed to send payment request. Try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Check your connection and try again.');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-900 text-sm font-bold">← Back</button>
        <h3 className="text-xl font-bold tracking-tight">M-Pesa Payment</h3>
      </div>

      {/* Amount summary */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Smartphone size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-600">Lipa Na M-Pesa</p>
            <p className="font-bold text-stone-900">KES {amount.toLocaleString()}</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-green-600">🇰🇪</p>
      </div>

      {status === 'idle' || status === 'error' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="mpesa-phone" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                id="mpesa-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrorMsg(''); }}
                placeholder="07XX XXX XXX or 254XXXXXXXXX"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <p className="text-xs text-stone-400 mt-1">Enter the M-Pesa number to charge</p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{errorMsg}</p>
            </div>
          )}

          <button
            onClick={handleSendSTK}
            disabled={!phone || status === 'sending'}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'sending'
              ? <><Loader size={18} className="animate-spin" /> Sending request...</>
              : <><Smartphone size={18} /> Send Payment Request</>}
          </button>
        </div>
      ) : (
        /* Waiting for user to complete payment on their phone */
        <div className="text-center space-y-5 py-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Smartphone size={36} className="text-green-600" />
            </motion.div>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-stone-900 text-lg">Check your phone!</p>
            <p className="text-stone-500 text-sm">
              An M-Pesa prompt has been sent to <span className="font-bold">{phone}</span>.
              Enter your PIN to complete the payment.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <Loader size={14} className="animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest">Waiting for confirmation...</p>
          </div>
          <button
            onClick={() => { setStatus('idle'); if (pollRef.current) clearInterval(pollRef.current); }}
            className="text-xs text-stone-400 hover:text-stone-900 underline"
          >
            Didn't receive it? Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main EventDetails Page ───────────────────────────────────────────────────
export default function EventDetails() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [organizer, setOrganizer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'mpesa' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'visa'>('mpesa');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [pendingBookingId, setPendingBookingId] = useState('');
  const [completedBookingCode, setCompletedBookingCode] = useState('');
  const [mpesaReceipt, setMpesaReceipt] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'events', id));
      if (docSnap.exists()) {
        const ev = { id: docSnap.id, ...docSnap.data() } as Event;
        setEvent(ev);
        const orgSnap = await getDoc(doc(db, 'users', ev.organizerId));
        if (orgSnap.exists()) setOrganizer({ uid: orgSnap.id, ...orgSnap.data() } as UserProfile);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'WEOUT10') { setDiscount(0.1); setPromoApplied(true); }
    else { setDiscount(0); setPromoApplied(false); alert('Invalid promo code'); }
  };

  const addToGoogleCalendar = () => {
    if (!event) return;
    const start = format(event.date.toDate(), "yyyyMMdd'T'HHmmss");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${start}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location.address)}`, '_blank');
  };

  /** Creates a pending booking in Firestore and returns its ID */
  const createPendingBooking = async (): Promise<string | null> => {
    if (!event || !selectedTicket || !profile) return null;
    const ticket = event.ticketTypes.find((t) => t.name === selectedTicket);
    if (!ticket) return null;
    const totalAmount = baseAmount - baseAmount * discount;
    const qrCode = `WEOUT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const bookingData: Omit<Booking, 'id'> = {
      eventId: event.id, userId: profile.uid, organizerId: event.organizerId,
      ticketType: selectedTicket, quantity, totalAmount, paymentMethod,
      paymentStatus: 'pending', createdAt: Timestamp.now(), qrCode,
      reminderEnabled: true, reminderSent: false,
    };
    const ref = await addDoc(collection(db, 'bookings'), bookingData);
    setCompletedBookingCode(qrCode);
    return ref.id;
  };

  /** Handles the Proceed to Pay button */
  const handleProceedToPayment = async () => {
    if (paymentMethod === 'mpesa') {
      // Create booking first, then go to M-Pesa step
      const bookingId = await createPendingBooking();
      if (bookingId) { setPendingBookingId(bookingId); setBookingStep('mpesa'); }
    } else {
      // Visa: mark completed immediately (placeholder for real card integration)
      await createPendingBooking();
      setBookingStep('success');
    }
  };

  /** Called by MpesaStep when payment confirmed */
  const handleMpesaSuccess = (receiptNumber: string) => {
    setMpesaReceipt(receiptNumber);
    setBookingStep('success');
  };

  if (loading) return <div className="animate-pulse h-screen bg-stone-200 rounded-3xl" />;
  if (!event) return <div className="text-center py-20 text-stone-400">Event not found</div>;

  const currentTicket = event.ticketTypes.find((t) => t.name === selectedTicket);
  const baseAmount = (currentTicket?.price || 0) * quantity;
  const totalAmount = baseAmount - baseAmount * discount;

  return (
    <>
      <AnimatePresence>
        {showQR && completedBookingCode && (
          <QRModal code={completedBookingCode} eventTitle={event.title} onClose={() => setShowQR(false)} />
        )}
        {showShare && <ShareModal event={event} onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Event info */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative h-[400px] rounded-3xl overflow-hidden">
            <img src={event.coverImage || `https://picsum.photos/seed/${event.id}/1200/800`}
              alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-stone-900">
              {event.category}
            </div>
            <button onClick={() => setShowShare(true)}
              className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-3 rounded-full text-stone-700 hover:text-stone-900 shadow-lg">
              <Share2 size={18} />
            </button>
          </motion.div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-stone-900">{event.title}</h1>
                <button onClick={() => setShowShare(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border-2 border-stone-200 text-sm font-bold text-stone-700 hover:border-stone-900 flex-shrink-0">
                  <Share2 size={16} /> Share
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-stone-600">
                <span className="flex items-center gap-2"><Calendar size={18} />{format(event.date.toDate(), 'EEEE, MMMM d, yyyy • h:mm a')}</span>
                <span className="flex items-center gap-2"><MapPin size={18} />{event.location.address}</span>
              </div>
            </div>

            {/* Organizer card */}
            {organizer && (
              <div className="flex items-center justify-between p-4 bg-violet-50 rounded-2xl border border-violet-100">
                <div className="flex items-center gap-3">
                  <img
                    src={organizer.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(organizer.displayName)}&background=7C3AED&color=fff&size=80`}
                    alt={organizer.displayName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-violet-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Organizer</p>
                    <p className="font-bold text-stone-900">{organizer.displayName}</p>
                    {(organizer.followerCount ?? 0) > 0 && (
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Users size={11} /> {organizer.followerCount} followers
                      </p>
                    )}
                  </div>
                </div>
                <FollowButton organizerId={organizer.uid} organizerName={organizer.displayName} size="sm" />
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold tracking-tight mb-2">About this event</h3>
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            <button onClick={addToGoogleCalendar}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-stone-200 text-sm font-bold text-stone-700 hover:border-stone-900 transition-colors">
              <Calendar size={16} /> Add to Google Calendar
            </button>

            <div className="space-y-3">
              <h3 className="text-xl font-bold tracking-tight">Location</h3>
              <div className="h-64 rounded-3xl overflow-hidden border border-stone-200 shadow-sm relative z-0">
                <MapView lat={event.location.lat} lng={event.location.lng} title={event.title} address={event.location.address} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
            <AnimatePresence mode="wait">

              {/* Step 1: Select tickets */}
              {bookingStep === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
                  <h3 className="text-xl font-bold tracking-tight">Select Tickets</h3>
                  <div className="space-y-3" role="radiogroup">
                    {event.ticketTypes.map((ticket) => {
                      const remaining = ticket.capacity - ticket.sold;
                      const soldOut = remaining <= 0;
                      return (
                        <button key={ticket.name} role="radio" aria-checked={selectedTicket === ticket.name}
                          disabled={soldOut} onClick={() => !soldOut && setSelectedTicket(ticket.name)}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center
                            ${soldOut ? 'opacity-40 cursor-not-allowed border-stone-100' :
                              selectedTicket === ticket.name ? 'border-violet-600 bg-violet-50' : 'border-stone-100 hover:border-stone-200'}`}>
                          <div>
                            <p className="font-bold text-stone-900">{ticket.name}</p>
                            <p className="text-xs text-stone-500">{soldOut ? 'Sold out' : `${remaining} left`}</p>
                          </div>
                          <p className="font-bold text-lg">{ticket.price === 0 ? 'Free' : `KES ${ticket.price.toLocaleString()}`}</p>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTicket && (
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-stone-600">Quantity</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50">-</button>
                          <span className="font-bold" aria-live="polite">{quantity}</span>
                          <button onClick={() => setQuantity(Math.min(quantity + 1, (currentTicket?.capacity || 99) - (currentTicket?.sold || 0)))} className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50">+</button>
                        </div>
                      </div>

                      {/* Promo code */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                          <input type="text" placeholder="Promo code" value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
                        </div>
                        <button onClick={applyPromo} className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-sm font-bold hover:bg-stone-200">Apply</button>
                      </div>
                      {promoApplied && <p className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12} /> 10% discount applied!</p>}

                      <div className="space-y-1">
                        {promoApplied && (
                          <div className="flex justify-between text-sm text-stone-400">
                            <span>Subtotal</span><span className="line-through">KES {baseAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xl font-bold">
                          <span>Total</span><span>KES {totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      <button onClick={() => setBookingStep('payment')}
                        className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
                        Checkout <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Choose payment method */}
              {bookingStep === 'payment' && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setBookingStep('details')} className="text-stone-400 hover:text-stone-900 text-sm font-bold">← Back</button>
                    <h3 className="text-xl font-bold tracking-tight">Payment Method</h3>
                  </div>
                  <div className="space-y-3" role="radiogroup">
                    {[
                      { value: 'mpesa' as const, label: 'M-Pesa', sub: 'Lipa Na M-Pesa · Recommended', icon: <Smartphone size={24} />, color: 'bg-green-100 text-green-600' },
                      { value: 'visa' as const, label: 'Visa / Mastercard', sub: 'Pay with your card', icon: <CreditCard size={24} />, color: 'bg-blue-100 text-blue-600' },
                    ].map((opt) => (
                      <button key={opt.value} onClick={() => setPaymentMethod(opt.value)} role="radio" aria-checked={paymentMethod === opt.value}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${paymentMethod === opt.value ? 'border-violet-600 bg-violet-50' : 'border-stone-100 hover:border-stone-200'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.color}`}>{opt.icon}</div>
                        <div><p className="font-bold text-stone-900">{opt.label}</p><p className="text-xs text-stone-500">{opt.sub}</p></div>
                        {opt.value === 'mpesa' && <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full uppercase tracking-widest">Popular</span>}
                      </button>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-stone-100 space-y-4">
                    <div className="flex justify-between text-sm text-stone-500">
                      <span>{quantity}× {selectedTicket}</span><span>KES {totalAmount.toLocaleString()}</span>
                    </div>
                    <button onClick={handleProceedToPayment}
                      className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold hover:bg-violet-700 transition-all">
                      {paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Pay with Card'}  · KES {totalAmount.toLocaleString()}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3a: M-Pesa STK Push */}
              {bookingStep === 'mpesa' && (
                <motion.div key="mpesa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <MpesaStep
                    amount={totalAmount}
                    bookingId={pendingBookingId}
                    eventTitle={event.title}
                    onSuccess={handleMpesaSuccess}
                    onBack={() => setBookingStep('payment')}
                  />
                </motion.div>
              )}

              {/* Step 4: Success */}
              {bookingStep === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Booking Confirmed!</h3>
                    {mpesaReceipt && (
                      <p className="text-stone-500 text-sm mt-2">M-Pesa Receipt: <span className="font-bold text-stone-700">{mpesaReceipt}</span></p>
                    )}
                  </div>
                  <div className="space-y-3 pt-2">
                    <button onClick={() => setShowQR(true)}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-4 rounded-2xl font-bold hover:bg-violet-700">
                      <QrCode size={20} /> View QR Ticket
                    </button>
                    <button onClick={addToGoogleCalendar}
                      className="w-full flex items-center justify-center gap-2 border-2 border-stone-200 py-3 rounded-2xl text-sm font-bold hover:border-stone-900">
                      <Calendar size={16} /> Add to Google Calendar
                    </button>
                    <button onClick={() => setShowShare(true)}
                      className="w-full flex items-center justify-center gap-2 border-2 border-stone-200 py-3 rounded-2xl text-sm font-bold hover:border-stone-900">
                      <Share2 size={16} /> Share with Friends
                    </button>
                    <button onClick={() => navigate('/my-bookings')} className="w-full text-stone-600 font-medium py-2 hover:text-stone-900">
                      View My Tickets
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
