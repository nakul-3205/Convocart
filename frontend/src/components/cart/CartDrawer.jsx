import { useEffect, useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { formatRupees } from '../../lib/format';
import CartLineItem from './CartLineItem';
import CheckoutFlow from './CheckoutFlow';
import StitchDivider from '../StitchDivider';

export default function CartDrawer({ open, onClose, cart, busy, onQtyChange, onRemove, onRefresh }) {
  const [mode, setMode] = useState('cart'); // cart | checkout

  // Reset back to the cart view whenever the drawer is freshly reopened.
  useEffect(() => {
    if (open) setMode('cart');
  }, [open]);

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-paper shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {mode === 'checkout' ? (
          <CheckoutFlow
            onBack={() => setMode('cart')}
            onCartRefresh={onRefresh}
            onClose={() => {
              setMode('cart');
              onClose();
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-base font-semibold text-ink">Your cart</h2>
              <button type="button" onClick={onClose} className="btn-ghost h-8 w-8 p-0" aria-label="Close cart">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag size={32} strokeWidth={1.5} className="mb-3 text-faint" />
                  <p className="text-sm text-muted">Nothing here yet — ask the assistant what you're after.</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {cart.items.map((item) => (
                    <CartLineItem
                      key={item.productId}
                      item={item}
                      busy={busy}
                      onQtyChange={onQtyChange}
                      onRemove={onRemove}
                    />
                  ))}
                </div>
              )}
            </div>

            {!isEmpty && (
              <div className="border-t border-line px-5 py-4">
                <StitchDivider className="mb-3" />
                <div className="mb-1 flex justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatRupees(cart.subtotal)}</span>
                </div>
                <div className="mb-3 flex justify-between text-sm text-muted">
                  <span>Delivery</span>
                  <span className="font-mono">{formatRupees(cart.deliveryFee)}</span>
                </div>
                <div className="mb-4 flex justify-between text-base font-semibold text-ink">
                  <span>Total</span>
                  <span className="font-mono">{formatRupees(cart.total)}</span>
                </div>
                <button type="button" onClick={() => setMode('checkout')} className="btn-primary w-full">
                  Checkout
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
