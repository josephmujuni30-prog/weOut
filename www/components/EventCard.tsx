
import React from 'react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onBook: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBook }) => {
  const isFull = event.bookedCount >= event.capacity;
  
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {event.category}
          </span>
        </div>
        {event.price === 0 && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
              Free
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center text-orange-600 text-sm font-semibold mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.time}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">
          {event.title}
        </h3>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
          {event.description}
        </p>
        
        <div className="flex items-center text-gray-600 text-xs mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.location}, {event.area}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            <span className="text-xs text-gray-400 block uppercase font-semibold">Price</span>
            <span className="text-lg font-bold text-gray-900">
              {event.price > 0 ? `KES ${event.price.toLocaleString()}` : 'Free Admission'}
            </span>
          </div>
          
          <button
            onClick={onBook}
            disabled={isFull}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              isFull 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
            }`}
          >
            {isFull ? 'Sold Out' : 'Get Tickets'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
