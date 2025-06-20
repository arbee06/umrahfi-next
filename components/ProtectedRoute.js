import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/utils/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || (allowedRoles.length > 0 && !allowedRoles.includes(user?.role))) {
    return null;
  }

  return children;
}