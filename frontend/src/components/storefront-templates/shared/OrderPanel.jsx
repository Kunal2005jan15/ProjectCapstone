import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Smartphone, Wallet, Banknote } from "lucide-react";
import { computeBill } from "@/lib/billing";

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "cod", label: "COD", icon: Banknote },
];

// A no-op fallback so this panel can render safely wherever a real cart
// isn't wired in yet (e.g. the admin's static template preview).
const EMPTY_CART = { items: [], count: 0, total: 0, updateQty: () => {}, removeItem: () => {} };

export default function OrderPanel({
  cart,
  accent,
  accentText,
  onCheckout,
  showPaymentMethods = false,
  title = "Your Order",
  className = "",
}) {
  const { items, count, total, updateQty, removeItem } = cart || EMPTY_CART;
  const [method, setMethod] = useState("card");
  const bill = computeBill(total);

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm ${className}`}
      style={{ borderColor: "rgba(0,0,0,0.08)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">{count} {count === 1 ? "item" : "items"}</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-sm text-gray-400">
          <ShoppingBag className="h-7 w-7 opacity-40" />
          Your cart is empty
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 320 }}>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-3 text-center text-xs font-medium">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{bill.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{bill.taxLabel}</span>
              <span>₹{bill.tax}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>₹{bill.total}</span>
            </div>
          </div>

          {showPaymentMethods && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-gray-400">Select Payment Method</p>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className="flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] font-medium transition-colors"
                    style={
                      method === m.id
                        ? { borderColor: accent, color: accent, background: `${accent}14` }
                        : { borderColor: "rgba(0,0,0,0.08)", color: "#6B7280" }
                    }
                  >
                    <m.icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onCheckout}
            style={{ background: accent, color: accentText }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
          >
            Proceed to Pay · ₹{bill.total}
          </button>
        </>
      )}
    </div>
  );
}