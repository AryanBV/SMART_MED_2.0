// File: C:\Project\SMART_MED_2.0\client\src\components\auth\ProtectedRoute.tsx

import { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireProfile?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireProfile = true
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Special handling for create-profile route
  if (location.pathname === '/create-profile') {
    // If user already has a profile, redirect to dashboard
    if (user?.profileId) {
      return <Navigate to="/dashboard" replace />;
    }
  } else if (requireProfile && !user?.profileId) {
    // For other routes, if profile is required but missing, redirect to create-profile
    return <Navigate to="/create-profile" state={{ from: location }} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;