import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Tv,
  Plus,
  Edit2,
  Trash2,
  Building,
  Armchair,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Hall, Cinema } from '../../types';
import { getHalls, createHall, updateHall, deleteHall } from '../../services/halls';
import { getCinemas } from '../../services/cinemas';

export const AdminHalls: React.FC = () => {
  const [searchParams] = useSearchParams();
  const filterCinemaId = searchParams.get('cinemaId') || 'ALL';

  const [halls, setHalls] = useState<Hall[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(filterCinemaId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);

  // Form
  const [name, setName] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [screenType, setScreenType] = useState('4K Laser Ultra HD');
  const [soundSystem, setSoundSystem] = useState('Dolby Atmos 7.1 Immersive');
  const [totalRows, setTotalRows] = useState(6);
  const [seatsPerRow, setSeatsPerRow] = useState(8);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hList, cList] = await Promise.all([getHalls(), getCinemas()]);
      setHalls(hList);
      setCinemas(cList);
      if (cList.length > 0 && !cinemaId) {
        setCinemaId(cList[0].id);
      }
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
    setEditingHall(null);
    setName('Hall 1 - Grand Recliner');
    setCinemaId(cinemas[0]?.id || '');
    setScreenType('4K Laser Ultra HD');
    setSoundSystem('Dolby Atmos 7.1 Immersive');
    setTotalRows(6);
    setSeatsPerRow(8);
    setModalOpen(true);
  };

  const openEditModal = (h: Hall) => {
    setEditingHall(h);
    setName(h.name);
    setCinemaId(h.cinemaId);
    setScreenType(h.screenType || '4K Laser');
    setSoundSystem(h.soundSystem || 'Dolby Atmos');
    setTotalRows(h.totalRows || 6);
    setSeatsPerRow(h.seatsPerRow || 8);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cinemaId) {
      setMessage({ type: 'error', text: 'Hall Name and Cinema are required.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const calculatedCapacity = Number(totalRows) * Number(seatsPerRow);

    try {
      if (editingHall) {
        await updateHall(editingHall.id, {
          name,
          cinemaId,
          screenType,
          soundSystem,
          totalRows: Number(totalRows),
          seatsPerRow: Number(seatsPerRow),
          capacity: calculatedCapacity,
        });
        setMessage({ type: 'success', text: `Updated "${name}".` });
      } else {
        await createHall({
          name,
          cinemaId,
          screenType,
          soundSystem,
          totalRows: Number(totalRows),
          seatsPerRow: Number(seatsPerRow),
          capacity: calculatedCapacity,
        });
        setMessage({ type: 'success', text: `Created auditorium "${name}".` });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save hall.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, hallName: string) => {
    if (!window.confirm(`Delete hall "${hallName}"? This will delete all seats in this auditorium.`)) {
      return;
    }
    try {
      await deleteHall(id);
      setMessage({ type: 'success', text: `Hall "${hallName}" deleted.` });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete hall.' });
    }
  };

  const filteredHalls = halls.filter((h) => {
    if (selectedCinemaId !== 'ALL' && h.cinemaId !== selectedCinemaId) return false;
    return true;
  });

  const cinemaNameMap = new Map(cinemas.map((c) => [c.id, c.name]));

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
          <h1 className="text-3xl font-black text-white">Manage Auditoriums & Halls</h1>
          <p className="text-xs text-gray-400">
            Configure screening rooms, certified sound systems, projection types, and seating grid sizes.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="admin-add-hall-btn"
          className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/60"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hall</span>
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

      {/* Filter by Cinema */}
      <div className="flex items-center space-x-2 bg-[#12131d] p-3 rounded-xl border border-[#232535] w-fit">
        <Building className="w-4 h-4 text-gray-400 ml-1" />
        <span className="text-xs text-gray-400 font-semibold">Cinema Venue:</span>
        <select
          value={selectedCinemaId}
          onChange={(e) => setSelectedCinemaId(e.target.value)}
          className="bg-[#171926] border border-[#2c2f42] text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
        >
          <option value="ALL">All Cinemas</option>
          {cinemas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Halls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredHalls.map((h) => (
          <div
            key={h.id}
            className="p-6 rounded-2xl bg-[#12131d] border border-[#232535] space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-red-400 block">
                    {cinemaNameMap.get(h.cinemaId) || 'Cinema'}
                  </span>
                  <h3 className="text-lg font-bold text-white">{h.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(h)}
                    className="p-2 rounded-lg bg-[#1a1c2a] text-blue-400 hover:text-blue-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(h.id, h.name)}
                    className="p-2 rounded-lg bg-[#1a1c2a] text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-300 pt-2 border-t border-[#1e202e]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Capacity:</span>
                  <span className="font-bold text-amber-400">{h.capacity} Seats</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Grid Dimensions:</span>
                  <span className="text-white">
                    {h.totalRows || 6} Rows × {h.seatsPerRow || 8} Seats
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Screen:</span>
                  <span className="text-gray-200">{h.screenType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Audio:</span>
                  <span className="text-gray-200">{h.soundSystem}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e202e]">
              <Link
                to={`/admin/seats?hallId=${h.id}`}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold bg-[#1a1c2a] text-emerald-400 hover:bg-[#25283c] border border-emerald-900/30 transition-colors"
              >
                <Armchair className="w-3.5 h-3.5" />
                <span>Configure Physical Seats</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141522] border border-[#26283d] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#222435]">
              <h2 className="text-xl font-black text-white">
                {editingHall ? 'Edit Auditorium' : 'Create Auditorium'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Auditorium Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hall 1 - Laser Screen"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Cinema Venue *</label>
                <select
                  required
                  value={cinemaId}
                  onChange={(e) => setCinemaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  {cinemas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Screen Type</label>
                <input
                  type="text"
                  value={screenType}
                  onChange={(e) => setScreenType(e.target.value)}
                  placeholder="4K Laser Ultra HD, IMAX, 3D"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Sound System</label>
                <input
                  type="text"
                  value={soundSystem}
                  onChange={(e) => setSoundSystem(e.target.value)}
                  placeholder="Dolby Atmos 7.1, DTS:X"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Total Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={totalRows}
                    onChange={(e) => setTotalRows(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Seats Per Row</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={seatsPerRow}
                    onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400 bg-[#191a28] p-3 rounded-xl">
                Calculated Total Capacity: <strong className="text-white">{Number(totalRows) * Number(seatsPerRow)} Seats</strong>
              </div>

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
                  {submitting ? 'Saving...' : 'Save Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
