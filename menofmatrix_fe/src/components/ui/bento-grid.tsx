"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const BentoGrid = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("mx-auto grid max-w-7xl grid-cols-1 auto-rows-[200px] gap-2 md:grid-cols-3 md:grid-rows-4 md:auto-rows-fr", className)}>
    {children}
  </div>
);

export const BentoGridItem = ({ className, title, description, header, icon, meta, expanded, onClick }: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  meta?: string;
  expanded?: boolean;
  onClick?: () => void;
}) => (
  <motion.div layout onClick={onClick} transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.9 }} className={cn("group/bento min-h-0 cursor-pointer overflow-hidden shadow-input row-span-1 flex flex-col justify-between space-y-1.5 rounded-lg border border-neutral-200 bg-white p-2.5 transition-shadow duration-300 hover:shadow-xl", className)}>
    <div className="flex min-h-0 w-full flex-1 overflow-hidden rounded-lg transition-all duration-700">{header}</div>
    <div className="min-h-0 shrink-0 overflow-hidden transition duration-200 group-hover/bento:translate-x-1">
      <div className={cn("mb-1 mt-1 flex min-w-0 items-start gap-1.5 overflow-hidden font-sans font-bold leading-tight text-neutral-600", expanded ? "text-[12px]" : "text-[10.5px]")}>
        <span className="mt-px shrink-0">{icon}</span>
        <span className={cn("min-w-0 flex-1 overflow-hidden text-ellipsis", expanded ? "line-clamp-3" : "line-clamp-2")}>{title}</span>
        {expanded && meta && <span className="ml-auto shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-neutral-400">{meta}</span>}
      </div>
      {expanded && <div className="line-clamp-3 overflow-hidden font-sans text-[9.5px] font-normal leading-snug text-neutral-600">{description}</div>}
    </div>
  </motion.div>
);
