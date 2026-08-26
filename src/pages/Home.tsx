import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Play,
  Ticket,
  Clock,
  Star,
  Calendar,
  Sparkles,
  MapPin,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Movie, Cinema } from '../types';
import { getMovies, subscribeToMovies } from '../services/movies';
import { getCinemas } from '../services/cinemas';
import { MovieCard } from '../components/MovieCard';
import { TrailerModal } from '../components/TrailerModal';
import { seedCinemaData } from '../services/seedData';

export const Home: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeToMovies(async (movieList) => {
      if (!isMounted) return;
      if (movieList.length === 0) {
        try {
          await seedCinemaData(false);
          const updatedCinemas = await getCinemas();
          if (isMounted) setCinemas(updatedCinemas);
        } catch (err) {
          console.warn('Initial seed completed or skipped:', err);
        }
      }
      setMovies(movieList);
      setLoading(false);
    });

    getCinemas().then((cinemaList) => {
      if (isMounted) setCinemas(cinemaList);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const featuredMovie = movies.find((m) => m.isFeatured) || movies[0];
  const nowShowingMovies = movies.filter((m) => m.isNowShowing !== false && !m.isComingSoon);
  const comingSoonMovies = movies.filter((m) => m.isComingSoon);

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. Main Hero Section */}
      <div className="relative min-h-[560px] lg:min-h-[640px] flex items-center bg-[#0d0e15] overflow-hidden border-b border-[#1f212f]">
        
        {/* Background Backdrop Image */}
        {featuredMovie?.backdropUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={featuredMovie.backdropUrl}
              alt="Backdrop"
              className="w-full h-full object-cover object-center opacity-30 scale-105 filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-[#0c0d12]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d12] via-[#0c0d12]/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-2xl space-y-6">
            
            {/* Top Brand Pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PREMIERE CINEMA EXPERIENCE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Your Movie Night <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e50914] via-red-500 to-amber-500">
                Starts Here.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
              Discover movies, choose your perfect seats, and book your cinema experience in seconds with real-time guaranteed seat selection.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/movies"
                id="hero-browse-movies-btn"
                className="flex items-center space-x-2 px-7 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-all duration-200 shadow-xl shadow-red-950/60 hover:scale-105"
              >
                <Film className="w-4 h-4" />
                <span>Browse Movies</span>
              </Link>

              <Link
                to="/cinemas"
                id="hero-explore-showtimes-btn"
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#1a1b28] text-gray-200 hover:bg-[#252839] hover:text-white border border-[#2e3146] transition-all duration-200"
              >
                <Ticket className="w-4 h-4 text-red-500" />
                <span>Explore Showtimes</span>
              </Link>
            </div>

            {/* Fast Stats / Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#232537] text-gray-400 text-xs">
              <div>
                <span className="text-lg font-black text-white block">4K Laser</span>
                <span>Ultra-HD Projection</span>
              </div>
              <div>
                <span className="text-lg font-black text-red-500 block">Dolby Atmos</span>
                <span>7.1 Immersive Sound</span>
              </div>
              <div>
                <span className="text-lg font-black text-emerald-400 block">Instant Locks</span>
                <span>Zero Double Booking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* 2. Featured Movie Highlight (if available) */}
        {featuredMovie && (
          <section className="relative bg-gradient-to-r from-[#141522] to-[#0f1019] border border-[#232538] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              
              {/* Poster */}
              <div className="w-full lg:w-1/3 max-w-[280px] shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-[#2d3044]">
                <img
                  src={featuredMovie.posterUrl}
                  alt={featuredMovie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4 text-left">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                    FEATURED BLOCKBUSTER
                  </span>
                  {featuredMovie.rating && (
                    <span className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{featuredMovie.rating} / 10</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                  {featuredMovie.title}
                </h2>

                <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                  {featuredMovie.description}
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-2">
                  <span>Genre: <strong className="text-gray-200">{featuredMovie.genre}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-gray-200">{featuredMovie.duration} mins</strong></span>
                  <span>•</span>
                  <span>Director: <strong className="text-gray-200">{featuredMovie.director || 'Kali Studios'}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Link
                    to={`/movies/${featuredMovie.id}`}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/50"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Select Showtimes</span>
                  </Link>

                  <button
                    onClick={() => setActiveTrailerMovie(featuredMovie)}
                    className="flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs bg-[#1f2130] text-gray-200 hover:bg-[#2b2e42] transition-colors border border-[#34374c]"
                  >
                    <Play className="w-4 h-4 text-red-500 fill-current" />
                    <span>Watch Trailer</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Now Showing Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-red-500" />
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  Now Showing
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                Playing in Addis Ababa cinema screens today
              </p>
            </div>

            <Link
              to="/movies"
              className="flex items-center space-x-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              <span>View All Movies</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-[#141520] animate-pulse border border-[#222432]"
                />
              ))}
            </div>
          ) : nowShowingMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nowShowingMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#13141f] rounded-2xl border border-[#222432] space-y-3">
              <Film className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-base font-bold text-gray-300">No movies currently scheduled</p>
              <p className="text-xs text-gray-500">
                Showtimes will be loaded shortly. Please check back soon!
              </p>
            </div>
          )}
        </section>

        {/* 4. Coming Soon Section */}
        {comingSoonMovies.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  Coming Soon
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                Upcoming major cinema releases to look forward to
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {comingSoonMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Cinema Locations Highlight */}
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                Our Cinema Lounges
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              State-of-the-art destinations in Addis Ababa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cinemas.map((cinema) => (
              <div
                key={cinema.id}
                className="group relative bg-[#13141f] border border-[#232535] hover:border-red-600/40 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col sm:flex-row"
              >
                <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto relative overflow-hidden bg-[#1c1e2b]">
                  <img
                    src={cinema.imageUrl}
                    alt={cinema.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/60 to-transparent" />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs text-red-400 font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{cinema.location}</span>
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-red-400 transition-colors">
                      {cinema.name}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {cinema.description}
                    </p>
                  </div>

                  {cinema.amenities && cinema.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cinema.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1a1c2a] text-gray-300 border border-[#2a2d40]"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#1e202e] flex items-center justify-between">
                    <span className="text-xs text-gray-400">{cinema.phone || '+251 11 661 2233'}</span>
                    <Link
                      to={`/cinemas/${cinema.id}`}
                      className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center space-x-1"
                    >
                      <span>View Halls & Showtimes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Call To Action Banner */}
        <section className="bg-gradient-to-r from-red-950 via-[#181119] to-[#12131d] border border-red-900/50 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready for the Ultimate Cinema Experience?
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Skip box office queues. Pick your favourite recliner seats online and receive your digital QR code admission pass immediately.
            </p>
            <div className="pt-3">
              <Link
                to="/movies"
                id="cta-book-your-seat-btn"
                className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-all duration-200 shadow-xl shadow-red-950/70 hover:scale-105"
              >
                <Ticket className="w-5 h-5" />
                <span>Book Your Seat Now</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {activeTrailerMovie && (
        <TrailerModal
          isOpen={!!activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
          title={activeTrailerMovie.title}
          trailerUrl={activeTrailerMovie.trailerUrl}
        />
      )}
    </div>
  );
};
