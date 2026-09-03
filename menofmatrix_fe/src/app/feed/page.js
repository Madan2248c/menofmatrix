"use client";
import { BentoGridDemo } from "@/components/ui/bento-grid-demo";
import TrendingIssueCard from "@/components/TrendingIssueCard";

export default function FeedPage() {
  return (
    <main className="min-h-dvh w-full bg-white px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:h-[calc(100dvh-6rem)] lg:flex-row">
        <div className="min-h-[60vh] flex-1 lg:min-h-0">
          <BentoGridDemo />
        </div>
        <aside className="flex justify-center lg:w-[360px] lg:shrink-0 lg:items-start">
          <TrendingIssueCard />
        </aside>
      </div>
    </main>
  );
}
