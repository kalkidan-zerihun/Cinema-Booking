import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Film, Sparkles, Flame, Star, Armchair, RotateCcw } from 'lucide-react';
import { Movie } from '../types';
import { subscribeToMovies } from '../services/movies';
import { MovieCard } from '../components/MovieCard';

export const Movies: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'NOW_SHOWING' | 'COMING_SOON'>('ALL');
  const [sortBy, setSortBy] = useState<'RATING' | 'TITLE' | 'DATE'>('RATING');

  useEffect(() => {
    const unsub = subscribeToMovies((movieList) => {
      setMovies(movieList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Handle URL query filters
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'now-showing') {
      setSelectedStatus('NOW_SHOWING');
    } else if (filter === 'coming-soon') {
      setSelectedStatus('COMING_SOON');
    } else if (filter === 'imax') {
      setSelectedStatus('NOW_SHOWING');
    }
  }, [searchParams]);

  // Extract unique genres from movies
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach((m) => {
      if (m.genre) {
        m.genre.split(/[\/,]/).forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) genreSet.add(trimmed);
        });
      }
    });
    return ['ALL', ...Array.from(genreSet).sort()];
  }, [movies]);

  // Filtered & Sorted Movies
  const filteredMovies = useMemo(() => {
    return movies
      .filter((movie) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = movie.title.toLowerCase().includes(q);
          const matchDesc = movie.description?.toLowerCase().includes(q);
          const matchGenre = movie.genre?.toLowerCase().includes(q);
          const matchDirector = movie.director?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchGenre && !matchDirector) return false;
        }

        // Genre filter
        if (selectedGenre !== 'ALL') {
          if (!movie.genre?.toLowerCase().includes(selectedGenre.toLowerCase())) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus === 'NOW_SHOWING' && movie.isComingSoon) return false;
        if (selectedStatus === 'COMING_SOON' && !movie.isComingSoon) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'RATING') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'DATE') {
          return (b.releaseDate || '').localeCompare(a.releaseDate || '');
        }
        if (sortBy === 'TITLE') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [movies, searchQuery, selectedGenre, selectedStatus, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Film className="w-4 h-4" />
          <span>Cinema Catalog</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Explore Movies & Premieres
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
          Browse current blockbuster releases, award winners, and upcoming titles across our Cinema halls.
        </p>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-[#0c101a] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="movie-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by movie title, genre, director, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Sort:</span>
            <select
              id="movie-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0e121b] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400/50 cursor-pointer"
            >
              <option value="RATING">Highest Rating</option>
              <option value="DATE">Release Date</option>
              <option value="TITLE">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] w-fit">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === 'ALL'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('NOW_SHOWING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === 'NOW_SHOWING'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setSelectedStatus('COMING_SOON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === 'COMING_SOON'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Coming Soon
            </button>
          </div>

          {/* Genre Scrollable Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedGenre === genre
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-semibold'
                    : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]"
            />
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="p-14 text-center bg-[#0c101a] rounded-2xl border border-white/[0.08] space-y-4">
          <Film className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No matching movies found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We couldn't find any titles matching your search criteria. Try adjusting your keywords or clearing the genre filter.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('ALL');
              setSelectedStatus('ALL');
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.05] text-amber-400 hover:bg-white/[0.1] transition-colors border border-amber-400/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
