import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Star, Calendar, Ticket } from 'lucide-react';
import { Movie } from '../types';
import { TrailerModal } from './TrailerModal';

interface MovieCardProps {
  movie: Movie;
  onOpenTrailer?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [trailerOpen, setTrailerOpen] = useState(false);

  const formatDuration = (mins?: number) => {
    if (!mins) return '120m';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <>
      <div className="group relative flex flex-col bg-[#0d1322] border border-[#1b263b] hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-amber-950/30 hover:-translate-y-1">
        {/* Poster Container */}
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#101726]">
          <img
            src={movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Fallback placeholder
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Dark gradient overlay on poster bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-transparent to-black/40 opacity-85 group-hover:opacity-95 transition-opacity" />

          {/* Badges on poster */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/40">
              {movie.genre || 'Feature'}
            </span>

            {movie.rating ? (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/40">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{movie.rating.toFixed(1)}</span>
              </div>
            ) : movie.ageRating ? (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-900/80 text-slate-300 border border-slate-700">
                {movie.ageRating}
              </span>
            ) : null}
          </div>

          {/* Center Play Trailer Button (Hover) */}
          <button
            onClick={() => setTrailerOpen(true)}
            title="Watch Official Trailer"
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl shadow-amber-950/60 hover:bg-amber-300 font-bold"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
        </div>

        {/* Content Info */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex items-center space-x-3 text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatDuration(movie.duration)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{movie.releaseDate?.split('-')[0] || '2026'}</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-white leading-tight line-clamp-1 mb-1.5 group-hover:text-amber-400 transition-colors">
            {movie.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
            {movie.description}
          </p>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#182338]">
            <button
              onClick={() => setTrailerOpen(true)}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#131d31] text-slate-200 hover:bg-[#1c2842] transition-colors border border-[#233352]"
            >
              <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>Trailer</span>
            </button>

            <Link
              to={`/movies/${movie.id}`}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-colors shadow-sm shadow-amber-950"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Book Seats</span>
            </Link>
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        title={movie.title}
        trailerUrl={movie.trailerUrl}
      />
    </>
  );
};
