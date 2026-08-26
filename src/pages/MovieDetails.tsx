import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  Star,
  Calendar,
  Film,
  MapPin,
  Ticket,
  Sparkles,
  ArrowLeft,
  Share2,
  Users,
  Armchair,
  CheckCircle2,
} from 'lucide-react';
import { Movie, Cinema, Hall, EnrichedShowtime } from '../types';
import { getMovieById } from '../services/movies';
import { getShowtimesByMovieId } from '../services/showtimes';
import { getCinemas } from '../services/cinemas';
import { getHalls } from '../services/halls';
import { ShowtimeCard } from '../components/ShowtimeCard';
import { TrailerModal } from '../components/TrailerModal';

export const MovieDetails: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<EnrichedShowtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('ALL');

  useEffect(() => {
    if (!movieId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [movieData, rawShowtimes, allCinemas, allHalls] = await Promise.all([
          getMovieById(movieId),
          getShowtimesByMovieId(movieId),
          getCinemas(),
          getHalls(),
        ]);

        setMovie(movieData);

        const cinemaMap = new Map(allCinemas.map((c) => [c.id, c]));
        const hallMap = new Map(allHalls.map((h) => [h.id, h]));

        const enriched = rawShowtimes.map((st) => ({
          ...st,
          movie: movieData || undefined,
          cinema: cinemaMap.get(st.cinemaId),
          hall: hallMap.get(st.hallId),
        }));

        setShowtimes(enriched);
      } catch (err) {
        console.error('Error loading movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [movieId]);

  // Extract unique dates from showtimes
  const availableDates = Array.from(new Set(showtimes.map((s) => s.date).filter(Boolean))).sort();

  const filteredShowtimes = showtimes.filter((st) => {
    if (selectedDate !== 'ALL' && st.date !== selectedDate) return false;
    return true;
  });

  const formatDuration = (mins?: number) => {
    if (!mins) return '120m';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading movie details & showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#0c101a] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Movie Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested movie record could not be found or has been removed from the schedule.
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Cinematic Backdrop Header */}
      <div className="relative min-h-[440px] lg:min-h-[500px] flex items-end bg-[#07090e] overflow-hidden border-b border-white/[0.08]">
        {/* Backdrop image */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-top opacity-35 filter brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/70 to-transparent" />
        </div>

        {/* Back button */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
            {/* Large Poster */}
            <div className="w-44 sm:w-56 md:w-64 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 relative group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              {movie.trailerUrl && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 shadow-xl shadow-black/80 font-bold"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              )}
            </div>

            {/* Movie Info */}
            <div className="flex-1 space-y-3.5 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                  {movie.genre || 'Feature Film'}
                </span>

                {movie.ageRating && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
                    {movie.ageRating}
                  </span>
                )}

                {movie.rating && (
                  <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-black/60 text-amber-400 border border-amber-400/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{movie.rating.toFixed(1)} / 10</span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs sm:text-sm text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{formatDuration(movie.duration)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Release: {movie.releaseDate || '2026'}</span>
                </span>
                {movie.language && (
                  <>
                    <span>•</span>
                    <span>{movie.language}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {movie.trailerUrl && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    id="movie-watch-trailer-btn"
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/15 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Watch Trailer</span>
                  </button>
                )}

                <a
                  href="#showtimes-section"
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-md shadow-amber-400/20"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Book Showtime</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Synopsis, Cast, Metadata */}
          <div className="space-y-6">
            <div className="bg-[#0c101a] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white tracking-wide">Storyline</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {movie.description}
              </p>

              {movie.director && (
                <div className="pt-3 border-t border-white/[0.06] text-xs">
                  <span className="text-slate-400 block mb-0.5">Director</span>
                  <span className="font-semibold text-white">{movie.director}</span>
                </div>
              )}

              {movie.cast && movie.cast.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06] text-xs">
                  <span className="text-slate-400 block mb-1.5">Key Cast</span>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.cast.map((actor, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.03] text-slate-300 border border-white/[0.06] text-xs"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Experience Perks Card */}
            <div className="bg-[#0c101a] border border-white/[0.08] rounded-2xl p-6 space-y-3">
              <h4 className="text-sm font-bold text-white">Cinema Amenities</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Real-time reserved seating hold</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Laser 4K HDR Projection & Dolby Atmos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Mobile QR Code instant admission pass</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Date Tabs & Available Showtimes List */}
          <div className="lg:col-span-2 space-y-6" id="showtimes-section">
            <div className="bg-[#0c101a] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Available Showtimes</h2>
                  <p className="text-xs text-slate-400">Select a date and hall to choose your seats</p>
                </div>

                {/* Date selection pill filters */}
                {availableDates.length > 0 && (
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => setSelectedDate('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedDate === 'ALL'
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-white/[0.03] text-slate-300 border border-white/[0.08] hover:bg-white/[0.06]'
                      }`}
                    >
                      All Dates
                    </button>
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                          selectedDate === date
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-white/[0.03] text-slate-300 border border-white/[0.08] hover:bg-white/[0.06]'
                        }`}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Showtimes List */}
              {filteredShowtimes.length > 0 ? (
                <div className="space-y-3">
                  {filteredShowtimes.map((st) => (
                    <ShowtimeCard key={st.id} showtime={st} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">
                    No showtimes scheduled for this selection
                  </p>
                  <p className="text-xs text-slate-400">
                    Try selecting "All Dates" or check back later for newly added screenings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {trailerOpen && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          title={movie.title}
          trailerUrl={movie.trailerUrl}
        />
      )}
    </div>
  );
};
