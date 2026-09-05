import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEMPLATES } from "@/lib/templates";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { ArrowRight, ImageIcon, Loader2 } from "lucide-react";

export default function OnboardingTemplate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setShop } = useStore();

  const [templateId, setTemplateId] = useState("classic");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await api.put("/shops/theme", {
        templateId,
        theme: {
          logoUrl,
          bannerUrl,
          primaryColor: selectedTemplate.preview.accent,
          font: selectedTemplate.font || "Outfit",
        },
      });
      setShop(res.data);
      toast.success("Your store is ready!");
      navigate("/admin");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Step 2 of 2</p>
        <h1 className="text-xl font-heading font-bold">Choose your store&apos;s look</h1>
      </div>

      {/* Logo + Banner upload */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="mb-1 block">Store Logo</Label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-16 mx-auto mb-2 rounded-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            )}
            <Input
              placeholder="Paste logo image URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label className="mb-1 block">Store Banner</Label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {bannerUrl ? (
              <img src={bannerUrl} alt="banner" className="h-16 w-full object-cover rounded mb-2" />
            ) : (
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            )}
            <Input
              placeholder="Paste banner image URL"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Template picker */}
      <Label className="mb-2 block">Storefront Layout</Label>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplateId(t.id)}
            className={`overflow-hidden rounded-lg border text-left transition ${
              templateId === t.id ? "ring-2 ring-offset-1 ring-primary" : ""
            }`}
          >
            <div className="h-16 border-b">
              <TemplateThumbnail id={t.id} accent={t.preview.accent} bg={t.preview.bg} />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-gray-500">{t.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div className="border rounded-lg overflow-hidden mb-6">
        {bannerUrl && <img src={bannerUrl} alt="" className="h-24 w-full object-cover" />}
        <div className="p-4 text-center" style={{ backgroundColor: selectedTemplate.preview.bg }}>
          {logoUrl && <img src={logoUrl} alt="" className="h-10 mx-auto mb-2 rounded-full" />}
          <p className="font-bold" style={{ color: selectedTemplate.preview.accent }}>
            {user?.name || "Your Shop"}
          </p>
          <p className="text-xs text-gray-500">Preview — {selectedTemplate.name} layout</p>
        </div>
      </div>

      <Button onClick={handleFinish} disabled={saving} className="w-full" size="lg">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {saving ? "Setting up your store..." : "Finish Setup"} <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}