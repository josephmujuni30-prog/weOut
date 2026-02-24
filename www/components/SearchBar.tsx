
import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onFilterClick: () => void;
  hasActiveFilters?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onFilterClick, hasActiveFilters }) => {
  return (
    <div className="px-5 mt-6 flex gap-3">
      <div className="relative flex-grow group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[1.8rem] leading-tight text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-inner transition-all text-sm font-bold"
          placeholder="What's the move today?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <button 
        onClick={onFilterClick}
        className={`relative w-[60px] h-[60px] rounded-[1.8rem] shadow-sm transition-all active:scale-90 flex items-center justify-center ${
          hasActiveFilters 
            ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
            : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default SearchBar;
