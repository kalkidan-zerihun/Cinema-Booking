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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mx-auto animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Loading movie details & showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#141522] border border-[#222432] rounded-3xl text-center space-y-4">
        <Film className="w-12 h-12 text-gray-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-xs text-gray-400">
          The requested movie record could not be found or has been removed from the schedule.
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#e50914] text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Movies</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. Cinematic Backdrop Header */}
      <div className="relative min-h-[460px] lg:min-h-[520px] flex items-end bg-[#0a0a0e] overflow-hidden border-b border-[#1f212f]">
        
        {/* Backdrop image */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-top opacity-30 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-[#0c0d12]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d12] via-[#0c0d12]/70 to-transparent" />
        </div>

        {/* Back button */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-gray-300 hover:text-white border border-[#2c2f42] text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            
            {/* Large Poster */}
            <div className="w-48 sm:w-60 md:w-72 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#2b2e40] bg-[#141520] relative group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setTrailerOpen(true)}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 shadow-xl shadow-red-950"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
            </div>

            {/* Movie Info */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                  {movie.genre}
                </span>

                {movie.ageRating && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#1d1f2d] text-gray-300 border border-[#2d3042]">
                    {movie.ageRating}
                  </span>
                )}

                {movie.rating && (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{movie.rating.toFixed(1)} / 10</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-gray-300">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>{formatDuration(movie.duration)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Release: {movie.releaseDate}</span>
                </span>
                {movie.language && (
                  <>
                    <span>•</span>
                    <span>{movie.language}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => setTrailerOpen(true)}
                  id="movie-watch-trailer-btn"
                  className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/60"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>WATCH TRAILER</span>
                </button>

                <a
                  href="#showtimes-section"
                  className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs bg-[#1a1b28] text-gray-200 hover:bg-[#262839] hover:text-white border border-[#2b2e40] transition-colors"
                >
                  <Ticket className="w-4 h-4 text-red-500" />
                  <span>VIEW SHOWTIMES</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid: Synopsis & Details on Left, Showtimes on Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Synopsis, Cast, Metadata */}
          <div className="space-y-6">
            <div className="bg-[#12131d] border border-[#222432] rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white tracking-wide">Storyline & Synopsis</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {movie.description}
              </p>

              {movie.director && (
                <div className="pt-3 border-t border-[#1d1f2b] text-xs">
                  <span className="text-gray-400 block mb-0.5">Director:</span>
                  <span className="font-bold text-gray-200">{movie.director}</span>
                </div>
              )}

              {movie.cast && movie.cast.length > 0 && (
                <div className="pt-3 border-t border-[#1d1f2b] text-xs">
                  <span className="text-gray-400 block mb-1">Key Cast:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.cast.map((actor, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-[#191a27] text-gray-300 border border-[#27293b]"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cinema Tech Quality Badge */}
            <div className="bg-gradient-to-br from-[#161725] to-[#11121c] border border-red-900/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center space-x-2 text-red-400">
                <Sparkles className="w-5 h-5" />
                <h4 className="text-sm font-bold">Kali Cinema Standards</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Presented in uncompressed 4K Laser Projection with Dolby Atmos multi-dimensional spatial audio for total audience immersion.
              </p>
            </div>
          </div>

          {/* Right Column: Available Showtimes (2 Columns Wide on LG) */}
          <div id="showtimes-section" className="lg:col-span-2 space-y-6 scroll-mt-24">
            
            {/* Header & Date Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#202230]">
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-white flex items-center space-x-2">
                  <Ticket className="w-5 h-5 text-red-500" />
                  <span>Available Showtimes</span>
                </h2>
                <p className="text-xs text-gray-400">
                  Select your preferred hall and time to choose your seats
                </p>
              </div>

              {/* Date Filter Tabs */}
              {availableDates.length > 1 && (
                <div className="flex items-center space-x-1.5 bg-[#141520] p-1 rounded-xl border border-[#232535] overflow-x-auto">
                  <button
                    onClick={() => setSelectedDate('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedDate === 'ALL'
                        ? 'bg-[#e50914] text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    All Dates
                  </button>
                  {availableDates.map((dateStr) => (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                        selectedDate === dateStr
                          ? 'bg-[#e50914] text-white'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {dateStr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Showtimes List */}
            {filteredShowtimes.length > 0 ? (
              <div className="space-y-4">
                {filteredShowtimes.map((st) => (
                  <ShowtimeCard key={st.id} showtime={st} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-[#12131d] border border-[#222432] rounded-2xl space-y-3">
                <Calendar className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-base font-bold text-gray-300">
                  No showtimes currently scheduled for this date
                </p>
                <p className="text-xs text-gray-400">
                  Please check other scheduled dates or explore our other featured releases.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        title={movie.title}
        trailerUrl={movie.trailerUrl}
      />
    </div>
  );
};
