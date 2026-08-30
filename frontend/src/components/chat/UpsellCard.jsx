import { useState } from 'react';
import { Sparkles, Footprints } from 'lucide-react';
import { formatRupees, resolveImageUrl } from '../../lib/format';

export default function UpsellCard({ reason, product, onAdd, onDecline }) {
  const [resolved, setResolved] = useState(null); // 'added' | 'declined' | null
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd();
      setResolved('added');
    } finally {
      setAdding(false);
    }
  };
  const handleDecline = () => {
    onDecline?.();
    setResolved('declined');
  };

  if (resolved) {
    return (
      <div className="w-full max-w-sm rounded-card border border-dashed border-pine/40 bg-pine-soft/50 px-4 py-3 text-sm text-pine">
        {resolved === 'added' ? "Added — it's in your cart." : 'No worries, skipped.'}
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-card border border-dashed border-ochre/60 bg-ochre-soft/50">
      <div className="p-4 pb-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-ochre">
          <Sparkles size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wide">One suggestion</span>
        </div>
        <p className="text-sm leading-snug text-ink">{reason}</p>
      </div>

      {product && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-ochre/30 bg-surface p-2.5">
          <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-md bg-ochre-soft">
            {resolveImageUrl(product.imageUrl) && !imgError ? (
              <img
                src={resolveImageUrl(product.imageUrl)}
                alt={product.name}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <Footprints size={18} strokeWidth={1.5} className="text-ochre" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{product.name}</p>
            <p className="font-mono text-xs text-muted">{formatRupees(product.price)}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 px-4 pb-4">
        <button type="button" onClick={handleAdd} disabled={adding} className="btn-primary h-8 px-3 text-xs">
          {adding ? 'Adding…' : 'Add to cart'}
        </button>
        <button type="button" onClick={handleDecline} disabled={adding} className="btn-ghost h-8 px-3 text-xs">
          No thanks
        </button>
      </div>
    </div>
  );
}
