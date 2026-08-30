import {
  PackagePlus,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  Activity,
  Gift,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { formatDate, formatRelative } from '../lib/format';

const EVENTS = {
  order_created: { icon: PackagePlus, tone: 'text-pine', bg: 'bg-pine-soft', label: 'Order placed' },
  payment_initiated: { icon: CreditCard, tone: 'text-ochre', bg: 'bg-ochre-soft', label: 'Payment initiated' },
  payment_captured: { icon: CheckCircle2, tone: 'text-pine', bg: 'bg-pine-soft', label: 'Payment confirmed' },
  payment_failed: { icon: XCircle, tone: 'text-brick', bg: 'bg-brick-soft', label: 'Payment failed' },
  order_expired: { icon: Clock3, tone: 'text-muted', bg: 'bg-line', label: 'Checkout expired' },
  payment_reconciled_late: { icon: ShieldCheck, tone: 'text-pine', bg: 'bg-pine-soft', label: 'Payment reconciled' },
  upsell_offered: { icon: Gift, tone: 'text-ochre', bg: 'bg-ochre-soft', label: 'Add-on suggested' },
  upsell_candidate_skipped: { icon: EyeOff, tone: 'text-muted', bg: 'bg-line', label: 'Add-on held back' },
};
const FALLBACK = { icon: Activity, tone: 'text-muted', bg: 'bg-line', label: null };

// Customer-facing copy — deliberately says nothing about webhooks, reservation TTLs,
// reconciliation checks, or any other backend implementation detail. Admin mode still
// shows the real reasonText for actual debugging value; customers just get plain status.
const CUSTOMER_COPY = {
  order_created: 'Your order was placed and your items were set aside for you.',
  payment_initiated: "We're processing your payment.",
  payment_captured: 'Your payment was received.',
  payment_failed: "Your payment didn't go through.",
  order_expired: 'This order wasn\'t completed in time and was cancelled.',
  payment_reconciled_late: 'Your payment was confirmed.',
};

export default function AuditTrail({ logs, mode = 'admin' }) {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-faint">No audit events recorded for this order yet.</p>;
  }

  return (
    <ol className="space-y-5">
      {logs.map((log, i) => {
        const meta = EVENTS[log.eventType] || FALLBACK;
        const Icon = meta.icon;
        const isLast = i === logs.length - 1;
        const description = mode === 'customer' ? CUSTOMER_COPY[log.eventType] || meta.label : log.reasonText;
        return (
          <li
            key={log.id}
            className="fade-in-up relative flex gap-3.5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {!isLast && <span className="absolute left-[15px] top-8 h-[calc(100%+4px)] w-px bg-line" />}
            <div className={`z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full ${meta.bg}`}>
              <Icon size={15} strokeWidth={2} className={meta.tone} />
            </div>
            <div className="flex-1 pb-0.5 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className={`text-sm font-semibold ${meta.tone}`}>{meta.label || log.eventType}</p>
                <p className="text-xs text-faint" title={formatDate(log.createdAt)}>
                  {formatRelative(log.createdAt)}
                </p>
              </div>
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
