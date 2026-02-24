
import React from 'react';
import { Category } from '../types';

interface CategoryScrollProps {
  selected: Category | 'All';
  onSelect: (cat: Category | 'All') => void;
}

const CAT_CONFIG = [
  { name: 'All', icon: '⚡' },
  { name: Category.MUSIC, icon: '🎵' },
  { name: Category.TECH, icon: '🚀' },
  { name: Category.FOOD, icon: '🍹' },
  { name: Category.ART, icon: '🎨' },
  { name: Category.SPORTS, icon: '🏀' },
];

const CategoryScroll: React.FC<CategoryScrollProps> = ({ selected, onSelect }) => {
  return (
    <div className="mt-8">
      <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 hide-scrollbar">
        {CAT_CONFIG.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onSelect(cat.name as Category | 'All')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl whitespace-nowrap font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 border ${
              selected === cat.name 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm grayscale-0">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryScroll;
