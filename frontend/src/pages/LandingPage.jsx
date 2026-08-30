import { useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  CreditCard,
  Footprints,
  ShoppingBag,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  X,
  Check,
} from 'lucide-react';
import Header from '../components/Header';
import StitchDivider from '../components/StitchDivider';
import HeroMockup from '../components/HeroMockup';

const STEPS = [
  { icon: MessageSquare, title: 'Say what you want', body: 'Running shoes under ₹4,000, size 9 — plain language is enough.' },
  { icon: Sparkles, title: 'Get real picks', body: 'Actual catalog matches, plus maybe one honest add-on — never more than one.' },
  { icon: CreditCard, title: 'Pay in the chat', body: 'A real Razorpay payment, without ever leaving the conversation.' },
];

const CATEGORIES = [
  { icon: Footprints, label: 'Running', tagline: 'Built for the miles', seed: 'Show me running shoes' },
  { icon: ShoppingBag, label: 'Casual', tagline: 'Everyday comfort', seed: 'Show me casual sneakers' },
  { icon: Briefcase, label: 'Formal', tagline: 'Sharp when it counts', seed: 'Show me formal shoes' },
];

const OLD_WAY = ['Scroll past dozens of options that don\'t fit', 'Open five tabs to compare specs', 'Guess at your size and hope', 'Add-ons buried three clicks deep'];
const NEW_WAY = ['Say your size, budget, and vibe once', 'Get options matched to exactly that', 'One honest suggestion, never a pile-on', 'Checkout without leaving the conversation'];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-clip">
      <Header variant="marketing" />

      {/* Hero */}
      <section className="relative mx-auto grid max-w-5xl gap-12 px-6 pb-20 pt-16 sm:pt-24 lg:grid-cols-2 lg:items-center lg:gap-8">
        <div className="fade-in-up text-center lg:text-left">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-pine">
            <Sparkles size={12} /> Shop by conversation
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            No filters.
            <br />
            No maze of pages.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-muted lg:mx-0">
            Tell Convocart what you need. It searches the real catalog, offers at most one
            useful add-on, and takes payment right there in the chat — like a good salesperson
            at the counter, not a search bar with extra steps.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <button type="button" onClick={() => navigate('/shop')} className="btn-primary px-6 py-3 text-base">
              Start shopping <ArrowRight size={16} />
            </button>
            <p className="text-xs text-faint">No account needed — just start talking.</p>
          </div>
        </div>

        <div className="fade-in-up" style={{ animationDelay: '120ms' }}>
          <HeroMockup />
        </div>
      </section>

      <StitchDivider />

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-3 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">How it works</h2>
        <p className="mb-12 text-center text-sm text-muted">Three steps, start to checkout.</p>
        <div className="grid gap-10 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pine-soft text-pine ring-4 ring-paper">
                <Icon size={21} strokeWidth={1.75} />
              </div>
              <p className="mb-1 font-mono text-[11px] text-faint">Step {i + 1}</p>
              <h3 className="mb-1.5 font-display text-base font-semibold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <StitchDivider />

      {/* Old way vs new way */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
          Filters were never the point
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-surface p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-faint">The old way</p>
            <ul className="space-y-3">
              {OLD_WAY.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-muted">
                  <X size={15} className="mt-0.5 flex-none text-faint" strokeWidth={2} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-pine/30 bg-pine-soft/40 p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-pine">With Convocart</p>
            <ul className="space-y-3">
              {NEW_WAY.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-ink">
                  <Check size={15} className="mt-0.5 flex-none text-pine" strokeWidth={2.25} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <StitchDivider />

      {/* Categories */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">What are you after?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map(({ icon: Icon, label, tagline, seed }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate('/shop', { state: { seed } })}
              className="card card-hover group flex flex-col items-center gap-3 p-8 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-soft text-pine transition-transform duration-200 group-hover:scale-110">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <div>
                <span className="block font-display text-base font-semibold text-ink">{label}</span>
                <span className="block text-xs text-faint">{tagline}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <StitchDivider />

      {/* Trust */}
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-6 py-12 text-center">
        <div className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck size={16} className="text-pine" />
          Secure checkout via Razorpay
        </div>
        <p className="text-xs text-faint">This build runs in test mode for demo purposes.</p>
      </section>

      <footer className="flex flex-col items-center gap-2 border-t border-line px-6 py-8 text-center text-xs text-faint">
        <p>Convocart — a conversational shop-copilot.</p>
        <Link to="/admin/login" className="text-faint underline-offset-2 transition-colors hover:text-muted hover:underline">
          Admin
        </Link>
      </footer>
    </div>
  );
}
