import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading Stone India...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    const redirectMap = { 
      admin: '/admin/dashboard', 
      manager: '/manager/dashboard',
      client: '/client/dashboard', 
      employee: '/employee/dashboard' 
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return children;
}
