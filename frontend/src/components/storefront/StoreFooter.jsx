import { motion } from "framer-motion";
import { Camera, Link2, MessageCircle } from "lucide-react";
import { getTemplateSkin } from "@/lib/templates";

export default function StoreFooter({ shop, theme, templateId }) {
  const skin = getTemplateSkin(templateId ?? shop?.templateId, theme);

  return (
    <motion.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: skin.surfaceStrong,
        color: skin.text,
        borderTop: `1px solid ${skin.border}`,
        fontFamily: skin.font,
      }}
      className="px-4 py-8 text-center"
    >
      {(theme && (theme.instagramUrl || theme.facebookUrl || theme.whatsapp)) ? (
        <div className="flex justify-center gap-4 mb-3">
          {theme.instagramUrl ? (
            <motion.a
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              href={theme.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-2"
              style={{ border: `1px solid ${skin.border}` }}
            >
              <Camera className="w-4 h-4" style={{ color: skin.accent }} />
            </motion.a>
          ) : null}
          {theme.facebookUrl ? (
            <motion.a
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              href={theme.facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-2"
              style={{ border: `1px solid ${skin.border}` }}
            >
              <Link2 className="w-4 h-4" style={{ color: skin.accent }} />
            </motion.a>
          ) : null}
          {theme.whatsapp ? (
            <motion.a
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              href={"https://wa.me/" + theme.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-2"
              style={{ border: `1px solid ${skin.border}` }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: skin.accent }} />
            </motion.a>
          ) : null}
        </div>
      ) : null}
      {theme && theme.footerNote ? (
        <p className="text-xs mb-1" style={{ color: skin.muted }}>{theme.footerNote}</p>
      ) : null}
      <p className="text-[10px] tracking-wide" style={{ color: skin.muted }}>
        {shop && shop.name} · Powered by QROder
      </p>
    </motion.footer>
  );
}