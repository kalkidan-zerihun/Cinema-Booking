import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Hall } from '../types';
import { INITIAL_HALLS } from './seedData';

const COLLECTION_NAME = 'halls';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required for administrative operations.');
  }
  return await currentUser.getIdToken();
}

export const getHalls = async (): Promise<Hall[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    if (snapshot.empty) return INITIAL_HALLS;
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Hall[];
  } catch (err) {
    console.warn('Using fallback halls:', err);
    return INITIAL_HALLS;
  }
};

export const getHallsByCinemaId = async (cinemaId: string): Promise<Hall[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('cinemaId', '==', cinemaId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return INITIAL_HALLS.filter((h) => h.cinemaId === cinemaId);
    }
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Hall[];
  } catch {
    return INITIAL_HALLS.filter((h) => h.cinemaId === cinemaId);
  }
};

export const getHallById = async (hallId: string): Promise<Hall | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, hallId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Hall;
    }
    const fallback = INITIAL_HALLS.find((h) => h.id === hallId);
    return fallback || null;
  } catch {
    const fallback = INITIAL_HALLS.find((h) => h.id === hallId);
    return fallback || null;
  }
};

export const createHall = async (hallData: Omit<Hall, 'id'>): Promise<string> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/halls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(hallData),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to create hall.');
  }
  return data.data?.id || '';
};

export const updateHall = async (hallId: string, hallData: Partial<Hall>): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/halls/${hallId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(hallData),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to update hall.');
  }
};

export const deleteHall = async (hallId: string): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/halls/${hallId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to delete hall.');
  }
};

export const subscribeToHalls = (callback: (halls: Hall[]) => void) => {
  return onSnapshot(
    collection(db, COLLECTION_NAME),
    (snapshot) => {
      const halls = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Hall[];
      callback(halls);
    },
    (error) => {
      console.error('Error subscribing to halls:', error);
    }
  );
};

