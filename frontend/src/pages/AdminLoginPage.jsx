import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import Header from '../components/Header';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.adminLogin(password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Invalid password.' : 'Could not log in — try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header variant="admin" />
      <div className="mx-auto flex max-w-sm flex-col items-center px-6 pt-24">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-pine-soft text-pine">
          <Lock size={19} strokeWidth={1.75} />
        </div>
        <h1 className="mb-1 font-display text-xl font-semibold text-ink">Admin access</h1>
        <p className="mb-6 text-sm text-muted">Enter the admin password to view orders.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
            autoFocus
            required
          />
          {error && <p className="text-sm text-brick">{error}</p>}
          <button type="submit" disabled={loading || !password} className="btn-primary w-full">
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
