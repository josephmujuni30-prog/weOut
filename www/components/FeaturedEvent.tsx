
import React from 'react';
import { Event } from '../types';

interface FeaturedEventProps {
  event: Event;
  onBook: () => void;
}

const FeaturedEvent: React.FC<FeaturedEventProps> = ({ event, onBook }) => {
  return (
    <div className="relative h-72 rounded-[2.5rem] overflow-hidden shadow-2xl active:scale-[0.98] transition-all cursor-pointer group" onClick={onBook}>
      <img 
        src={event.imageUrl} 
        alt={event.title} 
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-transparent"></div>
      
      <div className="absolute top-6 left-6">
        <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
          Must Attend
        </span>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <h3 className="text-white text-2xl font-black tracking-tight leading-tight mb-1 italic">{event.title}</h3>
        <p className="text-slate-300 text-xs font-bold flex items-center gap-1.5 mb-5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          {event.area} • {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        
        <div className="flex justify-between items-center">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 overflow-hidden shadow-lg bg-slate-800">
                        <img src={`https://i.pravatar.cc/100?u=${event.id}${i}`} alt="" className="w-full h-full object-cover" />
                    </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                  <span className="text-[8px] text-white font-black">+2k</span>
                </div>
            </div>
            <button 
                className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-white/10 active:scale-90 transition-transform"
            >
                Secure Spot
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" /></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvent;
