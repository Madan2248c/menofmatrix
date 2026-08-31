"use client";

import { Caveat, Montserrat } from "next/font/google";
import SocialFab from "@/components/SocialFab";
import FluidButton from "@/components/FluidButton";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500", "600"] });

/**
 * Compact identity cluster: photo-circle social FAB + handwriting name +
 * "Buy me few tokens" fluid button. Flows in normal layout (no absolute
 * positioning) so it can be dropped anywhere.
 */
export default function MeetLokesh({ className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="relative z-50 translate-y-[8px]">
          {/* fan upward-left into the open space, above surrounding content */}
          <SocialFab fabSize={54} itemSize={30} spread={112} startAngle={160} arc={110} />
        </div>
        <div
          className={`${caveat.className} -mt-[20px] -rotate-[4deg] flex select-none flex-col text-neutral-900`}
        >
          <span
            className="mb-0.5 ml-1"
            style={{ fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.02em", opacity: 0.7 }}
          >
            Meet me
          </span>
          <span style={{ fontSize: "1.55rem", fontWeight: 700, lineHeight: 1.02 }}>Lokesh</span>
          <span style={{ fontSize: "1.55rem", fontWeight: 700, lineHeight: 1.02 }}>Yarramallu..!</span>
        </div>
      </div>

      <FluidButton
        className={`${montserrat.className} ml-[52px]`}
        href="https://buymeacoffee.com/lokeshyarramallu"
        newTab
        baseScale={0.8}
        borderColor="#0d0d0f"
        firstTextColor="#0d0d0f"
        secondTextColor="#ffffff"
        overlayColor="#0d0d0f"
      >
        <span
          aria-hidden
          className="inline-block shrink-0"
          style={{
            width: 16,
            height: 16,
            background: "currentColor",
            WebkitMaskImage: "url(/assets/llm-token.png)",
            maskImage: "url(/assets/llm-token.png)",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
        Buy me few tokens
      </FluidButton>
    </div>
  );
}
