
import React from 'react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  minPrice: number;
  maxPrice: number;
  setMinPrice: (val: number) => void;
  setMaxPrice: (val: number) => void;
  startDate: string;
  endDate: string;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  startDate,
  endDate,
  setStartDate,
  setEndDate
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setMinPrice(0);
    setMaxPrice(50000);
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-md rounded-t-[40px] shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-gray-900">Filters</h3>
            <button 
              onClick={handleClear}
              className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-8">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">Price Range (KES)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Min</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Max</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Start</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">End</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-10 py-4 bg-gray-900 text-white font-black rounded-3xl shadow-xl hover:bg-black active:scale-[0.98] transition-all tracking-wide"
          >
            Apply Filters
          </button>
        </div>
        <div className="h-8 bg-white"></div>
      </div>
    </div>
  );
};

export default FilterModal;
