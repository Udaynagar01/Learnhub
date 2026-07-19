import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthRedirectPath } from '../utils/authRedirect';

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to={getAuthRedirectPath(user)} replace />;

  return children;
}
