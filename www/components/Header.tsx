
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="px-5 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-br from-blue-500 to-emerald-400 p-1.5 rounded-xl shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tighter italic">weOut</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative p-2 bg-slate-50 rounded-full cursor-pointer hover:bg-slate-100 transition-colors">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
