
import React from 'react';
import { Booking, Event } from '../types';

interface BookingsViewProps {
  bookings: Booking[];
  events: Event[];
  onGoDiscover: () => void;
}

const BookingsView: React.FC<BookingsViewProps> = ({ bookings, events, onGoDiscover }) => {
  // Helper to find the event details for a specific booking
  const getEventForBooking = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  if (bookings.length === 0) {
    return (
      <div className="px-8 py-24 text-center animate-fade-in flex flex-col items-center">
        <div className="mb-6 inline-flex p-8 rounded-full bg-slate-50 text-blue-600">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight italic">No Tickets Found</h2>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium text-sm">
          You haven't booked any vibe yet. Nairobi's cultural heartbeat is waiting for you!
        </p>
        <button
          onClick={onGoDiscover}
          className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-xs"
        >
          Discover Events
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 pb-32 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic leading-none">My Tickets</h2>
          <p className="text-slate-500 mt-2 font-medium text-sm">Secure entry to the city's best events.</p>
        </div>
      </div>

      <div className="space-y-6">
        {bookings.map((booking) => {
          const event = getEventForBooking(booking.eventId);
          
          // Use event data if available, otherwise fallback to booking data
          const displayTitle = event?.title || "Confirmed Vibe";
          const displayDate = event?.date || "";
          const displayTime = event?.time || "TBA";
          const displayImageUrl = event?.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800";

          return (
            <div key={booking.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50 flex flex-col active:scale-[0.98] transition-all group">
              {/* Event Image Banner */}
              <div className="h-40 relative">
                <img src={displayImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                   <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/20">
                     {event?.category || "EVENT"}
                   </span>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight flex-grow pr-4">
                    {displayTitle}
                  </h3>
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                    Confirmed
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-5">
                  <div>
                    <span className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">When</span>
                    <p className="text-xs font-bold text-slate-900">
                      {displayDate ? new Date(displayDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) : 'Date TBA'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{displayTime}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Passes</span>
                    <p className="text-xs font-bold text-slate-900">{booking.tickets} Guest{booking.tickets > 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-slate-400 font-medium italic">ID: {booking.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                {/* Scannable Area Mimic */}
                <div className="mt-6 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m0 11v1m5-10v1m-10 0v1m10 5v1m-10 0v1m4-10h1m4 0h1m-9 4h1m4 0h1m4 0h1m-9 4h1m4 0h1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Entry Code</p>
                      <p className="text-[11px] font-bold text-slate-900">Valid Digital Pass</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-blue-600 italic">Paid</p>
                    <p className="text-[9px] text-slate-400 font-bold">KES {(booking.totalPrice || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingsView;
