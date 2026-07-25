import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Clock, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { getAllCanteens, normalizeCanteen } from '@/services/canteens';
import { getTrendingItems, getFastItems, normalizeMenuItem } from '@/services/menu';
import type { Canteen, MenuItem } from '@/types';

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

export default function HomeScreen() {
  const { navigate, dispatch, addToCart, showToast, state } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [trendingItems, setTrendingItems] = useState<MenuItem[]>([]);
  const [fastItems, setFastItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [canteensRes, trendingRes, fastRes] = await Promise.all([
          getAllCanteens(),
          getTrendingItems(5),
          getFastItems(6),
        ]);
        setCanteens(canteensRes.data.map(normalizeCanteen));
        setTrendingItems(trendingRes.data.map(normalizeMenuItem));
        setFastItems(fastRes.data.map(normalizeMenuItem));
      } catch {
        // Fallback to empty state
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = state.user.name.split(' ')[0];
    if (hour < 5) return `Late night, ${name}`;
    if (hour < 7) return `Rise and shine, ${name}`;
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 14) return `Lunch cravings, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    if (hour < 21) return `Good evening, ${name}`;
    return `Night cravings, ${name}`;
  }, [state.user.name]);

  // Filtering logic
  const matchesSearch = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return () => true;
    return (item: MenuItem) =>
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
  }, [searchQuery]);

  const matchesFilter = useMemo(() => {
    return (item: MenuItem) => {
      switch (activeFilter) {
        case 'All': return true;
        case 'Veg': return item.isVeg;
        case 'Fast': return item.isFast === true;
        case 'Popular': return item.isTrending === true;
        case 'Under ₹100': return item.price < 100;
        case 'Beverages': return item.category?.toLowerCase() === 'beverages';
        default: return true;
      }
    };
  }, [activeFilter]);

  const canteenMatchesSearch = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return () => true;
    return (c: Canteen) =>
      c.name.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredCanteens = useMemo(() => {
    let result = canteens;
    // Apply search
    result = result.filter(canteenMatchesSearch);
    // Apply filter
    if (activeFilter !== 'All') {
      result = result.filter(c => {
        switch (activeFilter) {
          case 'Veg': return c.tags?.some(t => t.toLowerCase().includes('veg') || t.toLowerCase().includes('vegetarian'));
          case 'Fast': return c.tags?.some(t => t.toLowerCase().includes('fast'));
          case 'Popular': return c.rating >= 4.3;
          case 'Under ₹100': return true;
          case 'Beverages': return c.categories?.some(cat => cat.toLowerCase() === 'beverages');
          default: return true;
        }
      });
    }
    return result;
  }, [canteens, activeFilter, canteenMatchesSearch]);

  const filteredTrendingItems = useMemo(() => {
    let result = trendingItems;
    // Apply search
    result = result.filter(matchesSearch);
    // Apply filter
    if (activeFilter !== 'All') {
      result = result.filter(matchesFilter);
    }
    return result;
  }, [trendingItems, activeFilter, matchesFilter, matchesSearch]);

  const filteredFastItems = useMemo(() => {
    let result = fastItems;
    // Apply search
    result = result.filter(matchesSearch);
    // Apply filter
    if (activeFilter !== 'All') {
      result = result.filter(matchesFilter);
    }
    return result;
  }, [fastItems, activeFilter, matchesFilter, matchesSearch]);

  const handleCanteenTap = (id: string) => {
    dispatch({ type: 'SELECT_CANTEEN', id });
    navigate('canteenDetail', 'push', { canteenId: id });
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item.id, { ...item, quantity: 1 });
    showToast(`${item.name} added to cart!`);
  };

  return (
    <div className="screen-surface h-full overflow-y-auto no-scrollbar relative">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="pt-4 px-4 md:px-6 lg:px-8"
      >
        <div className="flex items-start justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">{greeting}</h1>
            <p className="text-sm md:text-base text-[#8A6A78] mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>

          {/* Profile icon */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('profile', 'push')}
            className="relative group"
          >
            <div className="w-10 h-10 rounded-full bg-card border border-white/[0.08] flex items-center justify-center overflow-hidden hover:border-[#D94A5A]/50 transition-all duration-200">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#D94A5A]/20 to-[#B83042]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {state.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
            </div>
            {/* Active dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0A0508]" />
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-card-elevated text-white text-[10px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg border border-white/[0.06]">
                Profile
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mt-4 px-4 md:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto h-12 md:h-14 rounded-full bg-card-elevated border border-white/[0.06] flex items-center px-4 gap-3 focus-within:border-[#D94A5A]/50 focus-within:shadow-[0_0_0_3px_rgba(217,74,90,0.15)] transition-all duration-200">
          <Search size={18} className="text-[#6B4D5A]" />
          <input
            type="text"
            placeholder="Search for food, canteens..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm md:text-base text-white placeholder:text-[#6B4D5A] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#6B4D5A] hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">✕</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.25 }}
        className="mt-3 px-4 md:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === f
                  ? 'food-gradient text-white'
                  : 'bg-card border border-white/[0.08] text-[#8A6A78]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Canteens Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="mt-6 px-4 md:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Canteens</h2>
            <button className="text-xs md:text-sm font-medium text-[#D94A5A] flex items-center gap-0.5">
              See All <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="snap-start flex-shrink-0 w-[260px] xs:w-[280px] sm:w-[300px] md:w-[320px] lg:w-[340px] h-[160px] xs:h-[180px] md:h-[200px] rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : filteredCanteens.length > 0 ? (              <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
                {filteredCanteens.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCanteenTap(c.id)}
                  className="snap-start carousel-card flex-shrink-0 w-[260px] xs:w-[280px] sm:w-[300px] md:w-[320px] lg:w-[340px] h-[160px] xs:h-[180px] md:h-[200px] rounded-2xl overflow-hidden relative group"
                >
                  <img src={c.bannerImage} alt={c.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <h3 className="text-base md:text-lg font-bold text-white">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs md:text-sm text-white font-medium">{c.rating}</span>
                      </div>
                      <div className="flex gap-1">
                        {c.tags.map(t => (
                          <span key={t} className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <RushDot level={c.rushLevel} />
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[160px] rounded-2xl bg-card/50">
              <p className="text-sm text-[#6B4D5A]">No canteens match &quot;{activeFilter}&quot;</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Trending Section - Horizontal Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="mt-6 px-4 md:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-3">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <TrendingUp size={18} className="text-[#D94A5A]" /> Trending Now
            </h2>
            {activeFilter !== 'All' && (
              <p className="text-[11px] md:text-sm text-[#D94A5A] mt-0.5">{activeFilter} picks for you</p>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {filteredTrendingItems.length > 0 ? (
              filteredTrendingItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.06 }}
                  className="snap-start carousel-card-sm flex-shrink-0 w-[160px] xs:w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] bg-card rounded-2xl overflow-hidden text-left cursor-default"
                >
                  <div className="relative">
                    <img src={item.image} alt={item.name} className="w-full h-[100px] xs:h-[110px] md:h-[130px] lg:h-[150px] object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-[#D94A5A]/80 text-white font-medium">
                        Trending
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 md:p-3">
                    <h4 className="text-sm md:text-base font-semibold text-white truncate">{item.name}</h4>
                    <p className="text-[9px] md:text-[10px] text-[#6B4D5A] mt-0.5 truncate">{canteens.find(c => c.id === item.canteenId)?.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm md:text-base font-bold text-[#D94A5A]">₹{item.price}</span>
                      <span className="text-[9px] md:text-[10px] text-[#6B4D5A] flex items-center gap-0.5">
                        <Clock size={9} /> {item.prepTime}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full h-[130px] rounded-2xl bg-card/50">
                <p className="text-sm text-[#6B4D5A]">No trending items match &quot;{activeFilter}&quot;</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Fastest to Prepare */}
      {filteredFastItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="mt-6 px-4 md:px-6 lg:px-8 pb-6"
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-3">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                <Zap size={18} className="text-yellow-400" /> Fastest to Prepare
              </h2>
              {activeFilter !== 'All' && (
                <p className="text-[11px] md:text-sm text-yellow-400/70 mt-0.5">{activeFilter} picks for you</p>
              )}
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
              {filteredFastItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 + i * 0.06 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAddToCart(item)}
                  className="snap-start carousel-card-xs flex-shrink-0 w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] bg-card rounded-xl overflow-hidden"
                >
                  <img src={item.image} alt={item.name} className="w-full h-[80px] xs:h-[100px] md:h-[120px] lg:h-[130px] object-cover" />
                  <div className="p-2 md:p-3">
                    <p className="text-xs md:text-sm font-semibold text-white truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs md:text-sm font-bold text-[#D94A5A]">₹{item.price}</span>
                      <span className="text-[9px] md:text-[10px] text-[#6B4D5A] flex items-center gap-0.5">
                        <Clock size={9} /> {item.prepTime}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
