import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Seat, SeatType } from '../types';

const COLLECTION_NAME = 'seats';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required for administrative operations.');
  }
  return await currentUser.getIdToken();
}

export const getSeatsByHallId = async (hallId: string): Promise<Seat[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('hallId', '==', hallId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const seats = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Seat[];

      return seats.sort((a, b) => {
        if (a.row === b.row) {
          return a.number - b.number;
        }
        return a.row.localeCompare(b.row);
      });
    }
  } catch (err) {
    console.warn('Error fetching seats from Firestore, generating fallback:', err);
  }

  // Generate fallback seats
  const rowLetters = ['A', 'B', 'C', 'D'];
  const fallbackSeats: Seat[] = [];
  for (let r = 0; r < rowLetters.length; r++) {
    const row = rowLetters[r];
    const isVip = r === rowLetters.length - 1;
    for (let num = 1; num <= 6; num++) {
      fallbackSeats.push({
        id: `${hallId}_${row}${num}`,
        hallId,
        row,
        number: num,
        label: `${row}${num}`,
        type: isVip ? 'VIP' : 'STANDARD',
        priceModifier: isVip ? 1.25 : 1.0,
      });
    }
  }
  return fallbackSeats;
};

export const updateSeat = async (id: string, data: Partial<Seat>): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/seats/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok || !resData?.success) {
    throw new Error(resData?.message || 'Failed to update seat.');
  }
};

export const createSeatsBatch = async (seatsData: Array<Omit<Seat, 'id'>>): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/seats/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ seats: seatsData }),
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok || !resData?.success) {
    throw new Error(resData?.message || 'Failed to create seats batch.');
  }
};

export const generateDefaultSeatsForHall = async (
  hallId: string,
  rowCount: number = 4,
  seatsPerRow: number = 6,
  vipRows: string[] = [],
  premiumRows: string[] = []
): Promise<Seat[]> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/halls/${hallId}/generate-seats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      rowCount,
      seatsPerRow,
      vipRows,
      premiumRows,
    }),
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok || !resData?.success) {
    throw new Error(resData?.message || 'Failed to generate seats.');
  }
  return getSeatsByHallId(hallId);
};

export const deleteSeatsByHallId = async (hallId: string): Promise<void> => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/halls/${hallId}/seats`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const resData = await res.json().catch(() => null);
  if (!res.ok || !resData?.success) {
    throw new Error(resData?.message || 'Failed to delete seats.');
  }
};

