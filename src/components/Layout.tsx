import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, signOut } from '../firebase';
import { LogOut, Search, Ticket, User, PlusCircle, LayoutDashboard } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import WeOutLogo from './WeOutLogo';

export default function Layout() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              {/* Purple script logo */}
              <Link to="/" aria-label="weOut home">
                <WeOutLogo size="md" variant="purple" />
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link
                  to="/"
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                  aria-label="Discover events"
                >
                  Discover
                </Link>
                {profile?.role === 'attendee' && (
                  <Link
                    to="/my-bookings"
                    className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                    aria-label="View my bookings"
                  >
                    My Tickets
                  </Link>
                )}
                {profile?.role === 'attendee' && (
                  <Link
                    to="/following"
                    className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                    aria-label="Organizers you follow"
                  >
                    Following
                  </Link>
                )}
                {profile?.role === 'organizer' && (
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                    aria-label="Organizer dashboard"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile?.role === 'organizer' && (
                <Link
                  to="/create-event"
                  className="hidden sm:flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  <PlusCircle size={16} />
                  Create Event
                </Link>
              )}

              <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                <NotificationCenter />
                <Link
                  to="/profile"
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="View profile"
                >
                  <User size={20} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-6 py-3 flex justify-between items-center z-50"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <Link to="/" className="flex flex-col items-center gap-1 text-white/60 hover:text-violet-400 transition-colors" aria-label="Discover">
          <Search size={20} />
          <span className="text-[10px] uppercase tracking-widest font-bold" aria-hidden="true">Discover</span>
        </Link>

        {profile?.role === 'attendee' ? (
          <>
            <Link to="/my-bookings" className="flex flex-col items-center gap-1 text-white/60 hover:text-violet-400 transition-colors" aria-label="My Tickets">
              <Ticket size={20} />
              <span className="text-[10px] uppercase tracking-widest font-bold" aria-hidden="true">Tickets</span>
            </Link>
            <Link to="/following" className="flex flex-col items-center gap-1 text-white/60 hover:text-violet-400 transition-colors" aria-label="Following">
              <User size={20} />
              <span className="text-[10px] uppercase tracking-widest font-bold" aria-hidden="true">Following</span>
            </Link>
          </>
        ) : (
          <Link to="/dashboard" className="flex flex-col items-center gap-1 text-white/60 hover:text-violet-400 transition-colors" aria-label="Dashboard">
            <LayoutDashboard size={20} />
            <span className="text-[10px] uppercase tracking-widest font-bold" aria-hidden="true">Dashboard</span>
          </Link>
        )}

        <Link to="/profile" className="flex flex-col items-center gap-1 text-white/60 hover:text-violet-400 transition-colors" aria-label="Profile">
          <User size={20} />
          <span className="text-[10px] uppercase tracking-widest font-bold" aria-hidden="true">Profile</span>
        </Link>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-20" />
    </div>
  );
}
