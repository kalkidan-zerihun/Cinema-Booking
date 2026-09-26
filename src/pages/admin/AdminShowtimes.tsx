import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Film,
  Building,
  Tv,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { Showtime, Movie, Cinema, Hall, EnrichedShowtime } from '../../types';
import {
  getShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from '../../services/showtimes';
import { getMovies } from '../../services/movies';
import { getCinemas } from '../../services/cinemas';
import { getHalls } from '../../services/halls';

export const AdminShowtimes: React.FC = () => {
  const [showtimes, setShowtimes] = useState<EnrichedShowtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);

  // Form State
  const [movieId, setMovieId] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [hallId, setHallId] = useState('');
  const [date, setDate] = useState('2025-05-20');
  const [startTime, setStartTime] = useState('14:30');
  const [endTime, setEndTime] = useState('16:45');
  const [ticketPrice, setTicketPrice] = useState<number>(250);
  const [format, setFormat] = useState('2D Laser');
  const [language, setLanguage] = useState('English with Subtitles');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter state
  const [filterMovieId, setFilterMovieId] = useState('ALL');
  const [filterCinemaId, setFilterCinemaId] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rawShowtimes, mList, cList, hList] = await Promise.all([
        getShowtimes(),
        getMovies(),
        getCinemas(),
        getHalls(),
      ]);

      setMovies(mList);
      setCinemas(cList);
      setHalls(hList);

      const movieMap = new Map(mList.map((m) => [m.id, m]));
      const cinemaMap = new Map(cList.map((c) => [c.id, c]));
      const hallMap = new Map(hList.map((h) => [h.id, h]));

      const enriched: EnrichedShowtime[] = rawShowtimes.map((st) => ({
        ...st,
        movie: movieMap.get(st.movieId),
        cinema: cinemaMap.get(st.cinemaId),
        hall: hallMap.get(st.hallId),
      }));

      setShowtimes(enriched);

      if (mList.length > 0 && !movieId) setMovieId(mList[0].id);
      if (cList.length > 0 && !cinemaId) setCinemaId(cList[0].id);
      if (hList.length > 0 && !hallId) setHallId(hList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingShowtime(null);
    setMovieId(movies[0]?.id || '');
    setCinemaId(cinemas[0]?.id || '');
    const firstHall = halls.find((h) => h.cinemaId === cinemas[0]?.id) || halls[0];
    setHallId(firstHall?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('17:00');
    setEndTime('19:30');
    setTicketPrice(250);
    setFormat('2D Laser');
    setLanguage('English with Subtitles');
    setModalOpen(true);
  };

  const openEditModal = (st: Showtime) => {
    setEditingShowtime(st);
    setMovieId(st.movieId);
    setCinemaId(st.cinemaId);
    setHallId(st.hallId);
    setDate(st.date);
    setStartTime(st.startTime);
    setEndTime(st.endTime || '');
    setTicketPrice(st.ticketPrice || 250);
    setFormat(st.format || '2D');
    setLanguage(st.language || 'English');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieId || !cinemaId || !hallId || !date || !startTime) {
      setMessage({ type: 'error', text: 'Movie, Cinema, Hall, Date, and Start Time are required.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      if (editingShowtime) {
        await updateShowtime(editingShowtime.id, {
          movieId,
          cinemaId,
          hallId,
          date,
          startTime,
          endTime,
          ticketPrice: Number(ticketPrice),
          format,
          language,
        });
        setMessage({ type: 'success', text: 'Showtime updated successfully.' });
      } else {
        await createShowtime({
          movieId,
          cinemaId,
          hallId,
          date,
          startTime,
          endTime,
          ticketPrice: Number(ticketPrice),
          format,
          language,
        });
        setMessage({ type: 'success', text: 'Showtime scheduled successfully.' });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save showtime.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this showtime? All seat bookings for this session will also be cancelled.')) {
      return;
    }
    try {
      await deleteShowtime(id);
      setMessage({ type: 'success', text: 'Showtime deleted.' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete showtime.' });
    }
  };

  // Halls available for current selected cinema in modal
  const availableHallsInModal = halls.filter((h) => h.cinemaId === cinemaId);

  const filteredShowtimes = showtimes.filter((st) => {
    if (filterMovieId !== 'ALL' && st.movieId !== filterMovieId) return false;
    if (filterCinemaId !== 'ALL' && st.cinemaId !== filterCinemaId) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162035]">
        <div className="space-y-1">
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-amber-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Showtime Scheduler</h1>
          <p className="text-xs text-slate-400">
            Schedule screening sessions, link movies to auditorium halls, and assign ticket price rates.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="admin-add-showtime-btn"
          className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Showtime</span>
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

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0d1424] p-4 rounded-2xl border border-[#1b263b]">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400 font-semibold">Movie:</span>
          <select
            value={filterMovieId}
            onChange={(e) => setFilterMovieId(e.target.value)}
            className="bg-[#121c32] border border-[#1b263b] text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="ALL">All Movies</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400 font-semibold">Cinema:</span>
          <select
            value={filterCinemaId}
            onChange={(e) => setFilterCinemaId(e.target.value)}
            className="bg-[#121c32] border border-[#1b263b] text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="ALL">All Cinemas</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Showtimes Table */}
      <div className="bg-[#0d1424] border border-[#1b263b] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#121c32] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#1b263b]">
              <tr>
                <th className="px-5 py-3">Movie</th>
                <th className="px-5 py-3">Venue & Hall</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162035]">
              {filteredShowtimes.map((st) => (
                <tr key={st.id} className="hover:bg-[#121c32]">
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-2.5">
                      {st.movie?.posterUrl && (
                        <img
                          src={st.movie.posterUrl}
                          alt={st.movie.title}
                          className="w-8 h-11 object-cover rounded bg-[#162035]"
                        />
                      )}
                      <span className="font-bold text-white text-sm">{st.movie?.title || 'Unknown Title'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-200 block">{st.cinema?.name}</span>
                      <span className="text-slate-400 text-[11px] block">{st.hall?.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">{st.date}</span>
                      <span className="text-amber-400 font-mono font-semibold block">
                        {st.startTime} {st.endTime ? `– ${st.endTime}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#121c32] text-slate-300 border border-[#1b263b]">
                      {st.format || '2D'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-emerald-400">
                    {st.ticketPrice} ETB
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/showtimes/${st.id}/seats`}
                        title="View Seat Map"
                        className="px-2.5 py-1 rounded-lg bg-[#121c32] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#192744]"
                      >
                        Seat Map
                      </Link>
                      <button
                        onClick={() => openEditModal(st)}
                        className="p-1.5 rounded-lg bg-[#121c32] text-amber-400 hover:text-amber-300 hover:bg-[#192744]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(st.id)}
                        className="p-1.5 rounded-lg bg-[#121c32] text-red-400 hover:text-red-300 hover:bg-[#192744]"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d1424] border border-[#1b263b] rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#162035]">
              <h2 className="text-xl font-black text-white">
                {editingShowtime ? 'Edit Showtime Session' : 'Schedule New Showtime'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Select Movie *</label>
                <select
                  required
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Cinema Venue *</label>
                  <select
                    required
                    value={cinemaId}
                    onChange={(e) => {
                      const newCinemaId = e.target.value;
                      setCinemaId(newCinemaId);
                      const matchingHall = halls.find((h) => h.cinemaId === newCinemaId);
                      if (matchingHall) setHallId(matchingHall.id);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Auditorium Hall *</label>
                  <select
                    required
                    value={hallId}
                    onChange={(e) => setHallId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {availableHallsInModal.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.capacity} Seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Base Ticket Price (ETB) *</label>
                  <input
                    type="number"
                    min={50}
                    max={2000}
                    step={10}
                    required
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Projection Format</label>
                  <input
                    type="text"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    placeholder="2D Laser, IMAX 3D, Dolby Vision"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Audio / Subtitle Track</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="English with Amharic Subtitles"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#162035]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#121c32] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Showtime'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
