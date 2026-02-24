
import React, { useState } from 'react';
import { Category, Event, UserProfile } from '../types';
import { NAIROBI_AREAS } from '../constants';
import { enhanceEventDescription } from '../services/geminiService';
import { db, storage } from '../services/firebase';
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface OrganizerFormProps {
  onSubmit: (event: Event) => void;
  onCancel: () => void;
  userProfile: UserProfile;
}

const OrganizerForm: React.FC<OrganizerFormProps> = ({ onSubmit, onCancel, userProfile }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    area: NAIROBI_AREAS[0],
    category: Category.MUSIC,
    price: 0,
    capacity: 100,
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // 1. Upload Image to Firebase Storage if selected
      if (imageFile) {
        const storageRef = ref(storage, `event-banners/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      const eventData = {
        ...formData,
        imageUrl: finalImageUrl,
        organizer: userProfile.name,
        organizerUid: userProfile.uid,
        bookedCount: 0,
      };

      // 2. Save to Firestore
      const docRef = await addDoc(collection(db, "events"), eventData);
      
      onSubmit({ id: docRef.id, ...eventData } as Event);
    } catch (err) {
      console.error("Firestore/Storage Error:", err);
      alert("Failed to save event. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnhance = async () => {
    if (!formData.description || !formData.title) {
        alert("Please enter a title and a basic description first.");
        return;
    }
    setIsEnhancing(true);
    const enhanced = await enhanceEventDescription(formData.title, formData.category, formData.description);
    setFormData(prev => ({ ...prev, description: enhanced }));
    setIsEnhancing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Event Title</label>
          <input
            required
            type="text"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
            placeholder="e.g. Sarit Tech Expo"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Event Banner</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Category</label>
            <select
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm appearance-none"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
            >
              {Object.values(Category).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Area</label>
            <select
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm appearance-none"
              value={formData.area}
              onChange={e => setFormData({ ...formData, area: e.target.value })}
            >
              {NAIROBI_AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
            <button 
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="text-[9px] flex items-center text-blue-600 font-black uppercase tracking-wider hover:text-blue-700 disabled:opacity-30"
            >
              {isEnhancing ? 'AI Enhancing...' : '✨ AI Magic'}
            </button>
          </div>
          <textarea
            required
            rows={3}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
            placeholder="Tell us the vibe..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Date</label>
            <input
              required
              type="date"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Time</label>
            <input
              required
              type="time"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Ticket Price</label>
            <input
              required
              type="number"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Max Crowd</label>
            <input
              required
              type="number"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
              value={formData.capacity}
              onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 100 })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center"
          >
            {isSubmitting ? 'Posting...' : 'Go Live'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrganizerForm;
