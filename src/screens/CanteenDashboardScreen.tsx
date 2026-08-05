import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, UtensilsCrossed, RefreshCw, AlertTriangle, X, Settings, LogOut } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { getOrdersByCanteen, updateOrderStatus, type OrderDTO } from '@/services/orders';
import { getDashboardStats, updateCanteen } from '@/services/canteens';
import { extractErrorMessage } from '@/services/api';

import { LoadingAnimation } from '@/components/ui/loading-animation';


type OrderStatus = 'received' | 'preparing' | 'ready' | 'cancelled';
type DisplayStatus = 'received' | 'preparing' | 'ready' | 'all';

const statusLabel: Record<string, string> = {
  received: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
};

const tabs: { key: DisplayStatus; label: string }[] = [
  { key: 'received', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'all', label: 'All' },
];

interface DashboardOrderItem {
  _id: string;
  token: string;
  status: OrderStatus;
  items: { name: string; quantity: number }[];
  total: number;
  notes?: string;
  isGroupOrder: boolean;
  createdAt: string;
  canteenName: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function normalizeDashboardOrders(orders: OrderDTO[]): DashboardOrderItem[] {
  return orders.map(order => ({
    _id: order._id,
    token: order.token,
    status: order.status as OrderStatus,
    items: order.items.map(item => ({ name: item.name, quantity: item.quantity })),
    total: order.finalTotal || order.subtotal,
    notes: order.notes,
    isGroupOrder: order.isGroupOrder,
    createdAt: order.createdAt,
    canteenName: order.canteenName,
  }));
}

export default function CanteenDashboardScreen() {
  const { state, logout, showToast } = useApp();
  const { canteen, canteenId } = state;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DisplayStatus>('received');
  const [orders, setOrders] = useState<DashboardOrderItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isPaused, setIsPaused] = useState(!canteen?.isActive);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DashboardOrderItem | null>(null);
  const [togglingPause, setTogglingPause] = useState(false);

  const fetchData = useCallback(async () => {
    if (!canteenId) return;
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        getOrdersByCanteen(canteenId),
        getDashboardStats(canteenId),
      ]);
      setOrders(normalizeDashboardOrders(ordersRes.data));
      setTotalOrders(statsRes.data.totalOrders);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canteenId]);

  useEffect(() => {
    if (!canteenId) return;
    const id = canteenId;
    let cancelled = false;

    async function load() {
      try {
        const [ordersRes, statsRes] = await Promise.all([
          getOrdersByCanteen(id),
          getDashboardStats(id),
        ]);
        if (cancelled) return;
        setOrders(normalizeDashboardOrders(ordersRes.data));
        setTotalOrders(statsRes.data.totalOrders);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [canteenId]);

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const stats = {
    received: orders.filter(o => o.status === 'received').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    today: totalOrders,
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o._id === orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      // Refresh order list to get updated state
      await fetchData();
      showToast(`Order ${order?.token} updated`);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  // logout() is role-aware and already routes canteen owners to /canteen/login.
  const handleLogout = () => {
    logout();
  };

  const handleTogglePause = async () => {
    if (!canteenId) return;
    setTogglingPause(true);
    try {
      await updateCanteen(canteenId, { isActive: isPaused });
      setIsPaused(!isPaused);
      showToast(isPaused ? 'Orders resumed' : 'Orders paused');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setTogglingPause(false);
    }
  };

  const getActions = (order: DashboardOrderItem) => {
    if (order.status === 'received') {
      return (
        <>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => handleUpdateStatus(order._id, 'preparing')}
            disabled={isPaused}
            className="px-3 py-1.5 rounded-full green-gradient text-white text-[10px] font-semibold disabled:opacity-40"
          >
            Accept
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setRejectTarget(order)}
            className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold"
          >
            Reject
          </motion.button>
        </>
      );
    }
    if (order.status === 'preparing') {
      return (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleUpdateStatus(order._id, 'ready')}
          className="px-3 py-1.5 rounded-full food-gradient text-white text-[10px] font-semibold"
        >
          Mark Ready
        </motion.button>
      );
    }
    return (
      <span className="px-3 py-1.5 rounded-full green-gradient/30 text-green-400 text-[10px] font-semibold flex items-center gap-1">
        <Check size={10} /> Ready
      </span>
    );
  };

  // ─── Loading State ─────────────────────────────────────
  if (loading && orders.length === 0) {
    return (
      <LoadingAnimation
        variant="fullscreen"
        message="Loading dashboard..."
      />
    );
  }

  // ─── Error State ───────────────────────────────────────
  if (error && orders.length === 0) {
    return (
      <div className="screen-surface h-full flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <p className="text-sm text-[#A0A0A0] text-center mb-4">{error}</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={fetchData}
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
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Canteen Panel</h1>
          <p className="text-[10px] md:text-xs text-[#6B6B6B]">{canteen?.name || 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={fetchData}
            className="w-8 h-8 rounded-full bg-card flex items-center justify-center"
            aria-label="Refresh orders"
          >
            <RefreshCw size={14} className="text-[#6B6B6B]" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-card flex items-center justify-center"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={14} className="text-red-400" />
          </motion.button>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400">Live</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 md:px-6 lg:px-8 grid grid-cols-4 gap-2 md:gap-3"
      >
        {[
          { key: 'received', label: 'New', color: 'text-[#FF6B35]' },
          { key: 'preparing', label: 'Preparing', color: 'text-amber-400' },
          { key: 'ready', label: 'Ready', color: 'text-green-400' },
          { key: 'today', label: 'Total', color: 'text-white' },
        ].map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-2.5 text-center"
          >
            <motion.p
              key={stats[s.key as keyof typeof stats]}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${s.color}`}
            >
              {loading ? '-' : stats[s.key as keyof typeof stats]}
            </motion.p>
            <p className="text-[9px] text-[#6B6B6B] mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Pause Toggle */}
      <div className="px-4 md:px-6 lg:px-8 mt-3 flex items-center justify-between bg-card rounded-xl p-3 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">Pause New Orders</span>
          {togglingPause && (
            <div className="w-3 h-3 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin" />
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleTogglePause}
          disabled={togglingPause}
          className={`relative w-12 h-7 rounded-full transition-colors ${isPaused ? 'bg-red-500' : 'bg-card-elevated'} disabled:opacity-50`}
        >
          <motion.div
            animate={{ x: isPaused ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
          />
        </motion.button>
      </div>
      {isPaused && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mx-4 mt-2 bg-red-500/10 rounded-xl px-3 py-2"
        >
          <p className="text-[10px] text-red-400">Orders are paused. Customers cannot place new orders.</p>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="px-4 md:px-6 lg:px-8 mt-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === tab.key ? 'food-gradient text-white' : 'bg-card text-[#A0A0A0]'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 text-[9px] opacity-70">({stats[tab.key]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="px-4 md:px-6 lg:px-8 mt-3 pb-6 space-y-2 flex-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <LoadingAnimation variant="dots" size="sm" />
            <span className="text-xs text-[#6B6B6B] ml-2">Updating orders...</span>
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UtensilsCrossed size={32} className="text-[#6B6B6B] mb-3" />
            <p className="text-sm text-[#A0A0A0]">No {activeTab === 'all' ? '' : (statusLabel[activeTab] || '').toLowerCase() + ' '}orders yet</p>
            <p className="text-[10px] text-[#6B6B6B] mt-1">Orders will appear here when customers place them.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!loading && filteredOrders.map((order, i) => (
            <motion.div
              key={order._id}
              layout
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#FF6B35]">{order.token}</span>
                  <span className="text-[10px] text-[#6B6B6B]">{timeAgo(order.createdAt)}</span>
                </div>
                {order.isGroupOrder && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full purple-gradient text-white">Group</span>
                )}
              </div>

              <div className="mt-2 space-y-0.5">
                {order.items.map((item, ii) => (
                  <p key={ii} className="text-xs text-[#A0A0A0]">{item.name} x{item.quantity}</p>
                ))}
              </div>

              {order.notes && (
                <p className="text-[10px] text-amber-400 mt-1.5">Note: {order.notes}</p>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-bold text-white">₹{order.total}</span>
                <div className="flex gap-2">
                  {getActions(order)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Reject Confirmation Dialog ──────────────────── */}
      <AnimatePresence>
        {rejectTarget && (
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
                <X size={24} className="text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Reject Order {rejectTarget.token}?</h3>
              <p className="text-xs text-[#6B6B6B] mb-4">This will mark the order as cancelled.</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRejectTarget(null)}
                  className="flex-1 h-11 rounded-xl bg-card text-[#A0A0A0] font-medium text-sm"
                >
                  Keep Order
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    const target = rejectTarget;
                    setRejectTarget(null);
                    await handleUpdateStatus(target._id, 'cancelled');
                  }}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white font-semibold text-sm"
                >
                  Reject
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Menu Link */}
      <div className="px-4 md:px-6 lg:px-8 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/canteen/menu')}
          className="flex-1 h-12 rounded-2xl bg-card border border-white/[0.08] text-[#A0A0A0] font-medium text-sm flex items-center justify-center gap-2"
        >
          <UtensilsCrossed size={16} />
          Manage Menu
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/canteen/settings')}
          className="flex-1 h-12 rounded-2xl bg-card border border-white/[0.08] text-[#A0A0A0] font-medium text-sm flex items-center justify-center gap-2"
        >
          <Settings size={16} />
          Settings
        </motion.button>
      </div>

      {/* Bottom spacer */}
      <div className="h-6" />
    </div>
  );
}
