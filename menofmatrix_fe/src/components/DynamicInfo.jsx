"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const BG = "#0a0a0a";
const W = 258;
const H = 56;
const FL = 24; // flare width on each side
const R = 22; // bottom corner radius

// Shape: flares out to the top edge on both sides, straight sides, rounded bottom.
const PATH = [
  `M 0 0`,
  `L ${W} 0`,
  `C ${W - FL / 2} 0, ${W - FL} ${H * 0.32}, ${W - FL} ${H * 0.42}`, // right flare
  `L ${W - FL} ${H - R}`,
  `Q ${W - FL} ${H}, ${W - FL - R} ${H}`, // bottom-right
  `L ${FL + R} ${H}`,
  `Q ${FL} ${H}, ${FL} ${H - R}`, // bottom-left
  `L ${FL} ${H * 0.42}`,
  `C ${FL} ${H * 0.32}, ${FL / 2} 0, 0 0`, // left flare
  `Z`,
].join(" ");

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/**
 * Compact dark "dynamic info" pill that hangs from the top edge with curved
 * flares joining it to the top. Modelled on the Framer "Dynamic Info" component.
 */
export default function DynamicInfo({
  name = "James Doe",
  info = "Designer",
  image = "https://framerusercontent.com/images/mNzl4z6a01cebukTTLU0FRnswRI.jpg",
  time,
  onClick,
}) {
  const clock = useClock();
  const shown = time ?? clock;

  return (
    <div
      onClick={onClick}
      className={`${inter.className} relative text-white ${onClick ? "cursor-pointer" : ""}`}
      style={{ width: W, height: H }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="absolute inset-0"
        style={{ filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.32))" }}
      >
        <path d={PATH} fill={BG} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      </svg>

      <div className="absolute inset-0 flex items-center gap-2.5 pl-[38px] pr-4">
        {image ? (
          <img
            src={image}
            alt=""
            draggable={false}
            className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
        ) : (
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
            {name.charAt(0)}
          </span>
        )}

        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[13px] font-semibold">{name}</span>
          <span className="truncate text-[12px] text-neutral-400">{info}</span>
        </span>

        <span className="ml-auto shrink-0 text-[13px] font-medium tabular-nums text-white/95">
          {shown}
        </span>
      </div>
    </div>
  );
}
