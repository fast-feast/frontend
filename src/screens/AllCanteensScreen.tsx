import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Star, Clock } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { getAllCanteens, normalizeCanteen } from '@/services/canteens';
import { CardSkeleton } from '@/components/ui/loading-animation';
import type { Canteen } from '@/types';

const filters = ['All', 'Veg', 'Fast', 'Popular', 'Under ₹100', 'Beverages'];

const RushDot = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const colors = { low: '#10B981', medium: '#F59E0B', high: '#FF3B3B' };
  const labels = { low: 'Low Rush', medium: 'Medium Rush', high: 'High Rush' };
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{
          background: colors[level],
          boxShadow: `0 0 8px ${colors[level]}60`,
        }}
      />
      <span className="text-[10px] font-medium" style={{ color: colors[level] }}>
        {labels[level]}
      </span>
    </div>
  );
};

export default function AllCanteensScreen() {
  const { navigate, goBack, dispatch } = useApp();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const res = await getAllCanteens();
        if (cancelled) return;
        setCanteens(res.data.map(normalizeCanteen));
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const filteredCanteens = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return canteens.filter(c => {
      const searchMatch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.description?.toLowerCase().includes(q);
      let filterMatch = true;
      switch (activeFilter) {
        case 'Veg': filterMatch = c.tags?.some(t => t.toLowerCase().includes('veg') || t.toLowerCase().includes('vegetarian')); break;
        case 'Fast': filterMatch = c.tags?.some(t => t.toLowerCase().includes('fast')); break;
        case 'Popular': filterMatch = c.rating >= 4.3; break;
        case 'Under ₹100': filterMatch = true; break;
        case 'Beverages': filterMatch = c.categories?.some(cat => cat.toLowerCase() === 'beverages'); break;
      }
      return searchMatch && filterMatch;
    });
  }, [canteens, searchQuery, activeFilter]);

  const handleCanteenTap = (id: string) => {
    dispatch({ type: 'SELECT_CANTEEN', id });
    navigate('canteenDetail', 'push', { canteenId: id });
  };

  return (
    <div className="screen-surface h-full flex flex-col overflow-y-auto no-scrollbar">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#0A0508]/95 backdrop-blur-lg border-b border-white/[0.04]">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 pt-4 pb-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={20} className="text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">All Canteens</h1>
            <p className="text-[11px] text-[#8A6A78]">
              {loading ? 'Loading...' : `${filteredCanteens.length} canteen${filteredCanteens.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 md:px-6 lg:px-8 pb-3">
          <div className="h-11 rounded-full bg-card-elevated border border-white/[0.06] flex items-center px-4 gap-2.5 focus-within:border-[#D94A5A]/50 focus-within:shadow-[0_0_0_3px_rgba(217,74,90,0.15)] transition-all duration-200">
            <Search size={16} className="text-[#6B4D5A] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search canteens, tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6B4D5A] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#6B4D5A] hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 md:px-6 lg:px-8 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === f
                  ? 'food-gradient text-white'
                  : 'bg-card border border-white/[0.08] text-[#8A6A78] hover:border-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 lg:px-8 pb-6">
        {/* Loading State */}
        {loading ? (
          <div className="pt-4">
            <CardSkeleton count={4} />
          </div>
        ) : filteredCanteens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mb-4">
              <Search size={28} className="text-[#6B6B6B]" />
            </div>
            <p className="text-sm text-[#A0A0A0] font-medium">No canteens found</p>
            <p className="text-xs text-[#6B6B6B] mt-1">
              {searchQuery ? `No results for "${searchQuery}"` : 'Try a different filter'}
            </p>
            {(searchQuery || activeFilter !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                className="mt-4 px-5 py-2 rounded-full food-gradient text-white text-xs font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Responsive Grid */
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCanteens.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCanteenTap(c.id)}
                className="rounded-2xl overflow-hidden text-left group bg-card border border-white/[0.04] hover:border-[#D94A5A]/20 transition-all duration-200"
              >
                {/* Banner Image */}
                <div className="relative h-[120px] xs:h-[140px] sm:h-[150px] overflow-hidden">
                  <img
                    src={c.bannerImage}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Rating badge */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-semibold text-white">{c.rating}</span>
                  </div>
                  {/* Canteen name on image */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  {/* Tags */}
                  <div className="flex gap-1.5 flex-wrap">
                    {c.tags.slice(0, 3).map(t => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-card-elevated text-[#8A6A78]"
                      >
                        {t}
                      </span>
                    ))}
                    {c.tags.length > 3 && (
                      <span className="text-[9px] text-[#6B4D5A]">+{c.tags.length - 3}</span>
                    )}
                  </div>

                  {/* Rush level + wait time */}
                  <div className="flex items-center justify-between">
                    <RushDot level={c.rushLevel} />
                    <div className="flex items-center gap-1 text-[10px] text-[#6B4D5A]">
                      <Clock size={10} />
                      {c.avgWaitTime}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-6" />
      </div>
    </div>
  );
}
