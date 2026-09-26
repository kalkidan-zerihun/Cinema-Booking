import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Film, Tv, Sparkles, ArrowLeft, Ticket, Calendar, Armchair } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading cinema facilities & schedule...</p>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#0c101a] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Cinema Not Found</h2>
        <Link
          to="/cinemas"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cinemas</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0c101a] border border-white/[0.08] shadow-2xl">
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-slate-900">
          <img
            src={cinema.imageUrl}
            alt={cinema.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-[#0c101a]/60 to-transparent" />

          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <Link
              to="/cinemas"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-slate-200 hover:text-white border border-white/10 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Locations</span>
            </Link>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-3 -mt-12 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
              {cinema.location}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">{cinema.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {cinema.description}
          </p>

          <div className="flex flex-wrap gap-6 text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            {cinema.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{cinema.address}</span>
              </div>
            )}
            {cinema.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{cinema.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cinema Halls Showcase */}
      {halls.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <Tv className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Auditoriums & Halls</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {halls.map((hall) => (
              <div
                key={hall.id}
                className="p-5 rounded-2xl bg-[#0c101a] border border-white/[0.08] hover:border-amber-400/40 space-y-2.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{hall.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.04] text-amber-400 border border-white/[0.08]">
                    {hall.type || 'STANDARD'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <Armchair className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>{hall.totalSeats || 50} Premium Recliner Seats</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Laser 4K Projection • Dolby Surround Audio
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Showtimes Schedule */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">Today & Upcoming Showtimes</h2>
        </div>

        {showtimes.length > 0 ? (
          <div className="space-y-3">
            {showtimes.map((st) => (
              <ShowtimeCard key={st.id} showtime={st} />
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-[#0c101a] border border-white/[0.08] text-center space-y-2">
            <Ticket className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              No showtimes currently scheduled for this venue
            </p>
            <p className="text-xs text-slate-400">Please check back soon for updated schedules.</p>
          </div>
        )}
      </section>
    </div>
  );
};
