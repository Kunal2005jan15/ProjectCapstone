import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed,
  ArrowLeft,
  QrCode,
  Utensils,
  ShoppingBag,
} from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    shopName: "",
    email: "",
    password: "",
    serviceType: "DINE_IN",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await register(form);
      setStatus("success");
      toast.success("Account created — let's set up your store.");
      setTimeout(() => navigate("/onboarding/template"), 550);
    } catch (err) {
      setStatus("error");
      toast.error(apiError(err));
      setTimeout(() => setStatus("idle"), 550);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-secondary p-10 text-secondary-foreground md:flex">
        <div className="paper-grain pointer-events-none absolute inset-0 opacity-40" />
        <Link
          to="/"
          className="relative flex items-center gap-2 font-heading text-lg font-semibold"
        >
          <UtensilsCrossed className="h-5 w-5" /> QROder
        </Link>

        <div className="relative">
          <QrCode className="h-8 w-8 opacity-70" />
          <p className="mt-4 max-w-xs font-heading text-2xl font-semibold leading-snug">
            Your shop, branded and taking orders in minutes.
          </p>
          <p className="mt-3 max-w-xs text-sm text-secondary-foreground/70">
            Set your menu, pick a template, and print your table codes — no
            developer needed.
          </p>
        </div>

        <p className="relative font-mono-ticket text-xs text-secondary-foreground/50">
          NO. 0148 · TABLE 04
        </p>
      </aside>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-8 flex items-center gap-1 text-sm text-muted-foreground md:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <h1 className="font-heading text-2xl font-bold">Create your shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Takes about two minutes. You can change any of this later.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <motion.div
              animate={{ opacity: status === "idle" ? 1 : 0.6 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="shopName">Shop name</Label>
                <Input
                  id="shopName"
                  placeholder="Brew & Bowl Café"
                  value={form.shopName}
                  onChange={(e) =>
                    setForm({ ...form, shopName: e.target.value })
                  }
                  disabled={status !== "idle"}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={status !== "idle"}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  disabled={status !== "idle"}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Service type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={status !== "idle"}
                    onClick={() => setForm({ ...form, serviceType: "DINE_IN" })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-sm border px-3 py-3 text-sm transition-colors",
                      form.serviceType === "DINE_IN"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Utensils className="h-4 w-4" />
                    Dine-in
                  </button>
                  <button
                    type="button"
                    disabled={status !== "idle"}
                    onClick={() =>
                      setForm({ ...form, serviceType: "COUNTER_ONLY" })
                    }
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-sm border px-3 py-3 text-sm transition-colors",
                      form.serviceType === "COUNTER_ONLY"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Counter / takeaway
                  </button>
                </div>
              </div>
            </motion.div>

            <AuthSubmitButton
              status={status}
              idleLabel="Create shop"
              loadingLabel="Creating…"
              successLabel="Shop created"
            />
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}