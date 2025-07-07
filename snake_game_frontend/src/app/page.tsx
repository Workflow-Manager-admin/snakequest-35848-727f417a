"use client";
import SnakeGame from "@/components/SnakeGame";

// PUBLIC_INTERFACE
/** Main Home Page - renders the Snake Game centered on the page */
export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-[#222] text-center">
        <span style={{ color: "#228B22" }}>Snake</span>
        <span style={{ color: "#FFD700" }}>Quest</span>
      </h1>
      <SnakeGame />
      <footer className="mt-12 text-[#888] text-xs text-center">
        Classic Snake Game • Next.js • Try desktop or swipe controls
      </footer>
    </div>
  );
}
