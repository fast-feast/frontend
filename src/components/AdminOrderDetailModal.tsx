import { motion } from 'framer-motion';
import { CheckCircle2, ChefHat, PackageCheck, X, XCircle, Clock, User, Store, CreditCard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { OrderDTO } from '@/services/orders';
import { STATUS_STYLES, STATUS_LABELS, orderCustomerName, orderFormatTime } from '@/lib/adminOrders';

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

interface AdminOrderDetailModalProps {
  order: OrderDTO;
  onClose: () => void;
}

export default function AdminOrderDetailModal({ order, onClose }: AdminOrderDetailModalProps) {
  const status = order.status;
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const showTimeline = !isCancelled && !isCompleted;
  const currentStepIndex = showTimeline ? steps.findIndex((s) => s.key === status) : -1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-[440px] max-h-[90dvh] overflow-y-auto no-scrollbar bg-card rounded-t-2xl md:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-white">Order {order.token}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_STYLES[order.status] || STATUS_STYLES.received}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-card-elevated flex items-center justify-center text-[#A0A0A0] hover:text-white transition-colors"
            aria-label="Close order details"
          >
            <X size={15} />
          </button>
        </div>

        {/* Token & QR */}
        <div className="mx-5 bg-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-3xl font-extrabold text-[#FF6B35] text-shadow-token tracking-tighter">{order.token}</p>
            <p className="text-[10px] text-[#6B6B6B] mt-1">
              {order.canteenName} • Estimated {order.estimatedTime || '15-20 min'}
            </p>
          </div>
          <div className="bg-card-elevated p-1.5 rounded-xl">
            <QRCodeSVG value={`FASTFEAST:${order.token}`} size={52} bgColor="#1A1A1A" fgColor="#FFFFFF" level="L" />
          </div>
        </div>

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="mx-5 mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <XCircle size={28} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-400">Order Cancelled</p>
          </div>
        )}

        {/* Completed Banner */}
        {isCompleted && (
          <div className="mx-5 mt-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
            <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-400">Order Completed</p>
          </div>
        )}

        {/* Timeline */}
        {showTimeline && (
          <div className="mx-5 mt-6">
            <div className="relative">
              <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-white/10" />
              <motion.div
                className="absolute left-[23px] top-6 w-0.5"
                style={{ background: 'linear-gradient(180deg, #10B981, #FF6B35)' }}
                animate={{ height: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                const isDone = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isPending = i > currentStepIndex;
                return (
                  <div key={step.key} className="flex items-start gap-4 relative mb-5 last:mb-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-500 ${
                        isDone ? 'green-gradient' : isCurrent ? 'food-gradient' : 'bg-card-elevated'
                      }`}
                      style={isCurrent ? { boxShadow: `0 0 20px ${step.color}40` } : {}}
                    >
                      {isDone && <CheckCircle2 size={22} className="text-white" />}
                      {isCurrent && <StepIcon size={22} className="text-white" />}
                      {isPending && <StepIcon size={22} className="text-[#6B6B6B]" />}
                    </div>
                    <div className="pt-2">
                      <p className={`text-sm font-semibold ${isPending ? 'text-[#6B6B6B]' : 'text-white'}`}>{step.label}</p>
                      <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                        {isDone ? 'Completed' : isCurrent ? 'In progress...' : 'Waiting'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Message */}
        {showTimeline && (
          <div className="mx-5 mt-4 text-center">
            <p className="text-base font-semibold text-white">{statusMessages[order.status] || statusMessages.received}</p>
          </div>
        )}

        {/* Order Info */}
        <div className="mx-5 mt-5 space-y-2.5">
          <div className="flex items-center gap-3">
            <Store size={15} className="text-[#6B6B6B] flex-shrink-0" />
            <p className="text-xs text-[#A0A0A0]">{order.canteenName}</p>
          </div>
          <div className="flex items-center gap-3">
            <User size={15} className="text-[#6B6B6B] flex-shrink-0" />
            <p className="text-xs text-[#A0A0A0]">{orderCustomerName(order)}</p>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard size={15} className="text-[#6B6B6B] flex-shrink-0" />
            <p className="text-xs text-[#A0A0A0]">{order.paymentMethod}</p>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={15} className="text-[#6B6B6B] flex-shrink-0" />
            <p className="text-xs text-[#A0A0A0]">{orderFormatTime(order.createdAt)}</p>
          </div>
          {order.isGroupOrder && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full purple-gradient text-white">Group order</span>
          )}
          {order.notes && (
            <p className="text-xs text-amber-400">
              <span className="text-[#6B6B6B]">Note:</span> {order.notes}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="mx-5 mt-5">
          <p className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wide mb-2">Items</p>
          <div className="bg-card-elevated rounded-xl p-3 space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-[#6B6B6B]">
                    {item.quantity} × ₹{item.price}
                    {item.spiceLevel ? ` • ${item.spiceLevel}` : ''}
                  </p>
                </div>
                <p className="text-sm font-medium text-white flex-shrink-0">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mx-5 mt-4 mb-6 space-y-1.5">
          <div className="flex justify-between text-xs text-[#A0A0A0]">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-xs text-[#A0A0A0]">
            <span>GST</span>
            <span>₹{order.gst}</span>
          </div>
          <div className="flex justify-between text-xs text-[#A0A0A0]">
            <span>Platform fee</span>
            <span>₹{order.platformFee}</span>
          </div>
          <div className="flex justify-between text-xs text-[#A0A0A0]">
            <span>Discount</span>
            <span>-₹{order.discount}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/[0.06]">
            <span>Total</span>
            <span>₹{order.finalTotal}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
