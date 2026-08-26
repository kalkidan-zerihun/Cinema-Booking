import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Seat, SeatType } from '../types';

const COLLECTION_NAME = 'seats';

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
  await updateDoc(doc(db, COLLECTION_NAME, id), data);
};

export const createSeatsBatch = async (seatsData: Array<Omit<Seat, 'id'>>): Promise<void> => {
  // Firestore batches support up to 500 operations
  const batches = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  for (const seat of seatsData) {
    const docRef = doc(collection(db, COLLECTION_NAME));
    currentBatch.set(docRef, {
      ...seat,
      label: seat.label || `${seat.row}${seat.number}`,
      type: seat.type || 'STANDARD',
      createdAt: new Date().toISOString(),
    });
    operationCount++;

    if (operationCount >= 450) {
      batches.push(currentBatch.commit());
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
};

export const generateDefaultSeatsForHall = async (
  hallId: string,
  rowCount: number = 4,
  seatsPerRow: number = 6,
  vipRows: string[] = [],
  premiumRows: string[] = []
): Promise<Seat[]> => {
  await deleteSeatsByHallId(hallId);

  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  const seats: Array<Omit<Seat, 'id'>> = [];

  for (let r = 0; r < Math.min(rowCount, rowLetters.length); r++) {
    const row = rowLetters[r];
    const isVip = vipRows.includes(row) || (vipRows.length === 0 && r === rowCount - 1 && rowCount > 2);
    const isPremium = premiumRows.includes(row);

    let type: SeatType = 'STANDARD';
    let priceModifier = 1.0;

    if (isVip) {
      type = 'VIP';
      priceModifier = 1.35;
    } else if (isPremium) {
      type = 'PREMIUM';
      priceModifier = 1.15;
    }

    for (let num = 1; num <= seatsPerRow; num++) {
      seats.push({
        hallId,
        row,
        number: num,
        label: `${row}${num}`,
        type,
        priceModifier,
      });
    }
  }

  await createSeatsBatch(seats);
  return getSeatsByHallId(hallId);
};

export const deleteSeatsByHallId = async (hallId: string): Promise<void> => {
  const seats = await getSeatsByHallId(hallId);
  const deletePromises = seats.map((seat) => deleteDoc(doc(db, COLLECTION_NAME, seat.id)));
  await Promise.all(deletePromises);
};
