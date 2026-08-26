import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Film, Sparkles, SlidersHorizontal, Star } from 'lucide-react';
import { Movie } from '../types';
import { subscribeToMovies } from '../services/movies';
import { MovieCard } from '../components/MovieCard';

export const Movies: React.FC = () => {
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
          if (!matchTitle && !matchDesc && !matchGenre) return false;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-red-500">
          <Film className="w-4 h-4" />
          <span>KALI CINEMA MOVIE CATALOG</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Explore Cinema Titles
        </h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Browse current blockbuster releases, award winners, and upcoming titles across our Kali Cinema halls in Addis Ababa.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#12131d] border border-[#232535] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              id="movie-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by movie title, genre, or keyword..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#171926] border border-[#2b2e40] text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-400 shrink-0">Sort By:</span>
            <select
              id="movie-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-3 px-3.5 rounded-xl bg-[#171926] border border-[#2b2e40] text-white text-sm focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="RATING">Highest Rating</option>
              <option value="DATE">Release Date</option>
              <option value="TITLE">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#1d1f2b]">
          
          {/* Status Tabs */}
          <div className="flex items-center space-x-2 bg-[#171926] p-1 rounded-xl border border-[#282a3c] w-fit">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedStatus === 'ALL'
                  ? 'bg-[#e50914] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('NOW_SHOWING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedStatus === 'NOW_SHOWING'
                  ? 'bg-[#e50914] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setSelectedStatus('COMING_SOON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedStatus === 'COMING_SOON'
                  ? 'bg-[#e50914] text-white'
                  : 'text-gray-400 hover:text-gray-200'
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
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedGenre === genre
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'bg-[#151722] text-gray-400 border-[#262838] hover:text-gray-200 hover:bg-[#1f2130]'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-[#141520] animate-pulse border border-[#222432]"
            />
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#13141f] rounded-2xl border border-[#222432] space-y-4">
          <Film className="w-12 h-12 text-gray-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No matching movies found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              We couldn't find any titles matching your search criteria. Try adjusting your keywords or clearing the genre filter.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('ALL');
              setSelectedStatus('ALL');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e202e] text-red-400 hover:bg-[#282a3c] transition-colors border border-red-900/40"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
