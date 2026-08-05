import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, X, Save, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import {
  getAllCanteens, createCanteen, updateCanteen, deleteCanteen, type CanteenDTO,
} from '@/services/canteens';
import { getAllUsers, createOwnerUser, type UserDTO } from '@/services/users';
import { extractErrorMessage } from '@/services/api';
import { AdminBackButton } from '@/components/AdminLayout';

const PAGE_SIZE = 10;

type CanteenForm = {
  name: string;
  description: string;
  contactPhone: string;
  address: string;
  openingHours: string;
  avgWaitTime: string;
  rushLevel: 'low' | 'medium' | 'high';
  bannerImage: string;
  logoImage: string;
  tags: string;
  categories: string;
};

const EMPTY_FORM: CanteenForm = {
  name: '',
  description: '',
  contactPhone: '',
  address: '',
  openingHours: '',
  avgWaitTime: '',
  rushLevel: 'low',
  bannerImage: '',
  logoImage: '',
  tags: '',
  categories: '',
};

function toForm(c: CanteenDTO): CanteenForm {
  return {
    name: c.name || '',
    description: c.description || '',
    contactPhone: c.contactPhone || '',
    address: c.address || '',
    openingHours: c.openingHours || '',
    avgWaitTime: c.avgWaitTime || '',
    rushLevel: c.rushLevel || 'low',
    bannerImage: c.bannerImage || '',
    logoImage: c.logoImage || '',
    tags: (c.tags || []).join(', '),
    categories: (c.categories || []).filter(x => x !== 'All').join(', '),
  };
}

const RUSH_STYLES: Record<string, string> = {
  low: 'bg-green-500/15 text-green-400',
  medium: 'bg-amber-500/15 text-amber-400',
  high: 'bg-red-500/15 text-red-400',
};

export default function AdminCanteensScreen() {
  const { showToast } = useApp();
  const [canteens, setCanteens] = useState<CanteenDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CanteenForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Owner assignment state
  const [ownerMode, setOwnerMode] = useState<'create' | 'existing' | 'skip'>('create');
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [userList, setUserList] = useState<UserDTO[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

  const editingCanteen = canteens.find(c => c._id === editingId) ?? null;
  const canteenHasOwner = !!editingCanteen?.ownerId;

  const filteredUsers = userList.filter(u => {
    const q = ownerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const loadUsers = useCallback(async () => {
    if (usersFetched) return;
    setUsersLoading(true);
    try {
      const res = await getAllUsers({ limit: '50' });
      // Admins can never be canteen owners — hide them from the picker.
      setUserList(res.data.filter(u => u.role !== 'admin'));
      setUsersFetched(true);
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setUsersLoading(false);
    }
  }, [usersFetched]);

  // Deactivate confirm state
  const [deleteTarget, setDeleteTarget] = useState<CanteenDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCanteens = useCallback(async (pageNum: number, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllCanteens({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
        ...(query ? { search: query } : {}),
      });
      setCanteens(res.data);
      setTotal(res.meta?.total ?? 0);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err) {
      setError(extractErrorMessage(err));
      setCanteens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void fetchCanteens(page, search), 0);
    return () => window.clearTimeout(t);
  }, [fetchCanteens, page, search]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const resetOwnerState = () => {
    setOwnerForm({ name: '', email: '', phone: '', password: '' });
    setOwnerSearch('');
    setSelectedUser(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOwnerMode('create');
    resetOwnerState();
    setFormOpen(true);
  };

  const openEdit = (c: CanteenDTO) => {
    setEditingId(c._id);
    setForm(toForm(c));
    setFormError(null);
    setOwnerMode(c.ownerId ? 'skip' : 'create');
    resetOwnerState();
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Canteen name is required'); return; }
    if (!form.bannerImage.trim()) { setFormError('Banner image URL is required'); return; }

    // ── Owner validation ──
    if (ownerMode === 'create') {
      if (!ownerForm.name.trim()) { setFormError('Owner name is required'); return; }
      if (!/^\S+@\S+\.\S+$/.test(ownerForm.email.trim())) { setFormError('Enter a valid owner email'); return; }
      if (!/^(\+91)?[6-9]\d{9}$/.test(ownerForm.phone.trim())) { setFormError('Enter a valid 10-digit Indian mobile number'); return; }
      if (ownerForm.password.length < 6) { setFormError('Owner password must be at least 6 characters'); return; }
    }
    if (ownerMode === 'existing' && !selectedUser) {
      setFormError('Select a user to assign as owner');
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      address: form.address.trim() || undefined,
      openingHours: form.openingHours.trim() || undefined,
      avgWaitTime: form.avgWaitTime.trim() || undefined,
      rushLevel: form.rushLevel,
      bannerImage: form.bannerImage.trim(),
      logoImage: form.logoImage.trim() || undefined,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      categories: ['All', ...form.categories.split(',').map(c => c.trim()).filter(Boolean)],
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        // Save the canteen fields first; a failed owner step must not lose them.
        await updateCanteen(editingId, payload);
        if (ownerMode === 'create') {
          const owner = await createOwnerUser({
            name: ownerForm.name.trim(),
            email: ownerForm.email.trim(),
            phone: ownerForm.phone.trim(),
            password: ownerForm.password,
          });
          await updateCanteen(editingId, { ownerEmail: owner.data.email });
        } else if (ownerMode === 'existing' && selectedUser) {
          await updateCanteen(editingId, { ownerEmail: selectedUser.email });
        }
        showToast('Canteen updated successfully');
      } else {
        // For an existing user the account already exists, so it can be linked
        // directly at creation. For a brand-new owner, create the canteen first
        // (without owner), then the account, then link — so a failure never
        // leaves an orphaned owner account with no canteen.
        if (ownerMode === 'existing' && selectedUser) {
          payload.ownerEmail = selectedUser.email;
        }
        const created = await createCanteen(payload);
        if (ownerMode === 'create') {
          const owner = await createOwnerUser({
            name: ownerForm.name.trim(),
            email: ownerForm.email.trim(),
            phone: ownerForm.phone.trim(),
            password: ownerForm.password,
          });
          await updateCanteen(created.data._id, { ownerEmail: owner.data.email });
        }
        showToast('Canteen created successfully');
      }
      setFormOpen(false);
      // setPage(1) triggers the effect fetch; only fetch explicitly when already on page 1.
      if (page === 1) {
        await fetchCanteens(1, search);
      } else {
        setPage(1);
      }
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCanteen(deleteTarget._id);
      showToast('Canteen deactivated');
      setDeleteTarget(null);
      // If we deactivated the last canteen on the last page, move back a page.
      if (canteens.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchCanteens(page, search);
      }
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const fieldClass = "mt-1 w-full h-11 rounded-xl bg-card border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all";
  const labelClass = "text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <AdminBackButton />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Canteens</h1>
            <p className="text-[10px] md:text-xs text-[#6B6B6B]">{total} active canteens</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCanteens(page, search)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-elevated transition-colors"
            aria-label="Refresh canteens"
          >
            <RefreshCw size={18} className="text-[#A0A0A0]" />
          </button>
          <button
            onClick={openCreate}
            className="h-10 px-4 rounded-full food-gradient text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus size={15} /> New Canteen
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="px-4 md:px-6 lg:px-8 pb-3">
        <div className="flex h-11 rounded-xl bg-card border border-white/[0.08] items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 transition-all">
          <Search size={16} className="text-[#6B6B6B] flex-shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search canteens..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-[#6B6B6B]"
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 lg:px-8 pb-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin" />
            <p className="text-xs text-[#6B6B6B] mt-3">Loading canteens...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle size={28} className="text-red-400 mb-3" />
            <p className="text-sm text-[#A0A0A0] text-center mb-4">{error}</p>
            <button
              onClick={() => fetchCanteens(page, search)}
              className="px-6 h-11 rounded-full food-gradient text-white font-semibold text-sm flex items-center gap-2"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && canteens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Store size={32} className="text-[#6B6B6B] mb-3" />
            <p className="text-sm text-[#A0A0A0]">No canteens found{search ? ' for your search' : ''}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && canteens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Canteen</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Rating</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Rush</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Wait</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Categories</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {canteens.map((c) => (
                    <tr key={c._id} className="hover:bg-card-highlight transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{c.name}</p>
                        <p className="text-[11px] text-[#6B6B6B] truncate max-w-[200px]">{c.description || (c.tags || []).join(' • ') || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#A0A0A0]">
                        ⭐ {c.rating ?? '—'} <span className="text-[10px] text-[#6B6B6B]">({c.ratingCount ?? 0})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${RUSH_STYLES[c.rushLevel] || RUSH_STYLES.low}`}>
                          {c.rushLevel || 'low'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#A0A0A0]">{c.avgWaitTime || '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#A0A0A0] truncate max-w-[160px]">
                        {(c.categories || []).filter(x => x !== 'All').join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(c)}
                            className="w-8 h-8 rounded-lg bg-card-elevated flex items-center justify-center text-[#A0A0A0] hover:text-white hover:bg-card-highlight transition-colors"
                            aria-label={`Edit ${c.name}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="w-8 h-8 rounded-lg bg-card-elevated flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label={`Deactivate ${c.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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

      {/* Create / Edit Modal */}
      {formOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
          onClick={() => !saving && setFormOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="w-full md:max-w-[560px] max-h-[88dvh] overflow-y-auto no-scrollbar bg-card rounded-t-2xl md:rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Canteen' : 'New Canteen'}
              </h3>
              <button
                onClick={() => !saving && setFormOpen(false)}
                className="w-8 h-8 rounded-full bg-card-elevated flex items-center justify-center text-[#A0A0A0]"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{formError}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block">
                <span className={labelClass}>Canteen Name *</span>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Canteen" className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Description</span>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Describe your canteen..." className="mt-1 w-full rounded-xl bg-card border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all resize-none" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>Avg. Wait Time</span>
                  <input type="text" value={form.avgWaitTime} onChange={e => setForm({ ...form, avgWaitTime: e.target.value })} placeholder="e.g. 5 min" className={fieldClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Rush Level</span>
                  <select value={form.rushLevel} onChange={e => setForm({ ...form, rushLevel: e.target.value as CanteenForm['rushLevel'] })} className={`${fieldClass} appearance-none`}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Contact Phone</span>
                <input type="tel" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} placeholder="e.g. +91 90000 00001" className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Address</span>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. Building 5, Campus Area" className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Opening Hours</span>
                <input type="text" value={form.openingHours} onChange={e => setForm({ ...form, openingHours: e.target.value })} placeholder="e.g. 8 AM - 8 PM" className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Banner Image URL *</span>
                <input type="url" value={form.bannerImage} onChange={e => setForm({ ...form, bannerImage: e.target.value })} placeholder="https://..." className={fieldClass} />
              </label>
              {form.bannerImage && (
                <div className="h-24 rounded-xl overflow-hidden bg-card-elevated">
                  <img src={form.bannerImage} alt="Banner preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <label className="block">
                <span className={labelClass}>Logo Image URL</span>
                <input type="url" value={form.logoImage} onChange={e => setForm({ ...form, logoImage: e.target.value })} placeholder="https://..." className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Tags (comma-separated)</span>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. Fast, Popular, Veg" className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Menu Categories (comma-separated)</span>
                <input type="text" value={form.categories} onChange={e => setForm({ ...form, categories: e.target.value })} placeholder="e.g. Beverages, Snacks, Meals" className={fieldClass} />
              </label>

              {/* Owner Assignment */}
              <div className="bg-card-elevated/50 rounded-xl p-3 space-y-3">
                <div>
                  <span className={labelClass}>Canteen Owner</span>
                  <div className="mt-2 flex bg-card rounded-lg p-1">
                    {(['create', 'existing', 'skip'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setOwnerMode(mode);
                          if (mode === 'existing') void loadUsers();
                        }}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                          ownerMode === mode ? 'food-gradient text-white' : 'text-[#6B6B6B]'
                        }`}
                      >
                        {mode === 'create' ? 'Create New Owner' : mode === 'existing' ? 'Assign Existing User' : 'Skip'}
                      </button>
                    ))}
                  </div>
                </div>

                {editingId && (
                  <p className="text-[10px] text-[#6B6B6B]">
                    {canteenHasOwner
                      ? 'This canteen already has an owner. Choosing an option below will reassign it.'
                      : 'This canteen has no owner yet.'}
                  </p>
                )}

                {ownerMode === 'create' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block col-span-2">
                      <span className={labelClass}>Owner Name *</span>
                      <input type="text" value={ownerForm.name} onChange={e => setOwnerForm({ ...ownerForm, name: e.target.value })} placeholder="e.g. Rajesh Kumar" className={fieldClass} />
                    </label>
                    <label className="block col-span-2">
                      <span className={labelClass}>Owner Email *</span>
                      <input type="email" value={ownerForm.email} onChange={e => setOwnerForm({ ...ownerForm, email: e.target.value })} placeholder="owner@fastfeast.app" className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Mobile *</span>
                      <input type="tel" value={ownerForm.phone} onChange={e => setOwnerForm({ ...ownerForm, phone: e.target.value })} placeholder="+91 90000 00000" className={fieldClass} />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Password *</span>
                      <input type="password" value={ownerForm.password} onChange={e => setOwnerForm({ ...ownerForm, password: e.target.value })} placeholder="Min 6 characters" className={fieldClass} />
                    </label>
                    <p className="col-span-2 text-[9px] text-[#6B6B6B]">
                      The owner can sign in immediately at /canteen/login with these credentials.
                    </p>
                  </div>
                )}

                {ownerMode === 'existing' && (
                  <div className="space-y-2">
                    <div className="flex h-10 rounded-xl bg-card border border-white/[0.08] items-center gap-2.5 px-3 focus-within:border-[#FF6B35]/50 transition-all">
                      <Search size={14} className="text-[#6B6B6B] flex-shrink-0" />
                      <input
                        type="text"
                        value={ownerSearch}
                        onChange={e => setOwnerSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="flex-1 min-w-0 bg-transparent outline-none text-xs text-white placeholder:text-[#6B6B6B]"
                      />
                    </div>
                    {selectedUser && (
                      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{selectedUser.name}</p>
                          <p className="text-[10px] text-[#6B6B6B] truncate">{selectedUser.email}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedUser(null)} className="text-[#6B6B6B] hover:text-white px-1 flex-shrink-0" aria-label="Clear selection">
                          <X size={13} />
                        </button>
                      </div>
                    )}
                    <div className="max-h-44 overflow-y-auto no-scrollbar space-y-1">
                      {usersLoading && <p className="text-[10px] text-[#6B6B6B] px-1 py-2">Loading users...</p>}
                      {!usersLoading && !selectedUser && filteredUsers.length === 0 && (
                        <p className="text-[10px] text-[#6B6B6B] px-1 py-2">No matching users. Try "Create New Owner" instead.</p>
                      )}
                      {!selectedUser && filteredUsers.map(u => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="w-full flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2 hover:bg-card-highlight transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-[#6B6B6B] truncate">{u.email}</p>
                          </div>
                          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                            u.role === 'canteen_owner' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                          }`}>
                            {u.role === 'canteen_owner' ? 'Owner' : 'Student'}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-[#6B6B6B]">
                      Assigning a student promotes them to canteen_owner automatically.
                    </p>
                  </div>
                )}

                {ownerMode === 'skip' && (
                  <p className="text-[10px] text-[#6B6B6B]">
                    {editingId
                      ? 'Owner will remain unchanged.'
                      : 'No owner will be linked. The canteen cannot be managed until an owner is assigned later.'}
                  </p>
                )}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="mt-5 w-full h-12 rounded-xl food-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <><Save size={16} /> {editingId ? 'Save Changes' : 'Create Canteen'}</>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Deactivate Confirm */}
      {deleteTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[340px] bg-card rounded-2xl p-5 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Deactivate {deleteTarget.name}?</h3>
            <p className="text-xs text-[#6B6B6B] mb-4">
              The canteen will be hidden from the app and stop accepting orders.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-card text-[#A0A0A0] font-medium text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting && <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                Deactivate
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
