import { Link } from 'react-router-dom';
import { ShoppingBag, MessageSquarePlus } from 'lucide-react';
import { clearChat } from '../lib/chatStorage';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-xs font-bold text-white">
        C
      </span>
      Convocart
    </Link>
  );
}

export default function Header({ variant = 'marketing', cartCount = 0, onCartClick }) {
  function handleNewChat() {
    if (!window.confirm('Start a new chat? This clears your current conversation.')) return;
    clearChat();
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        {variant === 'marketing' && (
          <Link to="/shop" className="btn-primary">
            Start shopping
          </Link>
        )}

        {variant === 'shop' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="btn-ghost gap-1.5 border border-transparent px-3 py-2 hover:border-line"
              aria-label="Start a new chat"
              title="Clears the current conversation"
            >
              <MessageSquarePlus size={16} strokeWidth={2} />
              <span className="hidden sm:inline">New chat</span>
            </button>
            <button
              type="button"
              onClick={onCartClick}
              className="relative flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-pine hover:text-pine"
              aria-label="Open cart"
            >
              <ShoppingBag size={17} strokeWidth={2} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pine px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        )}

        {variant === 'admin' && <span className="text-xs font-semibold uppercase tracking-wide text-muted">Admin</span>}
      </div>
    </header>
  );
}
