"use client";

import {
  ExternalLink,
  FileText,
  Folders,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/artworks", label: "Artworks", icon: Images },
  { href: "/admin/categories", label: "Categories", icon: Folders },
  { href: "/admin/content", label: "Statement & site", icon: FileText },
  { href: "/admin/account", label: "Account", icon: UserRound },
];

export function Sidebar({ artistName, userEmail }: { artistName: string; userEmail: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-8">
        <p className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase">Studio</p>
        <p className="text-ink mt-1 truncate font-serif text-2xl leading-tight">{artistName}</p>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "text-ink bg-white font-medium shadow-xs ring-1 ring-stone-200"
                  : "hover:text-ink text-stone-600 hover:bg-stone-200/50",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-stone-200 px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-200/50"
        >
          <ExternalLink className="size-4" strokeWidth={1.75} />
          View site
        </a>
        <form action={logout}>
          <button
            type="submit"
            className="hover:text-ink flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-200/50"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            Sign out
          </button>
        </form>
        <p className="truncate px-3 pt-2 text-xs text-stone-400">{userEmail}</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-[#f1efea] lg:block">
        {content}
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-[#f7f6f3]/90 px-4 backdrop-blur lg:hidden">
        <p className="font-serif text-xl">{artistName}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex size-9 items-center justify-center rounded-lg hover:bg-stone-200/60"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="bg-ink/30 absolute inset-0 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-[#f1efea] shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute top-5 right-4 flex size-9 items-center justify-center rounded-lg hover:bg-stone-200/60"
            >
              <X className="size-5" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
