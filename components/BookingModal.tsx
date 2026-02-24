
import React, { useState } from 'react';
import { Event, UserProfile } from '../types';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment,
  runTransaction 
} from "firebase/firestore";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  userProfile: UserProfile;
  onConfirm: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, event, userProfile, onConfirm }) => {
  const [tickets, setTickets] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      // Use a transaction to ensure we don't overbook
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, "events", event.id);
        const eventDoc = await transaction.get(eventRef);
        
        if (!eventDoc.exists()) {
          throw new Error("This event exists in 'preview' mode only. Please ask the organizer to publish it or click 'Seed DB' in the header to initialize the database.");
        }

        const currentBooked = eventDoc.data().bookedCount || 0;
        const capacity = eventDoc.data().capacity || 100;

        if (currentBooked + tickets > capacity) {
          throw new Error("Sorry, this event is now fully booked!");
        }

        // 1. Create the ticket record
        const ticketRef = doc(collection(db, "tickets"));
        transaction.set(ticketRef, {
          eventId: event.id,
          eventTitle: event.title,
          userUid: userProfile.uid,
          userName: userProfile.name,
          userEmail: userProfile.email,
          tickets: tickets,
          totalPrice: tickets * event.price,
          status: "confirmed",
          timestamp: serverTimestamp()
        });

        // 2. Increment the event's booked count
        transaction.update(eventRef, {
          bookedCount: increment(tickets)
        });
      });

      setSuccess(true);
      setTimeout(() => {
        onConfirm();
        setSuccess(false);
        setTickets(1);
      }, 2500);

    } catch (err: any) {
      console.error("Booking failed:", err);
      // Clean up common Firebase errors for the user
      const msg = err.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 text-center shadow-2xl animate-slide-up">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight italic">Oya, Safi!</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Your spot is secured. Check your tickets to see the entry code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Secure Tickets</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Instant confirmation</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-all active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold text-rose-600 flex items-start gap-3 animate-pulse">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
              <img src={event.imageUrl} alt={event.title} className="w-20 h-20 object-cover rounded-2xl shadow-sm" />
              <div className="flex-grow">
                <h4 className="font-black text-slate-900 line-clamp-1 leading-tight">{event.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-slate-100 font-black text-blue-600 uppercase">
                    {event.category}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold">{event.area}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                 <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                 <span className="text-[10px] font-bold text-slate-300">Max: {event.capacity - event.bookedCount} left</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                <button 
                  type="button"
                  onClick={() => setTickets(Math.max(1, tickets - 1))}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-900 shadow-sm active:scale-90 transition-transform disabled:opacity-30"
                  disabled={tickets <= 1}
                >
                  −
                </button>
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-900 leading-none">{tickets}</span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Guest{tickets > 1 ? 's' : ''}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setTickets(Math.min(event.capacity - event.bookedCount, tickets + 1))}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-900 shadow-sm active:scale-90 transition-transform disabled:opacity-30"
                  disabled={tickets >= (event.capacity - event.bookedCount)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <div className="flex justify-between items-end mb-8 px-2">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Bill</span>
                <span className="text-3xl font-black text-blue-600 italic">
                  {event.price > 0 ? `KES ${(tickets * event.price).toLocaleString()}` : 'FREE'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Status</span>
                <span className="text-xs font-bold text-slate-900">Immediate Entry</span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-[2rem] bg-slate-900 text-white font-black text-lg hover:bg-black shadow-2xl shadow-slate-200 active:scale-[0.97] transition-all flex justify-center items-center gap-3 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  Confirm Booking
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" /></svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
