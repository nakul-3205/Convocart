import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 font-mono text-sm text-faint">404</p>
      <h1 className="mb-3 font-display text-2xl font-semibold text-ink">Nothing here.</h1>
      <p className="mb-6 max-w-xs text-sm text-muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">
        Back to Convocart
      </Link>
    </div>
  );
}
