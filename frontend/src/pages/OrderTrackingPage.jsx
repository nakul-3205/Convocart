import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { PackageCheck, Clock, XCircle, CheckCircle2, Footprints, ScrollText, MapPin } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import Header from '../components/Header';
import StitchDivider from '../components/StitchDivider';
import AuditTrail from '../components/AuditTrail';
import { formatRupees, formatDate } from '../lib/format';

const STAGES = {
  pending: { label: 'Awaiting payment', icon: Clock, tone: 'text-ochre', dot: 'bg-ochre' },
  paid: { label: 'Payment confirmed', icon: CheckCircle2, tone: 'text-pine', dot: 'bg-pine' },
  failed: { label: 'Payment failed', icon: XCircle, tone: 'text-brick', dot: 'bg-brick' },
  expired: { label: 'Checkout expired', icon: XCircle, tone: 'text-muted', dot: 'bg-faint' },
};

// The timeline can include internal agent-behavior events (upsell offered/skipped) —
// meaningful on the admin trail, not something a customer needs to see about their
// own order. Keep the public view to actual order/payment lifecycle events.
const CUSTOMER_FACING_EVENTS = new Set([
  'order_created',
  'payment_initiated',
  'payment_captured',
  'payment_failed',
  'order_expired',
  'payment_reconciled_late',
]);

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId || !token) {
      setError("This tracking link looks incomplete — check you copied the full URL from your email.");
      return;
    }
    api
      .trackOrder(orderId, token)
      .then(setOrder)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
          setError("We couldn't find that order — double-check the link from your confirmation email.");
        } else {
          setError('Could not load your order right now. Try again in a moment.');
        }
      });
  }, [orderId, token]);

  const stage = order && (STAGES[order.status] || STAGES.pending);
  const timeline = (order?.timeline || [])
    .filter((t) => CUSTOMER_FACING_EVENTS.has(t.eventType))
    .map((t, i) => ({ id: i, eventType: t.eventType, reasonText: t.reasonText, createdAt: t.at }));

  return (
    <div className="min-h-screen">
      <Header variant="marketing" />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {error && (
          <div className="card fade-in-up p-8 text-center">
            <XCircle size={32} className="mx-auto mb-3 text-brick" strokeWidth={1.5} />
            <p className="text-sm text-muted">{error}</p>
            <Link to="/" className="btn-secondary mt-5 inline-flex">
              Back to Convocart
            </Link>
          </div>
        )}

        {!order && !error && <TrackingSkeleton />}

        {order && stage && (
          <>
            <div className="fade-in-up mb-6 text-center">
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-faint">Order {orderId.slice(0, 8).toUpperCase()}</p>
              <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${stage.dot}/15`}>
                <stage.icon size={22} className={stage.tone} strokeWidth={1.75} />
              </div>
              <h1 className={`font-display text-xl font-semibold ${stage.tone}`}>{stage.label}</h1>
              <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
            </div>

            {/* Simple two-stage tracker: what the backend actually models, nothing invented */}
            <div className="card fade-in-up mb-6 flex items-center gap-3 p-5" style={{ animationDelay: '60ms' }}>
              <TrackerStep done label="Order placed" />
              <div className="h-px flex-1 bg-line" />
              <TrackerStep
                done={order.status !== 'pending'}
                active={order.status === 'pending'}
                label={stage.label}
                tone={stage.tone}
                dot={stage.dot}
              />
            </div>

            <section className="card fade-in-up mb-6 p-5" style={{ animationDelay: '120ms' }}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Items</h2>
              <div className="divide-y divide-line">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-pine-soft">
                      <Footprints size={15} strokeWidth={1.5} className="text-pine" />
                    </div>
                    <span className="flex-1">
                      {item.name} <span className="text-faint">× {item.qty}</span>
                    </span>
                    <span className="font-mono">{formatRupees(item.unitPrice * item.qty)}</span>
                  </div>
                ))}
              </div>
              <StitchDivider className="my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatRupees(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery</span>
                  <span className="font-mono">{formatRupees(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-ink">
                  <span>Total</span>
                  <span className="font-mono">{formatRupees(order.total)}</span>
                </div>
              </div>
            </section>

            {(order.address || order.phoneNo) && (
              <section className="card fade-in-up mb-6 p-5" style={{ animationDelay: '150ms' }}>
                <div className="mb-3 flex items-center gap-1.5 text-muted">
                  <MapPin size={13} strokeWidth={2} />
                  <h2 className="text-xs font-semibold uppercase tracking-wide">Delivering to</h2>
                </div>
                {order.address && <p className="text-sm text-ink">{order.address}{order.pincode ? `, ${order.pincode}` : ''}</p>}
                {order.phoneNo && <p className="mt-0.5 text-sm text-muted">{order.phoneNo}</p>}
              </section>
            )}

            {timeline.length > 0 && (
              <section className="card fade-in-up mb-6 p-5" style={{ animationDelay: '180ms' }}>
                <div className="mb-4 flex items-center gap-1.5 text-muted">
                  <ScrollText size={13} strokeWidth={2} />
                  <h2 className="text-xs font-semibold uppercase tracking-wide">Order history</h2>
                </div>
                <AuditTrail logs={timeline} mode="customer" />
              </section>
            )}

            <div className="fade-in-up mt-8 flex justify-center gap-1.5" style={{ animationDelay: '240ms' }}>
              <PackageCheck size={16} className="mt-0.5 text-faint" />
              <p className="text-xs text-faint">This link is unique to your order — no login required.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TrackerStep({ done, active, label, tone = 'text-pine', dot = 'bg-pine' }) {
  return (
    <div className="flex flex-none flex-col items-center gap-1.5">
      <span
        className={`h-2.5 w-2.5 rounded-full ${done || active ? dot : 'bg-line'} ${active ? 'ring-4 ring-offset-0 ' + dot + '/20' : ''}`}
      />
      <span className={`text-[11px] font-medium ${done || active ? tone : 'text-faint'}`}>{label}</span>
    </div>
  );
}

function TrackingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <div className="skeleton h-12 w-12 rounded-full" />
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-3 w-28" />
      </div>
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}
