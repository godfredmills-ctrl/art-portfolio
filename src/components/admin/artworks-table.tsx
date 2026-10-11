"use client";

import { ArrowUpDown, ExternalLink, Pencil, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteArtwork, reorderArtworks, setArtworkFlag } from "@/server/actions/artworks";
import { ConfirmDialog } from "./confirm-dialog";
import { DragHandle, SortableList } from "./sortable";
import { Badge, Button, Input, Select } from "./ui";

export interface ArtworkRow {
  id: string;
  title: string;
  slug: string;
  year: number;
  published: boolean;
  featured: boolean;
  category: { id: string; name: string } | null;
  thumb: string | null;
  imageCount: number;
}

type Status = "all" | "published" | "draft";

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="block size-12 shrink-0 overflow-hidden rounded-md bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="size-full object-cover" loading="lazy" />}
    </span>
  );
}

export function ArtworksTable({
  rows: initialRows,
  categories,
  initialStatus,
}: {
  rows: ArtworkRow[];
  categories: { id: string; name: string }[];
  initialStatus: Status;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState(initialRows);
  const [toDelete, setToDelete] = useState<ArtworkRow | null>(null);
  const [pending, startTransition] = useTransition();

  // Keep local rows in sync when the server sends fresh data.
  const [source, setSource] = useState(initialRows);
  if (source !== initialRows) {
    setSource(initialRows);
    setRows(initialRows);
    setOrder(initialRows);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!q || r.title.toLowerCase().includes(q) || String(r.year).includes(q)) &&
        (category === "all" || (category === "none" ? !r.category : r.category?.id === category)) &&
        (status === "all" || (status === "published") === r.published),
    );
  }, [rows, query, category, status]);

  function toggle(row: ArtworkRow, flag: "published" | "featured") {
    const value = !row[flag];
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [flag]: value } : r)));
    startTransition(async () => {
      const res = await setArtworkFlag(row.id, flag, value);
      if (!res.ok) {
        toast.error(res.message);
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [flag]: !value } : r)));
      } else {
        toast.success(
          flag === "published"
            ? value
              ? "Published"
              : "Moved to drafts"
            : value
              ? "Featured on home page"
              : "Removed from featured",
        );
      }
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteArtwork(toDelete.id);
      if (!res.ok) toast.error(res.message);
      else {
        toast.success(res.message ?? "Deleted");
        setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
        router.refresh();
      }
      setToDelete(null);
    });
  }

  function saveOrder() {
    startTransition(async () => {
      const res = await reorderArtworks(order.map((r) => r.id));
      if (!res.ok) toast.error(res.message);
      else {
        toast.success(res.message ?? "Order saved");
        setRows(order);
        setReordering(false);
        router.refresh();
      }
    });
  }

  if (reordering) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-sm text-stone-600">
            Drag works into the order they should appear on the site.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setOrder(rows);
                setReordering(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={saveOrder} loading={pending}>
              Save order
            </Button>
          </div>
        </div>
        <SortableList
          items={order}
          onReorder={setOrder}
          className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white"
          itemClassName="bg-white"
          renderItem={(row, index, handle) => (
            <div className="flex items-center gap-3 px-3 py-2">
              <DragHandle {...handle} />
              <span className="w-6 text-right text-xs text-stone-400 tabular-nums">
                {index + 1}
              </span>
              <Thumb src={row.thumb} />
              <span className="flex-1 truncate text-sm font-medium">{row.title}</span>
              <span className="text-[13px] text-stone-500">{row.year}</span>
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or year"
            className="pl-9"
            aria-label="Search artworks"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-auto"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">Uncategorised</option>
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="w-auto"
          aria-label="Filter by status"
        >
          <option value="all">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </Select>
        <Button variant="secondary" onClick={() => setReordering(true)}>
          <ArrowUpDown className="size-4" /> Reorder
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50/70 text-left text-[12px] font-medium text-stone-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Artwork</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Category</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((row) => (
              <tr key={row.id} className="group hover:bg-stone-50/60">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/artworks/${row.id}`} className="flex items-center gap-3">
                    <Thumb src={row.thumb} />
                    <span className="min-w-0">
                      <span className="text-ink block truncate font-medium group-hover:underline">
                        {row.title}
                      </span>
                      <span className="block text-[13px] text-stone-500">
                        {row.year} · {row.imageCount} image{row.imageCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="hidden px-4 py-2.5 text-stone-600 md:table-cell">
                  {row.category?.name ?? <span className="text-stone-400">—</span>}
                </td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <button
                    type="button"
                    onClick={() => toggle(row, "published")}
                    title={row.published ? "Unpublish" : "Publish"}
                  >
                    {row.published ? <Badge tone="success">Published</Badge> : <Badge>Draft</Badge>}
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggle(row, "featured")}
                      title={row.featured ? "Remove from featured" : "Feature on home page"}
                      aria-pressed={row.featured}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md hover:bg-stone-100",
                        row.featured ? "text-amber-500" : "text-stone-300 hover:text-stone-500",
                      )}
                    >
                      <Star className={cn("size-4", row.featured && "fill-current")} />
                    </button>
                    {row.published && (
                      <a
                        href={`/works/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on site"
                        className="hover:text-ink flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <Link
                      href={`/admin/artworks/${row.id}`}
                      title="Edit"
                      className="hover:text-ink flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(row)}
                      title="Delete"
                      className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-stone-500">
            No artworks match these filters.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this artwork?"
        description={<>“{toDelete?.title}” and its images will be permanently removed.</>}
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
