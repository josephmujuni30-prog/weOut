
import React from 'react';

interface HeroProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Hero: React.FC<HeroProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative bg-gray-900 py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <img 
          src="https://images.unsplash.com/photo-1514525253361-bee8a48740d0?auto=format&fit=crop&q=80&w=1920" 
          alt="Nairobi nightlife" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
          Experience <span className="text-orange-500">Nairobi</span> Like Never Before
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-300 mb-10">
          Discover the hottest concerts, workshops, and community gatherings in the Green City in the Sun.
        </p>
        
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-transparent rounded-2xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:text-lg shadow-2xl"
              placeholder="Search by event, location, or area (e.g. Westlands)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-gray-400">
            <span>Trending:</span>
            <button onClick={() => setSearchTerm('Westlands')} className="hover:text-orange-400">#Westlands</button>
            <button onClick={() => setSearchTerm('Concert')} className="hover:text-orange-400">#Music</button>
            <button onClick={() => setSearchTerm('Tech')} className="hover:text-orange-400">#Startup</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
