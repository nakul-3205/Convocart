import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Package, ScrollText, MessageCircle } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import StitchDivider from '../components/StitchDivider';
import AuditTrail from '../components/AuditTrail';
import { formatRupees, formatDate, shortId } from '../lib/format';

export default function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .adminGetOrder(orderId)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/admin/login');
        else setError(err instanceof ApiError ? err.message : 'Could not load this order.');
      });
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen">
      <Header variant="admin" />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link to="/admin" className="btn-ghost -ml-3 mb-4 px-3 py-1.5">
          <ArrowLeft size={14} /> All orders
        </Link>

        {error && <p className="text-sm text-brick">{error}</p>}
        {!data && !error && <DetailSkeleton />}

        {data && (
          <>
            <div className="fade-in-up mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5">
              <div>
                <p className="mb-1 font-mono text-xs text-faint">#{shortId(data.order.id)}</p>
                <h1 className="font-display text-xl font-semibold text-ink">{data.order.customerName}</h1>
                <p className="text-sm text-muted">{formatDate(data.order.createdAt)}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={data.order.status} />
                <p className="mt-2 font-mono text-lg font-semibold text-ink">{formatRupees(data.order.total)}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <section className="card card-hover fade-in-up p-5" style={{ animationDelay: '60ms' }}>
                <SectionHeading icon={User} label="Customer & delivery" />
                <p className="text-sm text-ink">{data.order.customerName}</p>
                <p className="text-sm text-muted">{data.order.phone} · {data.order.email}</p>
                <p className="mt-1 text-sm text-muted">{data.order.address}, {data.order.pincode}</p>
                {data.order.deliveryNotes && (
                  <p className="mt-1 text-sm italic text-faint">"{data.order.deliveryNotes}"</p>
                )}
              </section>

              <section className="card card-hover fade-in-up p-5" style={{ animationDelay: '110ms' }}>
                <SectionHeading icon={Package} label="Items" />
                <div className="divide-y divide-line">
                  {data.order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1.5 text-sm">
                      <span>{item.product.name} × {item.qty}</span>
                      <span className="font-mono">{formatRupees(item.unitPriceAtOrder * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <StitchDivider className="my-3" />
                <div className="flex justify-between text-sm font-semibold text-ink">
                  <span>Total</span>
                  <span className="font-mono">{formatRupees(data.order.total)}</span>
                </div>
              </section>
            </div>

            <section className="card fade-in-up mt-6 p-5" style={{ animationDelay: '160ms' }}>
              <SectionHeading icon={ScrollText} label="Audit trail" />
              <AuditTrail logs={data.order.auditLogs} />
            </section>

            <section className="card fade-in-up mt-6 p-5" style={{ animationDelay: '210ms' }}>
              <SectionHeading icon={MessageCircle} label="Chat transcript" />
              <div className="space-y-2.5">
                {data.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        m.role === 'user' ? 'bg-pine text-white' : 'border border-line bg-surface text-ink'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {data.messages.length === 0 && <p className="text-sm text-faint">No messages for this session.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, label }) {
  return (
    <div className="mb-4 flex items-center gap-1.5 text-muted">
      <Icon size={13} strokeWidth={2} />
      <h2 className="text-xs font-semibold uppercase tracking-wide">{label}</h2>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-24 w-full" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-32 w-full" />
      </div>
      <div className="skeleton h-40 w-full" />
    </div>
  );
}
