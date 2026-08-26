import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Movie } from '../types';

const COLLECTION_NAME = 'movies';

export const getMovies = async (): Promise<Movie[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('title', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Movie[];
  } catch {
    // If index isn't created or error, fallback to un-ordered query
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Movie[];
  }
};

export const getMovieById = async (movieId: string): Promise<Movie | null> => {
  const docRef = doc(db, COLLECTION_NAME, movieId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Movie;
  }
  return null;
};

export const createMovie = async (movieData: Omit<Movie, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...movieData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateMovie = async (movieId: string, movieData: Partial<Movie>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, movieId);
  await updateDoc(docRef, {
    ...movieData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMovie = async (movieId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, movieId);
  await deleteDoc(docRef);
};

export const subscribeToMovies = (callback: (movies: Movie[]) => void) => {
  const q = collection(db, COLLECTION_NAME);
  return onSnapshot(
    q,
    (snapshot) => {
      const movies = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Movie[];
      callback(movies);
    },
    (error) => {
      console.error('Error subscribing to movies:', error);
    }
  );
};
