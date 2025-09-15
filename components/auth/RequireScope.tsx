import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import NoAccessPage from '../../pages/NoAccessPage';

interface RequireScopeProps {
  requiredScopes: string[];
  children?: React.ReactNode;
}

const RequireScope: React.FC<RequireScopeProps> = ({ requiredScopes, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-8 text-gray-500">Authenticating...</div>;
  }

  if (!user) {
    return <NoAccessPage requiredScopes={requiredScopes} reason="Not signed in" />;
  }
  
  // A user has access if they possess ANY of the required scopes.
  const hasAccess = requiredScopes.some(scope => user.scopes.includes(scope));
  
  if (!hasAccess) {
      return <NoAccessPage requiredScopes={requiredScopes} />;
  }
  
  // If children are provided, render them. Otherwise, render an Outlet for nested routes.
  return <>{children || <Outlet />}</>;
};

export default RequireScope;