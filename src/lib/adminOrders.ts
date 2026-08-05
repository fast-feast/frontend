import type { OrderDTO } from '@/services/orders';

/** Status badge styles shared by admin order views. */
export const STATUS_STYLES: Record<string, string> = {
  received: 'bg-[#FF6B35]/15 text-[#FF6B35]',
  preparing: 'bg-amber-500/15 text-amber-400',
  ready: 'bg-green-500/15 text-green-400',
  completed: 'bg-white/10 text-[#A0A0A0]',
  cancelled: 'bg-red-500/15 text-red-400',
};

/** Human-readable status labels shared by admin order views. */
export const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Extract a customer display name from an order.
 * The backend populates `userId` with `{ _id, name, ... }`, but it is typed as a string id.
 */
export function orderCustomerName(order: OrderDTO): string {
  const userId = order.userId as unknown;
  if (userId && typeof userId === 'object') {
    const u = userId as { name?: string };
    return u.name || 'User';
  }
  return 'User';
}

/** Format an ISO timestamp for admin order views. */
export function orderFormatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
