import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Hall } from '../types';
import { INITIAL_HALLS } from './seedData';

const COLLECTION_NAME = 'halls';

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
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...hallData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateHall = async (hallId: string, hallData: Partial<Hall>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, hallId);
  await updateDoc(docRef, {
    ...hallData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteHall = async (hallId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, hallId);
  await deleteDoc(docRef);
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
