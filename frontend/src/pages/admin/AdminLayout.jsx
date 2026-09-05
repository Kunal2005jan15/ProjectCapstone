import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import StoreQrDialog from "@/components/StoreQrDialog";
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  QrCode,
  Palette,
  LogOut,
  ExternalLink,
  UtensilsCrossed,
  TrendingUp,
  Boxes,
  PackageX,
} from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { shop, setShop } = useStore();
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!shop) {
      api
        .get("/shops/theme")
        .then((res) => setShop(res.data))
        .catch((err) => console.error("Failed to load your shop", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDineIn = shop?.serviceType === "DINE_IN";

  const links = [
    { to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/queue", icon: ShoppingBag, label: "Live Queue" },
    { to: "/admin/menu", icon: Utensils, label: "Menu" },
    ...(isDineIn ? [{ to: "/admin/tables", icon: QrCode, label: "Tables" }] : []),
    { to: "/admin/customize", icon: Palette, label: "Customize" },
    { to: "/admin/forecast", icon: TrendingUp, label: "Demand Forecast" },
  ];

  const storeLink = shop && shop.slug ? "/store/" + shop.slug : null;

  const openStore = () => {
    if (storeLink) window.open(storeLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r bg-card/40 p-4">
        {/* App brand — makes it obvious which platform this dashboard belongs to */}
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-base font-bold">QROder</p>
            <p className="font-mono-ticket text-[10px] uppercase tracking-wide text-muted-foreground">
              Order Management
            </p>
          </div>
        </div>

        {/* Which shop this workspace is managing */}
        <div className="mb-5 rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="font-mono-ticket text-[10px] uppercase tracking-wide text-muted-foreground">
            Managing
          </p>
          <p className="truncate text-sm font-semibold">{shop?.name || "Your Shop"}</p>
          {storeLink ? (
            <button
              type="button"
              onClick={openStore}
              className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View store <ExternalLink className="w-3 h-3" />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1">
          {links.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}

          {/* Opens a dialog (not a route) with a scannable QR for this
              vendor's storefront link — same URL as "View store" above. */}
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            disabled={!storeLink}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <QrCode className="w-4 h-4" /> Store QR Code
          </button>

          {/* Inventory & Waste Management — placed directly below the QR
              Code Generator per the sidebar layout requirement. */}
          <NavLink
            to="/admin/inventory"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`
            }
          >
            <Boxes className="w-4 h-4" /> Inventory Management
          </NavLink>
          <NavLink
            to="/admin/waste"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`
            }
          >
            <PackageX className="w-4 h-4" /> Waste Management
          </NavLink>
        </nav>

        <StoreQrDialog open={qrOpen} onOpenChange={setQrOpen} shop={shop} />

        <div className="border-t border-border pt-3">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {(user?.email || "?")[0].toUpperCase()}
            </div>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 bg-secondary/20">
        <Outlet />
      </main>
    </div>
  );
}