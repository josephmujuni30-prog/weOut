
import React from 'react';
import { UserProfile, Category } from '../types';
import { NAIROBI_AREAS } from '../constants';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdate, onLogout }) => {
  const toggleInterest = (interest: Category) => {
    const newInterests = profile.interests.includes(interest)
      ? profile.interests.filter(i => i !== interest)
      : [...profile.interests, interest];
    onUpdate({ ...profile, interests: newInterests });
  };

  const toggleArea = (area: string) => {
    const newAreas = profile.preferredAreas.includes(area)
      ? profile.preferredAreas.filter(a => a !== area)
      : [...profile.preferredAreas, area];
    onUpdate({ ...profile, preferredAreas: newAreas });
  };

  return (
    <div className="animate-fade-in px-5 pb-24">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-6 border-b border-gray-100 mb-8">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl mb-4">
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile.name}</h2>
        <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 font-medium text-sm">{profile.email}</p>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                profile.role === 'organizer' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
                {profile.role}
            </span>
        </div>
      </div>

      {/* Account Settings */}
      <div className="mb-8">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Account Settings</h3>
        <div className="bg-gray-50 rounded-3xl overflow-hidden divide-y divide-gray-100">
          <button className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-100 transition-colors">
            <span className="text-sm font-bold text-gray-700">Personal Information</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-100 transition-colors">
            <span className="text-sm font-bold text-gray-700">Payment Methods</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Interests Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">My Interests</h3>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {profile.interests.length} Selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(Category).map(cat => {
            const isSelected = profile.interests.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleInterest(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Areas Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Preferred Areas</h3>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {profile.preferredAreas.length} Selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {NAIROBI_AREAS.map(area => {
            const isSelected = profile.preferredAreas.includes(area);
            return (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200' 
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={onLogout}
        className="w-full py-4 bg-red-50 text-red-600 font-black rounded-3xl hover:bg-red-100 active:scale-[0.98] transition-all tracking-wide mt-4 shadow-sm"
      >
        Sign Out
      </button>
    </div>
  );
};

export default ProfileView;
