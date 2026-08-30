import { Footprints, Sparkles, ShoppingBag } from 'lucide-react';

export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="ambient-blob -right-10 -top-10 h-56 w-56 bg-pine-soft" />
      <div className="ambient-blob -bottom-14 -left-10 h-52 w-52 bg-ochre-soft" />

      <div className="relative rounded-2xl border border-line bg-surface p-1.5 shadow-xl shadow-ink/5">
        {/* fake window chrome */}
        <div className="flex items-center gap-1.5 px-2.5 py-2">
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="ml-2 flex items-center gap-1 rounded-full bg-pine-soft px-2 py-0.5 text-[10px] font-semibold text-pine">
            <ShoppingBag size={9} /> Cart · 1
          </span>
        </div>

        <div className="space-y-3 rounded-xl bg-paper p-3.5">
          {/* user bubble */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-sm bg-pine px-3.5 py-2 text-xs text-white">
              Running shoes under ₹4,000, size 9
            </div>
          </div>

          {/* assistant bubble */}
          <div className="flex items-end gap-1.5">
            <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-pine-soft text-[9px] font-bold text-pine">
              C
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-2 text-xs text-ink">
              Found two solid picks in your size — both under budget.
            </div>
          </div>

          {/* mini product cards */}
          <div className="ml-6 flex gap-2">
            {[
              { name: 'TrailRunner Pro', price: '₹3,299' },
              { name: 'CloudStep Lite', price: '₹3,799' },
            ].map((p) => (
              <div key={p.name} className="w-[6.5rem] flex-none rounded-lg border border-line bg-surface p-1.5">
                <div className="mb-1.5 flex h-9 items-center justify-center rounded-md bg-pine-soft">
                  <Footprints size={13} strokeWidth={1.5} className="text-pine" />
                </div>
                <p className="truncate text-[9.5px] font-semibold text-ink">{p.name}</p>
                <p className="font-mono text-[9px] text-muted">{p.price}</p>
              </div>
            ))}
          </div>

          {/* mini upsell */}
          <div className="ml-6 flex items-center gap-1.5 rounded-lg border border-dashed border-ochre/60 bg-ochre-soft/50 px-2.5 py-2">
            <Sparkles size={11} className="flex-none text-ochre" />
            <p className="text-[9.5px] leading-tight text-ink">Cushioned insoles pair well with these — add for ₹299?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
