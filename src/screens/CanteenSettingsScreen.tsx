import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
<<<<<<< HEAD
  ArrowLeft, Save, Store, Phone, Clock, Image,
  Tags, AlertTriangle,
=======
  ArrowLeft, Save, Store, Phone, Clock, Image, Tags, AlertTriangle,
>>>>>>> 194fc05 (updated canteen)
} from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { updateCanteen } from '@/services/canteens';
import { extractErrorMessage } from '@/services/api';

type FormFields = {
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

export default function CanteenSettingsScreen() {
  const { state, showToast } = useApp();
  const { canteen, canteenId } = state;
  const navigate = useNavigate();

  const cRecord = canteen as unknown as Record<string, unknown>;

  const [form, setForm] = useState<FormFields>({
    name: canteen?.name || '',
<<<<<<< HEAD
    description: (cRecord?.description as string) || '',
    contactPhone: (cRecord?.contactPhone as string) || '',
    address: (cRecord?.address as string) || '',
    openingHours: (cRecord?.openingHours as string) || '',
    avgWaitTime: canteen?.avgWaitTime || '',
    rushLevel: canteen?.rushLevel || 'low',
    bannerImage: canteen?.bannerImage || '',
    logoImage: (cRecord?.logoImage as string) || '',
=======
    description: canteen?.description || '',
    contactPhone: canteen?.contactPhone || '',
    address: canteen?.address || '',
    openingHours: canteen?.openingHours || '',
    avgWaitTime: canteen?.avgWaitTime || '',
    rushLevel: canteen?.rushLevel || 'low',
    bannerImage: canteen?.bannerImage || '',
    logoImage: canteen?.logoImage || '',
>>>>>>> 194fc05 (updated canteen)
    tags: (canteen?.tags || []).join(', '),
    categories: (canteen?.categories || []).filter(c => c !== 'All').join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof FormFields, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!canteenId) return;
    if (!form.name.trim()) {
      setError('Canteen name is required');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        address: form.address.trim() || undefined,
        openingHours: form.openingHours.trim() || undefined,
        avgWaitTime: form.avgWaitTime.trim() || undefined,
        rushLevel: form.rushLevel,
        bannerImage: form.bannerImage.trim() || undefined,
        logoImage: form.logoImage.trim() || undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        categories: ['All', ...form.categories.split(',').map(c => c.trim()).filter(Boolean)],
      };
      await updateCanteen(canteenId, payload);
      setSuccess(true);
      showToast('Settings saved successfully');
    } catch (err) {
      setError(extractErrorMessage(err));
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "mt-1 w-full h-11 rounded-xl bg-card border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all";
  const labelClass = "text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide";
  const sectionClass = "bg-card rounded-2xl p-4 space-y-3";

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
            <h1 className="text-lg md:text-xl font-bold text-white">Canteen Settings</h1>
            <p className="text-[10px] text-[#6B6B6B]">{canteen?.name || ''}</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-4 rounded-full food-gradient text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-70"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <><Save size={14} /> Save</>
          )}
        </motion.button>
      </div>

      <div className="px-4 md:px-6 lg:px-8 pb-8 space-y-4">
        {/* Success banner */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5"
          >
            <p className="text-xs text-green-400">Settings saved successfully</p>
          </motion.div>
        )}

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2"
          >
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Basic Info */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-1">
            <Store size={14} className="text-[#FF6B35]" />
            <span className="text-xs font-semibold text-white">Basic Info</span>
          </div>
          <label className="block">
            <span className={labelClass}>Canteen Name *</span>
            <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Main Canteen" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Describe your canteen..." rows={2} className="mt-1 w-full rounded-xl bg-card border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-[#6B6B6B] outline-none focus:border-[#FF6B35]/50 transition-all resize-none" />
          </label>
        </div>

        {/* Contact & Location */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-1">
            <Phone size={14} className="text-[#FF6B35]" />
            <span className="text-xs font-semibold text-white">Contact & Location</span>
          </div>
          <label className="block">
            <span className={labelClass}>Contact Phone</span>
            <input type="tel" value={form.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} placeholder="e.g. +91 90000 00001" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Address</span>
            <input type="text" value={form.address} onChange={e => handleChange('address', e.target.value)} placeholder="e.g. Building 5, Campus Area" className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Opening Hours</span>
            <input type="text" value={form.openingHours} onChange={e => handleChange('openingHours', e.target.value)} placeholder="e.g. 8 AM - 8 PM" className={fieldClass} />
          </label>
        </div>

        {/* Timing & Rush */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-[#FF6B35]" />
            <span className="text-xs font-semibold text-white">Timing & Rush</span>
          </div>
          <div className="flex gap-3">
            <label className="flex-1 block">
              <span className={labelClass}>Avg. Wait Time</span>
              <input type="text" value={form.avgWaitTime} onChange={e => handleChange('avgWaitTime', e.target.value)} placeholder="e.g. 5 min" className={fieldClass} />
            </label>
            <label className="flex-1 block">
              <span className={labelClass}>Rush Level</span>
              <select value={form.rushLevel} onChange={e => handleChange('rushLevel', e.target.value)} className={`${fieldClass} appearance-none`}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-1">
            <Image size={14} className="text-[#FF6B35]" />
            <span className="text-xs font-semibold text-white">Images</span>
          </div>
          <label className="block">
            <span className={labelClass}>Banner Image URL</span>
            <input type="url" value={form.bannerImage} onChange={e => handleChange('bannerImage', e.target.value)} placeholder="https://..." className={fieldClass} />
          </label>
          {form.bannerImage && (
            <div className="mt-2 h-24 rounded-xl overflow-hidden bg-card-elevated">
              <img src={form.bannerImage} alt="Banner preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <label className="block">
            <span className={labelClass}>Logo Image URL</span>
            <input type="url" value={form.logoImage} onChange={e => handleChange('logoImage', e.target.value)} placeholder="https://..." className={fieldClass} />
          </label>
        </div>

        {/* Tags & Categories */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-1">
            <Tags size={14} className="text-[#FF6B35]" />
            <span className="text-xs font-semibold text-white">Tags & Categories</span>
          </div>
          <label className="block">
            <span className={labelClass}>Tags (comma-separated)</span>
            <input type="text" value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="e.g. Fast, Popular, Veg" className={fieldClass} />
            <p className="text-[9px] text-[#6B6B6B] mt-1">Appear as badges on your canteen card</p>
          </label>
          <label className="block">
            <span className={labelClass}>Menu Categories (comma-separated)</span>
            <input type="text" value={form.categories} onChange={e => handleChange('categories', e.target.value)} placeholder="e.g. Beverages, Snacks, Meals" className={fieldClass} />
            <p className="text-[9px] text-[#6B6B6B] mt-1">Used to organize menu items. 'All' is always included.</p>
          </label>
        </div>

        {/* Save button (bottom) */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl food-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <><Save size={16} /> Save Settings</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
