import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, updateDoc, collection, query, where, onSnapshot } from '../firebase';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save, Camera, Heart, Calendar, MapPin, Users } from 'lucide-react';
import type { Event } from '../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Profile() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    interests: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        interests: profile.interests?.join(', ') || '',
      });
    }
  }, [profile]);

  // Fetch saved events
  useEffect(() => {
    if (!profile?.savedEvents?.length) { setSavedEvents([]); return; }
    const savedIds = profile.savedEvents.slice(0, 30);
    const q = query(collection(db, 'events'), where('__name__', 'in', savedIds));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Event)));
    });
    return () => unsubscribe();
  }, [profile?.savedEvents]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
        interests: formData.interests.split(',').map((i) => i.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const isOrganizer = profile.role === 'organizer';
  const followerCount = profile.followerCount ?? 0;
  const followingCount = profile.following?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter text-stone-900">Profile</h1>
        <p className="text-stone-500">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Cover banner */}
        <div className="h-28 bg-gradient-to-br from-violet-600 to-violet-900 relative" />

        {/* Avatar + stats */}
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-12 mb-6">
            <div className="relative group">
              <img
                src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=7C3AED&color=fff&size=96`}
                alt={profile.displayName}
                className="w-24 h-24 rounded-3xl border-4 border-white object-cover shadow-lg"
                referrerPolicy="no-referrer"
              />
              <button className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={20} />
              </button>
            </div>

            {/* Follower / following stats */}
            <div className="flex items-center gap-6 pb-1">
              {isOrganizer ? (
                <div className="text-center">
                  <p className="text-2xl font-bold text-stone-900">{followerCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Followers</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-stone-900">{followingCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Following</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-900">{profile.savedEvents?.length ?? 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Saved</p>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-violet-50 rounded-2xl border border-violet-100">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Account Type</p>
              <p className="font-bold text-stone-900 capitalize">{profile.role}</p>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input id="displayName" type="text" value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input id="email" disabled type="email" value={profile.email}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Bio</label>
              <textarea id="bio" rows={3} value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                placeholder={isOrganizer ? 'Tell attendees about your events...' : 'Tell us about yourself...'} />
            </div>

            {!isOrganizer && (
              <div>
                <label htmlFor="interests" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Interests (comma separated)</label>
                <input id="interests" type="text" value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="Music, Tech, Arts..." />
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                saved ? 'bg-green-600 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}>
              {loading ? 'Saving...' : saved ? '✓ Saved!' : <><Save size={18} /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>

      {/* Organizer: show follower count callout */}
      {isOrganizer && followerCount > 0 && (
        <div className="bg-violet-50 rounded-3xl border border-violet-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600">
            <Users size={24} />
          </div>
          <div>
            <p className="font-bold text-stone-900">{followerCount} people follow you</p>
            <p className="text-stone-500 text-sm">They'll get notified when you create new events.</p>
          </div>
        </div>
      )}

      {/* Attendee: link to following page */}
      {!isOrganizer && followingCount > 0 && (
        <Link to="/following"
          className="flex items-center justify-between bg-violet-50 rounded-3xl border border-violet-100 p-6 hover:border-violet-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600">
              <Users size={24} />
            </div>
            <div>
              <p className="font-bold text-stone-900">Following {followingCount} organizer{followingCount !== 1 ? 's' : ''}</p>
              <p className="text-stone-500 text-sm">See their upcoming events</p>
            </div>
          </div>
          <span className="text-violet-600 font-bold text-sm">View →</span>
        </Link>
      )}

      {/* Saved Events */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Heart size={22} className="text-red-500" fill="currentColor" /> Saved Events
          </h2>
          <span className="text-stone-400 text-sm">{profile.savedEvents?.length || 0} saved</span>
        </div>

        {savedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedEvents.map((event) => (
              <motion.div key={event.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden group">
                <Link to={`/events/${event.id}`} className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                    <img
                      src={event.coverImage || `https://picsum.photos/seed/${event.id}/200/200`}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-stone-900 truncate">{event.title}</h3>
                    <div className="flex items-center gap-1 text-stone-500 text-xs">
                      <Calendar size={11} />{format(event.date.toDate(), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1 text-stone-500 text-xs truncate">
                      <MapPin size={11} />{event.location.address}
                    </div>
                    <p className="text-violet-600 font-bold text-sm">
                      {Math.min(...event.ticketTypes.map((t) => t.price)) === 0
                        ? 'Free'
                        : `KES ${Math.min(...event.ticketTypes.map((t) => t.price)).toLocaleString()}`}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
            <p className="text-stone-400 italic">You haven't saved any events yet.</p>
            <Link to="/" className="text-violet-600 font-bold text-sm mt-2 inline-block hover:underline">
              Explore events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
