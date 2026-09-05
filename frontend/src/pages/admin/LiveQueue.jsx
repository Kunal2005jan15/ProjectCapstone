import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChefHat, Bell, CheckCircle2, Clock, Loader2 } from "lucide-react";

const COLUMNS = [
  { status: "PREPARING", label: "Preparing", icon: ChefHat, next: "READY", nextLabel: "Mark as Ready" },
  { status: "READY", label: "Ready", icon: Bell, next: "COMPLETED", nextLabel: "Mark as Completed" },
  { status: "COMPLETED", label: "Completed", icon: CheckCircle2, next: null },
];

export default function LiveQueue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/live");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount and poll for live updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
     
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success("Order updated");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-xl font-heading font-bold mb-4">Live Order Queue</h1>
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(({ status, label, icon: Icon, next, nextLabel }) => (
          <div key={status} className="bg-card border rounded-lg p-3">
            <h3 className="flex items-center gap-2 font-medium mb-3">
              <Icon className="w-4 h-4" /> {label} ({orders.filter((o) => o.status === status).length})
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {orders.filter((o) => o.status === status).map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border rounded-md p-3 bg-background"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">#ORD-{order.id}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {order.minutesAgo}m ago
                      </span>
                    </div>
                    {order.items?.map((it) => (
                      <p key={it.id} className="text-xs text-muted-foreground">
                        {it.qty} × {it.name}
                      </p>
                    ))}
                    {next && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => updateStatus(order.id, next)}
                      >
                        {nextLabel}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}