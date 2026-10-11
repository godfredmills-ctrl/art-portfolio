"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { deleteCategory, reorderCategories, saveCategory } from "@/server/actions/categories";
import { ConfirmDialog } from "./confirm-dialog";
import { DragHandle, SortableList } from "./sortable";
import { Button, Card, EmptyState, Field, Input, Textarea } from "./ui";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
}

const blank = { name: "", slug: "", description: "" };

function CategoryEditor({
  id,
  initial,
  onDone,
}: {
  id: string | null;
  initial: typeof blank;
  onDone: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCategory(id, values);
      if (!res.ok) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        return;
      }
      toast.success(res.message ?? "Saved");
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`name-${id ?? "new"}`} error={errors.name}>
          <Input
            id={`name-${id ?? "new"}`}
            value={values.name}
            autoFocus
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                name: e.target.value,
                slug: slugTouched ? v.slug : slugify(e.target.value),
              }))
            }
            placeholder="e.g. Paintings"
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label="Slug" htmlFor={`slug-${id ?? "new"}`} error={errors.slug}>
          <Input
            id={`slug-${id ?? "new"}`}
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setValues((v) => ({ ...v, slug: e.target.value.toLowerCase() }));
            }}
            aria-invalid={!!errors.slug}
          />
        </Field>
      </div>
      <Field
        label="Description (optional)"
        htmlFor={`desc-${id ?? "new"}`}
        error={errors.description}
        hint="Shown above the works when this category is selected."
      >
        <Textarea
          id={`desc-${id ?? "new"}`}
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {id ? "Save" : "Create category"}
        </Button>
      </div>
    </form>
  );
}

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(categories);
  const [source, setSource] = useState(categories);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [toDelete, setToDelete] = useState<CategoryRow | null>(null);
  const [pending, startTransition] = useTransition();

  if (source !== categories) {
    setSource(categories);
    setItems(categories);
  }

  function reorder(next: CategoryRow[]) {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const res = await reorderCategories(next.map((c) => c.id));
      if (!res.ok) {
        setItems(previous);
        toast.error(res.message);
      } else toast.success("Order saved");
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteCategory(toDelete.id);
      if (!res.ok) toast.error(res.message);
      else {
        toast.success(res.message ?? "Deleted");
        router.refresh();
      }
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-6">
      {editing === "new" ? (
        <Card title="New category">
          <CategoryEditor id={null} initial={blank} onDone={() => setEditing(null)} />
        </Card>
      ) : (
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New category
        </Button>
      )}

      {items.length === 0 ? (
        editing !== "new" && (
          <EmptyState
            title="No categories yet"
            description="Create categories like Paintings, Drawings or Sculpture to organise the gallery."
          />
        )
      ) : (
        <SortableList
          items={items}
          onReorder={reorder}
          className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs"
          itemClassName="bg-white"
          renderItem={(c, _i, handle) =>
            editing === c.id ? (
              <div className="p-5">
                <CategoryEditor
                  id={c.id}
                  initial={{ name: c.name, slug: c.slug, description: c.description }}
                  onDone={() => setEditing(null)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-3">
                <DragHandle {...handle} />
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate font-medium">{c.name}</p>
                  <p className="truncate text-[13px] text-stone-500">
                    /works?category={c.slug} · {c.count} work{c.count === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(c.id)}
                  title="Edit"
                  className="hover:text-ink flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(c)}
                  title="Delete"
                  className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          }
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete “${toDelete?.name}”?`}
        description={
          toDelete?.count
            ? `Its ${toDelete.count} artwork${toDelete.count === 1 ? "" : "s"} will be kept but become uncategorised.`
            : "This category has no artworks."
        }
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
