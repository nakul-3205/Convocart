import { Plus, Minus, X } from 'lucide-react';
import { formatRupees } from '../../lib/format';

export default function CartLineItem({ item, onQtyChange, onRemove, busy }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted">{formatRupees(item.unitPrice)} each</p>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center rounded-full border border-line">
            <button
              type="button"
              disabled={busy}
              onClick={() => onQtyChange(item.productId, Math.max(1, item.qty - 1))}
              className="flex h-6 w-6 items-center justify-center text-muted hover:text-pine disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={11} />
            </button>
            <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
            <button
              type="button"
              disabled={busy || item.qty >= 5}
              onClick={() => onQtyChange(item.productId, Math.min(5, item.qty + 1))}
              className="flex h-6 w-6 items-center justify-center text-muted hover:text-pine disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={11} />
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(item.productId)}
            className="text-xs font-medium text-faint hover:text-brick disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
      <p className="flex-none font-mono text-sm text-ink">{formatRupees(item.lineTotal)}</p>
    </div>
  );
}
