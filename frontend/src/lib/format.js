// All monetary values from the API are in paise — always divide by 100 to display.
import { API_BASE } from './api';

export function formatRupees(paise) {
  const rupees = (paise ?? 0) / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelative(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function shortId(id) {
  if (!id) return '';
  return id.slice(0, 8).toUpperCase();
}

// Product images can come back as either a full URL or a path meant to be served
// by the backend (e.g. "/uploads/shoe1.jpg"). A relative path used directly as an
// <img src> resolves against the FRONTEND's origin, not the API's — which 404s
// silently and just shows nothing. This makes either shape work.
export function resolveImageUrl(url) {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
