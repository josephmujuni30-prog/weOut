
import React from 'react';

interface NavbarProps {
  view: 'discover' | 'organize' | 'bookings';
  setView: (view: 'discover' | 'organize' | 'bookings') => void;
  bookingCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ view, setView, bookingCount }) => {
  return (
    <nav className="sticky top-0 z-50 glass-morphism border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer" onClick={() => setView('discover')}>
            <div className="bg-orange-600 text-white p-2 rounded-lg mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
              NairobiEvents
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setView('discover')}
              className={`text-sm font-semibold px-3 py-2 rounded-md transition-colors ${
                view === 'discover' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Discover
            </button>
            <button 
              onClick={() => setView('organize')}
              className={`text-sm font-semibold px-3 py-2 rounded-md transition-colors ${
                view === 'organize' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Organize
            </button>
            <button 
              onClick={() => setView('bookings')}
              className={`text-sm font-semibold px-3 py-2 rounded-md transition-colors relative flex items-center ${
                view === 'bookings' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              My Bookings
              {bookingCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {bookingCount}
                </span>
              )}
            </button>
            <button className="hidden sm:block bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105">
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
