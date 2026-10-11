"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 32,
  className,
  ...rest
}: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.1, ease: EASE_OUT, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Splits text into words that slide up from behind a mask, one after another.
 * Set `onMount` for above-the-fold headings that should play immediately.
 */
export function RevealText({
  text,
  as: Tag = "span",
  className,
  wordClassName,
  delay = 0,
  stagger = 0.06,
  onMount = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  onMount?: boolean;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const trigger = onMount
    ? { animate: "visible" }
    : { whileInView: "visible", viewport: { once: true, margin: "0px 0px -10% 0px" } };

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        initial="hidden"
        {...trigger}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
        className="inline"
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            // Extra bottom padding keeps descenders (g, y, p) inside the mask.
            className="-mb-[0.14em] inline-block overflow-hidden pb-[0.22em] align-bottom leading-[inherit]"
          >
            <motion.span
              className={cn("inline-block will-change-transform", wordClassName)}
              variants={{
                hidden: { y: "110%", rotate: 4 },
                visible: { y: "0%", rotate: 0, transition: { duration: 1.2, ease: EASE_OUT } },
              }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 && " "}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/** Wipes an image in from the bottom while it settles from a slight zoom. */
export function ImageReveal({
  children,
  className,
  delay = 0,
  onMount = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  onMount?: boolean;
}) {
  const trigger = onMount
    ? { animate: "visible" }
    : { whileInView: "visible", viewport: { once: true, margin: "0px 0px -10% 0px" } };

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial="hidden"
      {...trigger}
      variants={{
        hidden: { clipPath: "inset(100% 0% 0% 0%)" },
        visible: {
          clipPath: "inset(0% 0% 0% 0%)",
          transition: { duration: 1.4, ease: EASE_OUT, delay },
        },
      }}
    >
      <motion.div
        className="h-full w-full"
        variants={{
          hidden: { scale: 1.25 },
          visible: { scale: 1, transition: { duration: 1.8, ease: EASE_OUT, delay } },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
