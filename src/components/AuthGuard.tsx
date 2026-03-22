import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard() {
  const { user, profile, loading } = useAuth();
  // FIX: use useLocation() instead of window.location — works correctly inside React Router
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    // Pass current path so login can redirect back after auth
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in but hasn't chosen a role yet — send back to login
  if (!profile && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
