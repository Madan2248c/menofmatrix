"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Poppins } from "next/font/google";
import { X } from "lucide-react";
import { MORPH, GLASS_PANEL, vFade } from "@/lib/motion";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });

/**
 * The trigger is the "seed". On open it does NOT pop a separate modal —
 * the same glass surface morphs (shared layoutId) from the trigger's
 * footprint out to the expanded panel, and back again on close.
 */
export default function FeaturePopout({ trigger, children, label }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const layoutId = `popout-${useId()}`;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={poppins.className}>
      {/* seed — present only while closed; morphs out to the panel.
          `trigger` may be a node (wrapped with a click-to-open) or a
          function (open) => node that opens itself (e.g. after a gesture). */}
      {!open && (
        <motion.div
          layoutId={layoutId}
          transition={MORPH}
          style={{ borderRadius: 24 }}
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {typeof trigger === "function" ? (
              trigger(() => setOpen(true))
            ) : (
              <div onClick={() => setOpen(true)} className="cursor-pointer">
                {trigger}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className={`${poppins.className} fixed inset-0 z-[60] flex items-center justify-center p-4`}
                role="dialog"
                aria-modal="true"
                aria-label={label}
              >
                <motion.div
                  className="absolute inset-0 bg-black/15 backdrop-blur-[4px]"
                  onClick={() => setOpen(false)}
                  {...vFade}
                  transition={{ duration: 0.25 }}
                />
                <motion.div
                  layoutId={layoutId}
                  transition={MORPH}
                  className="relative z-10 max-h-[88vh] max-w-[min(92vw,720px)] rounded-[11px] p-5"
                  style={GLASS_PANEL}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    title={`Close ${label}`}
                    className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <motion.div
                    className="max-h-[80vh] overflow-y-auto overflow-x-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { delay: 0.12, duration: 0.28 } }}
                  >
                    {children}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
