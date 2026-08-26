import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, updateUserRole } from '../../services/auth';

export const AdminUsers: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load user accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = async (userId: string, currentRole: UserRole, userEmail: string) => {
    const nextRole: UserRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (
      userId === currentUser?.uid &&
      !window.confirm('You are about to change your own account role. Are you sure?')
    ) {
      return;
    }

    try {
      await updateUserRole(userId, nextRole);
      setMessage({
        type: 'success',
        text: `Role for ${userEmail || userId} changed to ${nextRole}.`,
      });
      await fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change user role.' });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

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
          <h1 className="text-3xl font-black text-white">User Accounts & Roles</h1>
          <p className="text-xs text-gray-400">
            View registered cinema members and assign administrative authority privileges.
          </p>
        </div>

        <span className="text-xs font-bold text-gray-400 bg-[#141522] px-4 py-2 rounded-xl border border-[#26283d]">
          Total Registered Users: <strong className="text-white">{users.length}</strong>
        </span>
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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search user by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12131d] border border-[#232535] text-white text-xs focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#12131d] border border-[#232535] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#171926] text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#232535]">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Email & Phone</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined Date</th>
                <th className="px-5 py-3 text-right">Role Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e202e]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    Loading user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-[#181a27]">
                    <td className="px-5 py-3 font-bold text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-black text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span>{u.name || 'Member'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        <span className="text-gray-200 block">{u.email}</span>
                        {u.phone && <span className="text-gray-400 text-[11px] block">{u.phone}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-[#1b1c2b] text-gray-300 border border-[#2b2d42]'
                        }`}
                      >
                        {u.role || 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleChangeRole(u.uid, u.role || 'CUSTOMER', u.email)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.role === 'ADMIN'
                            ? 'bg-[#1a1c2a] text-gray-300 hover:text-white hover:bg-[#25283c] border border-[#2a2d40]'
                            : 'bg-red-950/40 text-red-400 hover:bg-red-900/50 border border-red-900/60'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'Demote to Customer' : 'Make Administrator'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
