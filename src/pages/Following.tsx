import React, { useEffect, useState } from 'react';
import { db, doc, getDoc, collection, query, where, onSnapshot } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile, Event } from '../types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Calendar, MapPin, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import FollowButton from '../components/FollowButton';

interface OrganizerWithEvents extends UserProfile {
  recentEvents: Event[];
}

export default function Following() {
  const { profile } = useAuth();
  const [organizers, setOrganizers] = useState<OrganizerWithEvents[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.following?.length) {
      setLoading(false);
      return;
    }

    const fetchOrganizersAndEvents = async () => {
      // Fetch each followed organizer's profile
      const orgProfiles = await Promise.all(
        profile.following!.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null;
        })
      );

      const validOrgs = orgProfiles.filter(Boolean) as UserProfile[];

      // For each organizer, fetch their upcoming published events
      const orgsWithEvents = await Promise.all(
        validOrgs.map(async (org) => {
          const eventsSnap = await new Promise<Event[]>((resolve) => {
            const q = query(
              collection(db, 'events'),
              where('organizerId', '==', org.uid),
              where('status', '==', 'published')
            );
            const unsub = onSnapshot(q, (snap) => {
              const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Event));
              resolve(events);
              unsub();
            });
          });

          // Sort by date ascending and take the next 3
          const upcoming = eventsSnap
            .filter((e) => e.date.toDate() >= new Date())
            .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
            .slice(0, 3);

          return { ...org, recentEvents: upcoming };
        })
      );

      setOrganizers(orgsWithEvents);
      setLoading(false);
    };

    fetchOrganizersAndEvents();
  }, [profile?.following]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-stone-200 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter text-stone-900">Following</h1>
        <p className="text-stone-500">Organizers you follow and their upcoming events.</p>
      </div>

      {organizers.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-stone-200">
          <Users size={48} className="mx-auto text-stone-200 mb-4" />
          <p className="text-stone-400 italic text-xl">You're not following any organizers yet.</p>
          <p className="text-stone-400 text-sm mt-2">
            Browse events and tap <span className="font-bold text-violet-600">Follow</span> on any organizer.
          </p>
          <Link to="/" className="mt-6 inline-block bg-violet-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-violet-700 transition-colors">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {organizers.map((org, idx) => (
            <motion.div
              key={org.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden"
            >
              {/* Organizer header */}
              <div className="flex items-center justify-between p-6 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      org.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(org.displayName)}&background=7C3AED&color=fff&size=80`
                    }
                    alt={org.displayName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-violet-100"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">{org.displayName}</h2>
                    {org.bio && (
                      <p className="text-stone-500 text-sm line-clamp-1 mt-0.5">{org.bio}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        Organizer
                      </span>
                      {(org.followerCount ?? 0) > 0 && (
                        <span className="text-[10px] text-stone-400 font-medium">
                          {org.followerCount} follower{org.followerCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <FollowButton
                  organizerId={org.uid}
                  organizerName={org.displayName}
                  size="sm"
                />
              </div>

              {/* Upcoming events */}
              <div className="p-6">
                {org.recentEvents.length === 0 ? (
                  <p className="text-stone-400 text-sm italic text-center py-4">
                    No upcoming events from {org.displayName} right now.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
                      Upcoming Events
                    </p>
                    {org.recentEvents.map((event) => {
                      const minPrice = Math.min(...event.ticketTypes.map((t) => t.price));
                      return (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-colors group"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={event.coverImage || `https://picsum.photos/seed/${event.id}/200/200`}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-900 truncate">{event.title}</p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-stone-500">
                                <Calendar size={11} />
                                {format(event.date.toDate(), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-stone-500 truncate max-w-[140px]">
                                <MapPin size={11} />
                                {event.location.address}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-stone-400 uppercase font-bold tracking-widest">From</p>
                            <p className="font-bold text-stone-900 text-sm">
                              {minPrice === 0 ? 'Free' : `KES ${minPrice.toLocaleString()}`}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
