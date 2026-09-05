import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";

/**
 * Drop-in replacement for a submit <Button> on auth forms. Takes a `status`
 * ("idle" | "loading" | "success" | "error") driven by the calling form and
 * animates the button's content to match — a spinner while the request is
 * in flight, a checkmark burst the moment it succeeds, and a short shake if
 * it fails. Purely a response to the user's own action (clicking submit),
 * so the motion earns its place instead of just decorating the page.
 */
export default function AuthSubmitButton({
  status = "idle",
  idleLabel,
  loadingLabel,
  successLabel = "Success",
  className = "",
}) {
  const isError = status === "error";
  const isBusy = status === "loading" || status === "success";

  return (
    <motion.button
      type="submit"
      disabled={isBusy}
      whileTap={status === "idle" ? { scale: 0.98 } : {}}
      animate={
        isError
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : status === "success"
          ? { scale: [1, 1.03, 1] }
          : { x: 0 }
      }
      transition={isError ? { duration: 0.45, ease: "easeInOut" } : { duration: 0.35 }}
      className={`relative inline-flex h-10 w-full items-center justify-center gap-1.5 overflow-hidden rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-100 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <motion.span
            key="success"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="flex items-center gap-1.5"
          >
            <motion.span
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Check className="h-4 w-4" />
            </motion.span>
            {successLabel}
          </motion.span>
        ) : status === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            {idleLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}