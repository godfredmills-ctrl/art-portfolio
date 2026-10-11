"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_IN_OUT, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/works", label: "Works" },
  { href: "/statement", label: "Statement" },
  { href: "#contact", label: "Contact" },
];

export function Header({ name }: { name: string }) {
  const pathname = usePathname();
  const lenis = useLenis();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 160);
  });

  // Close the menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => href.startsWith("/") && pathname.startsWith(href);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: hidden && !open ? "-110%" : 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="gutter fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between text-white mix-blend-difference"
      >
        <Link href="/" className="font-serif text-2xl leading-none tracking-tight md:text-[1.7rem]">
          {name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-10 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label group relative flex items-center gap-2"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full bg-current transition-transform duration-500 ease-[var(--ease-expo)]",
                  isActive(item.href) ? "scale-100" : "scale-0 group-hover:scale-100",
                )}
              />
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="label md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          Menu
        </button>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.8, ease: EASE_IN_OUT }}
            className="gutter bg-ink text-paper fixed inset-0 z-[70] flex flex-col pb-10"
          >
            <div className="flex h-20 items-center justify-between">
              <span className="font-serif text-2xl">{name}</span>
              <button type="button" onClick={() => setOpen(false)} className="label">
                Close
              </button>
            </div>
            <nav aria-label="Mobile" className="mt-auto flex flex-col gap-2">
              {[{ href: "/", label: "Index" }, ...NAV].map((item, i) => (
                <div key={item.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.25 + i * 0.07 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 font-serif text-6xl leading-[1.05]"
                    >
                      <span className="label text-paper/50">0{i + 1}</span>
                      {item.label}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
