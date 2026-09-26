import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Movie } from '../types';
import { INITIAL_MOVIES } from './seedData';

const COLLECTION_NAME = 'movies';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required for administrative operations.');
  }
  return await currentUser.getIdToken();
}

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
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/movies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(movieData),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to create movie.');
  }
  return data.data?.id || '';
};

export const updateMovie = async (movieId: string, movieData: Partial<Movie>): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(movieData),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to update movie.');
  }
};

export const deleteMovie = async (movieId: string): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to delete movie.');
  }
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

