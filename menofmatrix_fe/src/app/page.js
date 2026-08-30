import Link from "next/link";
import { Poppins } from "next/font/google";
import { HiOutlineSparkles, HiOutlineArrowRight } from "react-icons/hi2";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function Home() {
  return (
    <div className={`${poppins.className} relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-white/70 px-4`}>
      {/* Ambient background glow spheres */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-pink-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-96 w-96 rounded-full bg-rose-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-amber-400/12 blur-[120px]" />

      {/* Centered Glassmorphic Announcement Card */}
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-8 text-center shadow-[0_20px_50px_rgba(60,50,35,0.08),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
        
        {/* Status Pill */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/90 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-600">
            Coming Soon
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          MenOfMatrix
        </h1>
        <p className="mt-2 text-sm text-neutral-500 leading-relaxed max-w-sm">
          Something extraordinary is in the works. The full platform experience will be soon released.
        </p>

        {/* CTA Button to Social page */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/social"
            className="group flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-95"
          >
            <HiOutlineSparkles className="h-4 w-4 text-amber-400 transition-transform group-hover:rotate-12" />
            <span>Explore Social Collective</span>
            <HiOutlineArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
