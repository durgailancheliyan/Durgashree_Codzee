import React from 'react';
import Layout from '../layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnboarded, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (!isOnboarded) return <Navigate to="/onboarding" />;

  return <Layout>{children}</Layout>;
};

export default PrivateRoute;