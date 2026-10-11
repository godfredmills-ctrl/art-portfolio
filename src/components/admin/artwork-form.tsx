"use client";

import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { formatDimensions, type DimensionUnit } from "@/lib/format";
import { slugify } from "@/lib/utils";
import { deleteArtwork, saveArtwork } from "@/server/actions/artworks";
import { ConfirmDialog } from "./confirm-dialog";
import { Dropzone, ImageGrid, useUploads, type UploadItem } from "./image-uploader";
import { MediumInput } from "./medium-input";
import { Button, Card, Field, Input, Select, Switch, Textarea, buttonClasses } from "./ui";

export interface ArtworkFormValues {
  title: string;
  slug: string;
  year: string;
  categoryId: string;
  mediums: string[];
  height: string;
  width: string;
  depth: string;
  unit: DimensionUnit;
  dimensionsNote: string;
  description: string;
  published: boolean;
  featured: boolean;
  images: UploadItem[];
}

function emptyArtwork(): ArtworkFormValues {
  return {
    title: "",
    slug: "",
    year: String(new Date().getFullYear()),
    categoryId: "",
    mediums: [],
    height: "",
    width: "",
    depth: "",
    unit: "CM",
    dimensionsNote: "",
    description: "",
    published: true,
    featured: false,
    images: [],
  };
}

export function ArtworkForm({
  id,
  initial,
  categories,
  mediumOptions,
}: {
  id?: string;
  /** Omit for a new artwork. */
  initial?: ArtworkFormValues;
  categories: { id: string; name: string }[];
  mediumOptions: string[];
}) {
  const router = useRouter();
  const [initialValues] = useState(() => initial ?? emptyArtwork());
  const [values, setValues] = useState(initialValues);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialValues));

  const setImages = (fn: (items: UploadItem[]) => UploadItem[]) =>
    setValues((v) => ({ ...v, images: fn(v.images) }));
  const addFiles = useUploads(setImages, "artworks");

  const dirty = JSON.stringify(values) !== savedSnapshot;
  const uploading = values.images.some((i) => i.status === "uploading");

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof ArtworkFormValues>(key: K, value: ArtworkFormValues[K]) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const preview = useMemo(
    () =>
      formatDimensions({
        height: Number(values.height) || null,
        width: Number(values.width) || null,
        depth: Number(values.depth) || null,
        unit: values.unit,
        dimensionsNote: values.dimensionsNote,
      }),
    [values.height, values.width, values.depth, values.unit, values.dimensionsNote],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading) {
      toast.error("Please wait for uploads to finish.");
      return;
    }
    const failed = values.images.filter((i) => i.status === "error");
    const payload = {
      ...values,
      images: values.images
        .filter((i) => i.status === "done" && i.key)
        .map((i) => ({
          id: i.dbId,
          key: i.key!,
          width: i.width!,
          height: i.height!,
          blurDataUrl: i.blurDataUrl ?? null,
          alt: i.alt ?? null,
        })),
    };

    startSaving(async () => {
      const res = await saveArtwork(id ?? null, payload);
      if (!res.ok) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        return;
      }
      setErrors({});
      if (failed.length)
        toast.warning(`${failed.length} image(s) failed to upload and were skipped.`);
      toast.success(res.message ?? "Saved");
      if (!id) {
        setSavedSnapshot(JSON.stringify(values));
        router.push(`/admin/artworks/${res.data.id}`);
        return;
      }
      // Attach database ids to freshly uploaded images and drop failed ones.
      const idByKey = new Map(res.data.images.map((i) => [i.key, i.id]));
      const next = {
        ...values,
        slug: res.data.slug,
        images: values.images.flatMap((i) => {
          const dbId = i.key ? idByKey.get(i.key) : undefined;
          return dbId ? [{ ...i, id: dbId, dbId }] : [];
        }),
      };
      setValues(next);
      setSavedSnapshot(JSON.stringify(next));
      router.refresh();
    });
  }

  function remove() {
    if (!id) return;
    startDeleting(async () => {
      const res = await deleteArtwork(id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message ?? "Deleted");
      setSavedSnapshot(JSON.stringify(values));
      router.push("/admin/artworks");
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/artworks"
            className="hover:text-ink inline-flex items-center gap-1.5 text-[13px] text-stone-500"
          >
            <ArrowLeft className="size-3.5" /> Artworks
          </Link>
          <h1 className="mt-1 truncate font-serif text-4xl tracking-tight">
            {values.title || (id ? "Untitled" : "New artwork")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {id && initialValues.published && (
            <a
              href={`/works/${initialValues.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("ghost")}
            >
              <ExternalLink className="size-4" /> View
            </a>
          )}
          <Button type="submit" loading={saving} disabled={uploading}>
            {id ? "Save changes" : "Create artwork"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title" htmlFor="title" error={errors.title} className="sm:col-span-2">
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  aria-invalid={!!errors.title}
                  placeholder="e.g. Salt Field II"
                  required
                />
              </Field>
              <Field
                label="URL slug"
                htmlFor="slug"
                error={errors.slug}
                hint={`/works/${values.slug || "…"}`}
                className="sm:col-span-2"
              >
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                  aria-invalid={!!errors.slug}
                />
              </Field>
              <Field label="Year" htmlFor="year" error={errors.year}>
                <Input
                  id="year"
                  inputMode="numeric"
                  value={values.year}
                  onChange={(e) => set("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  aria-invalid={!!errors.year}
                />
              </Field>
              <Field label="Category" htmlFor="category" error={errors.categoryId}>
                <Select
                  id="category"
                  value={values.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card title="Medium & dimensions">
            <div className="space-y-5">
              <Field
                label="Mediums"
                htmlFor="mediums"
                error={errors.mediums}
                hint="Press Enter or comma to add each medium."
              >
                <MediumInput
                  id="mediums"
                  value={values.mediums}
                  onChange={(m) => set("mediums", m)}
                  suggestions={mediumOptions}
                  invalid={!!errors.mediums}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(["height", "width", "depth"] as const).map((dim) => (
                  <Field
                    key={dim}
                    label={
                      dim === "depth" ? "Depth (optional)" : dim[0]!.toUpperCase() + dim.slice(1)
                    }
                    htmlFor={dim}
                    error={errors[dim]}
                  >
                    <Input
                      id={dim}
                      inputMode="decimal"
                      value={values[dim]}
                      onChange={(e) => set(dim, e.target.value.replace(/[^0-9.]/g, ""))}
                      aria-invalid={!!errors[dim]}
                    />
                  </Field>
                ))}
                <Field label="Unit" htmlFor="unit">
                  <Select
                    id="unit"
                    value={values.unit}
                    onChange={(e) => set("unit", e.target.value as DimensionUnit)}
                  >
                    <option value="CM">cm</option>
                    <option value="IN">in</option>
                    <option value="MM">mm</option>
                  </Select>
                </Field>
              </div>

              <Field
                label="Dimensions note (optional)"
                htmlFor="dimensionsNote"
                error={errors.dimensionsNote}
                hint="Overrides the numbers above, e.g. “Dimensions variable” or “Triptych, each 60 × 40 cm”."
              >
                <Input
                  id="dimensionsNote"
                  value={values.dimensionsNote}
                  onChange={(e) => set("dimensionsNote", e.target.value)}
                />
              </Field>

              <p className="rounded-lg bg-stone-50 px-3 py-2 text-[13px] text-stone-600">
                Displayed as: <span className="text-ink font-medium">{preview ?? "—"}</span>
              </p>
            </div>
          </Card>

          <Card title="Images" description="Drag to reorder. The first image is used as the cover.">
            <div className="space-y-4">
              <ImageGrid
                items={values.images}
                onChange={(images) => setValues((v) => ({ ...v, images }))}
              />
              <Dropzone onFiles={addFiles} compact={values.images.length > 0} />
              {errors.images && <p className="text-[13px] text-red-600">{errors.images}</p>}
            </div>
          </Card>

          <Card title="Description" description="Optional. Separate paragraphs with a blank line.">
            <Textarea
              id="description"
              rows={7}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              aria-label="Description"
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="mt-1.5 text-[13px] text-red-600">{errors.description}</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-5">
              <Switch
                id="published"
                label="Published"
                description="Visible on the public site."
                checked={values.published}
                onChange={(v) => set("published", v)}
              />
              <Switch
                id="featured"
                label="Featured"
                description="Shown in the home page selection."
                checked={values.featured}
                onChange={(v) => set("featured", v)}
              />
            </div>
          </Card>

          {id && (
            <Card title="Danger zone">
              <p className="mb-4 text-[13px] text-stone-500">
                Deleting removes the artwork and its images permanently.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full text-red-600"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> Delete artwork
              </Button>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this artwork?"
        description={
          <>“{values.title || "Untitled"}” and all of its images will be permanently removed.</>
        }
        pending={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}
