import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Minus, Plus, Trash2, Loader2, ShoppingBag, ShieldCheck,
  Sparkles, Heart, ChefHat,
} from "lucide-react";
import { getTemplateSkin } from "@/lib/templates";
import { computeBill } from "@/lib/billing";

// Razorpay's checkout.js used to be loaded on EVERY page via a blocking
// <script> tag in index.html — that delayed first paint (including the
// Login page) on every visit. Instead we lazy-load it only when someone
// actually reaches payment, and cache the promise so repeat checkouts
// don't refetch it.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Could not load payment gateway. Check your connection."));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
};

// TEMPORARY: set VITE_SKIP_PAYMENT=true in your .env to bypass Razorpay
// entirely — clicking "Pay" just creates the order and takes the customer
// straight to the order page, no payment step at all. Flip this back to
// false (or remove the env var) once you're ready to take real payments.
const SKIP_PAYMENT = import.meta.env.VITE_SKIP_PAYMENT === "true";

// Friendly, on-brand copy — cycles while the order is being placed, so the
// short wait feels intentional rather than like the page is stuck.
function useProcessingMessages(active, shopName) {
  const messages = [
    "Sending your order to the kitchen...",
    shopName ? `Letting ${shopName} know you're hungry...` : "Letting the kitchen know you're hungry...",
    "Plating up your ticket...",
    "Almost there...",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return messages[index];
}

export default function Checkout() {
  const { items, updateQty, removeItem, total } = useCart();
  const { shop } = useStore();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [placing, setPlacing] = useState(false);

  const skin = getTemplateSkin(shop?.templateId, shop?.theme);
  const processingMessage = useProcessingMessages(placing, shop?.name);

  // Same calculation used by the "Your Order" panel on the new desktop
  // templates, so a customer never sees a different total there than what
  // they're actually charged here.
  const bill = computeBill(total);
  const tax = bill.tax;
  const grandTotal = bill.total;

  const handlePayment = async () => {
    if (!customerPhone) {
      toast.error("Please enter your phone number");
      return;
    }
    setPlacing(true);
    try {
      // Step A: create a pending order on the backend (no login required)
      const orderRes = await api.post("/orders/guest", {
        shopId: shop.id,
        items: items.map((i) => ({ itemId: i.id, qty: i.qty, price: i.price })),
        customerName,
        customerPhone,
        totalAmount: grandTotal,
      });

      const order = orderRes.data;

      if (SKIP_PAYMENT) {
        toast.success("Order placed! (test mode — payment skipped)");
        navigate(`/order/${order.id}`);
        return;
      }

      // Step B: create a Razorpay payment order (backend returns razorpayOrderId)
      const paymentRes = await api.post(`/payments/create`, {
        orderId: order.id,
        amount: grandTotal,
      });

      // If the backend has no real Razorpay keys configured, it runs in mock
      // mode: skip the real payment widget entirely and just verify directly.
      // This lets checkout work out of the box in local dev/demo. Once real
      // RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set on the backend,
      // paymentRes.data.mock will be false and the real widget below runs.
      if (paymentRes.data.mock) {
        await api.post("/payments/verify", {
          orderId: order.id,
          razorpay_payment_id: paymentRes.data.razorpayOrderId,
          razorpay_order_id: paymentRes.data.razorpayOrderId,
          razorpay_signature: "mock",
        });
        toast.success("Order placed!");
        navigate(`/order/${order.id}`);
        return;
      }

      // Step C: open Razorpay checkout
      await loadRazorpayScript();
      const options = {
        key: paymentRes.data.razorpayKeyId,
        amount: paymentRes.data.amount,
        currency: "INR",
        name: shop?.name || "QROder",
        description: `Order #${order.id}`,
        order_id: paymentRes.data.razorpayOrderId,
        handler: async (response) => {
          // Step D: verify payment on backend
          await api.post("/payments/verify", {
            orderId: order.id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success("Payment successful!");
          navigate(`/order/${order.id}`);
        },
        modal: {
          // Razorpay's widget takes over the "processing" state itself once
          // open, so drop our own overlay to avoid two spinners stacking.
          ondismiss: () => setPlacing(false),
        },
        prefill: { name: customerName, contact: customerPhone },
        theme: { color: skin.accent },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(apiError(err));
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: skin.pageBg, color: skin.muted }}
        className="flex h-[60vh] min-h-screen flex-col items-center justify-center gap-2 p-8 text-center"
      >
        <ShoppingBag className="h-8 w-8 opacity-40" />
        Your cart is empty.
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{ background: skin.pageBg, color: skin.text, fontFamily: skin.font }}
      className="min-h-screen"
    >
      <div className="max-w-md mx-auto p-4 pb-32">
        {/* Shop-branded header — logo, name and a friendly headline so the
            checkout still feels like this specific store, not a generic form */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 flex flex-col items-center text-center"
        >
          {shop?.theme?.logoUrl ? (
            <motion.img
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              src={shop.theme.logoUrl}
              alt=""
              className="h-14 w-14 rounded-full object-cover shadow-sm"
              style={{ border: `2px solid ${skin.accent}` }}
            />
          ) : (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm"
              style={{ background: skin.accent, color: skin.accentText }}
            >
              <ChefHat className="h-6 w-6" />
            </motion.div>
          )}
          <p className="mt-2 text-base font-bold">{shop?.name || "Your Order"}</p>
          <p className="mt-0.5 text-xs" style={{ color: skin.muted }}>
            You're almost there — review &amp; pay to send it to the kitchen
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-lg font-bold mb-4 tracking-tight"
        >
          Your Order
        </motion.h1>

        <div className="space-y-3 mb-6">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24, height: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                style={{ borderBottom: `1px solid ${skin.border}` }}
                className="flex justify-between items-center pb-3"
              >
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs" style={{ color: skin.muted }}>₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    style={{ border: `1px solid ${skin.border}` }}
                    className="rounded-full p-1 transition-colors hover:opacity-70"
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>
                  <motion.span
                    key={item.qty}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm w-4 text-center"
                  >
                    {item.qty}
                  </motion.span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    style={{ border: `1px solid ${skin.border}` }}
                    className="rounded-full p-1 transition-colors hover:opacity-70"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bill summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ background: skin.surface, border: `1px solid ${skin.border}` }}
          className="rounded-lg p-4 mb-6 space-y-1 text-sm shadow-sm"
        >
          <div className="flex justify-between"><span>Subtotal</span><span>₹{total}</span></div>
          <div className="flex justify-between" style={{ color: skin.muted }}><span>Tax (5%)</span><span>₹{tax}</span></div>
          <div
            className="flex justify-between font-bold text-base pt-2 mt-2"
            style={{ borderTop: `1px solid ${skin.border}` }}
          >
            <span>Total</span>
            <motion.span key={grandTotal} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}>
              ₹{grandTotal}
            </motion.span>
          </div>
        </motion.div>

        {/* Customer details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="space-y-3 mb-6"
        >
          <div>
            <Label>Your Name</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="For order updates" required />
          </div>
          <p className="flex items-center gap-1.5 text-[11px] pt-1" style={{ color: skin.muted }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {SKIP_PAYMENT ? "Test mode — no real payment will be taken" : "Secure payment powered by Razorpay"}
          </p>
        </motion.div>

        {/* Return-visit tagline — a small, on-brand nudge to come back */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          style={{ border: `1px dashed ${skin.accent}66`, color: skin.text }}
          className="flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-xs"
        >
          <Heart className="h-4 w-4 shrink-0" style={{ color: skin.accent }} />
          <span>
            Good food deserves a repeat visit — scan the code again next time,
            {shop?.name ? ` ${shop.name}` : " we"} will be ready for you.
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.2 }}
        style={{
          background: skin.surfaceStrong,
          borderTop: `1px solid ${skin.border}`,
        }}
        className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
      >
        <div className="max-w-md mx-auto">
          {SKIP_PAYMENT && (
            <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-amber-600">
              ⚠ Test Mode — Razorpay is bypassed
            </p>
          )}
          <Button
            onClick={handlePayment}
            disabled={placing}
            style={{ background: skin.accent, color: skin.accentText }}
            className="w-full transition-transform active:scale-[0.98] hover:opacity-90"
            size="lg"
          >
            {placing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {placing ? "Processing..." : SKIP_PAYMENT ? `Place Order · ₹${grandTotal}` : `Pay ₹${grandTotal}`}
          </Button>
        </div>
      </motion.div>

      {/* Full-screen waiting animation while the order is being placed */}
      <AnimatePresence>
        {placing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
            style={{ background: `${skin.pageBg}E6` }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-full shadow-md"
              style={{ background: skin.accent, color: skin.accentText }}
            >
              <ShoppingBag className="h-7 w-7" />
            </motion.div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="h-2 w-2 rounded-full"
                  style={{ background: skin.accent }}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={processingMessage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="max-w-[220px] text-center text-sm font-medium"
                style={{ color: skin.text }}
              >
                {processingMessage}
              </motion.p>
            </AnimatePresence>
            <p className="flex items-center gap-1 text-[11px]" style={{ color: skin.muted }}>
              <Sparkles className="h-3 w-3" /> Good things are worth the wait
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}