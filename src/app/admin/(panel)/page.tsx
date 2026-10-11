import { ArrowUpRight, Check, Circle, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, PageHeader, buttonClasses } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [total, published, featured, categories, recent, settings] = await Promise.all([
    db.artwork.count(),
    db.artwork.count({ where: { published: true } }),
    db.artwork.count({ where: { featured: true, published: true } }),
    db.category.count(),
    db.artwork.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
    }),
    db.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  const stats = [
    { label: "Artworks", value: total, href: "/admin/artworks" },
    { label: "Published", value: published, href: "/admin/artworks?status=published" },
    { label: "Drafts", value: total - published, href: "/admin/artworks?status=draft" },
    { label: "Categories", value: categories, href: "/admin/categories" },
  ];

  const checklist = [
    {
      done: Boolean(settings?.statement),
      label: "Write your artist statement",
      href: "/admin/content",
    },
    { done: Boolean(settings?.portraitKey), label: "Add a portrait", href: "/admin/content" },
    { done: Boolean(settings?.email), label: "Add a contact email", href: "/admin/content" },
    { done: categories > 0, label: "Create categories", href: "/admin/categories" },
    { done: featured > 0, label: "Feature works on the home page", href: "/admin/artworks" },
  ];
  const remaining = checklist.filter((c) => !c.done).length;

  return (
    <>
      <PageHeader
        title={`Hello${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here’s what’s on view in your portfolio."
        actions={
          <Link href="/admin/artworks/new" className={buttonClasses()}>
            <Plus className="size-4" /> Add artwork
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
          >
            <p className="text-[13px] text-stone-500">{s.label}</p>
            <p className="text-ink mt-2 font-serif text-5xl leading-none">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          title="Recently edited"
          className="lg:col-span-2"
          actions={
            <Link href="/admin/artworks" className="hover:text-ink text-[13px] text-stone-500">
              View all
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">No artworks yet.</p>
          ) : (
            <ul className="-my-2 divide-y divide-stone-100">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/artworks/${a.id}`}
                    className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-2.5 hover:bg-stone-50"
                  >
                    <span className="size-12 shrink-0 overflow-hidden rounded-md bg-stone-100">
                      {a.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(a.images[0].key)}
                          alt=""
                          className="size-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-sm font-medium">{a.title}</span>
                      <span className="block text-[13px] text-stone-500">
                        {a.year}
                        {a.category && ` · ${a.category.name}`}
                      </span>
                    </span>
                    {a.published ? <Badge tone="success">Published</Badge> : <Badge>Draft</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Site checklist"
          description={
            remaining === 0
              ? "Everything’s in place."
              : `${remaining} thing${remaining === 1 ? "" : "s"} left to set up`
          }
        >
          <ul className="space-y-1">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-stone-50"
                >
                  {item.done ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle className="size-5 text-stone-300" />
                  )}
                  <span className={item.done ? "text-stone-400 line-through" : "text-ink"}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink mt-5 inline-flex items-center gap-1 text-[13px] font-medium hover:underline"
          >
            Open public site <ArrowUpRight className="size-3.5" />
          </a>
        </Card>
      </div>
    </>
  );
}
