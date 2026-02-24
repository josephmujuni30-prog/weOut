import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      const docRef = doc(db, "events", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading details...</div>;
  if (!event) return <div className="p-10 text-center">Event not found.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 min-h-screen pb-20">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="p-4 flex items-center gap-2 text-slate-500">
        <span className="material-symbols-outlined">arrow_back</span> Back
      </button>

      {/* Main Image */}
      <div className="w-full h-64 overflow-hidden">
        <img 
          src={event.bannerUrl || "https://picsum.photos/600/400"} 
          className="w-full h-full object-cover"
          alt={event.title}
        />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold dark:text-white">{event.title}</h1>
          <span className="bg-[#ee2b8c] text-white px-4 py-1 rounded-full font-bold">
            KES {event.price}
          </span>
        </div>

        <div className="flex gap-4 mb-6 text-slate-500 text-sm">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">pin_drop</span>
            {event.area}
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {event.createdAt ? new Date(event.createdAt.seconds * 1000).toLocaleDateString() : 'Upcoming'}
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800 mb-6" />

        <h2 className="text-lg font-bold mb-2 dark:text-white">About this Event</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
          {event.description || "No description provided for this event."}
        </p>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
        <button className="w-full bg-[#ee2b8c] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#ee2b8c]/30">
          Book Now
        </button>
      </div>
    </div>
  );
};

export default EventDetails;