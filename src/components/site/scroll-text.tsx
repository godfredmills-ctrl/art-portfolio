"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { useHydrated } from "@/lib/use-hydrated";

const DIM = 0.14;

function Word({
  children,
  progress,
  range,
  hydrated,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  hydrated: boolean;
}) {
  const opacity = useTransform(progress, range, [DIM, 1]);
  return (
    <motion.span style={{ opacity: hydrated ? opacity : DIM }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

/** Paragraph whose words light up one by one as it travels through the viewport. */
export function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const hydrated = useHydrated();
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <Word
            key={i}
            progress={scrollYProgress}
            hydrated={hydrated}
            range={[i / words.length, Math.min(1, (i + 1.5) / words.length)]}
          >
            {word}
          </Word>
        ))}
      </span>
    </p>
  );
}
