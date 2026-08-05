import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Store, ArrowRight, Eye } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { getAdminStats } from '@/services/users';
import { getAllCanteens, normalizeCanteen } from '@/services/canteens';
import { ROUTES } from '@/routes/paths';
import AdminOrderDetailModal from '@/components/AdminOrderDetailModal';
import { STATUS_STYLES, STATUS_LABELS, orderCustomerName, orderFormatTime } from '@/lib/adminOrders';
import type { Canteen } from '@/types';
import type { OrderDTO } from '@/services/orders';

export default function AdminScreen() {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalOrders: number;
    totalCanteens: number;
    totalRevenue: number;
  }>({ totalUsers: 0, totalOrders: 0, totalCanteens: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);

  async function loadData() {
    setError(null);
    try {
      const [statsRes, canteensRes] = await Promise.all([
        getAdminStats(),
        getAllCanteens({ limit: '5' }),
      ]);
      setStats(statsRes.data.stats);
      setRecentOrders(statsRes.data.recentOrders || []);
      setCanteens(canteensRes.data.map(normalizeCanteen));
    } catch {
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(t);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => {
      setRefreshing(false);
      showToast('Data refreshed');
    }, 500);
  };

  const kpiData = [
    { key: 'totalOrders', label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: '📊' },
    { key: 'revenue', label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰' },
    { key: 'activeCanteens', label: 'Total Canteens', value: stats.totalCanteens, icon: '🏪' },
    { key: 'totalUsers', label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: '👥' },
  ];

  return (
    <div className="screen-surface h-full flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-[10px] md:text-xs text-[#6B6B6B]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleRefresh}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <RefreshCw size={18} className={`text-[#A0A0A0] ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Error banner */}
      {error && !loading && (
        <div className="mx-4 md:mx-6 lg:mx-8 mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin" />
          <p className="text-xs text-[#6B6B6B] mt-3">Loading dashboard...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div className="px-4 md:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {kpiData.map((kpi, i) => (
              <motion.div
                key={kpi.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-4"
              >
                <span className="text-lg">{kpi.icon}</span>
                <motion.p
                  key={refreshing ? `${kpi.key}-refresh` : kpi.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl font-bold text-white mt-1"
                >
                  {kpi.value}
                </motion.p>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-4 md:mx-6 lg:mx-8 mt-4 bg-card rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 pb-2">
              <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] text-center py-6">
                No orders yet. They will appear here as customers place them.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentOrders.map((order, i) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center px-4 py-3 hover:bg-card-highlight transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{order.canteenName}</p>
                      <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                        {orderCustomerName(order)} • {orderFormatTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES.received}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <span className="text-sm font-bold text-white">₹{order.finalTotal}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="w-7 h-7 rounded-lg bg-card-elevated flex items-center justify-center hover:bg-card-highlight transition-colors"
                        aria-label={`View order ${order.token}`}
                      >
                        <Eye size={12} className="text-[#6B6B6B]" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Canteens Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mx-4 md:mx-6 lg:mx-8 mt-4 mb-8 bg-card rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 pb-2">
              <h3 className="text-sm font-semibold text-white">Canteens</h3>
              <button
                onClick={() => navigate(ROUTES.ADMIN_CANTEENS)}
                className="text-[10px] text-[#FF6B35] font-medium flex items-center gap-0.5"
              >
                Manage All <ArrowRight size={10} />
              </button>
            </div>
            {canteens.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] text-center py-6">
                No canteens available.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {canteens.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 + i * 0.06 }}
                    onClick={() => navigate(ROUTES.ADMIN_CANTEENS)}
                    className="flex items-center px-4 py-3 hover:bg-card-highlight transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: c.rushLevel === 'high' ? '#FF3B3B' : '#10B981' }}
                        />
                        <span className="text-[10px] text-[#6B6B6B]">
                          {c.rushLevel === 'high' ? 'High load' : 'Operating'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-[#A0A0A0]">{c.ratingCount} ratings</span>
                      <span className="w-7 h-7 rounded-lg bg-card-elevated flex items-center justify-center">
                        <Store size={12} className="text-[#6B6B6B]" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
