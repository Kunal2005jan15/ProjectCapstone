import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat, Search, Menu as MenuIcon, X, Plus, UtensilsCrossed, Sparkles,
} from "lucide-react";
import OrderPanel from "@/components/storefront-templates/shared/OrderPanel";
import CategoryChips from "@/components/storefront-templates/shared/CategoryChips";

const NAV_LINKS = ["Home", "Menu", "Offers", "About Us", "Contact"];

function DishTile({ item, onAdd, accent, accentText }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {item.image ? (
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
        <p className="truncate text-xs text-gray-400">{item.category}</p>
        <p className="mt-0.5 text-sm font-bold text-gray-900">₹{item.price}</p>
      </div>
      <button
        onClick={() => onAdd(item)}
        style={{ background: accent, color: accentText }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function FlavoroTemplate({
  shop, items = [], onAdd, theme,
  search, setSearch, category, setCategory, categories, cart, onCheckout,
}) {
  const accent = theme?.primaryColor || "#E8A33D";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const scrollToMenu = () =>
    document.getElementById("flavoro-menu")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleNav = (label) => {
    setDrawerOpen(false);
    if (label === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (label === "Menu") scrollToMenu();
    else toast("Coming soon");
  };

  return (
    <div style={{ fontFamily: theme?.font, background: "#FFF8F0" }} className="min-h-screen text-[#18181B]">
      {/* Top nav — pinned so it stays reachable while the page scrolls */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-2">
          {theme?.logoUrl ? (
            <img
              src={theme.logoUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <ChefHat className="h-5 w-5" style={{ color: accent }} />
          )}
          <span className="text-sm font-bold">{shop?.name || "Your Shop"}</span>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((label) => (
            <button
              key={label}
              onClick={() => handleNav(label)}
              className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              style={label === "Home" ? { color: accent, fontWeight: 600 } : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => setSearchOpen((v) => !v)}>
            <Search className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={() => setDrawerOpen(true)} className="lg:hidden">
            <MenuIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-black/5 bg-white"
          >
            <div className="relative px-4 py-3 lg:px-8">
              <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 lg:left-11" />
              <input
                autoFocus
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search dishes..."
                className="w-full rounded-full border border-black/5 bg-black/[0.02] py-2 pl-9 pr-3 text-sm outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-64 bg-white p-5 lg:hidden"
            >
              <button onClick={() => setDrawerOpen(false)} className="mb-6">
                <X className="h-5 w-5" />
              </button>
              <div className="space-y-1">
                {NAV_LINKS.map((label) => (
                  <button
                    key={label}
                    onClick={() => handleNav(label)}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="lg:flex lg:items-start">
        <div className="min-w-0 flex-1">
          {/* Hero */}
          <div className="px-4 pt-5 lg:px-8">
            <div className="relative flex flex-col-reverse items-center gap-5 overflow-hidden rounded-2xl p-6 lg:flex-row lg:gap-8 lg:p-10"
              style={{ background: "linear-gradient(135deg, #1C1410, #2A1D14)" }}
            >
              <div className="flex-1 text-white">
                <p className="mb-1 flex items-center gap-1.5 text-xs italic opacity-70" style={{ color: accent }}>
                  <Sparkles className="h-3 w-3" /> Good Food, Good Mood
                </p>
                <h1 className="text-2xl font-bold leading-tight lg:text-4xl">
                  Delicious food,<br />delivered to you
                </h1>
                <p className="mt-2 max-w-sm text-sm opacity-70">
                  {theme?.tagline || "Order your favorite meals from our wide range of flavorful dishes, made fresh."}
                </p>
                <div className="mt-4 flex gap-2.5">
                  <button
                    onClick={scrollToMenu}
                    style={{ background: accent, color: "#1C1410" }}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold transition-transform active:scale-95"
                  >
                    Order Now
                  </button>
                  <button
                    onClick={scrollToMenu}
                    className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Explore Menu
                  </button>
                </div>
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

          {/* Category + menu */}
          <div id="flavoro-menu" className="scroll-mt-4 px-4 py-6 lg:flex lg:gap-8 lg:px-8">
            <div className="mb-4 lg:mb-0 lg:w-40 lg:shrink-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Categories</p>
              <CategoryChips
                categories={categoryList}
                active={categoryVal}
                onChange={setCategoryVal}
                accent={accent}
                accentText="#1C1410"
                className="lg:flex-col lg:overflow-visible"
              />
            </div>

            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Popular Dishes</h2>
                <button onClick={() => setCategoryVal("All")} className="text-xs font-semibold" style={{ color: accent }}>
                  View All
                </button>
              </div>
              {displayItems.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">No dishes match your search.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {displayItems.map((item) => (
                    <DishTile key={item.id} item={item} onAdd={onAdd} accent={accent} accentText="#1C1410" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-1 gap-4 border-t border-black/5 px-4 py-8 text-center sm:grid-cols-3 lg:px-8">
            {["Fresh & Tasty", "Best Quality", "Secure Payment"].map((label) => (
              <div key={label} className="text-xs font-medium text-gray-500">{label}</div>
            ))}
          </div>
        </div>

        {/* Desktop order panel — pinned just below the sticky top nav */}
        <aside className="hidden w-80 shrink-0 border-l border-black/5 p-5 lg:block lg:sticky lg:top-[70px] lg:max-h-[calc(100vh-70px)] lg:overflow-y-auto">
          <OrderPanel
            cart={cart}
            accent={accent}
            accentText="#1C1410"
            onCheckout={onCheckout}
            showPaymentMethods
          />
        </aside>
      </div>
    </div>
  );
}