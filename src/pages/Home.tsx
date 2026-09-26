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
  ChevronLeft,
  ChevronRight,
  Armchair,
  Volume2,
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
  const [featuredIndex, setFeaturedIndex] = useState(0);

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

  const featuredMovies = movies.filter((m) => m.isFeatured).length > 0
    ? movies.filter((m) => m.isFeatured)
    : movies.slice(0, 4);

  const currentHeroMovie = featuredMovies[featuredIndex] || movies[0];
  const nowShowingMovies = movies.filter((m) => m.isNowShowing !== false && !m.isComingSoon);
  const comingSoonMovies = movies.filter((m) => m.isComingSoon);

  const nextHero = () => {
    if (featuredMovies.length > 0) {
      setFeaturedIndex((prev) => (prev + 1) % featuredMovies.length);
    }
  };

  const prevHero = () => {
    if (featuredMovies.length > 0) {
      setFeaturedIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Cinematic Hero Banner (Inspired by Reference) */}
      <section className="relative min-h-[520px] lg:min-h-[600px] flex items-end bg-[#07090e] overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 border border-white/[0.08] shadow-2xl">
        {/* Full Backdrop Image */}
        {currentHeroMovie?.backdropUrl ? (
          <div className="absolute inset-0 z-0">
            <img
              src={currentHeroMovie.backdropUrl}
              alt={currentHeroMovie.title}
              className="w-full h-full object-cover object-center transition-all duration-700 transform scale-100 filter brightness-[0.65]"
            />
            {/* Multi-layered Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/70 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0f1d] via-[#101726] to-[#07090e]" />
        )}

        {/* Hero Content Area */}
        <div className="relative z-10 w-full p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
          <div className="max-w-2xl space-y-4">
            {/* Tag / Category Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                <span>Now Showing • IMAX 4K</span>
              </span>

              {currentHeroMovie?.genre && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-slate-200 bg-white/10 backdrop-blur-md border border-white/10">
                  {currentHeroMovie.genre}
                </span>
              )}

              {currentHeroMovie?.rating && (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-300 bg-black/60 backdrop-blur-md border border-amber-400/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{currentHeroMovie.rating.toFixed(1)} / 10</span>
                </span>
              )}
            </div>

            {/* Movie Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              {currentHeroMovie?.title || 'Discover Today’s Cinema Premieres'}
            </h1>

            {/* Movie Description */}
            <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
              {currentHeroMovie?.description ||
                'Book the finest reserved seats in advance. Enjoy crystal-clear laser projection, Dolby Atmos surround sound, and VIP recliner comfort.'}
            </p>

            {/* Key Specs */}
            <div className="flex items-center space-x-4 text-xs font-medium text-slate-400 pt-1">
              {currentHeroMovie?.duration && (
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentHeroMovie.duration} Mins</span>
                </span>
              )}
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Armchair className="w-3.5 h-3.5 text-sky-400" />
                <span>VIP Recliners Available</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {currentHeroMovie && (
                <Link
                  to={`/movies/${currentHeroMovie.id}`}
                  id="hero-book-ticket-btn"
                  className="flex items-center space-x-2 px-6 sm:px-8 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all duration-200 shadow-xl shadow-amber-400/25 hover:scale-102"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets</span>
                </Link>
              )}

              {currentHeroMovie?.trailerUrl && (
                <button
                  onClick={() => setActiveTrailerMovie(currentHeroMovie)}
                  id="hero-watch-trailer-btn"
                  className="flex items-center space-x-2 px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/15 transition-colors"
                >
                  <Play className="w-4 h-4 text-amber-400 fill-current" />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>
          </div>

          {/* Carousel Slide Indicators & Mini Thumbnail Switcher */}
          {featuredMovies.length > 1 && (
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-x-auto pb-1 max-w-lg">
                {featuredMovies.map((movie, idx) => (
                  <button
                    key={movie.id}
                    onClick={() => setFeaturedIndex(idx)}
                    className={`flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl transition-all ${
                      featuredIndex === idx
                        ? 'bg-white/15 border border-amber-400/60 shadow-md'
                        : 'bg-black/40 border border-white/5 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-7 h-9 rounded-md object-cover"
                    />
                    <div className="text-left hidden sm:block">
                      <span className="text-[11px] font-bold text-white block max-w-[100px] truncate">
                        {movie.title}
                      </span>
                      <span className="text-[10px] text-amber-400">
                        {movie.rating ? `★ ${movie.rating.toFixed(1)}` : 'Premiering'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center space-x-1.5 shrink-0 ml-4">
                <button
                  onClick={prevHero}
                  aria-label="Previous Featured Movie"
                  className="p-2 rounded-xl bg-black/50 hover:bg-white/10 text-white border border-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextHero}
                  aria-label="Next Featured Movie"
                  className="p-2 rounded-xl bg-black/50 hover:bg-white/10 text-white border border-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Main Discovery Sections Container */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-14 max-w-7xl mx-auto">
        {/* Real-time Experience Assurance Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Guaranteed Seat Hold</span>
              <span className="text-[11px] text-slate-400">15-minute lock with zero double booking</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2 border-t sm:border-t-0 sm:border-l border-white/[0.06]">
            <div className="w-9 h-9 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Laser 4K Projection</span>
              <span className="text-[11px] text-slate-400">High dynamic range with vibrant colors</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2 border-t sm:border-t-0 sm:border-l border-white/[0.06]">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Digital QR Ticket</span>
              <span className="text-[11px] text-slate-400">Direct admission right from your phone</span>
            </div>
          </div>
        </div>

        {/* 3. Now Showing Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Now Showing
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Playing in Addis Ababa cinema screens today
              </p>
            </div>

            <Link
              to="/movies"
              className="flex items-center space-x-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]"
                />
              ))}
            </div>
          ) : nowShowingMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {nowShowingMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white/[0.02] rounded-2xl border border-white/[0.06] space-y-3">
              <Film className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No movies currently scheduled</p>
              <p className="text-xs text-slate-500">
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
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Coming Soon to Theatres
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Upcoming major blockbusters and premieres
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {comingSoonMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Cinema Lounges & Venues */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Our Cinema Venues
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Premium multi-screen destinations across the city
              </p>
            </div>

            <Link
              to="/cinemas"
              className="flex items-center space-x-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Explore Lounges</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cinemas.map((cinema) => (
              <div
                key={cinema.id}
                className="group relative bg-[#0c101a] border border-white/[0.08] hover:border-amber-400/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col sm:flex-row"
              >
                <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto relative overflow-hidden bg-slate-900">
                  <img
                    src={cinema.imageUrl}
                    alt={cinema.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#0c101a] via-transparent to-transparent" />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{cinema.location}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {cinema.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {cinema.description}
                    </p>
                  </div>

                  {cinema.amenities && cinema.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cinema.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {cinema.phone || '+251 11 661 2233'}
                    </span>
                    <Link
                      to={`/cinemas/${cinema.id}`}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                    >
                      <span>Showtimes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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
