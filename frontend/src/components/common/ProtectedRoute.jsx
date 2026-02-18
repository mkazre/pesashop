import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import { useEffect } from 'react';

/**
 * Wraps routes that require authentication.
 * If the user is not authenticated, opens the auth modal and redirects to home.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
    }
  }, [isAuthenticated, openAuthModal]);

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
