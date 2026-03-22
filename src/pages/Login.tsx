import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { motion } from 'framer-motion';
import { LogIn, User, Building2 } from 'lucide-react';
import WeOutLogo from '../components/WeOutLogo';

export default function Login() {
  const { setRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      if (!auth.currentUser) {
        await signInWithPopup(auth, googleProvider);
      }
      await setRole(selectedRole);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <WeOutLogo size="lg" variant="purple" />
          </div>
          <p className="text-white/50 text-sm">Join the community. Discover or create.</p>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 text-center">I want to join as</p>
          
          <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Select your role">
            <button
              onClick={() => setSelectedRole('attendee')}
              role="radio"
              aria-checked={selectedRole === 'attendee'}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                selectedRole === 'attendee' 
                ? 'border-violet-500 bg-violet-600 text-white' 
                : 'border-white/10 bg-white/5 text-white/60 hover:border-violet-500/50'
              }`}
            >
              <User size={32} aria-hidden="true" />
              <span className="font-medium">Attendee</span>
            </button>

            <button
              onClick={() => setSelectedRole('organizer')}
              role="radio"
              aria-checked={selectedRole === 'organizer'}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                selectedRole === 'organizer' 
                ? 'border-violet-500 bg-violet-600 text-white' 
                : 'border-white/10 bg-white/5 text-white/60 hover:border-violet-500/50'
              }`}
            >
              <Building2 size={32} aria-hidden="true" />
              <span className="font-medium">Organizer</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={!selectedRole || loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-stone-900 py-4 rounded-2xl font-bold hover:bg-stone-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-stone-900"></div>
          ) : (
            <>
              <LogIn size={20} />
              Continue with Google
            </>
          )}
        </button>

        <p className="mt-8 text-center text-[10px] text-white/30 uppercase tracking-widest">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </motion.div>
    </div>
  );
}
