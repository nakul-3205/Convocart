import { useState } from 'react';
import { Plus, Minus, Footprints } from 'lucide-react';
import { formatRupees, resolveImageUrl } from '../../lib/format';

export default function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = async () => {
    await onAdd(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const src = resolveImageUrl(product.imageUrl);
  const showImage = src && !imgError;

  return (
    <div className="card card-hover fade-in-up w-full max-w-[12.5rem] flex-none overflow-hidden">
      <div className="flex h-24 items-center justify-center bg-pine-soft">
        {showImage ? (
          <img
            src={src}
            alt={product.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Footprints size={26} strokeWidth={1.5} className="text-pine" />
        )}
      </div>
      <div className="p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          {product.subCategory && (
            <span className="rounded-full bg-line/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {product.subCategory}
            </span>
          )}
          {product.size && <span className="text-[11px] text-faint">Size {product.size}</span>}
        </div>
        <p className="mb-1.5 text-[13px] font-semibold leading-snug text-ink">{product.name}</p>
        <p className="mb-2.5 font-mono text-[13px] text-ink">{formatRupees(product.price)}</p>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-full border border-line">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-7 w-6 items-center justify-center text-muted hover:text-pine"
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="w-4 text-center text-xs font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(5, q + 1))}
              className="flex h-7 w-6 items-center justify-center text-muted hover:text-pine"
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </div>
          <button type="button" onClick={handleAdd} className="btn-primary h-7 flex-1 px-2 text-[11px]">
            {added ? 'Added ✓' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
