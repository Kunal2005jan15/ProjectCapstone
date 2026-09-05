import { motion } from "framer-motion";
import { Phone, MapPin } from "lucide-react";
import { getTemplateSkin } from "@/lib/templates";

export default function StoreHeader({ shop, theme, templateId }) {
  const skin = getTemplateSkin(templateId ?? shop?.templateId, theme);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: skin.surfaceStrong,
        color: skin.text,
        borderBottom: `1px solid ${skin.border}`,
        fontFamily: skin.font,
      }}
      className="relative z-20 backdrop-blur-md"
    >
      {theme && theme.bannerUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative h-32 w-full overflow-hidden"
        >
          <img src={theme.bannerUrl} alt="" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${skin.surfaceStrong}, transparent 60%)`,
            }}
          />
        </motion.div>
      ) : null}

      <div className="flex items-center gap-3 px-4 py-3">
        {theme && theme.logoUrl ? (
          <motion.img
            initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            src={theme.logoUrl}
            alt=""
            className="w-11 h-11 rounded-full object-cover border-2 shadow-sm shrink-0"
            style={{ borderColor: skin.accent }}
          />
        ) : (
          <div
            className="flex w-11 h-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm"
            style={{ background: skin.accent, color: skin.accentText }}
          >
            {(shop?.name || "S")[0]}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 min-w-0"
        >
          <h1 className="font-bold text-base truncate tracking-tight">
            {shop && shop.name ? shop.name : "Your Shop"}
          </h1>
          {theme && theme.tagline ? (
            <p className="text-xs truncate" style={{ color: skin.muted }}>
              {theme.tagline}
            </p>
          ) : null}
        </motion.div>

        {theme && theme.contactPhone ? (
          <motion.a
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            whileTap={{ scale: 0.93 }}
            href={"tel:" + theme.contactPhone}
            className="flex items-center gap-1 text-xs rounded-full px-3 py-1.5 font-medium shrink-0"
            style={{ color: skin.accentText, background: skin.accent }}
          >
            <Phone className="w-3 h-3" />
            Call
          </motion.a>
        ) : null}
      </div>

      {theme && theme.contactAddress ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-1 px-4 pb-2.5 text-xs"
          style={{ color: skin.muted }}
        >
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{theme.contactAddress}</span>
        </motion.div>
      ) : null}
    </motion.header>
  );
}