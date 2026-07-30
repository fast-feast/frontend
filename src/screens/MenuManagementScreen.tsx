import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Check, RefreshCw,
  UtensilsCrossed, Leaf, AlertTriangle, Clock, Save,
} from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { getMenuByCanteen, createMenuItem, updateMenuItem, deleteMenuItem } from '@/services/menu';
import { extractErrorMessage } from '@/services/api';
import { LoadingAnimation, SpinnerLoader } from '@/components/ui/loading-animation';
import type { MenuItemDTO } from '@/services/menu';

type MenuForm = {
  name: string;
  category: string;
  description: string;
  price: number;
  prepTime: string;
  image: string;
  isVeg: boolean;
  inStock: boolean;
  isTrending: boolean;
  isFast: boolean;
  sortOrder: number;
};

const emptyForm: MenuForm = {
  name: '',
  category: '',
  description: '',
  price: 0,
  prepTime: '',
  image: '',
  isVeg: true,
  inStock: true,
  isTrending: false,
  isFast: false,
  sortOrder: 0,
};

const defaultCategories = ['Meals', 'Snacks', 'Beverages', 'Desserts', 'Combos'];

export default function MenuManagementScreen() {
  const { state, showToast } = useApp();
  const navigate = useNavigate();
  const { canteen, canteenId } = state;

  const [items, setItems] = useState<MenuItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItemDTO | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    if (!canteenId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMenuByCanteen(canteenId);
      setItems(res.data.items);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canteenId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // ─── Group items by category ──────────────────────────
  const grouped: Record<string, MenuItemDTO[]> = {};
  for (const item of items) {
    const cat = item.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  // ─── Form handlers ─────────────────────────────────────
  const openAddForm = () => {
    setForm(emptyForm);
    setEditingItem(null);
    setShowForm(true);
  };

  const openEditForm = (item: MenuItemDTO) => {
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      prepTime: item.prepTime,
      image: item.image,
      isVeg: item.isVeg,
      inStock: item.inStock,
      isTrending: item.isTrending || false,
      isFast: item.isFast || false,
      sortOrder: item.sortOrder || 0,
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim() || form.price <= 0) {
      showToast('Name, category, and price are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        canteenId: canteenId!,
        image: form.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
      };
      if (editingItem) {
        await updateMenuItem(editingItem._id, payload);
        showToast(`${form.name} updated`);
      } else {
        await createMenuItem(payload);
        showToast(`${form.name} added to menu`);
      }
      setShowForm(false);
      setEditingItem(null);
      await fetchMenu();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMenuItem(deleteTarget._id);
      showToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      await fetchMenu();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleToggleStock = async (item: MenuItemDTO) => {
    try {
      await updateMenuItem(item._id, { inStock: !item.inStock });
      showToast(`${item.name} ${item.inStock ? 'out of stock' : 'back in stock'}`);
      await fetchMenu();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  // ─── Loading State ─────────────────────────────────────
  if (loading && items.length === 0) {
    return (
      <LoadingAnimation
        variant="fullscreen"
        message="Loading menu..."
      />
    );
  }

  // ─── Error State ───────────────────────────────────────
  if (error && items.length === 0) {
    return (
      <div className="screen-surface h-full flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <p className="text-sm text-[#A0A0A0] text-center mb-4">{error}</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={fetchMenu}
          className="px-6 h-11 rounded-full food-gradient text-white font-semibold text-sm flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Retry
        </motion.button>
      </div>
    );
  }

  return (
    <div className="screen-surface h-full flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 pb-3 sticky top-0 z-20 bg-[#0A0508]/90 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/canteen/dashboard', { replace: true })}
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">Manage Menu</h1>
            <p className="text-[10px] text-[#6B6B6B]">{canteen?.name || ''} • {items.length} items</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={openAddForm}
          className="w-9 h-9 rounded-full food-gradient flex items-center justify-center shadow-glow-orange"
        >
          <Plus size={18} className="text-white" />
        </motion.button>
      </div>

      {/* Menu List */}
      <div className="px-4 md:px-6 lg:px-8 pb-6 space-y-4">
        {/* Loading overlay for subsequent fetches */}
        {loading && items.length > 0 && (
          <div className="flex items-center justify-center py-3">
            <LoadingAnimation variant="dots" size="sm" />
            <span className="text-xs text-[#6B6B6B] ml-2">Refreshing...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UtensilsCrossed size={40} className="text-[#6B6B6B] mb-4" />
            <p className="text-sm text-[#A0A0A0]">Menu is empty</p>
            <p className="text-[10px] text-[#6B6B6B] mt-1">Add your first menu item to get started.</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openAddForm}
              className="mt-4 px-6 h-11 rounded-full food-gradient text-white font-semibold text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Add Item
            </motion.button>
          </div>
        )}

        {/* Grouped Items */}
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              {category}
              <span className="text-[10px] text-[#6B6B6B] font-normal">({categoryItems.length})</span>
            </h3>
            <div className="flex flex-col gap-2">
              {categoryItems.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-2xl p-3 flex items-center gap-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-sm font-semibold truncate ${item.inStock ? 'text-white' : 'text-[#6B6B6B] line-through'}`}>
                        {item.name}
                      </h4>
                      <Leaf size={10} className={item.isVeg ? 'text-green-500 flex-shrink-0' : 'text-red-500 flex-shrink-0'} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-[#FF6B35]">₹{item.price}</span>
                      <span className="text-[9px] text-[#6B6B6B] flex items-center gap-0.5">
                        <Clock size={9} /> {item.prepTime}
                      </span>
                    </div>
                    {item.isTrending && <span className="text-[8px] text-amber-400 font-medium">Trending</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Quick toggle stock */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleToggleStock(item)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        item.inStock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                      title={item.inStock ? 'Mark out of stock' : 'Mark in stock'}
                    >
                      {item.inStock ? <Check size={12} /> : <X size={12} />}
                    </motion.button>
                    {/* Edit */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => openEditForm(item)}
                      className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center"
                    >
                      <Pencil size={11} />
                    </motion.button>
                    {/* Delete */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setDeleteTarget(item)}
                      className="w-7 h-7 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center"
                    >
                      <Trash2 size={11} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Add/Edit Form Modal ─────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto no-scrollbar rounded-t-2xl md:rounded-2xl bg-[#0A0508] border border-white/[0.08] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  {editingItem ? 'Edit Item' : 'Add Item'}
                </h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full bg-card flex items-center justify-center"
                >
                  <X size={16} className="text-[#6B6B6B]" />
                </motion.button>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <label className="block">
                  <span className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide">Name *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Cheese Burger"
                    className="mt-1 w-full h-11 rounded-xl bg-card border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all"
                  />
                </label>

                {/* Category + Price row */}
                <div className="flex gap-3">
                  <label className="flex-1 block">
                    <span className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide">Category *</span>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="mt-1 w-full h-11 rounded-xl bg-card border border-white/[0.08] px-3 text-sm text-white outline-none focus:border-[#FF6B35]/50 transition-all appearance-none"
                    >
                      <option value="" disabled>Select</option>
                      {defaultCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </label>
                  <label className="w-28 block">
                    <span className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide">Price *</span>
                    <input
                      type="number"
                      min={0}
                      value={form.price || ''}
                      onChange={e => setForm({ ...form, price: Math.max(0, parseInt(e.target.value) || 0) })}
                      placeholder="₹"
                      className="mt-1 w-full h-11 rounded-xl bg-card border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all"
                    />
                  </label>
                </div>

                {/* Description */}
                <label className="block">
                  <span className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide">Description</span>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe this item..."
                    rows={2}
                    className="mt-1 w-full rounded-xl bg-card border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all resize-none"
                  />
                </label>

                {/* Prep time + Image */}
                <label className="block">
                  <span className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide">Prep Time</span>
                  <input
                    type="text"
                    value={form.prepTime}
                    onChange={e => setForm({ ...form, prepTime: e.target.value })}
                    placeholder="e.g. 10 min"
                    className="mt-1 w-full h-11 rounded-xl bg-card border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide">Image URL</span>
                  <input
                    type="url"
                    value={form.image}
                    onChange={e => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full h-11 rounded-xl bg-card border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all"
                  />
                </label>

                {/* Toggles row */}
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isVeg}
                      onChange={e => setForm({ ...form, isVeg: e.target.checked })}
                      className="w-4 h-4 rounded border-[#6B6B6B] bg-card text-green-500 focus:ring-green-500/50"
                    />
                    <span className="text-xs text-white">Veg</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isTrending}
                      onChange={e => setForm({ ...form, isTrending: e.target.checked })}
                      className="w-4 h-4 rounded border-[#6B6B6B] bg-card text-amber-500 focus:ring-amber-500/50"
                    />
                    <span className="text-xs text-white">Trending</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFast}
                      onChange={e => setForm({ ...form, isFast: e.target.checked })}
                      className="w-4 h-4 rounded border-[#6B6B6B] bg-card text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="text-xs text-white">Fast Prep</span>
                  </label>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowForm(false)}
                    className="flex-1 h-12 rounded-xl bg-card text-[#A0A0A0] font-medium text-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 h-12 rounded-xl food-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {saving ? (
                      <SpinnerLoader size="sm" />
                    ) : (
                      <><Save size={16} /> {editingItem ? 'Update' : 'Add'}</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation Dialog ──────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[320px] bg-card rounded-2xl p-5 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Delete {deleteTarget.name}?</h3>
              <p className="text-xs text-[#6B6B6B] mb-4">This action cannot be undone.</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 h-11 rounded-xl bg-card text-[#A0A0A0] font-medium text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDelete}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white font-semibold text-sm"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
