import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { devLogger } from '../lib/devLogger';

// Wraps every /admin/* route except the login page itself. The admin cookie is
// httpOnly, so the frontend can't just "check" for it locally — the only real signal
// is whether a protected admin endpoint accepts it. This probes that on every admin
// route change and fails CLOSED: any error (401, network failure, anything else)
// sends the visitor to the login page rather than rendering admin content.
export default function RequireAdminAuth({ children }) {
  const [status, setStatus] = useState('checking'); // checking | authed | unauthed
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    setStatus('checking');

    api
      .adminListOrders()
      .then(() => {
        if (!cancelled) setStatus('authed');
      })
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof ApiError && err.status === 401)) {
          // Not even a clean 401 (network error, 500, etc.) — still fail closed.
          // Terminal-only, same as every other API log — never the browser console.
          devLogger.error(`admin auth check failed: ${err.message || err}`);
        }
        setStatus('unauthed');
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Checking admin access…</p>
      </div>
    );
  }

  if (status === 'unauthed') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
