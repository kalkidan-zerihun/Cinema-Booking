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

const COLLECTION_NAME = 'cinemas';

export const getCinemas = async (): Promise<Cinema[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Cinema[];
};

export const getCinemaById = async (cinemaId: string): Promise<Cinema | null> => {
  const docRef = doc(db, COLLECTION_NAME, cinemaId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Cinema;
  }
  return null;
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
      const cinemas = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Cinema[];
      callback(cinemas);
    },
    (error) => {
      console.error('Error subscribing to cinemas:', error);
    }
  );
};
