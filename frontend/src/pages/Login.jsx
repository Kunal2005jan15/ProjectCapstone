import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import { UtensilsCrossed, ArrowLeft, QrCode } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await login(form);
      setStatus("success");
      toast.success("Welcome back!");
      setTimeout(() => navigate("/admin"), 550);
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
            Every order, live the moment it&apos;s placed.
          </p>
          <p className="mt-3 max-w-xs text-sm text-secondary-foreground/70">
            Log in to your dashboard to manage your menu, tables, and the
            queue in real time.
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

          <h1 className="font-heading text-2xl font-bold">Log in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back — enter your details to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <motion.div
              animate={{ opacity: status === "idle" ? 1 : 0.6 }}
              className="space-y-4"
            >
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
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  disabled={status !== "idle"}
                  required
                />
              </div>
            </motion.div>
            <AuthSubmitButton
              status={status}
              idleLabel="Log in"
              loadingLabel="Logging in…"
              successLabel="Welcome back"
            />
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-primary">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}