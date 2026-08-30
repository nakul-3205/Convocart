import { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { formatRupees, shortId } from '../../lib/format';
import StitchDivider from '../StitchDivider';

const EMPTY_DELIVERY = { customerName: '', phone: '', email: '', address: '', pincode: '', deliveryNotes: '' };

function validate(d) {
  const errors = {};
  if (!d.customerName.trim() || d.customerName.length > 100) errors.customerName = 'Enter a name (under 100 characters).';
  if (d.phone.length < 10 || d.phone.length > 15) errors.phone = 'Phone should be 10–15 digits.';
  if (!/^\S+@\S+\.\S+$/.test(d.email) || d.email.length > 150) errors.email = 'Enter a valid email.';
  if (!d.address.trim() || d.address.length > 300) errors.address = 'Enter a delivery address (under 300 characters).';
  if (d.pincode.length < 4 || d.pincode.length > 10) errors.pincode = 'Pincode should be 4–10 characters.';
  if (d.deliveryNotes.length > 300) errors.deliveryNotes = 'Keep notes under 300 characters.';
  return errors;
}

export default function CheckoutFlow({ onBack, onCartRefresh, onClose }) {
  const [step, setStep] = useState('delivery'); // delivery | review | success | failure
  const [delivery, setDelivery] = useState(EMPTY_DELIVERY);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [order, setOrder] = useState(null); // { orderId, razorpayOrderId, amount, currency, keyId }
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function field(name) {
    return {
      value: delivery[name],
      onChange: (e) => setDelivery((d) => ({ ...d, [name]: e.target.value })),
    };
  }

  async function handleContinueToReview(e) {
    e.preventDefault();
    const v = validate(delivery);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      const data = await api.checkoutPreview(delivery);
      setPreview(data);
      setStep('review');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Could not load your order preview.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmAndPay() {
    setLoading(true);
    setServerError('');
    try {
      const confirmed = await api.checkoutConfirm(delivery);
      setOrder(confirmed);
      onCartRefresh?.(); // backend clears the cart as soon as the order is created
      launchPayment(confirmed);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : 'Could not start the payment. Your cart is untouched — try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  function launchPayment(activeOrder) {
    openRazorpayCheckout(activeOrder, {
      customerName: delivery.customerName,
      phone: delivery.phone,
      email: delivery.email,
      onSuccess: () => setStep('success'),
      onFailure: () => setStep('failure'),
      onDismiss: () => setStep((s) => (s === 'success' ? s : 'failure')),
    });
  }

  // --- Delivery form ---
  if (step === 'delivery') {
    return (
      <form onSubmit={handleContinueToReview} className="flex h-full flex-col">
        <DrawerHeader title="Delivery details" onBack={onBack} />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <FormField label="Full name" error={errors.customerName}>
            <input className="input-field" {...field('customerName')} maxLength={100} required />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <input className="input-field" {...field('phone')} maxLength={15} required inputMode="tel" />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input type="email" className="input-field" {...field('email')} maxLength={150} required />
          </FormField>
          <FormField label="Address" error={errors.address}>
            <textarea rows={2} className="input-field resize-none" {...field('address')} maxLength={300} required />
          </FormField>
          <FormField label="Pincode" error={errors.pincode}>
            <input className="input-field" {...field('pincode')} maxLength={10} required inputMode="numeric" />
          </FormField>
          <FormField label="Delivery notes (optional)" error={errors.deliveryNotes}>
            <textarea rows={2} className="input-field resize-none" {...field('deliveryNotes')} maxLength={300} />
          </FormField>
          {serverError && <p className="text-sm text-brick">{serverError}</p>}
        </div>
        <DrawerFooter>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Checking…' : 'Review order'}
          </button>
        </DrawerFooter>
      </form>
    );
  }

  // --- Review ---
  if (step === 'review') {
    return (
      <div className="flex h-full flex-col">
        <DrawerHeader title="Review your order" onBack={() => setStep('delivery')} />
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Items</h3>
            <div className="divide-y divide-line">
              {preview?.cart.items.map((item) => (
                <div key={item.productId} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.name} <span className="text-faint">× {item.qty}</span>
                  </span>
                  <span className="font-mono">{formatRupees(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <StitchDivider className="my-3" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-mono">{formatRupees(preview?.cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span className="font-mono">{formatRupees(preview?.cart.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-ink">
                <span>Total</span>
                <span className="font-mono">{formatRupees(preview?.cart.total)}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Delivering to</h3>
            <p className="text-sm text-ink">{delivery.customerName}</p>
            <p className="text-sm text-muted">{delivery.address}, {delivery.pincode}</p>
            <p className="text-sm text-muted">{delivery.phone} · {delivery.email}</p>
          </section>

          {serverError && <p className="text-sm text-brick">{serverError}</p>}
        </div>
        <DrawerFooter>
          <button type="button" onClick={handleConfirmAndPay} disabled={loading} className="btn-primary w-full">
            {loading ? 'Setting up payment…' : `Confirm & pay ${formatRupees(preview?.cart.total)}`}
          </button>
        </DrawerFooter>
      </div>
    );
  }

  // --- Success ---
  if (step === 'success') {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 size={44} className="mb-4 text-pine" strokeWidth={1.5} />
        <h3 className="font-display text-lg font-semibold text-ink">Order placed</h3>
        <p className="mt-1 text-sm text-muted">Order #{shortId(order?.orderId)} · {formatRupees(order?.amount)}</p>
        <StitchDivider className="my-5 w-full max-w-[14rem]" />
        <p className="text-sm text-muted">A confirmation is on its way to {delivery.email}.</p>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary mt-6"
        >
          Continue shopping
        </button>
      </div>
    );
  }

  // --- Failure ---
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <AlertTriangle size={40} className="mb-4 text-brick" strokeWidth={1.5} />
      <h3 className="font-display text-lg font-semibold text-ink">Payment didn't go through</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">
        Your items are still reserved for a short while — you can try the payment again.
      </p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => order && launchPayment(order)} className="btn-primary">
          Try payment again
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          I'll come back later
        </button>
      </div>
    </div>
  );
}

function DrawerHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-2 border-b border-line px-5 py-4">
      <button type="button" onClick={onBack} className="btn-ghost h-8 w-8 p-0" aria-label="Back">
        <ArrowLeft size={16} />
      </button>
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
    </div>
  );
}

function DrawerFooter({ children }) {
  return <div className="border-t border-line px-5 py-4">{children}</div>;
}

function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-brick">{error}</span>}
    </label>
  );
}
