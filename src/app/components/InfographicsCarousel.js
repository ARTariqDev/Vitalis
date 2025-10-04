"use client";
import { useState,useEffect } from "react";

export default function InfographicsCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") goLeft();
      if (e.key === "ArrowRight") goRight();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const goLeft = () => setCurrent((prev) => (prev === 0 ? total - 1 : prev - 1));
  const goRight = () => setCurrent((prev) => (prev === total - 1 ? 0 : prev + 1));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md h-72 flex items-center justify-center">
        <button
          onClick={goLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-teal-200 text-teal-700 rounded-full p-2 shadow-lg border border-teal-300"
          aria-label="Previous"
        >
          <span className="text-2xl">&#8592;</span>
        </button>
        <img
          src={images[current]}
          alt={`Figure ${current + 1}`}
          className="w-full h-72 object-contain rounded-lg border bg-slate-100 transition-all duration-300"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
        />
        <button
          onClick={goRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-teal-200 text-teal-700 rounded-full p-2 shadow-lg border border-teal-300"
          aria-label="Next"
        >
          <span className="text-2xl">&#8594;</span>
        </button>
      </div>
      <div className="mt-2 text-slate-600 text-sm flex items-center gap-2">
        <span className="font-mono px-2 py-1 bg-teal-50 rounded">{current + 1} / {total}</span>
        <span className="text-xs text-slate-400">(Use ←/→ keys)</span>
      </div>
      <div className="mt-2 text-slate-700 text-xs italic">
        {images[current].includes("PMC") ? `Figure ${current + 1}` : ""}
      </div>
    </div>
  );
}
