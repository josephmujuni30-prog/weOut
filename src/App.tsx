import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import EventDetails from './pages/EventDetails';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Following from './pages/Following';

// Components
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import RoleGuard from './components/RoleGuard';

// FIX: Router must wrap everything — moved <Router> to the App shell,
// not inside AppRoutes, so navigation hooks work anywhere in the tree.
function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route — redirect to home if already logged in */}
      <Route
        path="/login"
        element={!user || !profile ? <Login /> : <Navigate to="/" replace />}
      />

      {/* Protected routes */}
      <Route element={<AuthGuard />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/profile" element={<Profile />} />

          {/* Attendee-only routes */}
          <Route element={<RoleGuard allowedRole="attendee" />}>
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/following" element={<Following />} />
          </Route>

          {/* Organizer-only routes */}
          <Route element={<RoleGuard allowedRole="organizer" />}>
            <Route path="/dashboard" element={<OrganizerDashboard />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/edit-event/:id" element={<CreateEvent />} />
          </Route>
        </Route>
      </Route>

      {/* FIX: catch-all — redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* FIX: Router lives here so useNavigate/useLocation work inside AuthProvider too */}
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
