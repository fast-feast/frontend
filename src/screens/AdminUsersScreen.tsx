import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, ChevronLeft, ChevronRight, Eye, X, RefreshCw, Mail, Phone, Wallet, AlertTriangle,
} from 'lucide-react';
import { getAllUsers, type UserDTO } from '@/services/users';
import { extractErrorMessage } from '@/services/api';
import { AdminBackButton } from '@/components/AdminLayout';

const PAGE_SIZE = 10;

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-[#FF6B35]/15 text-[#FF6B35]',
  canteen_owner: 'bg-purple-500/15 text-purple-300',
  user: 'bg-white/10 text-[#A0A0A0]',
};

function roleLabel(role: string): string {
  if (role === 'canteen_owner') return 'Owner';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<UserDTO | null>(null);

  const fetchUsers = useCallback(async (pageNum: number, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllUsers({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
        ...(query ? { search: query } : {}),
      });
      setUsers(res.data);
      setTotal(res.meta?.total ?? 0);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err) {
      setError(extractErrorMessage(err));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void fetchUsers(page, search), 0);
    return () => window.clearTimeout(t);
  }, [fetchUsers, page, search]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <AdminBackButton />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Users</h1>
            <p className="text-[10px] md:text-xs text-[#6B6B6B]">{total} registered accounts</p>
          </div>
        </div>
        <button
          onClick={() => fetchUsers(page, search)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-elevated transition-colors"
          aria-label="Refresh users"
        >
          <RefreshCw size={18} className="text-[#A0A0A0]" />
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="px-4 md:px-6 lg:px-8 pb-3">
        <div className="flex h-11 rounded-xl bg-card border border-white/[0.08] items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 transition-all">
          <Search size={16} className="text-[#6B6B6B] flex-shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-[#6B6B6B]"
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 lg:px-8 pb-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin" />
            <p className="text-xs text-[#6B6B6B] mt-3">Loading users...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle size={28} className="text-red-400 mb-3" />
            <p className="text-sm text-[#A0A0A0] text-center mb-4">{error}</p>
            <button
              onClick={() => fetchUsers(page, search)}
              className="px-6 h-11 rounded-full food-gradient text-white font-semibold text-sm flex items-center gap-2"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={32} className="text-[#6B6B6B] mb-3" />
            <p className="text-sm text-[#A0A0A0]">No users found{search ? ' for your search' : ''}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && users.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Name</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Role</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Phone</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Wallet</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Orders</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Joined</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-card-highlight transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{u.name}</p>
                        <p className="text-[11px] text-[#6B6B6B] truncate max-w-[200px]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_STYLES[u.role] || ROLE_STYLES.user}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#A0A0A0]">{u.phone}</td>
                      <td className="px-4 py-3 text-sm text-[#A0A0A0]">₹{u.walletBalance ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-[#A0A0A0]">{u.totalOrders ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-[#6B6B6B] whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-elevated text-[10px] font-medium text-[#A0A0A0] hover:text-white hover:bg-card-highlight transition-colors"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[#6B6B6B]">
              Page {page} of {totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-[#A0A0A0] disabled:opacity-40 hover:bg-card-elevated transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-[#A0A0A0] disabled:opacity-40 hover:bg-card-elevated transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[380px] bg-card rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">User Details</h3>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-card-elevated flex items-center justify-center text-[#A0A0A0]"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full food-gradient p-[2px]">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <span className="text-base font-bold text-white">
                    {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{selected.name}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_STYLES[selected.role] || ROLE_STYLES.user}`}>
                  {roleLabel(selected.role)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={15} className="text-[#6B6B6B] flex-shrink-0" />
                <p className="text-xs text-[#A0A0A0] break-all">{selected.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={15} className="text-[#6B6B6B] flex-shrink-0" />
                <p className="text-xs text-[#A0A0A0]">{selected.phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <Wallet size={15} className="text-[#6B6B6B] flex-shrink-0" />
                <p className="text-xs text-[#A0A0A0]">₹{selected.walletBalance ?? 0} wallet balance</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="bg-card-elevated rounded-xl p-3 text-center">
                <p className="text-base font-bold text-white">{selected.totalOrders ?? 0}</p>
                <p className="text-[9px] text-[#6B6B6B] mt-0.5">Orders</p>
              </div>
              <div className="bg-card-elevated rounded-xl p-3 text-center">
                <p className="text-base font-bold text-white">{selected.streakDays ?? 0}</p>
                <p className="text-[9px] text-[#6B6B6B] mt-0.5">Streak</p>
              </div>
              <div className="bg-card-elevated rounded-xl p-3 text-center">
                <p className="text-base font-bold text-[#FF6B35]">₹{selected.totalSaved ?? 0}</p>
                <p className="text-[9px] text-[#6B6B6B] mt-0.5">Saved</p>
              </div>
            </div>

            <p className="text-[10px] text-[#6B6B6B] mt-4 text-center">
              Joined {formatDate(selected.createdAt)}
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
