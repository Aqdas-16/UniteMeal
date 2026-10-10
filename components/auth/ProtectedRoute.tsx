import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { session, user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session || !user) {
    // Redirect unauthenticated users to login page
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#09090b]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-500 font-medium">Setting up your profile...</p>
      </div>
    );
  }


  if (allowedRoles && allowedRoles.includes('admin') && profile.role !== 'admin' && user?.email !== 'cognixlabs.team@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-slate-600 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role) && profile.role !== 'admin') {
    // If not allowed, redirect to their respective dashboard. Admin can view anything.
    const rolePath = profile.role === 'donor' ? 'restaurant' : profile.role;
    return <Navigate to={`/dashboard/${rolePath}`} replace />;
  }

  // If this is the generic /dashboard route (no specific roles required), redirect to their role dashboard
  if (!allowedRoles) {
    const rolePath = profile.role === 'donor' ? 'restaurant' : profile.role;
    return <Navigate to={`/dashboard/${rolePath}`} replace />;
  }

  return <Outlet />;
}
