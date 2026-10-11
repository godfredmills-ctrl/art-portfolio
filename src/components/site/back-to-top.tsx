"use client";

import { useLenis } from "lenis/react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const lenis = useLenis();
  return (
    <button
      type="button"
      onClick={() =>
        lenis
          ? lenis.scrollTo(0, { duration: 1.8 })
          : window.scrollTo({ top: 0, behavior: "smooth" })
      }
      className="label group flex items-center gap-3"
    >
      Back to top
      <span className="border-paper/30 group-hover:bg-paper group-hover:text-ink flex size-10 items-center justify-center rounded-full border transition-colors duration-500">
        <ArrowUp className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5" />
      </span>
    </button>
  );
}
