import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Film, Tv, Sparkles, ArrowLeft, Ticket, Calendar } from 'lucide-react';
import { Cinema, Hall, EnrichedShowtime, Movie } from '../types';
import { getCinemaById } from '../services/cinemas';
import { getHallsByCinemaId } from '../services/halls';
import { getShowtimesByCinemaId } from '../services/showtimes';
import { getMovies } from '../services/movies';
import { ShowtimeCard } from '../components/ShowtimeCard';

export const CinemaDetails: React.FC = () => {
  const { cinemaId } = useParams<{ cinemaId: string }>();

  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [showtimes, setShowtimes] = useState<EnrichedShowtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cinemaId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [cinemaData, hallsData, showtimesData, moviesData] = await Promise.all([
          getCinemaById(cinemaId),
          getHallsByCinemaId(cinemaId),
          getShowtimesByCinemaId(cinemaId),
          getMovies(),
        ]);

        setCinema(cinemaData);
        setHalls(hallsData);

        const movieMap = new Map(moviesData.map((m) => [m.id, m]));
        const hallMap = new Map(hallsData.map((h) => [h.id, h]));

        const enriched = showtimesData.map((st) => ({
          ...st,
          cinema: cinemaData || undefined,
          movie: movieMap.get(st.movieId),
          hall: hallMap.get(st.hallId),
        }));

        setShowtimes(enriched);
      } catch (err) {
        console.error('Error loading cinema details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cinemaId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading cinema facilities & schedule...</p>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#0d1424] border border-[#1b263b] rounded-3xl text-center space-y-4">
        <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Cinema Not Found</h2>
        <Link
          to="/cinemas"
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cinemas</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0d1424] border border-[#1b263b] shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#101726]">
          <img
            src={cinema.imageUrl}
            alt={cinema.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-[#0d1424]/60 to-transparent" />
          
          <div className="absolute top-6 left-6">
            <Link
              to="/cinemas"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950/60 backdrop-blur-md text-slate-200 hover:text-white border border-[#1b263b] text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Locations</span>
            </Link>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-4 -mt-16 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {cinema.location}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">{cinema.name}</h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">{cinema.description}</p>

          <div className="flex flex-wrap gap-6 text-xs text-slate-400 pt-2 border-t border-[#162035]">
            {cinema.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cinema.address}</span>
              </div>
            )}
            {cinema.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cinema.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cinema Halls Showcase */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Tv className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl font-black text-white">Cinema Auditoriums & Halls</h2>
          </div>
          <p className="text-xs text-slate-400">
            Engineered with certified acoustics, laser projection, and luxury recliners
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {halls.map((hall) => (
            <div
              key={hall.id}
              className="p-5 rounded-2xl bg-[#0d1424] border border-[#1b263b] space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{hall.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#121c32] text-amber-300 border border-amber-500/30">
                  {hall.capacity} Seats
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                {hall.screenType && (
                  <div className="flex items-center space-x-2">
                    <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Screen: {hall.screenType}</span>
                  </div>
                )}
                {hall.soundSystem && (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Audio: {hall.soundSystem}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scheduled Showtimes at this Cinema */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl font-black text-white">Showtimes at {cinema.name}</h2>
          </div>
          <p className="text-xs text-slate-400">
            Select a movie and time to choose your seats
          </p>
        </div>

        {showtimes.length > 0 ? (
          <div className="space-y-4">
            {showtimes.map((st) => (
              <ShowtimeCard key={st.id} showtime={st} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#0d1424] rounded-2xl border border-[#1b263b] space-y-3">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-300">
              No showtimes scheduled at this location today
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
