import { devLogger } from './devLogger';

export const API_BASE = import.meta.env.API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(code, message, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const method = options.method || 'GET';
  const url = `${API_BASE}${path}`;
  const body = options.body ? JSON.parse(options.body) : undefined;
  const started = performance.now();
  devLogger.request(method, url, body);

  let res;
  try {
    res = await fetch(url, {
      credentials: 'include',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      ...options,
    });
  } catch (err) {
    const ms = Math.round(performance.now() - started);
    devLogger.networkError(method, url, ms);
    throw new ApiError(
      'NETWORK',
      `Could not reach the backend at ${API_BASE}. Is it running, and does VITE_API_URL match its port?`,
      0,
    );
  }

  const ms = Math.round(performance.now() - started);
  let payload;
  try {
    payload = await res.json();
  } catch {
    devLogger.responseError(method, url, res.status, ms, 'INTERNAL', 'Response was not valid JSON');
    throw new ApiError('INTERNAL', 'The server sent back something unexpected.', res.status);
  }

  if (!payload.success) {
    const { code, message, details } = payload.error || {};
    devLogger.responseError(method, url, res.status, ms, code || 'INTERNAL', message || 'Something went wrong.');
    throw new ApiError(code || 'INTERNAL', message || 'Something went wrong.', res.status, details);
  }

  devLogger.response(method, url, res.status, ms, payload.data);
  return payload.data;
}

export const api = {
  // Chat
  sendMessage: (message) => request('/api/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  // Products
  searchProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    return request(`/api/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/api/products/${id}`),

  // Cart
  getCart: () => request('/api/cart'),
  addToCart: (productId, qty) =>
    request('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, qty }) }),
  removeFromCart: (productId) => request(`/api/cart/items/${productId}`, { method: 'DELETE' }),

  // Checkout
  checkoutPreview: (delivery) =>
    request('/api/cart/checkout-preview', { method: 'POST', body: JSON.stringify(delivery) }),
  checkoutConfirm: (delivery) =>
    request('/api/cart/checkout-confirm', { method: 'POST', body: JSON.stringify(delivery) }),

  // Admin
  adminLogin: (password) => request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  adminListOrders: () => request('/api/admin/orders'),
  adminGetOrder: (orderId) => request(`/api/admin/orders/${orderId}`),

  // Order tracking (public, token-gated — link comes from the confirmation email)
  trackOrder: (orderId, token) => request(`/api/track/${orderId}?token=${encodeURIComponent(token)}`),
};
