import { createContext, useContext, useState } from "react";
import api from "@/lib/api";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [shop, setShop] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadShop = async (slug) => {
    setLoading(true);
    try {
      const res = await api.get(`/storefront/${slug}`);
      setShop({
        templateId: "classic", // default fallback if backend doesn't send one yet
        ...res.data.shop,
      });
      setMenu(res.data.menu || []);
    } catch (err) {
      console.error("Failed to load shop", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{ shop, menu, loading, loadShop, setShop, setMenu }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreContext);