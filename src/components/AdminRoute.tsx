import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Film } from 'lucide-react';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Verifying administrative security keys...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#141522] border border-red-900/40 rounded-3xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Administrator Access Required</h2>
          <p className="text-sm text-gray-400">
            The account <span className="text-white font-semibold">{currentUser.email}</span> is currently registered with the <span className="text-red-400 font-bold uppercase">{userProfile?.role || 'CUSTOMER'}</span> role.
          </p>
        </div>

        {/* No self-service elevation: admin rights can only be granted by
            an existing administrator from the Admin Users screen, or by
            an operator setting the role directly in the Firebase Console
            for the very first admin account. */}
        <div className="p-4 bg-[#1b1c2b] border border-[#2b2d42] rounded-2xl text-left space-y-2">
          <p className="text-xs text-gray-300">
            If you believe you should have administrator access, ask an existing administrator to
            promote your account from the <span className="text-white font-semibold">Admin Users</span> screen.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-block text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            ← Return to Cinema Homepage
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
