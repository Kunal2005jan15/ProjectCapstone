import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag } from "lucide-react";
import { getTemplateSkin } from "@/lib/templates";

import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import { TEMPLATE_COMPONENTS } from "@/lib/templateComponents";

export default function Storefront() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { shop, menu, loading, loadShop } = useStore();
  const { items: cartItems, addItem, updateQty, removeItem, count, total } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (slug) loadShop(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const skin = getTemplateSkin(shop?.templateId, shop?.theme);

  const categories = ["All", ...new Set(menu.map((m) => m.category))];
  const filtered = menu.filter(
    (m) =>
      (category === "All" || m.category === category) &&
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (item) => {
    addItem(item);
    toast.success(`${item.name} added to cart`);
  };

  const goToCheckout = () => navigate(`/store/${slug}/checkout`);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm text-muted-foreground"
        >
          Loading menu...
        </motion.div>
      </div>
    );
  }

  const Template = TEMPLATE_COMPONENTS[shop?.templateId] || TEMPLATE_COMPONENTS.classic;

  // Templates with hasOwnSearch (the desktop-style layouts) render their own
  // search box + category chips inline, matching their own design — so we
  // skip the generic bar entirely instead of stacking two differently
  // styled bars on top of each other. They get live search/category state
  // and the real cart passed as props instead.
  const showGenericBar = !skin.hasOwnSearch;
  const showGenericHeader = !skin.hasOwnHeader;

  return (
    <div
      style={{ background: skin.pageBg, color: skin.text, fontFamily: skin.font }}
      className="min-h-screen pb-24"
    >
      {showGenericHeader && (
        <StoreHeader shop={shop} theme={shop?.theme} templateId={shop?.templateId} />
      )}

      {showGenericBar && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          style={{
            background: skin.surfaceStrong,
            borderBottom: `1px solid ${skin.border}`,
          }}
          className="sticky top-0 z-10 p-4 backdrop-blur-md"
        >
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: skin.muted }} />
            <Input
              placeholder="Search for items..."
              className="pl-9 border-0 shadow-none transition-shadow focus-visible:shadow-md"
              style={{ background: skin.surface, color: skin.text }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category chips — only shown for templates that don't already
              render their own category navigation, so we never stack two
              differently-styled nav bars on top of each other. */}
          {!skin.hasOwnCategoryNav && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {categories.map((c, i) => {
                const active = category === c;
                return (
                  <motion.button
                    key={c}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * i }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setCategory(c)}
                    className="px-3 py-1 rounded-full text-sm whitespace-nowrap font-medium transition-colors"
                    style={
                      active
                        ? { background: skin.accent, color: skin.accentText }
                        : { background: skin.surface, color: skin.text, border: `1px solid ${skin.border}` }
                    }
                  >
                    {c}
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Template-specific rendering — fades in regardless of which template is active */}
      <AnimatePresence mode="wait">
        <motion.div
          key={shop?.templateId || "classic"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Template
            shop={shop}
            items={filtered}
            onAdd={handleAdd}
            theme={shop?.theme}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            categories={categories}
            cart={{ items: cartItems, count, total, updateQty, removeItem }}
            onCheckout={goToCheckout}
          />
        </motion.div>
      </AnimatePresence>

      <StoreFooter shop={shop} theme={shop?.theme} templateId={shop?.templateId} />

      {/* Floating "view cart" bar — for templates with their own inline
          order panel (desktop), this only shows up on mobile, since the
          panel already handles checkout on larger screens. */}
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            whileTap={{ scale: 0.97 }}
            onClick={goToCheckout}
            style={{ background: skin.accent, color: skin.accentText }}
            className={`fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center shadow-[0_-4px_16px_rgba(0,0,0,0.18)] ${
              skin.hasOwnCart ? "lg:hidden" : ""
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              View Cart · {count} items
            </span>
            <span className="font-bold">₹{total}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}