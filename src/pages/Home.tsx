import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, db, updateDoc, doc } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase';
import type { Event } from '../types';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, Filter, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getEventSuggestions } from '../services/geminiService';

const PREDEFINED_CATEGORIES = ['Music', 'Tech', 'Arts', 'Food', 'Sports', 'Networking'];

export default function Home() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([
    'All',
    ...PREDEFINED_CATEGORIES,
  ]);

  useEffect(() => {
    const q = query(collection(db, 'events'), where('status', '==', 'published'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // FIX: renamed inner 'doc' variable to 'snap' to avoid shadowing the imported 'doc' function
      const eventsData = snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() } as Event));
      setEvents(eventsData);

      // Merge custom categories from live events into the category list
      const uniqueCategories = Array.from(new Set(eventsData.map((e) => e.category)));
      const allCategories = ['All', ...PREDEFINED_CATEGORIES];
      uniqueCategories.forEach((cat) => {
        if (!allCategories.includes(cat)) allCategories.push(cat);
      });
      setDynamicCategories(allCategories);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGetSuggestions = async () => {
    setLoadingAi(true);
    const suggestions = await getEventSuggestions(
      'Nairobi',
      profile?.interests?.length ? profile.interests : ['Music', 'Tech']
    );
    setAiSuggestions(suggestions);
    setLoadingAi(false);
  };

  const handleToggleSave = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile) return;

    const savedEvents = profile.savedEvents || [];
    const isSaved = savedEvents.includes(eventId);
    const newSavedEvents = isSaved
      ? savedEvents.filter((id) => id !== eventId)
      : [...savedEvents, eventId];

    try {
      await updateDoc(doc(db, 'users', profile.uid), { savedEvents: newSavedEvents });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'All' || event.category === category;

    let matchesDate = true;
    if (startDate || endDate) {
      const eventDate = event.date.toDate();
      const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
      const end = endDate ? endOfDay(parseISO(endDate)) : new Date(8640000000000000);
      matchesDate = isWithinInterval(eventDate, { start, end });
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden bg-stone-900 flex items-center justify-center text-center px-4">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1920"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter text-white"
          >
            Find your next <br />
            <span className="italic text-stone-300">experience.</span>
          </motion.h1>
          <p className="text-stone-300 max-w-lg mx-auto">
            Discover the best events happening in Nairobi — from underground gigs to tech summits.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <div className="space-y-4 sticky top-20 z-40 bg-stone-50/80 backdrop-blur-sm py-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              size={20}
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search events..."
              aria-label="Search events"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
            />
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto"
            role="tablist"
            aria-label="Event categories"
          >
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={category === cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2 text-stone-400">
            <Filter size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Date Range</span>
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <input
              type="date"
              value={startDate}
              aria-label="Start date"
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-stone-100 text-sm focus:ring-2 focus:ring-stone-900 outline-none"
              placeholder="Start Date"
            />
            <span className="text-stone-300">to</span>
            <input
              type="date"
              value={endDate}
              aria-label="End date"
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-stone-100 text-sm focus:ring-2 focus:ring-stone-900 outline-none"
              placeholder="End Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <section className="bg-stone-100 p-8 rounded-3xl border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
              <span aria-hidden="true">✨</span> AI Recommendations
            </h3>
            <p className="text-stone-500 text-sm">Personalized event ideas powered by Gemini.</p>
          </div>
          <button
            onClick={handleGetSuggestions}
            disabled={loadingAi}
            className="px-6 py-2 bg-white border border-stone-200 rounded-full text-sm font-bold hover:border-stone-900 transition-all disabled:opacity-50"
          >
            {loadingAi ? 'Thinking...' : 'Get Suggestions'}
          </button>
        </div>

        {aiSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-stone max-w-none text-stone-600 text-sm bg-white p-6 rounded-2xl border border-stone-100"
            aria-live="polite"
          >
            {/* FIX: replaced dangerouslySetInnerHTML with safe whitespace rendering */}
            <p style={{ whiteSpace: 'pre-wrap' }}>{aiSuggestions}</p>
          </motion.div>
        )}
      </section>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[400px] bg-stone-200 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          id="events-grid"
          aria-live="polite"
        >
          {filteredEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.3) }}
              className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all"
            >
              <Link to={`/events/${event.id}`} aria-label={`View details for ${event.title}`}>
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={event.coverImage || `https://picsum.photos/seed/${event.id}/800/600`}
                    alt=""
                    role="presentation"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-900">
                    {event.category}
                  </div>
                  <button
                    onClick={(e) => handleToggleSave(e, event.id)}
                    aria-label={
                      profile?.savedEvents?.includes(event.id)
                        ? 'Remove from saved events'
                        : 'Save event'
                    }
                    aria-pressed={!!profile?.savedEvents?.includes(event.id)}
                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${
                      profile?.savedEvents?.includes(event.id)
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white/90 text-stone-400 hover:text-red-500'
                    }`}
                  >
                    <Heart
                      size={18}
                      fill={profile?.savedEvents?.includes(event.id) ? 'currentColor' : 'none'}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-stone-900">{event.title}</h3>
                    <p className="text-stone-500 text-sm line-clamp-2">{event.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-stone-600 text-xs">
                        <Calendar size={14} />
                        {format(event.date.toDate(), 'MMM d, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 text-xs">
                        <MapPin size={14} />
                        {event.location.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">
                        From
                      </p>
                      <p className="text-lg font-bold text-stone-900">
                        KES {Math.min(...event.ticketTypes.map((t) => t.price)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-stone-400 italic text-xl">No events found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
