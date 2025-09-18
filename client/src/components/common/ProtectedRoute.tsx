import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireRole?: UserRole;
}

export function ProtectedRoute({ 
  children, 
  requireOnboarding = false,
  requireRole 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requireRole && user.role !== requireRole) {
    // Redirect to appropriate dashboard based on their actual role
    if (user.role === 'EMPLOYER') {
      return <Navigate to="/employer/dashboard" replace />;
    } else {
      return <Navigate to="/job-seeker/dashboard" replace />;
    }
  }

  // If user needs onboarding (doesn't have profile) and this route doesn't handle it, redirect to onboarding
  if (!user.hasProfile && !requireOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding but is trying to access onboarding page, redirect to appropriate dashboard
  if (user.hasProfile && requireOnboarding) {
    if (user.role === 'EMPLOYER') {
      return <Navigate to="/employer/dashboard" replace />;
    } else {
      return <Navigate to="/job-seeker/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
