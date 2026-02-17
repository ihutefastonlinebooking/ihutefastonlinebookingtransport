import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { Loader } from './Loader';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [loading, setLoading] = React.useState(true);
  const [allowed, setAllowed] = React.useState(false);

  React.useEffect(() => {
    const authed = isAuthenticated();
    setAllowed(authed);
    setLoading(false);
  }, []);

  if (loading) return <Loader />;
  if (!allowed) return <Navigate to={adminOnly ? '/admin/login' : '/login'} replace />;

  return children;
}
