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
import { Showtime, EnrichedShowtime } from '../types';
import { getMovieById } from './movies';
import { getCinemaById } from './cinemas';
import { getHallById } from './halls';
import { getInitialShowtimes } from './seedData';

const COLLECTION_NAME = 'showtimes';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required for administrative operations.');
  }
  return await currentUser.getIdToken();
}

export const getShowtimes = async (): Promise<Showtime[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    if (snapshot.empty) return getInitialShowtimes();
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Showtime[];
  } catch (err) {
    console.warn('Using fallback showtimes:', err);
    return getInitialShowtimes();
  }
};

export const getShowtimesByMovieId = async (movieId: string): Promise<Showtime[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('movieId', '==', movieId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return getInitialShowtimes().filter((st) => st.movieId === movieId);
    }
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Showtime[];
  } catch {
    return getInitialShowtimes().filter((st) => st.movieId === movieId);
  }
};

export const getShowtimesByCinemaId = async (cinemaId: string): Promise<Showtime[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('cinemaId', '==', cinemaId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return getInitialShowtimes().filter((st) => st.cinemaId === cinemaId);
    }
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Showtime[];
  } catch {
    return getInitialShowtimes().filter((st) => st.cinemaId === cinemaId);
  }
};

export const getShowtimeById = async (showtimeId: string): Promise<Showtime | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, showtimeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Showtime;
    }
    const fallback = getInitialShowtimes().find((st) => st.id === showtimeId);
    return fallback || null;
  } catch {
    const fallback = getInitialShowtimes().find((st) => st.id === showtimeId);
    return fallback || null;
  }
};

export const getEnrichedShowtime = async (showtimeId: string): Promise<EnrichedShowtime | null> => {
  const showtime = await getShowtimeById(showtimeId);
  if (!showtime) return null;

  const [movie, cinema, hall] = await Promise.all([
    getMovieById(showtime.movieId),
    getCinemaById(showtime.cinemaId),
    getHallById(showtime.hallId),
  ]);

  return {
    ...showtime,
    movie: movie || undefined,
    cinema: cinema || undefined,
    hall: hall || undefined,
  };
};

export const createShowtime = async (showtimeData: Omit<Showtime, 'id'>): Promise<string> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/showtimes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(showtimeData),
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok || !resData?.success) {
    throw new Error(resData?.message || 'Failed to create showtime.');
  }
  return resData.data?.id || '';
};

export const updateShowtime = async (
  showtimeId: string,
  showtimeData: Partial<Showtime>
): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/showtimes/${showtimeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(showtimeData),
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok || !resData?.success) {
    throw new Error(resData?.message || 'Failed to update showtime.');
  }
};

export const deleteShowtime = async (showtimeId: string): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/showtimes/${showtimeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok || !resData?.success) {
    throw new Error(resData?.message || 'Failed to delete showtime.');
  }
};

export const subscribeToShowtimes = (callback: (showtimes: Showtime[]) => void) => {
  return onSnapshot(
    collection(db, COLLECTION_NAME),
    (snapshot) => {
      const showtimes = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Showtime[];
      callback(showtimes);
    },
    (error) => {
      console.error('Error subscribing to showtimes:', error);
    }
  );
};

