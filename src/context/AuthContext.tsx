import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';
import {
  subscribeToAuth,
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
} from '../services/auth';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  // Registration never accepts a role — every self-registered account is
  // CUSTOMER. Admins are promoted from the Admin Users screen by an
  // existing admin, enforced server-side by firestore.rules.
  register: (email: string, pass: string, name: string, phone?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((fbUser, profile) => {
      setCurrentUser(fbUser);
      setUserProfile(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await loginUser(email, pass);
      setUserProfile(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email: string, pass: string, name: string, phone?: string) => {
    const profile = await registerUser(email, pass, name, phone);
    setUserProfile(profile);
    return profile;
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Admin status comes ONLY from the Firestore profile's role field,
  // which is the same field firestore.rules checks server-side. There is
  // no client-side email special-case and no way for a user to grant
  // this to themselves.
  const isAdmin = userProfile?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
