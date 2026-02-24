import React from 'react';
import { UserRole } from '../types';

interface BottomNavProps {
  activeTab: 'home' | 'organize' | 'my-events' | 'profile';
  setActiveTab: (tab: 'home' | 'organize' | 'my-events' | 'profile') => void;
  userRole: UserRole;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, userRole }) => {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-slate-100 px-8 py-3 pb-8 flex justify-between items-center z-50 safe-bottom">
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-300'}`}
      >
        <svg className="w-6 h-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-widest">Discover</span>
      </button>

      {userRole === 'organizer' && (
        <button 
          onClick={() => setActiveTab('organize')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'organize' ? 'text-blue-600' : 'text-slate-300'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Create</span>
        </button>
      )}

      <button 
        onClick={() => setActiveTab('my-events')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'my-events' ? 'text-blue-600' : 'text-slate-300'}`}
      >
        <svg className="w-6 h-6" fill={activeTab === 'my-events' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-widest">Tickets</span>
      </button>

      <button 
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-300'}`}
      >
        <svg className="w-6 h-6" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-widest">Me</span>
      </button>
    </div>
  );
};

export default BottomNav;