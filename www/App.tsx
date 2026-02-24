
import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_EVENTS } from './constants';
import { Event, Category, Booking, UserProfile, UserRole } from './types';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SearchBar from './components/SearchBar';
import CategoryScroll from './components/CategoryScroll';
import FeaturedEvent from './components/FeaturedEvent';
import TrendingEvents from './components/TrendingEvents';
import ScheduleSection from './components/ScheduleSection';
import BookingModal from './components/BookingModal';
import BookingsView from './components/BookingsView';
import OrganizerForm from './components/OrganizerForm';
import FilterModal from './components/FilterModal';
import ProfileView from './components/ProfileView';
import LoginView from './components/LoginView';
import { enhanceEventDescription } from './services/geminiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc, getDoc, setDoc, orderBy } from 'firebase/firestore';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'organize' | 'my-events' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEnhancingAll, setIsEnhancingAll] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Filter states
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Sync Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile({ uid: user.uid, ...userDoc.data() } as UserProfile);
          } else {
            setUserProfile({
              uid: user.uid,
              name: user.displayName || "Explorer",
              email: user.email || "",
              avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`,
              interests: [Category.TECH],
              preferredAreas: ['Westlands'],
              role: 'user'
            });
          }
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
        setUserBookings([]);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Events Subscription
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      if (fetched.length === 0) {
        setIsDbEmpty(true);
        setEvents(INITIAL_EVENTS);
      } else {
        setIsDbEmpty(false);
        setEvents(fetched);
      }
    }, (err) => console.error("Events fetch error:", err));
    return () => unsubscribe();
  }, []);

  // 3. Real-time Tickets Subscription for current user
  useEffect(() => {
    if (!userProfile?.uid) return;
    
    // REMOVED orderBy("timestamp", "desc") to avoid Index Requirement errors
    const q = query(
      collection(db, "tickets"), 
      where("userUid", "==", userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // Sort in frontend to ensure the user sees newest tickets first
      const sortedBookings = fetchedBookings.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setUserBookings(sortedBookings);
    }, (err) => console.error("Tickets fetch error:", err));

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      for (const event of INITIAL_EVENTS) {
        await setDoc(doc(db, "events", event.id), {
          ...event,
          organizerUid: userProfile?.uid || 'system'
        });
      }
      alert("Database seeded! All events are now bookable.");
    } catch (err) {
      console.error("Seeding failed:", err);
      alert("Seeding failed. Check console.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('home');
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const handleBookEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsBookingOpen(true);
  };

  const confirmBooking = () => {
    setIsBookingOpen(false);
    setSelectedEvent(null);
  };

  const handleAddEvent = () => {
    setActiveTab('home');
  };

  const handleEnhanceAll = async () => {
    if (isEnhancingAll) return;
    setIsEnhancingAll(true);
    try {
      const enhancedEvents = await Promise.all(
        events.map(async (event) => {
          const enhancedDesc = await enhanceEventDescription(event.title, event.category, event.description);
          return { ...event, description: enhancedDesc };
        })
      );
      setEvents(enhancedEvents);
    } catch (error) {
      console.error("Failed to enhance all events:", error);
    } finally {
      setIsEnhancingAll(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.area.toLowerCase().includes(searchTerm.toLowerCase());
      const eventDate = new Date(event.date);
      const matchesStartDate = !startDate || eventDate >= new Date(startDate);
      const matchesEndDate = !endDate || eventDate <= new Date(endDate);
      const matchesPrice = event.price >= minPrice && event.price <= maxPrice;
      return matchesCategory && matchesSearch && matchesStartDate && matchesEndDate && matchesPrice;
    });
  }, [events, selectedCategory, searchTerm, minPrice, maxPrice, startDate, endDate]);

  const recommendedEvents = useMemo(() => {
    if (!userProfile) return [];
    return events.filter(e => 
      userProfile.interests.includes(e.category) || 
      userProfile.preferredAreas.includes(e.area)
    ).slice(0, 5);
  }, [events, userProfile]);

  const myListedEvents = useMemo(() => {
    if (!userProfile) return [];
    return events.filter(e => e.organizerUid === userProfile.uid);
  }, [events, userProfile]);

  if (isLoadingAuth) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white p-8">
        <div className="bg-gradient-to-br from-blue-500 to-emerald-400 p-4 rounded-3xl shadow-2xl animate-bounce mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">weOut</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 animate-pulse">Setting the vibe...</p>
      </div>
    );
  }

  if (!isLoggedIn || !userProfile) {
    return <LoginView onLogin={() => {}} />;
  }

  const renderContent = () => {
    if (activeTab === 'my-events') {
      return <BookingsView bookings={userBookings} events={events} onGoDiscover={() => setActiveTab('home')} />;
    }
    
    if (activeTab === 'organize') {
        if (userProfile.role !== 'organizer') {
            setActiveTab('home');
            return null;
        }
        return (
            <div className="px-5 py-8 animate-fade-in pb-32">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Create Vibe</h2>
                    <p className="text-slate-500 text-sm font-medium">Post your event to the weOut community.</p>
                </div>
                <div className="mb-10">
                    <OrganizerForm onSubmit={handleAddEvent} onCancel={() => setActiveTab('home')} userProfile={userProfile} />
                </div>
                {myListedEvents.length > 0 && (
                    <div className="animate-slide-up">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Your Listings ({myListedEvents.length})</h3>
                        <div className="space-y-4">
                            {myListedEvents.map(event => (
                                <div key={event.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm active:scale-95 transition-all">
                                    <img src={event.imageUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{event.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{event.bookedCount}/{event.capacity}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{event.area}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'profile') {
        return <ProfileView profile={userProfile} onUpdate={setUserProfile} onLogout={handleLogout} />;
    }

    return (
      <div className="pb-32 animate-fade-in">
        <div className="px-5 pt-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">Habari, {userProfile.name.split(' ')[0]}!</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Discover Nairobi's heartbeat</p>
          </div>
          <div className="flex gap-2">
            {isDbEmpty && (
                <button 
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black tracking-wider uppercase bg-emerald-500 text-white shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                >
                  {isSeeding ? 'Seeding...' : 'Seed DB'}
                </button>
            )}
            <button 
              onClick={handleEnhanceAll}
              disabled={isEnhancingAll}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black tracking-wider uppercase transition-all shadow-sm ${
                isEnhancingAll 
                  ? 'bg-slate-50 text-slate-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200'
              }`}
            >
              {isEnhancingAll ? 'Wait...' : 'AI Boost'}
            </button>
          </div>
        </div>

        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm} 
          onFilterClick={() => setIsFilterOpen(true)}
          hasActiveFilters={minPrice > 0 || maxPrice < 50000 || !!startDate || !!endDate}
        />
        
        <CategoryScroll selected={selectedCategory} onSelect={setSelectedCategory} />

        <div className="px-5 mt-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Featured Vibe</h2>
          {filteredEvents.length > 0 ? (
            <FeaturedEvent event={filteredEvents[0]} onBook={() => handleBookEvent(filteredEvents[0])} />
          ) : (
            <div className="bg-slate-50 h-56 rounded-[2.5rem] flex items-center justify-center text-slate-300 font-black italic border-2 border-dashed border-slate-100">
              No events matched
            </div>
          )}
        </div>

        {recommendedEvents.length > 0 && searchTerm === '' && selectedCategory === 'All' && (
          <div className="mt-10 animate-slide-up">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6 mb-4">Recommended For You</h2>
            <TrendingEvents events={recommendedEvents} onEventClick={handleBookEvent} />
          </div>
        )}

        <div className="mt-10 animate-slide-up">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6 mb-4">
            {selectedCategory !== 'All' ? `${selectedCategory} Vibe` : 'All Upcoming'}
          </h2>
          {filteredEvents.length > 0 ? (
            <TrendingEvents events={filteredEvents} onEventClick={handleBookEvent} />
          ) : (
            <div className="px-5 py-8 text-center text-slate-300 font-bold italic">Check another vibe</div>
          )}
        </div>

        <div className="px-5 mt-10">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Your Calendar</h2>
          <ScheduleSection bookings={userBookings} events={events} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-full relative shadow-2xl flex flex-col hide-scrollbar">
      <Header />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={userProfile.role} />
      {selectedEvent && userProfile && (
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
          event={selectedEvent} 
          userProfile={userProfile}
          onConfirm={confirmBooking}
        />
      )}
      <FilterModal 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />
    </div>
  );
};

export default App;
