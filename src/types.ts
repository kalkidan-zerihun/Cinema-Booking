export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface UserProfile {
  uid: string;
  name: string;
  fullName?: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  genre: string;
  releaseDate: string;
  posterUrl: string;
  trailerUrl: string;
  rating?: number; // e.g. 8.8
  ageRating?: string; // e.g. "PG-13", "R", "PG"
  backdropUrl?: string;
  language?: string;
  cast?: string[];
  director?: string;
  isFeatured?: boolean;
  isNowShowing?: boolean;
  isComingSoon?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cinema {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  address?: string;
  phone?: string;
  amenities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Hall {
  id: string;
  name: string;
  cinemaId: string;
  capacity: number;
  screenType?: string; // e.g. "Laser IMAX", "4K Dolby Cinema", "Standard"
  soundSystem?: string; // e.g. "Dolby Atmos 7.1", "THX Spatial"
  totalRows?: number;
  seatsPerRow?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type SeatType = 'STANDARD' | 'VIP' | 'PREMIUM' | 'COUPLE' | 'WHEELCHAIR' | 'ACCESSIBLE';

export interface Seat {
  id: string;
  hallId: string;
  row: string; // "A", "B", "C", etc.
  number: number; // 1, 2, 3, etc.
  label?: string; // "A1", "A2", etc.
  type: SeatType;
  priceModifier?: number; // e.g. 1.0 for standard, 1.3 for VIP
  createdAt?: string;
}

export type ShowtimeFormat = '2D' | '3D' | 'IMAX 2D' | 'IMAX 3D' | '4DX' | string;

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  hallId: string;
  startTime: string; // e.g. "18:00"
  endTime?: string;
  date: string; // e.g. "2026-08-21"
  ticketPrice: number; // in ETB
  format?: ShowtimeFormat;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: string;
  userId: string;
  showtimeId: string;
  status: ReservationStatus;
  totalPrice: number;
  seatIds: string[];
  seatLabels: string[];
  customerName?: string;
  customerEmail?: string;
  bookingCode: string;
  createdAt: string;
  updatedAt?: string;
  // ISO timestamp after which an unpaid PENDING reservation is
  // automatically released by expirePendingReservations. Absent/undefined
  // once CONFIRMED.
  expiresAt?: string;
  cancelReason?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
}

export interface ReservationSeat {
  id: string; // `${showtimeId}_${seatId}`
  reservationId: string;
  seatId: string;
  showtimeId: string;
  status: 'RESERVED' | 'CANCELLED';
  createdAt?: string;
  expiresAt?: string;
}

export type PaymentMethod = 'CHAPA' | 'TELEBIRR' | 'CARD' | 'PAY_AT_CINEMA';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  currency: 'ETB';
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  createdAt: string;
  updatedAt?: string;
  failReason?: string;
}

export interface EnrichedShowtime extends Showtime {
  movie?: Movie;
  cinema?: Cinema;
  hall?: Hall;
}

export interface EnrichedReservation extends Reservation {
  showtime?: Showtime;
  movie?: Movie;
  cinema?: Cinema;
  hall?: Hall;
  payment?: Payment;
}
