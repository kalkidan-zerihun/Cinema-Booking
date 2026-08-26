import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Cinema } from '../types';
import { INITIAL_CINEMAS } from './seedData';

const COLLECTION_NAME = 'cinemas';

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
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...cinemaData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCinema = async (cinemaId: string, cinemaData: Partial<Cinema>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, cinemaId);
  await updateDoc(docRef, {
    ...cinemaData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCinema = async (cinemaId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, cinemaId);
  await deleteDoc(docRef);
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
