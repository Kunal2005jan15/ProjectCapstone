import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, UtensilsCrossed } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { IndianRupee, ShoppingCart, Users, QrCode, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useStore } from "@/context/StoreContext";

const PIE_COLORS = ["#FA4616", "#FACC15", "#22C55E", "#3B82F6", "#A855F7"];

export default function Dashboard() {
  const { shop } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isDineIn = shop?.serviceType === "DINE_IN";

  useEffect(() => {
    api.get("/analytics/overview")
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Orders", value: stats?.totalOrders ?? "-", icon: ShoppingCart, color: PIE_COLORS[0] },
    { label: "Total Sales", value: `₹${stats?.totalSales ?? "-"}`, icon: IndianRupee, color: PIE_COLORS[2] },
    { label: "Avg Order Value", value: `₹${stats?.avgOrderValue ?? "-"}`, icon: TrendingUp, color: PIE_COLORS[3] },
    { label: "New Customers", value: stats?.newCustomers ?? "-", icon: Users, color: PIE_COLORS[4] },
  ];

  return (
    <div>
      {/* Branded page header — makes it obvious which app/dashboard this is,
          plus a friendly welcome using the shop's own name. */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono-ticket text-[10px] uppercase tracking-wide text-muted-foreground">
              QROder · Dashboard
            </p>
            <h1 className="font-heading text-xl font-bold leading-tight">
              Welcome back{shop?.name ? `, ${shop.name}` : ""}
            </h1>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          Store is live
        </span>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${color}1A`, color }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Counter-only QR block — only shown when shop has no dine-in tables */}
      {!isDineIn && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-xl border bg-card p-4 mb-6"
        >
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" /> Your Order QR Code
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Since you&apos;re counter/takeaway only, customers scan this single QR to order — no table needed.
          </p>
          <div className="flex justify-center bg-white rounded-lg p-4 w-fit mx-auto shadow-sm">
            <QrCode className="w-32 h-32" />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2 font-mono-ticket">
            Links to: /store/{shop?.slug}
          </p>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-xl border bg-card p-4"
        >
          <h3 className="font-medium mb-2">Order Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.orderTrend ?? []}>
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#FA4616" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="rounded-xl border bg-card p-4"
        >
          <h3 className="font-medium mb-2">Order Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats?.statusBreakdown ?? []}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
              >
                {(stats?.statusBreakdown ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent orders + top items */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl border bg-card p-4"
        >
          <h3 className="font-medium mb-3">Recent Orders</h3>
          <div className="space-y-2">
            {(stats?.recentOrders ?? []).map((order) => (
              <div key={order.id} className="flex justify-between text-sm border-b pb-2">
                <span className="font-mono-ticket">#ORD-{order.id}</span>
                <span className="text-muted-foreground">{order.itemCount} items</span>
                <span className="font-medium">₹{order.total}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="rounded-xl border bg-card p-4"
        >
          <h3 className="font-medium mb-3">Top Items</h3>
          <div className="space-y-2">
            {(stats?.topItems ?? []).map((item) => (
              <div key={item.name} className="flex justify-between text-sm border-b pb-2">
                <span>{item.name}</span>
                <span className="text-muted-foreground">{item.orderCount} sold</span>
              </div>
            ))}
            {(!stats?.topItems || stats.topItems.length === 0) && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}