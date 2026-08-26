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
import { INITIAL_MOVIES } from './seedData';

const COLLECTION_NAME = 'movies';

export const getMovies = async (): Promise<Movie[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('title', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return INITIAL_MOVIES;
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Movie[];
  } catch {
    try {
      // If index isn't created or error, fallback to un-ordered query
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      if (snapshot.empty) return INITIAL_MOVIES;
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Movie[];
    } catch (err) {
      console.warn('Using fallback movies data:', err);
      return INITIAL_MOVIES;
    }
  }
};

export const getMovieById = async (movieId: string): Promise<Movie | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, movieId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Movie;
    }
    const fallback = INITIAL_MOVIES.find((m) => m.id === movieId);
    return fallback || null;
  } catch (err) {
    const fallback = INITIAL_MOVIES.find((m) => m.id === movieId);
    return fallback || null;
  }
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
      if (snapshot.empty) {
        callback(INITIAL_MOVIES);
      } else {
        const movies = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Movie[];
        callback(movies);
      }
    },
    (error) => {
      console.warn('Error subscribing to movies, falling back to initial data:', error);
      callback(INITIAL_MOVIES);
    }
  );
};
