import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import ChatPanel from '../components/chat/ChatPanel';
import CartDrawer from '../components/cart/CartDrawer';
import { api } from '../lib/api';

export default function ShopPage() {
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [cartBusy, setCartBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch {
      // best-effort — the drawer will just show its last known state
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // The API only exposes "add N" (increments) and "remove line entirely" — there's no
  // direct decrement, so setting an absolute quantity is a remove-then-re-add.
  async function handleQtyChange(productId, targetQty) {
    setCartBusy(true);
    try {
      await api.removeFromCart(productId);
      const data = targetQty > 0 ? await api.addToCart(productId, targetQty) : await api.getCart();
      setCart(data);
    } finally {
      setCartBusy(false);
    }
  }

  async function handleRemove(productId) {
    setCartBusy(true);
    try {
      const data = await api.removeFromCart(productId);
      setCart(data);
    } finally {
      setCartBusy(false);
    }
  }

  const cartCount = cart?.items.reduce((sum, i) => sum + i.qty, 0) ?? 0;

  return (
    <div className="flex h-screen flex-col">
      <Header variant="shop" cartCount={cartCount} onCartClick={() => setDrawerOpen(true)} />
      <div className="flex-1 overflow-hidden">
        <ChatPanel onCartChange={refreshCart} seedMessage={location.state?.seed} />
      </div>
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cart={cart}
        busy={cartBusy}
        onQtyChange={handleQtyChange}
        onRemove={handleRemove}
        onRefresh={refreshCart}
      />
    </div>
  );
}
