import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * Shows a scannable QR code for a shop's public storefront link. Every
 * vendor's QR simply encodes their own `/store/:slug` URL, so no backend
 * endpoint is needed — the code is generated client-side from the URL
 * that's already in StoreContext.
 *
 * Usage: <StoreQrDialog open={open} onOpenChange={setOpen} shop={shop} />
 */
export default function StoreQrDialog({ open, onOpenChange, shop }) {
  const wrapperRef = useRef(null);

  const storeUrl = shop?.slug ? `${window.location.origin}/store/${shop.slug}` : "";

  const handleDownload = () => {
    const svg = wrapperRef.current?.querySelector("svg");
    if (!svg) return;

    // Rasterize the SVG to a PNG at 4x for a crisp printed/downloaded code.
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = 4;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${shop?.slug || "store"}-qr.png`;
      link.click();
    };
    img.src = url;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      toast.success("Store link copied");
    } catch {
      toast.error("Couldn't copy — copy it manually instead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Your store QR code</DialogTitle>
          <DialogDescription>
            Customers scan this to open your storefront directly — print it
            for tables, counters, or takeaway packaging.
          </DialogDescription>
        </DialogHeader>

        {storeUrl ? (
          <>
            <div
              ref={wrapperRef}
              className="mx-auto flex w-fit items-center justify-center rounded-lg border bg-white p-4"
            >
              <QRCodeSVG value={storeUrl} size={200} includeMargin={false} />
            </div>

            <p className="break-all text-center text-xs text-muted-foreground">
              {storeUrl}
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-2" /> Copy link
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>

            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
            >
              Open store <ExternalLink className="w-3 h-3" />
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your store isn't set up yet — finish onboarding to get a store link.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
