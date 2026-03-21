import React from 'react';

interface ProtectedRouteProps {
  isAllowed: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAllowed, fallback, children }) => {
  if (!isAllowed) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
