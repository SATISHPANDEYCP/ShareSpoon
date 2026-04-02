import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { FullPageLoader } from './Loader';

/**
 * PrivateRoute Component
 * Protects routes that require authentication
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * AdminRoute Component
 * Protects routes that require admin role
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
