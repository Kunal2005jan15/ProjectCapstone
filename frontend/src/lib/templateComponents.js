import NightMarketTemplate from "@/components/storefront-templates/NightMarketTemplate";
import ElectricPopTemplate from "@/components/storefront-templates/ElectricPopTemplate";
import ClassicTemplate from "@/components/storefront-templates/ClassicTemplate";
import GridTemplate from "@/components/storefront-templates/GridTemplate";
import MinimalTemplate from "@/components/storefront-templates/MinimalTemplate";
import VibrantTemplate from "@/components/storefront-templates/VibrantTemplate";
import { KitchenSidebarGreen, KitchenSidebarRed } from "@/components/storefront-templates/KitchenSidebarTemplate";
import FlavoroTemplate from "@/components/storefront-templates/FlavoroTemplate";

// Shared registry so Storefront.jsx (real customers) and StoreCustomization.jsx
// (admin preview) always render the exact same template components — no drift.
export const TEMPLATE_COMPONENTS = {
  "night-market": NightMarketTemplate,
  "electric-pop": ElectricPopTemplate,
  classic: ClassicTemplate,
  grid: GridTemplate,
  minimal: MinimalTemplate,
  vibrant: VibrantTemplate,
  "kitchen-sidebar": KitchenSidebarGreen,
  flavoro: FlavoroTemplate,
  "kitchen-red": KitchenSidebarRed,
};

// Sample menu used only for the admin's live preview, so the layout is
// meaningful to look at even before any real items are added.
export const DEMO_MENU_ITEMS = [
  { id: "d1", name: "Paneer Tikka Wrap", description: "Grilled paneer, mint chutney, onions", price: 199, category: "Starters", popular: true },
  { id: "d2", name: "Loaded Nachos", description: "Cheese, salsa, jalapenos", price: 179, category: "Starters" },
  { id: "d3", name: "Margherita Pizza", description: "Fresh basil, mozzarella, tomato sauce", price: 249, category: "Mains", popular: true },
  { id: "d4", name: "Veg Burger", description: "Crispy patty, lettuce, house sauce", price: 149, category: "Mains" },
  { id: "d5", name: "Cold Brew", description: "Slow-steeped, served over ice", price: 129, category: "Drinks" },
  { id: "d6", name: "Masala Lemonade", description: "Fresh lime, mint, spices", price: 99, category: "Drinks" },
];