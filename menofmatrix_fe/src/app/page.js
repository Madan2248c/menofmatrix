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
    <div className={`${poppins.className} relative min-h-dvh w-full overflow-hidden bg-white`}>
      {/* Dot-grid background (Framer component) */}
      <FramerEmbed url={DOT_GRID_URL} props={DOT_GRID_PROPS} className="fixed inset-0 z-0" />

      {/* Attached to the top edge, centered: auth */}
      <div className="pointer-events-none fixed left-1/2 top-0 z-20 -translate-x-1/2">
        <div className="pointer-events-auto">
          <EyeFollowAuth />
        </div>
      </div>

      {/* Idea board launcher + weekly challenge pendant — top of the left third */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-1/3 items-start justify-center px-4 pt-16">
        <div className="pointer-events-auto flex flex-col items-center">
          <FeaturePopout label="Idea Board" trigger={<IdeaChip />}>
            <IdeaBoard />
          </FeaturePopout>
          <WeeklyChallengePendant />
        </div>
      </div>

      {/* Matrix Score — canvas centerpiece */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="pointer-events-auto">
          <MatrixScore />
        </div>
      </div>

      {/* Rotating live polls — centered within the right third of the screen */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-1/3 items-center justify-center px-4">
        <div className="pointer-events-auto" style={{ zoom: 0.62 }}>
          <PollCarousel />
        </div>
      </div>
    </div>
    </MotionProvider>
  );
}
