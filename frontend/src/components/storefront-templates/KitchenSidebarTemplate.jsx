import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat, Home, BookOpen, Tag, Package, Heart, User, HelpCircle,
  Search, MapPin, Menu as MenuIcon, X, Plus, UtensilsCrossed, Phone,
} from "lucide-react";
import OrderPanel from "@/components/storefront-templates/shared/OrderPanel";
import CategoryChips from "@/components/storefront-templates/shared/CategoryChips";

const VARIANTS = {
  green: {
    sidebarBg: "#0F241A",
    sidebarSoft: "#17332510",
    promoBg: "#E8C97A",
    promoText: "#17332A",
    heroBg: "linear-gradient(135deg, #17332A, #0F241A)",
  },
  red: {
    sidebarBg: "#7C2018",
    sidebarSoft: "#93281E10",
    promoBg: "#F2C14E",
    promoText: "#5C170F",
    heroBg: "linear-gradient(135deg, #93281E, #6B160F)",
  },
};

const NAV_ITEMS = [
  { icon: Home, label: "Home", action: "home" },
  { icon: BookOpen, label: "Menu", action: "menu" },
  { icon: Tag, label: "Offers", action: "soon" },
  { icon: Package, label: "Orders", action: "soon" },
  { icon: Heart, label: "Favorites", action: "soon" },
  { icon: User, label: "Profile", action: "soon" },
  { icon: HelpCircle, label: "Help", action: "soon" },
];

function NavList({ textClass, activeColor, onNav }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.label}
          onClick={() => onNav(item.action)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${textClass}`}
          style={item.action === "home" ? { background: `${activeColor}22`, color: activeColor } : undefined}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function DishCard({ item, onAdd, accent, accentText }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="relative h-28 w-full bg-gray-100">
        {item.image ? (
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-gray-300" />
          </div>
        )}
        <button
          onClick={() => setLiked((v) => !v)}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
        <p className="truncate text-xs text-gray-400">{item.category}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
          <button
            onClick={() => onAdd(item)}
            style={{ background: accent, color: accentText }}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-transform active:scale-90"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

function KitchenSidebarBase({
  variant, shop, items = [], onAdd, theme,
  search, setSearch, category, setCategory, categories, cart, onCheckout,
}) {
  const v = VARIANTS[variant];
  const accent = theme?.primaryColor || (variant === "green" ? "#C98A2C" : "#C0392B");
  const accentText = "#FFFFFF";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isControlled = search !== undefined && category !== undefined;
  const [localSearch, setLocalSearch] = useState("");
  const [localCategory, setLocalCategory] = useState("All");
  const searchVal = isControlled ? search : localSearch;
  const setSearchVal = setSearch || setLocalSearch;
  const categoryVal = isControlled ? category : localCategory;
  const setCategoryVal = setCategory || setLocalCategory;
  const categoryList = categories || ["All", ...new Set(items.map((i) => i.category))];
  const displayItems = isControlled
    ? items
    : items.filter(
        (i) =>
          (categoryVal === "All" || i.category === categoryVal) &&
          i.name.toLowerCase().includes(searchVal.toLowerCase())
      );

  const heroImage = items.find((i) => i.image)?.image || theme?.bannerUrl;

  const handleNav = (action) => {
    setDrawerOpen(false);
    if (action === "home") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (action === "menu") document.getElementById("kitchen-menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
    else toast("Coming soon");
  };

  return (
    <div style={{ fontFamily: theme?.font, background: "#FBF7EF" }} className="min-h-screen text-[#18181B] lg:flex lg:items-start">
      {/* Desktop sidebar — pinned to the viewport while the menu column
          scrolls past it, like the reference design. */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col justify-between p-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
        style={{ background: v.sidebarBg, color: "#F3EFE6" }}
      >
        <div>
          <div className="mb-8 flex items-center gap-2">
            {theme?.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <ChefHat className="h-6 w-6" style={{ color: v.promoBg }} />
            )}
            <div>
              <p className="text-sm font-bold leading-tight">{shop?.name || "Your Shop"}</p>
              {theme?.tagline && (
                <p className="text-[9px] uppercase tracking-widest opacity-60">{theme.tagline}</p>
              )}
            </div>
          </div>
          <NavList textClass="text-[#F3EFE6]/80 hover:bg-white/5" activeColor={v.promoBg} onNav={handleNav} />
        </div>
        <div>
          <div className="rounded-xl p-3.5" style={{ background: v.promoBg, color: v.promoText }}>
            <p className="text-xs font-bold">Free Delivery</p>
            <p className="text-[11px] opacity-80">on orders above ₹500</p>
          </div>
          {theme?.contactPhone && (
            <a href={`tel:${theme.contactPhone}`} className="mt-3 flex items-center gap-2 px-1 text-xs opacity-70">
              <Phone className="h-3.5 w-3.5" /> {theme.contactPhone}
            </a>
          )}
        </div>
      </aside>

      {/* Mobile top bar — pinned so nav is always reachable while scrolling */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden"
        style={{ background: v.sidebarBg, color: "#F3EFE6" }}
      >
        <button onClick={() => setDrawerOpen(true)}>
          <MenuIcon className="h-5 w-5" />
        </button>
        <p className="text-sm font-bold">{shop?.name || "Your Shop"}</p>
        {theme?.logoUrl ? (
          <img
            src={theme.logoUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full object-cover"
          />
        ) : (
          <ChefHat className="h-5 w-5" style={{ color: v.promoBg }} />
        )}
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 p-5 lg:hidden"
              style={{ background: v.sidebarBg, color: "#F3EFE6" }}
            >
              <button onClick={() => setDrawerOpen(false)} className="mb-6">
                <X className="h-5 w-5" />
              </button>
              <NavList textClass="text-[#F3EFE6]/80 hover:bg-white/5" activeColor={v.promoBg} onNav={handleNav} />
              <div className="mt-6 rounded-xl p-3.5" style={{ background: v.promoBg, color: v.promoText }}>
                <p className="text-xs font-bold">Free Delivery</p>
                <p className="text-[11px] opacity-80">on orders above ₹500</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Desktop utility bar — sticky so search stays reachable while
            the menu grid scrolls underneath it */}
        <div
          className="sticky top-0 z-20 hidden items-center justify-between gap-4 border-b border-black/5 px-8 py-4 backdrop-blur-md lg:flex"
          style={{ background: "#FBF7EFEE" }}
        >
          {theme?.contactAddress ? (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              {theme.contactAddress}
            </div>
          ) : <div />}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search for dishes, cuisines..."
              className="w-full rounded-full border border-black/5 bg-black/[0.02] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2"
              style={{ "--tw-ring-color": `${accent}55` }}
            />
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pt-3 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search for dishes..."
              className="w-full rounded-full border border-black/5 bg-black/[0.02] py-2 pl-9 pr-3 text-sm outline-none"
            />
          </div>
        </div>

        {/* Hero */}
        <div className="px-4 pt-4 lg:px-8">
          <div
            className="relative flex flex-col-reverse items-center gap-5 overflow-hidden rounded-2xl p-6 lg:flex-row lg:gap-8 lg:p-10"
            style={{ background: v.heroBg }}
          >
            <div className="flex-1 text-[#F3EFE6]">
              <p className="mb-1 text-xs italic opacity-70" style={{ color: v.promoBg }}>
                Good Food, Good Mood
              </p>
              <h1 className="text-2xl font-bold leading-tight lg:text-4xl">
                Delicious food,<br />delivered to you
              </h1>
              <p className="mt-2 max-w-sm text-sm opacity-70">
                {theme?.tagline || "Fresh ingredients. Expertly cooked. Delivered with love."}
              </p>
              <button
                onClick={() => handleNav("menu")}
                style={{ background: v.promoBg, color: v.promoText }}
                className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform active:scale-95"
              >
                Order Now →
              </button>
            </div>
            <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl lg:h-52 lg:w-64">
              {heroImage ? (
                <img src={heroImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/5">
                  <UtensilsCrossed className="h-8 w-8 text-white/30" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="px-4 pt-5 lg:px-8">
          <CategoryChips
            categories={categoryList}
            active={categoryVal}
            onChange={setCategoryVal}
            accent={accent}
            accentText={accentText}
          />
        </div>

        {/* Menu grid */}
        <div id="kitchen-menu" className="scroll-mt-4 px-4 py-5 lg:px-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Popular Near You</h2>
            <button onClick={() => setCategoryVal("All")} className="text-xs font-semibold" style={{ color: accent }}>
              View All
            </button>
          </div>
          {displayItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No dishes match your search.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 xl:grid-cols-4">
              {displayItems.map((item) => (
                <DishCard key={item.id} item={item} onAdd={onAdd} accent={accent} accentText={accentText} />
              ))}
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-4 border-t border-black/5 px-4 py-8 text-center lg:grid-cols-4 lg:px-8">
          {["Fresh Ingredients", "Expertly Cooked", "Safe & Hygienic", "Loved by Customers"].map((label) => (
            <div key={label} className="text-xs font-medium text-gray-500">{label}</div>
          ))}
        </div>
      </div>

      {/* Desktop order panel — pinned alongside the scrolling menu */}
      <aside className="hidden w-80 shrink-0 border-l border-black/5 p-5 lg:block lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <OrderPanel cart={cart} accent={accent} accentText={accentText} onCheckout={onCheckout} />
      </aside>
    </div>
  );
}

export function KitchenSidebarGreen(props) {
  return <KitchenSidebarBase variant="green" {...props} />;
}

export function KitchenSidebarRed(props) {
  return <KitchenSidebarBase variant="red" {...props} />;
}