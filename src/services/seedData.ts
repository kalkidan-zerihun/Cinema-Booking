import { db } from './firebase';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Cinema, Hall, Movie, Showtime } from '../types';

export const INITIAL_CINEMAS: Cinema[] = [
  {
    id: 'cinema-kali-addis-main',
    name: 'Kali Cinema - Addis Ababa',
    location: 'Addis Ababa (Downtown Edna Mall)',
    address: 'Cameroon St, Bole Sub-City, Addis Ababa, Ethiopia',
    description: 'The flagship Kali Cinema luxury cinema complex featuring 4K Laser projection, Dolby Atmos audio, and VIP recliner seats.',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    phone: '+251 11 661 2233',
    amenities: ['Dolby Atmos', '4K Laser Projection', 'VIP Lounge', 'Gourmet Popcorn Bar', 'Parking'],
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'cinema-kali-bole',
    name: 'Kali Cinema - Bole Luxury',
    location: 'Bole Medhanealem, Addis Ababa',
    address: 'Near Medhanealem Cathedral, Addis Ababa, Ethiopia',
    description: 'An intimate premium cinema lounge with full in-seat dine-in service, acoustic velvet walls, and 7.1 surround sound.',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    phone: '+251 11 662 8899',
    amenities: ['VIP Recliners', 'In-Seat Service', 'Laser IMAX', 'Artisan Cafe'],
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

export const INITIAL_HALLS: Hall[] = [
  {
    id: 'hall-1-kali-main',
    cinemaId: 'cinema-kali-addis-main',
    name: 'Hall 1 (Main Dolby Atmos)',
    capacity: 32,
    screenType: '4K Dual Laser',
    soundSystem: 'Dolby Atmos 7.1 Spatial',
    totalRows: 4,
    seatsPerRow: 8,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'hall-2-kali-main',
    cinemaId: 'cinema-kali-addis-main',
    name: 'Hall 2 (VIP Premiere)',
    capacity: 24,
    screenType: 'Laser IMAX',
    soundSystem: 'THX Certified Surround',
    totalRows: 4,
    seatsPerRow: 6,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'hall-1-kali-bole',
    cinemaId: 'cinema-kali-bole',
    name: 'Hall 1 (Royal Lounge)',
    capacity: 24,
    screenType: 'Dolby Vision HDR',
    soundSystem: 'Dolby Atmos',
    totalRows: 4,
    seatsPerRow: 6,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'movie-lion-king-2026',
    title: 'The Lion King 2026',
    description: 'A grand family adventure exploring the heroic rise of Mufasa and the legendary origins of the Pride Lands across breathtaking vistas.',
    duration: 120,
    genre: 'Adventure',
    releaseDate: '2026-08-20',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=7TavVZMewpY',
    rating: 9.1,
    ageRating: 'PG',
    language: 'English with Amharic Subtitles',
    director: 'Barry Jenkins',
    cast: ['Aaron Pierre', 'Kelvin Harrison Jr.', 'Seth Rogen', 'Billy Eichner'],
    isFeatured: true,
    isNowShowing: true,
    isComingSoon: false,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'movie-dune-2',
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    duration: 166,
    genre: 'Sci-Fi / Action',
    releaseDate: '2026-06-15',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    rating: 9.3,
    ageRating: 'PG-13',
    language: 'English',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
    isFeatured: true,
    isNowShowing: true,
    isComingSoon: false,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'movie-gladiator-2',
    title: 'Gladiator II',
    description: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum to restore Rome to its former glory.',
    duration: 148,
    genre: 'Action / Epic',
    releaseDate: '2026-07-10',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
    rating: 8.8,
    ageRating: 'R',
    language: 'English',
    director: 'Ridley Scott',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
    isFeatured: false,
    isNowShowing: true,
    isComingSoon: false,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'movie-interstellar',
    title: 'Interstellar (Special Remaster)',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    duration: 169,
    genre: 'Sci-Fi / Drama',
    releaseDate: '2026-08-01',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    rating: 9.5,
    ageRating: 'PG-13',
    language: 'English',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    isFeatured: false,
    isNowShowing: true,
    isComingSoon: false,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'movie-avatar-fire-ash',
    title: 'Avatar: Fire and Ash',
    description: 'Jake Sully and Neytiri journey into the volcanic territories of Pandora, encountering the ruthless Ash People tribe.',
    duration: 185,
    genre: 'Action / Sci-Fi',
    releaseDate: '2026-12-18',
    posterUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    rating: 9.0,
    ageRating: 'PG-13',
    language: 'English',
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Oona Chaplin'],
    isFeatured: false,
    isNowShowing: false,
    isComingSoon: true,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

export const getInitialShowtimes = (): Showtime[] => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      id: 'st-lion-today-1400',
      movieId: 'movie-lion-king-2026',
      cinemaId: 'cinema-kali-addis-main',
      hallId: 'hall-1-kali-main',
      date: todayStr,
      startTime: '14:00',
      ticketPrice: 250,
      format: '4K Laser 2D',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'st-lion-today-1800',
      movieId: 'movie-lion-king-2026',
      cinemaId: 'cinema-kali-addis-main',
      hallId: 'hall-1-kali-main',
      date: todayStr,
      startTime: '18:00',
      ticketPrice: 280,
      format: 'Dolby Atmos 3D',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'st-dune-today-1730',
      movieId: 'movie-dune-2',
      cinemaId: 'cinema-kali-addis-main',
      hallId: 'hall-2-kali-main',
      date: todayStr,
      startTime: '17:30',
      ticketPrice: 300,
      format: 'IMAX 2D',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'st-dune-today-2030',
      movieId: 'movie-dune-2',
      cinemaId: 'cinema-kali-bole',
      hallId: 'hall-1-kali-bole',
      date: todayStr,
      startTime: '20:30',
      ticketPrice: 350,
      format: '2D',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'st-glad-today-1900',
      movieId: 'movie-gladiator-2',
      cinemaId: 'cinema-kali-addis-main',
      hallId: 'hall-1-kali-main',
      date: todayStr,
      startTime: '21:15',
      ticketPrice: 250,
      format: '2D',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'st-interstellar-tom-2000',
      movieId: 'movie-interstellar',
      cinemaId: 'cinema-kali-addis-main',
      hallId: 'hall-2-kali-main',
      date: tomorrowStr,
      startTime: '20:00',
      ticketPrice: 300,
      format: 'IMAX 2D',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ];
};

export const seedCinemaData = async (force: boolean = false): Promise<{ success: boolean; message: string }> => {
  try {
    const moviesSnap = await getDocs(collection(db, 'movies'));
    if (!force && !moviesSnap.empty) {
      return { success: true, message: 'Database already contains movie data.' };
    }

    // 1. Seed Cinemas
    for (const cinema of INITIAL_CINEMAS) {
      await setDoc(doc(db, 'cinemas', cinema.id), cinema);
    }

    // 2. Seed Halls
    for (const hall of INITIAL_HALLS) {
      await setDoc(doc(db, 'halls', hall.id), hall);
    }

    // 3. Seed physical Seats for each Hall
    const rowLetters = ['A', 'B', 'C', 'D', 'E'];
    const seatBatch = writeBatch(db);

    for (const hall of INITIAL_HALLS) {
      const rows = hall.totalRows || 4;
      const seatsPerRow = hall.seatsPerRow || 6;

      for (let r = 0; r < rows; r++) {
        const row = rowLetters[r];
        const isVip = r === rows - 1; // Last row is VIP

        for (let num = 1; num <= seatsPerRow; num++) {
          const seatId = `${hall.id}_${row}${num}`;
          const seatRef = doc(db, 'seats', seatId);
          seatBatch.set(seatRef, {
            hallId: hall.id,
            row,
            number: num,
            label: `${row}${num}`,
            type: isVip ? 'VIP' : 'STANDARD',
            priceModifier: isVip ? 1.25 : 1.0,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    await seatBatch.commit();

    // 4. Seed Movies
    for (const movie of INITIAL_MOVIES) {
      await setDoc(doc(db, 'movies', movie.id), movie);
    }

    // 5. Seed Showtimes
    const showtimes = getInitialShowtimes();
    for (const st of showtimes) {
      await setDoc(doc(db, 'showtimes', st.id), st);
    }

    return {
      success: true,
      message: 'Successfully seeded Kali Cinema with cinemas, halls, seats, movies, and showtimes!',
    };
  } catch (error: any) {
    console.warn('Error seeding cinema data:', error);
    return { success: false, message: error.message || 'Failed to seed cinema data.' };
  }
};
