// Single source of truth for how a cart subtotal turns into a final payable
// amount. Used by Checkout.jsx (the real payment) AND by any template that
// shows a live "Your Order" summary inline (so that preview never shows a
// different total than what the customer is actually charged).
const TAX_RATE = 0.05;

export function computeBill(subtotal) {
  const tax = Math.round(subtotal * TAX_RATE);
  return {
    subtotal,
    tax,
    taxLabel: "Tax (5%)",
    total: subtotal + tax,
  };
}