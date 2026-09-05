export const TEMPLATES = [
  {
    id: "night-market",
    name: "A — Night Market",
    description: "Dark, bold, street-food energy with a photo collage feel",
    preview: { bg: "#141319", accent: "#D85A30" },
    font: "Space Grotesk",
    isDark: true,
    hasOwnCategoryNav: false,
  },
  {
    id: "electric-pop",
    name: "B — Electric Pop",
    description: "Cream background, hard shadows, playful bold type",
    preview: { bg: "#FBF8F0", accent: "#E0562B" },
    font: "Poppins",
    isDark: false,
    hasOwnCategoryNav: false,
  },
  {
    id: "classic",
    name: "C — Classic",
    description: "Traditional menu list, clean and simple",
    preview: { bg: "#FFF8F0", accent: "#B45309" },
    font: "Playfair Display",
    isDark: false,
    hasOwnCategoryNav: false,
  },
  {
    id: "grid",
    name: "D — Modern Grid",
    description: "Image-forward cards, great for photo-heavy menus",
    preview: { bg: "#F8FAFC", accent: "#2563EB" },
    font: "Plus Jakarta Sans",
    isDark: false,
    hasOwnCategoryNav: false,
  },
  {
    id: "minimal",
    name: "E — Minimal",
    description: "Compact text-first list — fastest to scan and order",
    preview: { bg: "#FFFFFF", accent: "#111827" },
    font: "Outfit",
    isDark: false,
    hasOwnCategoryNav: true,
  },
  {
    id: "vibrant",
    name: "F — Vibrant",
    description: "Warm dark theme with bold accent pops — great for late-night spots",
    preview: { bg: "#1C1917", accent: "#FA4616" },
    font: "Outfit",
    isDark: true,
    hasOwnCategoryNav: true,
  },
  {
    id: "kitchen-sidebar",
    name: "G — Kitchen Sidebar (Green)",
    description: "Full desktop layout: dark green sidebar nav + a live order panel",
    preview: { bg: "#FBF7EF", accent: "#C98A2C" },
    font: "Poppins",
    isDark: false,
    hasOwnCategoryNav: true,
    hasOwnSearch: true,
    hasOwnCart: true,
    hasOwnHeader: true,
  },
  {
    id: "flavoro",
    name: "H — Flavoro",
    description: "Full desktop layout: bold top nav, dark hero banner, live order panel",
    preview: { bg: "#FFF8F0", accent: "#E8A33D" },
    font: "Poppins",
    isDark: false,
    hasOwnCategoryNav: true,
    hasOwnSearch: true,
    hasOwnCart: true,
    hasOwnHeader: true,
  },
  {
    id: "kitchen-red",
    name: "I — Kitchen Sidebar (Red)",
    description: "Full desktop layout: warm red sidebar nav + a live order panel",
    preview: { bg: "#FFF8F0", accent: "#C0392B" },
    font: "Poppins",
    isDark: false,
    hasOwnCategoryNav: true,
    hasOwnSearch: true,
    hasOwnCart: true,
    hasOwnHeader: true,
  },
];

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

// Picks readable text (near-black or near-white) for a given hex background,
// so accent-colored buttons/badges stay legible regardless of the color a
// shop owner picks.
export const getContrastText = (hex) => {
  if (!hex) return "#FFFFFF";
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#FFFFFF";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
};

// Single source of truth for how the shared chrome (header, footer, search
// bar, floating cart button) should look for a given store — driven by the
// chosen template's own identity, with the shop's own theme overrides
// (accent color / font) layered on top. This is what keeps the storefront
// feeling like ONE cohesive, on-brand site instead of a generic header
// bolted onto a differently-styled template.
export const getTemplateSkin = (templateId, theme) => {
  const template = getTemplate(templateId);
  const isDark = template.isDark;
  const accent = theme?.primaryColor || template.preview.accent;

  return {
    templateId: template.id,
    isDark,
    accent,
    accentText: getContrastText(accent),
    font: theme?.font || template.font,
    pageBg: template.preview.bg,
    hasOwnCategoryNav: template.hasOwnCategoryNav,
    hasOwnSearch: !!template.hasOwnSearch,
    hasOwnCart: !!template.hasOwnCart,
    hasOwnHeader: !!template.hasOwnHeader,
    text: isDark ? "#F5F5F4" : "#18181B",
    muted: isDark ? "rgba(245,245,244,0.6)" : "rgba(24,24,27,0.55)",
    surface: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
    surfaceStrong: isDark ? "rgba(20,19,25,0.9)" : "rgba(255,255,255,0.92)",
    border: isDark ? "rgba(255,255,255,0.12)" : "rgba(24,24,27,0.1)",
  };
};