import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ImageIcon } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { TEMPLATE_COMPONENTS, DEMO_MENU_ITEMS } from "@/lib/templateComponents";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";

const FONTS = ["Outfit", "Plus Jakarta Sans", "Poppins", "Playfair Display", "Space Grotesk"];
const MAX_IMAGE_BYTES = 1024 * 1024; // 1MB — see note below on why this cap exists

export default function StoreCustomization() {
  const { shop, setShop } = useStore();
  const [theme, setTheme] = useState(
    shop?.theme || {
      primaryColor: "#FA4616",
      font: "Outfit",
      logoUrl: "",
      bannerUrl: "",
      tagline: "",
      contactPhone: "",
      contactAddress: "",
      instagramUrl: "",
      facebookUrl: "",
      whatsapp: "",
      footerNote: "",
    }
  );
  const [templateId, setTemplateId] = useState(shop?.templateId || "classic");
  const [saving, setSaving] = useState(false);

  // AdminLayout fetches the shop asynchronously (GET /shops/theme) and only
  // populates StoreContext once that resolves. On first render `shop` is
  // still null, so the useState() calls above lock in the hard-coded
  // defaults. Once the real shop lands in context, sync local editable
  // state to it — keyed on shop.id so a later setShop() from handleSave()
  // (same id) doesn't clobber whatever the user is actively editing.
  useEffect(() => {
    if (shop) {
      setTemplateId(shop.templateId || "classic");
      setTheme((prev) => ({ ...prev, ...(shop.theme || {}) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const handleFileChange = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large — please choose one under 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setTheme((t) => ({ ...t, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/shops/theme", { theme, templateId });
      setShop({ ...res.data, templateId });
      toast.success("Store customization saved");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const Template = TEMPLATE_COMPONENTS[templateId] || TEMPLATE_COMPONENTS.classic;
  const previewShop = { name: shop?.name, slug: shop?.slug, serviceType: shop?.serviceType };

  return (
    <div>
      <h1 className="text-xl font-heading font-bold mb-4">Store Customization</h1>

      <div className="grid grid-cols-2 gap-6">
        <div>
          {/* Template picker */}
          <div className="bg-card border rounded-lg p-4 mb-4">
            <Label className="mb-2 block">Storefront Template</Label>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`overflow-hidden rounded-lg border text-left transition ${
                    templateId === t.id ? "ring-2 ring-offset-1 ring-primary" : ""
                  }`}
                >
                  <div className="h-14 border-b">
                    <TemplateThumbnail id={t.id} accent={t.preview.accent} bg={t.preview.bg} />
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme (colors/font/logo/banner) */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <div>
              <Label>Primary Color</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-md border p-0.5"
                />
                <Input
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>

            <div>
              <Label>Font</Label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={theme.font}
                onChange={(e) => setTheme({ ...theme, font: e.target.value })}
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Logo — real upload + optional URL fallback */}
            <div>
              <Label className="mb-1 block">Store Logo</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {theme.logoUrl ? (
                    <img src={theme.logoUrl} alt="logo" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange("logoUrl")}
                    className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
                  />
                  <Input
                    placeholder="...or paste an image URL"
                    value={theme.logoUrl?.startsWith("data:") ? "" : theme.logoUrl}
                    onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Banner — real upload + optional URL fallback */}
            <div>
              <Label className="mb-1 block">Store Banner</Label>
              <div className="mb-1.5 h-16 w-full overflow-hidden rounded-md border bg-muted">
                {theme.bannerUrl ? (
                  <img src={theme.bannerUrl} alt="banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange("bannerUrl")}
                className="mb-1.5 block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
              />
              <Input
                placeholder="...or paste an image URL"
                value={theme.bannerUrl?.startsWith("data:") ? "" : theme.bannerUrl}
                onChange={(e) => setTheme({ ...theme, bannerUrl: e.target.value })}
              />
            </div>

            {/* Header/Footer customization fields */}
            <div>
              <Label>Tagline</Label>
              <Input
                value={theme.tagline}
                onChange={(e) => setTheme({ ...theme, tagline: e.target.value })}
                placeholder="e.g. Fresh food, made fast"
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                value={theme.contactPhone}
                onChange={(e) => setTheme({ ...theme, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={theme.contactAddress}
                onChange={(e) => setTheme({ ...theme, contactAddress: e.target.value })}
              />
            </div>
            <div>
              <Label>Instagram URL</Label>
              <Input
                value={theme.instagramUrl}
                onChange={(e) => setTheme({ ...theme, instagramUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <Input
                value={theme.whatsapp}
                onChange={(e) => setTheme({ ...theme, whatsapp: e.target.value })}
                placeholder="919876543210"
              />
            </div>
            <div>
              <Label>Footer Note</Label>
              <Input
                value={theme.footerNote}
                onChange={(e) => setTheme({ ...theme, footerNote: e.target.value })}
                placeholder="e.g. Open 9am – 10pm daily"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Live customer-view preview — renders the actual template component */}
        <div>
          <h2 className="font-medium mb-1">Customer View</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            This is your real {TEMPLATES.find((t) => t.id === templateId)?.name} layout with
            sample items — exactly what customers see when they scan your QR code.
            {TEMPLATES.find((t) => t.id === templateId)?.hasOwnHeader &&
              " This template has a full desktop layout with a sidebar/top nav — this narrow preview shows its mobile version; open your live store link on a laptop to see the desktop layout."}
          </p>
          <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-8 border-gray-900 bg-black shadow-xl">
            <div
              className="max-h-[560px] overflow-y-auto"
              style={{ background: TEMPLATES.find((t) => t.id === templateId)?.preview.bg }}
            >
              {!TEMPLATES.find((t) => t.id === templateId)?.hasOwnHeader && (
                <StoreHeader shop={previewShop} theme={theme} templateId={templateId} />
              )}
              <Template items={DEMO_MENU_ITEMS} onAdd={() => {}} theme={theme} shop={previewShop} />
              {!TEMPLATES.find((t) => t.id === templateId)?.hasOwnHeader && (
                <StoreFooter shop={previewShop} theme={theme} templateId={templateId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}