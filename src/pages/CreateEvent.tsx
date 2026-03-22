import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, collection, addDoc, doc, getDoc, updateDoc, Timestamp } from '../firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import type { Event, TicketType } from '../types';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Save, X, Image as ImageIcon,
  MapPin, Ticket, Upload, CheckCircle2, Loader, AlertCircle,
} from 'lucide-react';

const PREDEFINED_CATEGORIES = ['Music', 'Tech', 'Arts', 'Food', 'Sports', 'Networking'];
const storage = getStorage();

// ─── Geocode helper (same as MapView) ────────────────────────────────────────
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = address.toLowerCase().includes('nairobi') ? address : `${address}, Nairobi, Kenya`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ke`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* fail silently */ }
  return null;
}

// ─── Image Upload Component ───────────────────────────────────────────────────
interface ImageUploadProps {
  currentUrl: string;
  onUploadComplete: (url: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}

function ImageUpload({ currentUrl, onUploadComplete, onUploadStart, onUploadEnd }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentUrl);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (currentUrl && !preview) setPreview(currentUrl); }, [currentUrl]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return; }
    setError(null); setDone(false); setProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    const storageRef = ref(storage, `event-banners/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    setUploading(true); onUploadStart();
    uploadTask.on('state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { console.error(err); setError('Upload failed.'); setUploading(false); onUploadEnd(); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete(url); setUploading(false); setDone(true); onUploadEnd();
      }
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">Cover Image</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        className={`relative w-full h-52 rounded-2xl border-2 border-dashed overflow-hidden transition-all
          ${uploading ? 'cursor-wait border-stone-300' : 'cursor-pointer border-stone-200 hover:border-violet-400'}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
            {!uploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                <Upload size={28} /><span className="text-xs font-bold uppercase tracking-widest">Change Image</span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-stone-400">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center"><ImageIcon size={28} /></div>
            <div className="text-center">
              <p className="text-sm font-bold text-stone-600">Click to upload or drag & drop</p>
              <p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP — max 5 MB</p>
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <div className="w-48 bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-white text-xs font-bold uppercase tracking-widest">Uploading {progress}%</p>
          </div>
        )}
        {done && !uploading && (
          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1"><CheckCircle2 size={18} /></div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {preview && !uploading && (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="text-xs font-bold text-stone-400 hover:text-violet-600 transition-colors uppercase tracking-widest">
          Replace image
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateEvent() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'found' | 'failed'>('idle');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    category: 'Music',
    customCategory: '',
    location: { address: '', lat: 0, lng: 0 },
    coverImage: '',
    status: 'published' as 'draft' | 'published',
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: 'Regular', price: 0, capacity: 100, sold: 0 },
  ]);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      const docSnap = await getDoc(doc(db, 'events', id));
      if (docSnap.exists()) {
        const data = docSnap.data() as Event;
        const dateObj = data.date.toDate();
        const isCustom = !PREDEFINED_CATEGORIES.includes(data.category);
        setFormData({
          title: data.title,
          description: data.description,
          date: dateObj.toISOString().split('T')[0],
          time: dateObj.toTimeString().split(' ')[0].slice(0, 5),
          category: isCustom ? 'Other' : data.category,
          customCategory: isCustom ? data.category : '',
          location: data.location,
          coverImage: data.coverImage || '',
          status: data.status,
        });
        setTicketTypes(data.ticketTypes);
        // If existing event already has coords, mark as found
        if (data.location.lat !== 0) setGeocodeStatus('found');
      }
    };
    fetchEvent();
  }, [id]);

  // Auto-geocode when user stops typing address (debounced)
  useEffect(() => {
    const address = formData.location.address;
    if (!address || address.length < 5) return;
    const timer = setTimeout(async () => {
      setGeocoding(true);
      const coords = await geocodeAddress(address);
      if (coords) {
        setFormData((prev) => ({ ...prev, location: { ...prev.location, ...coords } }));
        setGeocodeStatus('found');
      } else {
        setGeocodeStatus('failed');
      }
      setGeocoding(false);
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [formData.location.address]);

  const handleAddTicket = () => setTicketTypes([...ticketTypes, { name: '', price: 0, capacity: 0, sold: 0 }]);
  const handleRemoveTicket = (index: number) => setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  const handleTicketChange = (index: number, field: keyof TicketType, value: string | number) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (imageUploading) { alert('Please wait for the image upload to finish.'); return; }

    setLoading(true);

    // If geocode hasn't resolved yet, try one more time on submit
    let finalLocation = formData.location;
    if (finalLocation.lat === 0 && finalLocation.address) {
      const coords = await geocodeAddress(finalLocation.address);
      if (coords) finalLocation = { ...finalLocation, ...coords };
    }

    const eventDate = new Date(`${formData.date}T${formData.time}`);
    const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;

    const eventData: Omit<Event, 'id'> = {
      title: formData.title,
      description: formData.description,
      date: Timestamp.fromDate(eventDate),
      location: finalLocation,
      category: finalCategory || 'Other',
      coverImage: formData.coverImage,
      ticketTypes: ticketTypes.map((t) => ({
        ...t,
        price: isNaN(t.price) ? 0 : t.price,
        capacity: isNaN(t.capacity) ? 0 : t.capacity,
      })),
      organizerId: profile.uid,
      organizerName: profile.displayName,
      organizerPhoto: profile.photoURL,
      status: formData.status,
      createdAt: Timestamp.now(),
    };

    try {
      if (id) {
        await updateDoc(doc(db, 'events', id), eventData);
      } else {
        const newEventRef = await addDoc(collection(db, 'events'), eventData);
        // Notify followers about the new event (fire and forget)
        if (eventData.status === 'published') {
          fetch('/api/email/new-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: newEventRef.id }),
          }).catch((e) => console.warn('New event alert failed:', e));
        }
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-violet-500 outline-none';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tighter text-stone-900">
          {id ? 'Edit Event' : 'Create New Event'}
        </h1>
        <button onClick={() => navigate('/dashboard')} className="text-stone-400 hover:text-stone-900">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Basic Info */}
        <section className="bg-white p-8 rounded-3xl border border-stone-200 space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Plus size={20} /> Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="event-title" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Event Title</label>
              <input id="event-title" required type="text" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputClass} placeholder="e.g. Summer Solstice Festival" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="event-category" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Category</label>
                  <select id="event-category" value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={inputClass}>
                    {PREDEFINED_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="Other">Other...</option>
                  </select>
                </div>
                {formData.category === 'Other' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
                    <label htmlFor="custom-category" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Custom Category</label>
                    <input id="custom-category" required type="text" value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      className={inputClass} placeholder="e.g. Workshop, Gala..." />
                  </motion.div>
                )}
              </div>
              <ImageUpload
                currentUrl={formData.coverImage}
                onUploadComplete={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
                onUploadStart={() => setImageUploading(true)}
                onUploadEnd={() => setImageUploading(false)}
              />
            </div>

            <div>
              <label htmlFor="event-description" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Description</label>
              <textarea id="event-description" required rows={5} value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClass} resize-none`} placeholder="Tell people what to expect..." />
            </div>
          </div>
        </section>

        {/* Date & Location */}
        <section className="bg-white p-8 rounded-3xl border border-stone-200 space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MapPin size={20} /> Date & Location
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-date" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Date</label>
              <input id="event-date" required type="date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="event-time" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Time</label>
              <input id="event-time" required type="time" value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="event-address" className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
              Venue Address
            </label>
            <div className="relative">
              <input id="event-address" required type="text" value={formData.location.address}
                onChange={(e) => {
                  setGeocodeStatus('idle');
                  setFormData({ ...formData, location: { address: e.target.value, lat: 0, lng: 0 } });
                }}
                className={`${inputClass} pr-10`} placeholder="e.g. Uhuru Gardens, Nairobi" />
              {/* Geocode status indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {geocoding && <Loader size={16} className="text-violet-500 animate-spin" />}
                {!geocoding && geocodeStatus === 'found' && <CheckCircle2 size={16} className="text-green-500" />}
                {!geocoding && geocodeStatus === 'failed' && <AlertCircle size={16} className="text-amber-500" />}
              </div>
            </div>
            {/* Status messages */}
            {geocodeStatus === 'found' && !geocoding && (
              <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Location confirmed on map
              </p>
            )}
            {geocodeStatus === 'failed' && !geocoding && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Couldn't find exact location — map will show approximate area
              </p>
            )}
            {geocoding && (
              <p className="text-violet-600 text-xs mt-1 flex items-center gap-1">
                <Loader size={11} className="animate-spin" /> Looking up location...
              </p>
            )}
          </div>
        </section>

        {/* Tickets */}
        <section className="bg-white p-8 rounded-3xl border border-stone-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Ticket size={20} /> Ticket Tiers
            </h3>
            <button type="button" onClick={handleAddTicket}
              className="text-sm font-bold text-violet-600 hover:text-violet-700">
              + Add Tier
            </button>
          </div>
          <div className="space-y-4">
            {ticketTypes.map((ticket, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-end p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="col-span-5">
                  <label htmlFor={`ticket-name-${idx}`} className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Name</label>
                  <input id={`ticket-name-${idx}`} required type="text" value={ticket.name}
                    onChange={(e) => handleTicketChange(idx, 'name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. Early Bird" />
                </div>
                <div className="col-span-3">
                  <label htmlFor={`ticket-price-${idx}`} className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Price (KES)</label>
                  <input id={`ticket-price-${idx}`} required type="number" min={0}
                    value={isNaN(ticket.price) ? '' : ticket.price}
                    onChange={(e) => handleTicketChange(idx, 'price', e.target.value === '' ? NaN : parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div className="col-span-3">
                  <label htmlFor={`ticket-capacity-${idx}`} className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Capacity</label>
                  <input id={`ticket-capacity-${idx}`} required type="number" min={1}
                    value={isNaN(ticket.capacity) ? '' : ticket.capacity}
                    onChange={(e) => handleTicketChange(idx, 'capacity', e.target.value === '' ? NaN : parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => handleRemoveTicket(idx)}
                    aria-label={`Remove ${ticket.name || 'this'} tier`}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading || imageUploading || geocoding}
            className="flex-1 bg-violet-600 text-white py-4 rounded-2xl font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait">
            {imageUploading ? 'Waiting for image...' :
              geocoding ? <><Loader size={18} className="animate-spin" /> Looking up location...</> :
              loading ? 'Saving...' :
              <><Save size={20} /> {id ? 'Update Event' : 'Publish Event'}</>}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-2xl border-2 border-stone-200 font-bold hover:bg-stone-50 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
