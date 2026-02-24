
import React from 'react';
import { Event } from '../types';

interface TrendingEventsProps {
  events: Event[];
  onEventClick: (e: Event) => void;
}

const TrendingEvents: React.FC<TrendingEventsProps> = ({ events, onEventClick }) => {
  return (
    <div className="flex gap-4 overflow-x-auto px-5 pb-6 hide-scrollbar snap-x">
      {events.map((event) => (
        <div 
          key={event.id}
          onClick={() => onEventClick(event)}
          className="snap-start min-w-[240px] bg-white rounded-[2.2rem] overflow-hidden shadow-sm border border-slate-50 flex-shrink-0 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="h-40 w-full relative">
            <img src={event.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={event.title} />
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black text-slate-900">
                {event.price === 0 ? 'FREE' : `KES ${event.price.toLocaleString()}`}
              </span>
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-[15px] font-black text-slate-900 line-clamp-1 mb-1.5">{event.title}</h4>
            <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3" /></svg>
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.area}
            </p>
          </div>
        </div>
      ))}
      {/* Spacer for horizontal scroll end padding */}
      <div className="min-w-[5px] flex-shrink-0"></div>
    </div>
  );
};

export default TrendingEvents;
