import { Poppins } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import EyeFollowAuth from "@/components/EyeFollowAuth";
import FramerEmbed from "@/components/FramerEmbed";
import PollCarousel from "@/components/PollCarousel";
import IdeaBoard from "@/components/IdeaBoard";
import IdeaChip from "@/components/IdeaChip";
import FeaturePopout from "@/components/FeaturePopout";
import WeeklyChallengePendant from "@/components/WeeklyChallengePendant";
import MatrixScore from "@/components/MatrixScore";
import UsageTracker from "@/components/UsageTracker";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const DOT_GRID_URL =
  "https://framer.com/m/Dot-Grid-BG-GVxaLr.js@mfNBQfaPK0E7CX1epbhh";

// Black-on-white (the source is white-on-black).
const DOT_GRID_PROPS = {
  dotColor: "#111111",
  dotSize: 2,
  dotSpacing: 18,
  enableRevolve: true,
  orbitSpeed: 1.2,
  impactRadius: 120,
  scaleOnHover: 1.8,
};

export default function Home() {
  return (
    <MotionProvider>
    <div className={`${poppins.className} relative min-h-dvh w-full bg-white lg:overflow-hidden`}>
      {/* Dot-grid background (Framer component) */}
      <FramerEmbed url={DOT_GRID_URL} props={DOT_GRID_PROPS} className="fixed inset-0 z-0" />

      {/* Attached to the top edge, centered: auth */}
      <div className="pointer-events-none fixed left-1/2 top-0 z-20 -translate-x-1/2">
        <div className="pointer-events-auto">
          <EyeFollowAuth />
        </div>
      </div>

      {/* Below lg: a natural scrolling column. lg+: a full-viewport positioning
          context for the absolutely-placed spatial canvas panels. */}
      <div className="relative z-10 flex flex-col items-center gap-16 px-4 pb-32 pt-24 lg:absolute lg:inset-0 lg:z-10 lg:block lg:gap-0 lg:p-0">

      {/* Matrix Score — canvas centerpiece */}
      <div className="pointer-events-none order-1 flex items-center justify-center lg:absolute lg:inset-0 lg:z-10">
        <div className="pointer-events-auto">
          <MatrixScore />
        </div>
      </div>

      {/* Community Pulse — right side */}
      <div className="pointer-events-none order-2 flex w-full items-center justify-center lg:absolute lg:inset-y-0 lg:right-0 lg:z-10 lg:w-1/3 lg:px-4">
        <div className="pointer-events-auto flex w-full max-w-[420px] flex-col items-center gap-2 lg:mt-6 lg:[zoom:0.72]">
          <div className="w-full px-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
              Community Pulse
            </p>
            <p className="mt-1 max-w-[300px] text-[13px] leading-snug text-neutral-600">
              See where builders stand, then add your voice.
            </p>
          </div>
          <PollCarousel />
        </div>
      </div>

      {/* Idea board launcher + weekly challenge pendant — top of the left third */}
      <div className="pointer-events-none order-3 flex w-full items-start justify-center lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:w-1/3 lg:px-4 lg:pt-20">
        <div className="pointer-events-auto flex flex-col items-center">
          <FeaturePopout label="Idea Board" trigger={<IdeaChip />}>
            <IdeaBoard />
          </FeaturePopout>
          <WeeklyChallengePendant />
          <div className="mt-6 lg:[zoom:0.72]">
            <UsageTracker />
          </div>
        </div>
      </div>

      </div>
    </div>
    </MotionProvider>
  );
}
