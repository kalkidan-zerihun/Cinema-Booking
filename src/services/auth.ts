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

/**
 * Registers a new account. There is intentionally NO way to pass a role
 * in from the caller — every self-registered account is CUSTOMER. This
 * is enforced twice: here in the client (defense in depth) and, more
 * importantly, by firestore.rules (`request.resource.data.role ==
 * 'CUSTOMER'` on create), so even a forged direct Firestore write cannot
 * self-register as ADMIN.
 *
 * Promoting someone to ADMIN is only possible via an existing admin
 * using the Admin Users screen (which itself is gated by isAdmin() in
 * the rules), or by an operator setting the role manually the first
 * time in the Firebase Console.
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

  await setDoc(doc(db, 'users', user.uid), {
    ...userProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return userProfile;
};

export const loginUser = async (email: string, password: string): Promise<UserProfile | null> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  return await getUserProfile(user.uid);
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
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
        email: data.email || auth.currentUser?.email || '',
        role,
        phone: data.phone || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } else if (auth.currentUser) {
      // Fallback profile if record wasn't created yet. Always CUSTOMER —
      // no email is special-cased into ADMIN here.
      const fallbackProfile: UserProfile = {
        uid,
        name: auth.currentUser.displayName || 'Cinema Guest',
        email: auth.currentUser.email || '',
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
 * Changes another user's role. Used only from the Admin Users screen,
 * which is itself only reachable by an authenticated admin (AdminRoute).
 * The real enforcement is server-side: firestore.rules only allows this
 * write when the CALLER's own stored role is ADMIN, and separately
 * forbids anyone from changing their OWN role — so this function cannot
 * be abused for self-promotion even if called directly.
 */
export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
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
