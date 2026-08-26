import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { Cinema } from '../../types';
import {
  getCinemas,
  createCinema,
  updateCinema,
  deleteCinema,
} from '../../services/cinemas';

export const AdminCinemas: React.FC = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCinemas = async () => {
    setLoading(true);
    try {
      const list = await getCinemas();
      setCinemas(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  const openCreateModal = () => {
    setEditingCinema(null);
    setName('');
    setLocation('Addis Ababa, Bole');
    setDescription('Modern multiplex with luxury recliner seating and Dolby Atmos.');
    setAddress('Cameroon St, Next to Edna Mall, Addis Ababa');
    setPhone('+251 11 661 2233');
    setImageUrl('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80');
    setAmenitiesInput('VIP Lounge, 4K Laser, Dolby Atmos, Gourmet Bar');
    setModalOpen(true);
  };

  const openEditModal = (c: Cinema) => {
    setEditingCinema(c);
    setName(c.name);
    setLocation(c.location || '');
    setDescription(c.description || '');
    setAddress(c.address || '');
    setPhone(c.phone || '');
    setImageUrl(c.imageUrl || '');
    setAmenitiesInput(c.amenities?.join(', ') || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) {
      setMessage({ type: 'error', text: 'Name and Location are required.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const amenities = amenitiesInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      if (editingCinema) {
        await updateCinema(editingCinema.id, {
          name,
          location,
          description,
          address,
          phone,
          imageUrl,
          amenities,
        });
        setMessage({ type: 'success', text: `Updated "${name}" successfully.` });
      } else {
        await createCinema({
          name,
          location,
          description,
          address,
          phone,
          imageUrl,
          amenities,
        });
        setMessage({ type: 'success', text: `Created cinema "${name}".` });
      }
      setModalOpen(false);
      await fetchCinemas();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save cinema.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, cinemaName: string) => {
    if (!window.confirm(`Delete "${cinemaName}" and its configurations?`)) return;
    try {
      await deleteCinema(id);
      setMessage({ type: 'success', text: `Cinema "${cinemaName}" deleted.` });
      await fetchCinemas();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete cinema.' });
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
          <h1 className="text-3xl font-black text-white">Manage Cinemas & Venues</h1>
          <p className="text-xs text-gray-400">
            Configure multiplex branches, VIP locations, addresses, and concession amenities.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="admin-add-cinema-btn"
          className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#e50914] text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-950/60"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Cinema</span>
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cinemas.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-2xl bg-[#12131d] border border-[#232535] space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-red-400 block mb-0.5">{c.location}</span>
                  <h3 className="text-xl font-bold text-white">{c.name}</h3>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-2 rounded-lg bg-[#1a1c2a] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-2 rounded-lg bg-[#1a1c2a] text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {c.imageUrl && (
                <div className="h-40 rounded-xl overflow-hidden bg-[#181926]">
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="text-xs text-gray-300 leading-relaxed">{c.description}</p>

              <div className="space-y-1 text-xs text-gray-400 pt-2 border-t border-[#1e202e]">
                {c.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{c.address}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1e202e] text-xs">
              <Link
                to={`/admin/halls?cinemaId=${c.id}`}
                className="text-red-400 hover:text-red-300 font-bold"
              >
                Manage Halls in this Cinema →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141522] border border-[#26283d] rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#222435]">
              <h2 className="text-xl font-black text-white">
                {editingCinema ? 'Edit Cinema' : 'Add New Cinema Branch'}
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
                <label className="text-xs font-bold text-gray-300">Cinema Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kali Cinema - Bole Central"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">City / District Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Addis Ababa, Bole"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of this cinema complex..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Mall name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 11 661 2233"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Photo URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="4K Laser, Dolby Atmos, VIP Lounge, Parking"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1c2a] border border-[#2b2d42] text-white text-xs focus:outline-none focus:border-red-500"
                />
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
                  {submitting ? 'Saving...' : 'Save Cinema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
