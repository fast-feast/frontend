<<<<<<< Updated upstream
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChefHat, PackageCheck, Phone } from 'lucide-react';
=======
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChefHat, PackageCheck, Phone, XCircle } from 'lucide-react';
>>>>>>> Stashed changes
import { useApp } from '@/hooks/useAppContext';
import { QRCodeSVG } from 'qrcode.react';
import { getOrderById, updateOrderStatus, cancelOrder } from '@/services/orders';
import { extractErrorMessage } from '@/services/api';

type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

const steps = [
  { key: 'received' as OrderStatus, label: 'Order Received', icon: CheckCircle2, color: '#10B981' },
  { key: 'preparing' as OrderStatus, label: 'Preparing', icon: ChefHat, color: '#FF6B35' },
  { key: 'ready' as OrderStatus, label: 'Ready for Pickup', icon: PackageCheck, color: '#3B82F6' },
];

const statusMessages: Record<string, string> = {
  received: 'Your order has been confirmed ✓',
  preparing: 'Chef is cooking your order 👨‍🍳✨',
  ready: 'Your order is ready! Pick it up now 🎉',
  completed: 'Order completed! Enjoy your meal 🍽️',
  cancelled: 'Order cancelled',
};

export default function OrderTrackingScreen() {
<<<<<<< Updated upstream
  const { state, goBack, dispatch, navigate } = useApp();
=======
  const { orderId } = useParams<{ orderId: string }>();
  const { state, goBack, dispatch, navigate, showToast } = useApp();
>>>>>>> Stashed changes
  const [status, setStatus] = useState<OrderStatus>('received');
  const [queuePosition, setQueuePosition] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState('15-20 min');
  const [pickedUp, setPickedUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const token = state.tokenNumber || 'A-042';
  const activeOrderId = orderId || state.activeOrderId;

  // ─── Poll backend for real order status ──────────────
  const fetchOrder = useCallback(async () => {
    if (!activeOrderId) return;
    try {
      const res = await getOrderById(activeOrderId);
      const order = res.data;
      setStatus(order.status);
      setQueuePosition(order.queuePosition ?? 0);
      if (order.estimatedTime) setEstimatedTime(order.estimatedTime);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeOrderId]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const currentStepIndex = status === 'completed' || status === 'cancelled'
    ? -1
    : steps.findIndex(s => s.key === status);

  // ─── Picked Up — calls API to set status to 'completed' ─
  const handlePickedUp = async () => {
    if (!activeOrderId) return;
    try {
      await updateOrderStatus(activeOrderId, 'completed');
      setStatus('completed');
      setPickedUp(true);
      showToast('Enjoy your meal! 🍽️');
      setTimeout(() => {
        dispatch({ type: 'SET_TAB', tab: 'home' });
        navigate('home');
      }, 1500);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  // ─── Cancel order ─────────────────────────────────────
  const handleCancel = async () => {
    if (!activeOrderId) return;
    setCancelling(true);
    try {
      await cancelOrder(activeOrderId);
      setStatus('cancelled');
      setShowCancelConfirm(false);
      showToast('Order cancelled');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setCancelling(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="screen-surface h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin" />
        <p className="text-xs text-[#6B6B6B] mt-3">Loading order...</p>
      </div>
    );
  }

  // ─── Error with no data ───────────────────────────────
  if (error && !status) {
    return (
      <div className="screen-surface h-full flex flex-col items-center justify-center px-6">
        <p className="text-sm text-[#A0A0A0] text-center mb-4">{error}</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={fetchOrder}
          className="px-6 h-11 rounded-full food-gradient text-white font-semibold text-sm"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const showActions = !isCancelled && !isCompleted;

  return (
    <div className="screen-surface h-full flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 pt-4 pb-3">
        <motion.button whileTap={{ scale: 0.92 }} onClick={goBack} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft size={20} className="text-white" />
        </motion.button>
        <h1 className="text-xl font-bold text-white flex-1">Order Tracking</h1>
        <span className="px-3 py-1 rounded-full food-gradient text-white text-xs font-bold">{token}</span>
      </div>

      {/* Token & QR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-4 md:mx-6 lg:mx-8 bg-card rounded-2xl p-4 md:p-5 flex items-center justify-between"
      >
        <div>
          <p className="text-4xl font-extrabold text-[#FF6B35] text-shadow-token tracking-tighter">{token}</p>
          <p className="text-[10px] text-[#6B6B6B] mt-1">{state.canteen?.name || 'Canteen'} • Estimated {estimatedTime}</p>
        </div>
        <div className="bg-card-elevated p-1.5 rounded-xl">
          <QRCodeSVG value={`FASTFEAST:${token}`} size={56} bgColor="#1A1A1A" fgColor="#FFFFFF" level="L" />
        </div>
      </motion.div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 md:mx-6 lg:mx-8 mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center"
        >
          <XCircle size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-400">Order Cancelled</p>
          <p className="text-[10px] text-[#6B6B6B] mt-1">This order has been cancelled.</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { dispatch({ type: 'SET_TAB', tab: 'orders' }); navigate('orders'); }}
            className="mt-3 px-5 py-2 rounded-full bg-card text-white text-xs font-medium"
          >
            View My Orders
          </motion.button>
        </motion.div>
      )}

      {/* Completed Banner */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 md:mx-6 lg:mx-8 mt-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center"
        >
          <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-400">Enjoy your meal! 🍽️</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { dispatch({ type: 'SET_TAB', tab: 'home' }); navigate('home'); }}
            className="mt-3 px-5 py-2 rounded-full bg-card text-white text-xs font-medium"
          >
            Order Something Else
          </motion.button>
        </motion.div>
      )}

      {/* Timeline — only show for active statuses */}
      {showActions && (
        <div className="mx-4 md:mx-6 lg:mx-8 mt-6">
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-white/10" />
            {/* Active line */}
            <motion.div
              className="absolute left-[23px] top-6 w-0.5"
              style={{
                background: 'linear-gradient(180deg, #10B981, #FF6B35)',
              }}
              animate={{ height: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />

            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isPending = i > currentStepIndex;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                  className="flex items-start gap-4 relative mb-6 last:mb-0"
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-500 ${
                      isCompleted ? 'green-gradient' : isCurrent ? 'food-gradient' : 'bg-card-elevated'
                    }`}
                    style={isCurrent ? { boxShadow: `0 0 20px ${step.color}40` } : {}}
                  >
                    {isCurrent && (
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <StepIcon size={22} className="text-white" />
                      </motion.div>
                    )}
                    {isCompleted && <CheckCircle2 size={22} className="text-white" />}
                    {isPending && <StepIcon size={22} className="text-[#6B6B6B]" />}
                  </div>

                  {/* Label */}
                  <div className="pt-2">
                    <p className={`text-sm font-semibold ${isPending ? 'text-[#6B6B6B]' : 'text-white'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                      {isCompleted ? 'Completed' : isCurrent ? 'In progress...' : 'Waiting'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Message */}
      {showActions && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 md:mx-6 lg:mx-8 mt-4 text-center"
        >
          <p className="text-lg font-semibold text-white">{statusMessages[status] || statusMessages.received}</p>
        </motion.div>
      )}

      {/* Progress Ring — only for active statuses */}
      {showActions && (
        <div className="flex justify-center mt-5">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A1A" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke={status === 'ready' ? '#10B981' : status === 'preparing' ? '#FF6B35' : '#F59E0B'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                animate={{
                  strokeDashoffset: `${2 * Math.PI * 42 * (1 - (currentStepIndex + 1) / steps.length)}`,
                }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#FF6B35]">{estimatedTime}</span>
              <span className="text-[9px] text-[#6B6B6B]">est. time</span>
            </div>
          </div>
        </div>
      )}

      {/* Queue Position */}
      {showActions && (
        <div className="mx-4 md:mx-6 lg:mx-8 mt-4 bg-card rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A0A0A0]">{queuePosition > 0 ? `${queuePosition} orders ahead` : 'Your turn!'}</span>
          </div>
          <div className="w-24 h-1 bg-card-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full green-gradient"
              animate={{ width: `${Math.max(10, (1 - queuePosition / 10) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Call Canteen */}
      <div className="mx-4 md:mx-6 lg:mx-8 mt-3 bg-card rounded-2xl p-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{state.canteen?.name || 'Canteen'}</p>
          <p className="text-[10px] text-[#6B6B6B]">Counter</p>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} className="w-10 h-10 rounded-full bg-card-elevated flex items-center justify-center">
          <Phone size={18} className="text-green-400" />
        </motion.button>
      </div>

      {/* Cancel Button — only when status is 'received' */}
      {status === 'received' && !isCancelled && !isCompleted && (
        <div className="px-4 md:px-6 lg:px-8 mt-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCancelConfirm(true)}
            className="w-full h-12 rounded-2xl bg-red-500/10 text-red-400 font-medium text-sm flex items-center justify-center gap-2"
          >
            <XCircle size={16} />
            Cancel Order
          </motion.button>
        </div>
      )}

      {/* Picked Up Button — only when status is 'ready' */}
      {status === 'ready' && !isCancelled && !isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-6 lg:px-8 mt-4 pb-8 max-w-md mx-auto w-full"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePickedUp}
            disabled={pickedUp}
            className="w-full h-14 rounded-full food-gradient text-white font-semibold text-base shadow-glow-orange disabled:opacity-70"
          >
            {pickedUp ? 'Enjoy your meal! 🍽️' : "I've Picked Up ✓"}
          </motion.button>
        </motion.div>
      )}

      {!isCancelled && !isCompleted && status !== 'ready' && <div className="h-8" />}

      {/* ─── Cancel Confirmation Dialog ──────────────────── */}
      <AnimatePresence>
        {showCancelConfirm && (
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
                <XCircle size={24} className="text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Cancel Order {token}?</h3>
              <p className="text-xs text-[#6B6B6B] mb-4">This cannot be undone.</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 h-11 rounded-xl bg-card text-[#A0A0A0] font-medium text-sm"
                >
                  Keep Order
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white font-semibold text-sm disabled:opacity-70"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
