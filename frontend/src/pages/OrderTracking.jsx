import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ChefHat, Bell, ShoppingBag } from "lucide-react";

const STEPS = ["PLACED", "PREPARING", "READY", "COMPLETED"];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount and poll for live updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // poll every 5s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  const currentStep = STEPS.indexOf(order.status);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-lg font-heading font-bold mb-1">Order #{order.id}</h1>
      <p className="text-sm text-muted-foreground mb-6">Estimate time: 15-20 min</p>

      <div className="flex justify-between mb-8">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            animate={{ scale: i === currentStep ? 1.1 : 1 }}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i <= currentStep ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i === 1 ? <ChefHat className="w-4 h-4" /> : i === 2 ? <Bell className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </div>
            <span className="text-xs">{step}</span>
          </motion.div>
        ))}
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.qty} × {item.name}</span>
            <span>₹{item.price * item.qty}</span>
          </div>
        ))}
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Total</span>
          <span>₹{order.totalAmount}</span>
        </div>
      </div>

      <Link to="/">
        <Button variant="outline" className="w-full mt-6">Back to Home</Button>
      </Link>
    </div>
  );
}