import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Clock3, PackageSearch } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { formatRupees, formatDate, shortId } from '../lib/format';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .adminListOrders()
      .then(setOrders)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/admin/login');
        } else {
          setError('Could not load orders.');
        }
      });
  }, [navigate]);

  const stats = orders && {
    total: orders.length,
    paid: orders.filter((o) => o.status === 'paid').length,
    pending: orders.filter((o) => o.status === 'pending').length,
  };

  return (
    <div className="min-h-screen">
      <Header variant="admin" />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-6 font-display text-xl font-semibold text-ink">Orders</h1>

        {stats && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <Stat icon={ClipboardList} label="Total orders" value={stats.total} tone="text-ink" bg="bg-line" delay={0} />
            <Stat icon={CheckCircle2} label="Paid" value={stats.paid} tone="text-pine" bg="bg-pine-soft" delay={60} />
            <Stat icon={Clock3} label="Pending" value={stats.pending} tone="text-ochre" bg="bg-ochre-soft" delay={120} />
          </div>
        )}

        {error && <p className="text-sm text-brick">{error}</p>}

        {!orders && !error && <TableSkeleton />}

        {orders && (
          <div className="card fade-in-up overflow-hidden" style={{ animationDelay: '160ms' }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-pine-soft/40 text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <PackageSearch size={28} strokeWidth={1.5} className="mx-auto mb-2 text-faint" />
                      <p className="text-muted">No orders yet.</p>
                    </td>
                  </tr>
                )}
                {orders.map((o, i) => (
                  <tr
                    key={o.id}
                    className="fade-in-up border-b border-line transition-colors last:border-0 hover:bg-pine-soft/30"
                    style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                  >
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-mono text-pine hover:underline">
                        {shortId(o.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 text-muted">{o.phone}</td>
                    <td className="px-4 py-3 font-mono">{formatRupees(o.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone, bg, delay = 0 }) {
  return (
    <div className="card card-hover fade-in-up flex items-center gap-3 px-4 py-3.5" style={{ animationDelay: `${delay}ms` }}>
      <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${bg}`}>
        <Icon size={16} strokeWidth={2} className={tone} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="font-display text-xl font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full" style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}
