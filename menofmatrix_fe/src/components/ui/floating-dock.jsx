"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { useRef, useState } from "react";

const DOCK_SCALE = 1.3;

export const FloatingDock = ({
  items,
  desktopClassName,
}) => {
  return <FloatingDockDesktop items={items} className={desktopClassName} />;
};

const FloatingDockDesktop = ({
  items,
  className
}) => {
  let mouseX = useMotionValue(Infinity);
  const pathname = usePathname();
  const normalItems = items.filter((i) => !i.grouped);
  const groupedItems = items.filter((i) => i.grouped);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "fixed left-1/2 z-50 flex origin-bottom -translate-x-1/2 items-end gap-[21px] rounded-[21px] bg-gray-50 px-[21px] pb-[16px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)] scale-[0.52] sm:scale-[0.72] md:scale-[0.8] dark:bg-neutral-900",
        className
      )}
      style={{
        height: 64 * DOCK_SCALE,
        bottom: "max(3rem, env(safe-area-inset-bottom))",
      }}>
      {normalItems.map((item) => (
        <IconContainer
          mouseX={mouseX}
          key={item.title}
          {...item}
          selected={!item.noActiveIndicator && (item.wide ? ["/social", "/instagram", "/youtube"].includes(pathname) : pathname === item.href)}
        />
      ))}
      {groupedItems.length > 0 && (
        <div className="flex items-center -space-x-1 rounded-full bg-gray-200 p-1 dark:bg-neutral-800">
          {groupedItems.map((item) => {
            const selected = !item.noActiveIndicator && pathname === item.href;
            return (
              <IconContainer
                key={item.title}
                mouseX={mouseX}
                {...item}
                selected={selected}
                inGroup
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  icons,
  href,
  large,
  wide,
  iconScale,
  selected,
  inGroup,
}) {
  let ref = useRef(null);
  const isWide = !!wide;
  const restScale = large ? 1.5 : 1;
  const peakScale = large ? 1.5 * 1.15 : 4 / 3;
  const iconFill = iconScale ?? 1;

  const baseW = isWide ? 104 : 40;
  const baseIconW = isWide ? 60 : 20;

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(
    distance,
    [-150, 0, 150],
    [baseW * DOCK_SCALE * restScale, baseW * DOCK_SCALE * peakScale, baseW * DOCK_SCALE * restScale]
  );
  let heightTransform = useTransform(
    distance,
    [-150, 0, 150],
    [40 * DOCK_SCALE * restScale, 40 * DOCK_SCALE * peakScale, 40 * DOCK_SCALE * restScale]
  );

  let widthTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [
      baseIconW * DOCK_SCALE * restScale * iconFill,
      baseIconW * DOCK_SCALE * peakScale * iconFill,
      baseIconW * DOCK_SCALE * restScale * iconFill,
    ]
  );
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [
      20 * DOCK_SCALE * restScale * iconFill,
      20 * DOCK_SCALE * peakScale * iconFill,
      20 * DOCK_SCALE * restScale * iconFill,
    ]
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  if (inGroup) {
    return (
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        className="relative flex flex-col items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
        <span className="sr-only">{title}</span>
        <motion.div
          ref={ref}
          style={{ width, height }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            "relative flex aspect-square items-center justify-center rounded-full transition-colors",
            selected ? "bg-neutral-900" : "bg-transparent"
          )}>
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 2, x: "-50%" }}
                className="absolute -top-[42px] left-1/2 w-fit px-2.5 py-1 text-sm font-bold whitespace-pre uppercase tracking-wide text-neutral-900 dark:text-white">
                {title}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            style={{ width: widthIcon, height: heightIcon }}
            className={cn("flex items-center justify-center", selected ? "text-white" : "text-neutral-700 dark:text-neutral-300")}>
            {icon}
          </motion.div>
        </motion.div>
        {selected && (
          <span className="absolute -bottom-[10px] h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
        )}
      </Link>
    );
  }

  if (isWide) {
    return (
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        className="relative flex flex-col items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
        <span className="sr-only">{title}</span>
        <motion.div
          ref={ref}
          style={{ width, height }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            "relative flex items-center justify-center gap-2 rounded-full px-3 transition-colors",
            selected ? "bg-neutral-900 text-white" : "bg-gray-200 dark:bg-neutral-800"
          )}>
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 2, x: "-50%" }}
                className="absolute -top-[42px] left-1/2 w-fit px-2.5 py-1 text-sm font-bold whitespace-pre uppercase tracking-wide text-neutral-900 dark:text-white">
                {title}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            style={{ width: widthIcon, height: heightIcon }}
            className="flex items-center justify-center gap-2">
            {icons}
          </motion.div>
        </motion.div>
        {selected && (
          <span className="absolute -bottom-[10px] h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className="relative flex flex-col items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
      <span className="sr-only">{title}</span>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full transition-colors",
          large
            ? "bg-black"
            : selected
              ? "bg-neutral-900"
              : "bg-gray-200 dark:bg-neutral-800",
          large &&
            selected &&
            "ring-2 ring-neutral-400 ring-offset-2 ring-offset-white"
        )}>
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-[42px] left-1/2 w-fit px-2.5 py-1 text-sm font-bold whitespace-pre uppercase tracking-wide text-neutral-900 dark:text-white">
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className={cn(
            "flex items-center justify-center",
            !large && selected && "text-white"
          )}>
          {icon}
        </motion.div>
      </motion.div>
      {selected && (
        <span className="absolute -bottom-[10px] h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
      )}
    </Link>
  );
}
