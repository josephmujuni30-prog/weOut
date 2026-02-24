import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage, auth } from "../services/firebase";

export const OrganizeForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('Westlands');
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');

  // 1. Handle Image Selection & Upload to Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Create a unique filename
      const storageRef = ref(storage, `event-banners/${Date.now()}-${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the public URL
      const url = await getDownloadURL(snapshot.ref);
      
      setBannerUrl(url);
      console.log("Image uploaded successfully:", url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // 2. Handle Form Submission to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !price || !bannerUrl) {
      alert("Please fill in all fields and upload an image!");
      return;
    }

    try {
      setUploading(true);
      // This is the part that writes to the 'events' collection
      await addDoc(collection(db, "events"), {
        title,
        price,
        area,
        bannerUrl,
        description,
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous'
      });

      console.log("Event saved to Firestore!");
      alert("Event posted successfully!");
      
      // Reset form
      setTitle('');
      setPrice('');
      setBannerUrl('');
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Could not save event to database.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Host an Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Event Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded" 
            placeholder="e.g. Sunday Brunch"
          />
        </div>
        <div>
  <label className="block text-sm font-medium">Event Description</label>
  <textarea 
    id="description"
    name="description"
    value={description} 
    onChange={(e) => setDescription(e.target.value)}
    className="w-full border p-2 rounded h-24" 
    placeholder="What should guests expect?"
  />
</div>
        <div>
          <label className="block text-sm font-medium">Price (KES)</label>
          <input
            id="eventTitle"
            name="eventsTitle" 
            type="number" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Banner Image</label>
          <input 
            type="file" 
            onChange={handleImageUpload}
            className="w-full text-sm" 
          />
          {uploading && <p className="text-blue-500 text-xs">Processing...</p>}
          {bannerUrl && <p className="text-green-500 text-xs">Image Ready! ✅</p>}
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className={`w-full py-2 rounded-lg text-white font-bold ${uploading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {uploading ? 'Please wait...' : 'Post Event'}
        </button>
      </form>
    </div>
  );
};
export default OrganizeForm;