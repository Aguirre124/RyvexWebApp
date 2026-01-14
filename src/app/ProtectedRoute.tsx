import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// Update the import paths to match the actual file location and extension, e.g., 'auth.store.ts'
import { useAuthStore } from '../store/auth.store.ts';
import type { AuthState } from '../store/auth.store.ts';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s: AuthState) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
