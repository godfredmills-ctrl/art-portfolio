"use client";

import { motion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

/** Re-mounts on every navigation, giving each page a soft entrance. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
