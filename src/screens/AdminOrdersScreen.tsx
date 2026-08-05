import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, RefreshCw, ChevronLeft, ChevronRight, Eye, AlertTriangle } from 'lucide-react';
import { getAllCanteens } from '@/services/canteens';
import { getOrdersByCanteen, type OrderDTO } from '@/services/orders';
import { extractErrorMessage } from '@/services/api';
import { AdminBackButton } from '@/components/AdminLayout';
import AdminOrderDetailModal from '@/components/AdminOrderDetailModal';
import { STATUS_STYLES, orderCustomerName, orderFormatTime } from '@/lib/adminOrders';

const PAGE_SIZE = 10;
const PER_CANTEEN_LIMIT = 50;

type StatusFilter = 'all' | 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'received', label: 'Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OrderDTO | null>(null);

  const fetchOrders = useCallback(async (statusFilter: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const canteensRes = await getAllCanteens({ limit: '50' });
      const canteens = canteensRes.data;

      const results = await Promise.all(
        canteens.map((c) =>
          getOrdersByCanteen(c._id, {
            page: '1',
            limit: String(PER_CANTEEN_LIMIT),
            ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          }).catch(() => null)
        )
      );

      const merged = results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .flatMap((r) => r.data);

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(merged);
    } catch (err) {
      setError(extractErrorMessage(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount (initial status 'all') and whenever the status filter changes.
  useEffect(() => {
    const t = window.setTimeout(() => void fetchOrders(status), 0);
    return () => window.clearTimeout(t);
  }, [fetchOrders, status]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = orders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleStatusChange = (s: StatusFilter) => {
    setPage(1);
    setStatus(s);
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <AdminBackButton />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Orders</h1>
            <p className="text-[10px] md:text-xs text-[#6B6B6B]">
              {loading ? 'Loading...' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => void fetchOrders(status)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-elevated transition-colors"
          aria-label="Refresh orders"
        >
          <RefreshCw size={18} className="text-[#A0A0A0]" />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="px-4 md:px-6 lg:px-8 pb-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                status === tab.key ? 'food-gradient text-white' : 'bg-card text-[#8A8A8A] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 lg:px-8 pb-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin" />
            <p className="text-xs text-[#6B6B6B] mt-3">Loading orders...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle size={28} className="text-red-400 mb-3" />
            <p className="text-sm text-[#A0A0A0] text-center mb-4">{error}</p>
            <button
              onClick={() => void fetchOrders(status)}
              className="px-6 h-11 rounded-full food-gradient text-white font-semibold text-sm flex items-center gap-2"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList size={32} className="text-[#6B6B6B] mb-3" />
            <p className="text-sm text-[#A0A0A0]">
              {status === 'all' ? 'No orders yet' : `No ${status} orders`}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && pageItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[680px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Order</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Canteen</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Customer</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Items</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Total</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Status</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {pageItems.map((order) => (
                    <tr key={order._id} className="hover:bg-card-highlight transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-[#FF6B35]">{order.token}</p>
                        <p className="text-[11px] text-[#6B6B6B] whitespace-nowrap">{orderFormatTime(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white truncate max-w-[160px]">{order.canteenName}</td>
                      <td className="px-4 py-3 text-sm text-[#A0A0A0] truncate max-w-[160px]">{orderCustomerName(order)}</td>
                      <td className="px-4 py-3 text-sm text-[#A0A0A0]">
                        {order.items.reduce((sum, it) => sum + it.quantity, 0)} items
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-white">₹{order.finalTotal}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_STYLES[order.status] || STATUS_STYLES.received}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(order)}
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
        {!loading && !error && orders.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[#6B6B6B]">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1}
                className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-[#A0A0A0] disabled:opacity-40 hover:bg-card-elevated transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="w-9 h-9 rounded-lg bg-card flex items-center justify-center text-[#A0A0A0] disabled:opacity-40 hover:bg-card-elevated transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal (reuses the shared rich modal) */}
      {selected && (
        <AdminOrderDetailModal order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
