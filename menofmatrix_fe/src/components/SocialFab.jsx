"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/* ---------------- icons (24x24) ---------------- */
const I = {
  website: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3z" />
    </>
  ),
  linkedin: (
    <path
      fill="currentColor"
      stroke="none"
      d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
    />
  ),
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.26.8-.57v-2c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.3.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.2.68.82.56A12 12 0 0 0 12 .5z"
    />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  x: (
    <path
      fill="currentColor"
      stroke="none"
      d="M18.24 2.25h3.31l-7.23 8.26L23 21.75h-6.66l-4.71-6.23-5.4 6.23H2.75l7.73-8.84L1.25 2.25H8.08l4.25 5.62 5.91-5.62zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"
    />
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  whatsapp: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.98-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42l-.48-.01c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.25 3.75.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"
    />
  ),
};

const DEFAULT_ITEMS = [
  { label: "Website", href: "https://www.lokeshyarramallu.dev/", color: "#0d0d0f", icon: I.website },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/lokeshyarramallu/", color: "#0A66C2", icon: I.linkedin },
  { label: "GitHub", href: "https://github.com/LokeshYarramallu", color: "#181717", icon: I.github },
  { label: "Instagram", href: "https://www.instagram.com/lokesh_yarramallu/", color: "#E4405F", icon: I.instagram },
  { label: "X", href: "https://x.com/LOKESH_Y59", color: "#000000", icon: I.x },
  { label: "Email", href: "mailto:vsn.lokesh.yarramallu@gmail.com", color: "#EA4335", icon: I.email },
  { label: "WhatsApp", href: "https://wa.link/nvvirc", color: "#25D366", icon: I.whatsapp },
];

const SPRING = { type: "spring", stiffness: 340, damping: 24 };

/**
 * Parallax "share" FAB: a main button that fans out circular icon links.
 * Opens on hover AND on click/tap; the hit area grows to cover the whole fan
 * so the cursor can travel to an icon without the menu collapsing.
 */
export default function SocialFab({
  items = DEFAULT_ITEMS,
  photo = "/assets/lokesh.jpg",
  fabSize = 56,
  itemSize = 32,
  spread = 120,
  startAngle = 84,
  arc = 104,
  fabColor = "#0d0d0f",
  fabIconColor = "#ffffff",
  parallaxStrength = 14,
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [photoOk, setPhotoOk] = useState(true);
  const zoneRef = useRef(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 120, damping: 20 });
  const py = useSpring(my, { stiffness: 120, damping: 20 });
  const fanX = useTransform(px, (v) => v * parallaxStrength);
  const fanY = useTransform(py, (v) => v * parallaxStrength);

  const n = items.length;
  const step = n > 1 ? arc / (n - 1) : 0;
  const hit = spread * 2 + itemSize + 28; // interactive zone covers the fan

  // tap-friendly: close when tapping / clicking outside while open
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (zoneRef.current && !zoneRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  function onMove(e) {
    const r = zoneRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 2);
    my.set(((e.clientY - (r.top + r.height / 2)) / r.height) * 2);
  }
  function resetParallax() {
    mx.set(0);
    my.set(0);
  }

  return (
    // outer box is inert; only the centred zone captures pointer events
    <div className="pointer-events-none relative" style={{ width: fabSize, height: fabSize }}>
      <div
        ref={zoneRef}
        className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: open ? hit : fabSize,
          height: open ? hit : fabSize,
          transition: "width .18s ease, height .18s ease",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          setOpen(false);
          setHovered(null);
          resetParallax();
        }}
        onMouseMove={onMove}
      >
        {/* fan */}
        <motion.div className="absolute inset-0" style={{ x: fanX, y: fanY }}>
          <AnimatePresence>
            {open &&
              items.map((it, i) => {
                const angle = ((startAngle + i * step) * Math.PI) / 180;
                const tx = Math.cos(angle) * spread;
                const ty = Math.sin(angle) * spread;
                const dim = hovered !== null && hovered !== i;
                return (
                  <motion.a
                    key={it.label}
                    href={it.href}
                    target={it.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    aria-label={it.label}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
                    style={{
                      width: itemSize,
                      height: itemSize,
                      marginLeft: -itemSize / 2,
                      marginTop: -itemSize / 2,
                      background: it.color,
                      color: "#fff",
                    }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x: tx,
                      y: ty,
                      scale: hovered === i ? 1.16 : 1,
                      opacity: dim ? 0.55 : 1,
                      filter: dim ? "brightness(0.7)" : "brightness(1)",
                    }}
                    exit={{ x: 0, y: 0, scale: 0, opacity: 0, transition: { ...SPRING, delay: (n - 1 - i) * 0.03 } }}
                    transition={{ ...SPRING, delay: i * 0.045 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={itemSize * 0.5}
                      height={itemSize * 0.5}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {it.icon}
                    </svg>
                    <AnimatePresence>
                      {hovered === i && (
                        <motion.span
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white"
                        >
                          {it.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.a>
                );
              })}
          </AnimatePresence>
        </motion.div>

        {/* main FAB — profile photo, always centred in the zone */}
        <motion.button
          type="button"
          aria-label={open ? "Close links menu" : "Open links menu"}
          onClick={() => setOpen((v) => !v)}
          className="absolute left-1/2 top-1/2 flex items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.32)] ring-1 ring-black/10"
          style={{
            width: fabSize,
            height: fabSize,
            marginLeft: -fabSize / 2,
            marginTop: -fabSize / 2,
            color: fabIconColor,
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
        >
          {photo && photoOk ? (
            <img
              src={photo}
              alt=""
              draggable={false}
              onError={() => setPhotoOk(false)}
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 25%" }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center" style={{ background: fabColor }}>
              <svg viewBox="0 0 24 24" width={fabSize * 0.42} height={fabSize * 0.42} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
              </svg>
            </span>
          )}

          {/* subtle inner shadow on the photo itself */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.45),inset_0_0_4px_rgba(0,0,0,0.35)]"
          />

          {/* close affordance when open */}
          <motion.span
            className="absolute inset-0 flex items-center justify-center bg-black/45"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            style={{ pointerEvents: "none" }}
          >
            <svg viewBox="0 0 24 24" width={fabSize * 0.4} height={fabSize * 0.4} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}
