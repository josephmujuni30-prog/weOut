
import React from 'react';
import { Booking, Event } from '../types';

interface ScheduleSectionProps {
  bookings: Booking[];
  events: Event[];
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({ bookings, events }) => {
  const getEvent = (id: string) => events.find(e => e.id === id);

  if (bookings.length === 0) {
    return (
      <div className="bg-slate-50 rounded-[2rem] p-8 text-center border-2 border-dashed border-slate-100 mt-2">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Your calendar is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-2">
      {bookings.slice(0, 3).map((booking) => {
        const event = getEvent(booking.eventId);
        if (!event) return null;
        return (
          <div key={booking.id} className="bg-white p-4 rounded-[1.8rem] flex items-center gap-4 border border-slate-50 hover:bg-slate-50 transition-colors shadow-sm">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                event.category === 'Tech' ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'
            }`}>
              {event.category === 'Tech' ? '💻' : '🎸'}
            </div>
            <div className="flex-grow">
              <h4 className="text-sm font-black text-slate-900 tracking-tight leading-tight mb-0.5">{event.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Starts {event.time}</p>
            </div>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">
              Ticket
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleSection;
