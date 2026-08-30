let scriptPromise = null;

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the payment widget. Check your connection and try again.'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

// order = { orderId, razorpayOrderId, amount, currency, keyId } from POST /api/cart/checkout-confirm
export async function openRazorpayCheckout(order, { customerName, phone, email, onSuccess, onFailure, onDismiss }) {
  await loadRazorpayScript();

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.razorpayOrderId,
    name: 'Convocart',
    description: 'Order payment (test mode)',
    prefill: { name: customerName, contact: phone, email },
    theme: { color: '#35513F' },
    handler: (response) => onSuccess(response),
    modal: {
      ondismiss: () => onDismiss?.(),
    },
  });

  rzp.on('payment.failed', (response) => onFailure?.(response));
  rzp.open();
}
