
import React, { useState } from 'react';
import { UserRole, Category } from '../types';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginViewProps {
  onLogin: (name: string, email: string, role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [step, setStep] = useState<'welcome' | 'form'>('welcome');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update basic Auth profile
        await updateProfile(user, { displayName: name });

        // Store extended user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          interests: [Category.TECH, Category.MUSIC],
          preferredAreas: ['Westlands'],
          createdAt: new Date().toISOString()
        });

        onLogin(name, email, role);
      } else {
        // Simple Sign In
        await signInWithEmailAndPassword(auth, email, password);
        // App.tsx handles the state update via onAuthStateChanged
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message.replace("Firebase: ", "") || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1540575861501-7ad060e39fe1?auto=format&fit=crop&q=80&w=1200" 
          alt="Nairobi Events" 
          className="absolute inset-0 h-full w-full object-cover opacity-60 scale-110 animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-16 animate-slide-up safe-bottom">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-emerald-400 p-3 rounded-2xl shadow-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">weOut</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Discover what's happening <br/>
            <span className="text-emerald-400">around Nairobi.</span>
          </h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-xs font-medium">
            Join the premier community for concerts, tech summits, and local markets.
          </p>
          
          <button 
            onClick={() => setStep('form')}
            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Get Started
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-white px-8 flex flex-col justify-center animate-fade-in safe-top safe-bottom">
      <div className="mb-8">
        <button 
          onClick={() => setStep('welcome')}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors mb-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic">
          {isSignUp ? 'Karibu Nairobi' : 'Vipi, Explorer?'}
        </h2>
        <p className="text-slate-500 mt-2 font-medium text-sm">
          {isSignUp ? 'Create an account to start booking.' : 'Sign in to access your tickets.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Type</label>
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 gap-1 mb-2">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                  role === 'user' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-400'
                }`}
              >
                Explorer
              </button>
              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                  role === 'organizer' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-400'
                }`}
              >
                Organizer
              </button>
            </div>
          </div>
        )}

        {isSignUp && (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
            <input 
              required
              type="text" 
              placeholder="Juma Bakari"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
          <input 
            required
            type="email" 
            placeholder="juma@nairobi.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Password</label>
          <input 
            required
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-all mt-4 flex items-center justify-center gap-3"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            isSignUp ? 'Join weOut' : 'Sign In'
          )}
        </button>

        <div className="text-center mt-6">
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </form>

      <p className="text-center text-slate-400 text-[10px] mt-10 px-6 leading-relaxed font-bold italic">
        Discover Nairobi's heartbeat. By continuing, you agree to our Terms.
      </p>
    </div>
  );
};

export default LoginView;
