import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface RoleGuardProps {
  allowedRole: UserRole;
}

export default function RoleGuard({ allowedRole }: RoleGuardProps) {
  const { profile } = useAuth();

  if (!profile || profile.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
