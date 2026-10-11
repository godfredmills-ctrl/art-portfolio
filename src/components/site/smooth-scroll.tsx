"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function ResetScrollOnNavigate() {
  const lenis = useLenis();
  const pathname = usePathname();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      {reduce ? (
        children
      ) : (
        <ReactLenis root options={{ lerp: 0.09, smoothWheel: true, anchors: { offset: 0 } }}>
          <ResetScrollOnNavigate />
          {children}
        </ReactLenis>
      )}
    </MotionConfig>
  );
}
