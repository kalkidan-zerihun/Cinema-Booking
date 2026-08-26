import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Plus,
  Edit2,
  Trash2,
  Play,
  Star,
  Clock,
  Calendar,
  Check,
  X,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Movie } from '../../types';
import {
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../../services/movies';
import { TrailerModal } from '../../components/TrailerModal';

export const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState<number>(120);
  const [releaseDate, setReleaseDate] = useState('2025-01-01');
  const [rating, setRating] = useState<number>(8.5);
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [ageRating, setAgeRating] = useState('PG-13');
  const [director, setDirector] = useState('');
  const [castInput, setCastInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNowShowing, setIsNowShowing] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const list = await getMovies();
      setMovies(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const openCreateModal = () => {
    setEditingMovie(null);
    setTitle('');
    setDescription('');
    setGenre('Action / Sci-Fi');
    setDuration(125);
    setReleaseDate(new Date().toISOString().split('T')[0]);
    setRating(8.5);
    setPosterUrl('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80');
    setBackdropUrl('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80');
    setTrailerUrl('https://www.youtube.com/watch?v=Way9Dexny3w');
    setAgeRating('PG-13');
    setDirector('Christopher Nolan');
    setCastInput('Actor 1, Actor 2, Actor 3');
    setLanguage('English');
    setIsFeatured(false);
    setIsNowShowing(true);
    setIsComingSoon(false);
    setModalOpen(true);
  };

  const openEditModal = (m: Movie) => {
    setEditingMovie(m);
    setTitle(m.title);
    setDescription(m.description || '');
    setGenre(m.genre || '');
    setDuration(m.duration || 120);
    setReleaseDate(m.releaseDate || '');
    setRating(m.rating || 8.0);
    setPosterUrl(m.posterUrl || '');
    setBackdropUrl(m.backdropUrl || '');
    setTrailerUrl(m.trailerUrl || '');
    setAgeRating(m.ageRating || 'PG-13');
    setDirector(m.director || '');
    setCastInput(m.cast?.join(', ') || '');
    setLanguage(m.language || 'English');
    setIsFeatured(m.isFeatured || false);
    setIsNowShowing(m.isNowShowing !== false);
    setIsComingSoon(m.isComingSoon || false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !genre || !posterUrl) {
      setMessage({ type: 'error', text: 'Title, Genre, and Poster URL are required.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const cast = castInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      if (editingMovie) {
        await updateMovie(editingMovie.id, {
          title,
          description,
          genre,
          duration: Number(duration),
          releaseDate,
          rating: Number(rating),
          posterUrl,
          backdropUrl,
          trailerUrl,
          ageRating,
          director,
          cast,
          language,
          isFeatured,
          isNowShowing,
          isComingSoon,
        });
        setMessage({ type: 'success', text: `Updated "${title}" successfully.` });
      } else {
        await createMovie({
          title,
          description,
          genre,
          duration: Number(duration),
          releaseDate,
          rating: Number(rating),
          posterUrl,
          backdropUrl,
          trailerUrl,
          ageRating,
          director,
          cast,
          language,
          isFeatured,
          isNowShowing,
          isComingSoon,
        });
        setMessage({ type: 'success', text: `Created new movie "${title}" successfully.` });
      }
      setModalOpen(false);
      await fetchMovies();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save movie.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, movieTitle: string) => {
    if (!window.confirm(`Delete movie "${movieTitle}"? This will also remove showtimes associated with it.`)) {
      return;
    }
    try {
      await deleteMovie(id);
      setMessage({ type: 'success', text: `Movie "${movieTitle}" deleted.` });
      await fetchMovies();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete movie.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202232]">
        <div className="space-y-1">
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Manage Movie Catalog</h1>
          <p className="text-xs text-gray-400">
            Publish new titles, edit trailers, manage ratings, and set featured blockbusters.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="admin-add-movie-btn"
          className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/60"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Movies Table */}
      <div className="bg-[#12131d] border border-[#232535] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#171926] text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#232535]">
              <tr>
                <th className="px-5 py-3">Movie</th>
                <th className="px-5 py-3">Genre</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e202e]">
              {movies.map((m) => (
                <tr key={m.id} className="hover:bg-[#181a27]">
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        className="w-10 h-14 object-cover rounded-lg bg-[#202232] shrink-0"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-sm">{m.title}</span>
                          {m.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 block">{m.director}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-200">{m.genre}</td>
                  <td className="px-5 py-3">{m.duration} mins</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center space-x-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{m.rating}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.isNowShowing && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          NOW SHOWING
                        </span>
                      )}
                      {m.isComingSoon && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
                          COMING SOON
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {m.trailerUrl && (
                        <button
                          onClick={() => setTrailerMovie(m)}
                          title="Watch Trailer"
                          className="p-2 rounded-lg bg-[#1a1c2a] text-gray-300 hover:text-white hover:bg-[#25283c] transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(m)}
                        title="Edit Movie"
                        className="p-2 rounded-lg bg-[#1a1c2a] text-blue-400 hover:text-blue-300 hover:bg-[#25283c] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.title)}
                        title="Delete Movie"
                        className="p-2 rounded-lg bg-[#1a1c2a] text-red-400 hover:text-red-300 hover:bg-[#25283c] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#141522] border border-[#26283d] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#222435]">
              <h2 className="text-xl font-black text-white">
                {editingMovie ? 'Edit Movie' : 'Add New Movie Title'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dune: Part Two"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Genre *</label>
                  <input
                    type="text"
                    required
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Action / Sci-Fi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={400}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Release Date</label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Rating (0 - 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300">Description / Synopsis</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter full storyline summary..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300">Poster Image URL *</label>
                  <input
                    type="url"
                    required
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300">Backdrop Banner URL</label>
                  <input
                    type="url"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300">YouTube Trailer URL</label>
                  <input
                    type="url"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Director</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="Director Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Cast (comma-separated)</label>
                  <input
                    type="text"
                    value={castInput}
                    onChange={(e) => setCastInput(e.target.value)}
                    placeholder="Actor 1, Actor 2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-[#222435]">
                <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Featured Hero Showcase</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNowShowing}
                    onChange={(e) => setIsNowShowing(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Now Showing</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isComingSoon}
                    onChange={(e) => setIsComingSoon(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Coming Soon</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#222435]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1a1c2a] text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase bg-[#e50914] text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {trailerMovie && (
        <TrailerModal
          isOpen={!!trailerMovie}
          onClose={() => setTrailerMovie(null)}
          title={trailerMovie.title}
          trailerUrl={trailerMovie.trailerUrl}
        />
      )}
    </div>
  );
};
