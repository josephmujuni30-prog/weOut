import React from 'react';

// This defines what the component needs to function
interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<NavProps> = ({ activeTab, setActiveTab }) => {
  // We define the tabs here so it's easy to add more later (like 'tickets')
  const navItems = [
    { id: 'home', label: 'Explore', icon: '🌍' },
    { id: 'organize', label: 'Post', icon: '➕' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-8 py-4 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
            activeTab === item.id 
              ? 'scale-110 text-blue-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {/* Icon with a subtle bounce when active */}
          <span className={`text-2xl ${activeTab === item.id ? 'animate-bounce' : ''}`}>
            {item.icon}
          </span>
          
          {/* Label with a "black" (ultra-bold) font for that modern look */}
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${
            activeTab === item.id ? 'opacity-100' : 'opacity-40'
          }`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};