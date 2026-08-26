import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

/**
 * Registers a new account. Every self-registered account begins with role: CUSTOMER.
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<UserProfile> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userProfile: UserProfile = {
    uid: user.uid,
    name: name.trim() || 'Cinema Guest',
    email: user.email || email,
    role: 'CUSTOMER',
    phone: phone || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Direct Firestore write error on register:', e);
  }

  // Authoritative server profile sync
  const synced = await getUserProfile(user.uid);
  return synced || userProfile;
};

export const loginUser = async (email: string, password: string): Promise<UserProfile | null> => {
  const trimmedEmail = email.trim();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const user = userCredential.user;
    return await getUserProfile(user.uid);
  } catch (err: any) {
    // If it's a preset account that wasn't provisioned yet in Auth, trigger server-side provision & retry once
    const isPreset =
      trimmedEmail.toLowerCase() === 'admin@kalicinema.com' ||
      trimmedEmail.toLowerCase() === 'guest@kalicinema.com' ||
      trimmedEmail.toLowerCase() === 'admin@example.com';

    if (
      isPreset &&
      (err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password')
    ) {
      try {
        await fetch(`${API_BASE_URL}/auth/provision-preset`, { method: 'POST' });
        // Retry sign in
        const retryCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const retryUser = retryCredential.user;
        return await getUserProfile(retryUser.uid);
      } catch (retryErr) {
        console.warn('Preset auto-provisioning failed:', retryErr);
      }
    }
    throw err;
  }
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Fetches authoritative user profile from backend /api/auth/me or Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const currentUser = auth.currentUser;

  if (currentUser && currentUser.uid === uid) {
    try {
      const token = await currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data as UserProfile;
        }
      }
    } catch (err) {
      console.warn('Backend /api/auth/me not available, using Firestore profile:', err);
    }
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const rawRole = data.role ? String(data.role).toUpperCase() : 'CUSTOMER';
      const role: UserRole = rawRole === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
      return {
        uid,
        name: data.name || 'Cinema Guest',
        email: data.email || currentUser?.email || '',
        role,
        phone: data.phone || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } else if (currentUser) {
      const fallbackProfile: UserProfile = {
        uid,
        name: currentUser.displayName || 'Cinema Guest',
        email: currentUser.email || '',
        role: 'CUSTOMER',
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(userDocRef, {
          ...fallbackProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not auto-create fallback profile:', e);
      }
      return fallbackProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Changes another user's role with server API or Firestore
 */
export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/admin/users/${uid}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return;
      }
    } catch (err) {
      console.warn('Backend admin user role update failed, attempting Firestore direct write:', err);
    }
  }

  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((u: any) => ({
            uid: u.id || u.uid,
            name: u.name || 'Member',
            email: u.email || '',
            role: (u.role as UserRole) || 'CUSTOMER',
            phone: u.phone,
            createdAt: u.createdAt || '',
            updatedAt: u.updatedAt,
          }));
        }
      }
    } catch (err) {
      console.warn('Backend /api/admin/users failed, trying Firestore:', err);
    }
  }

  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      name: data.name || 'User',
      email: data.email || '',
      role: data.role || 'CUSTOMER',
      phone: data.phone || '',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || '',
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || '',
    };
  });
};

export const subscribeToAuth = (
  callback: (user: FirebaseUser | null, profile: UserProfile | null) => void
) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      callback(firebaseUser, profile);
    } else {
      callback(null, null);
    }
  });
};
