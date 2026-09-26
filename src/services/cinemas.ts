import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Cinema } from '../types';
import { INITIAL_CINEMAS } from './seedData';

const COLLECTION_NAME = 'cinemas';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required for administrative operations.');
  }
  return await currentUser.getIdToken();
}

export const getCinemas = async (): Promise<Cinema[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    if (snapshot.empty) return INITIAL_CINEMAS;
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Cinema[];
  } catch (err) {
    console.warn('Using fallback cinemas data:', err);
    return INITIAL_CINEMAS;
  }
};

export const getCinemaById = async (cinemaId: string): Promise<Cinema | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, cinemaId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Cinema;
    }
    const fallback = INITIAL_CINEMAS.find((c) => c.id === cinemaId);
    return fallback || null;
  } catch {
    const fallback = INITIAL_CINEMAS.find((c) => c.id === cinemaId);
    return fallback || null;
  }
};

export const createCinema = async (cinemaData: Omit<Cinema, 'id'>): Promise<string> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/cinemas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cinemaData),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to create cinema.');
  }
  return data.data?.id || '';
};

export const updateCinema = async (cinemaId: string, cinemaData: Partial<Cinema>): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/cinemas/${cinemaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cinemaData),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to update cinema.');
  }
};

export const deleteCinema = async (cinemaId: string): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/cinemas/${cinemaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to delete cinema.');
  }
};

export const subscribeToCinemas = (callback: (cinemas: Cinema[]) => void) => {
  return onSnapshot(
    collection(db, COLLECTION_NAME),
    (snapshot) => {
      if (snapshot.empty) {
        callback(INITIAL_CINEMAS);
      } else {
        const cinemas = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Cinema[];
        callback(cinemas);
      }
    },
    (error) => {
      console.warn('Error subscribing to cinemas, using fallback:', error);
      callback(INITIAL_CINEMAS);
    }
  );
};

