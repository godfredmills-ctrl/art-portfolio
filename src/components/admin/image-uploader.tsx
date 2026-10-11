"use client";

import { ImagePlus, Loader2, Star, Trash2, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { cn, mediaUrl } from "@/lib/utils";
import { SortableList, DragHandle } from "./sortable";

export interface UploadItem {
  /** Stable client id (the DB id for existing images). */
  id: string;
  dbId?: string;
  key?: string;
  width?: number;
  height?: number;
  blurDataUrl?: string | null;
  alt?: string | null;
  preview?: string;
  status: "uploading" | "done" | "error";
  progress?: number;
  error?: string;
}

interface UploadResponse {
  key: string;
  width: number;
  height: number;
  blurDataUrl: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/tiff,image/heic,image/heif";
const MAX_BYTES = 25 * 1024 * 1024;

function uploadFile(
  file: File,
  folder: "artworks" | "site",
  onProgress: (p: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let json: (UploadResponse & { error?: string }) | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && json) resolve(json);
      else reject(new Error(json?.error ?? `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(body);
  });
}

/** Hook that handles queueing files and patching their state as uploads complete. */
export function useUploads(
  setItems: (fn: (items: UploadItem[]) => UploadItem[]) => void,
  folder: "artworks" | "site",
) {
  const patch = (id: string, data: Partial<UploadItem>) =>
    setItems((items) => items.map((i) => (i.id === id ? { ...i, ...data } : i)));

  return async function add(files: File[]) {
    const queued = files.map((file) => ({
      file,
      item: {
        id: `tmp-${crypto.randomUUID()}`,
        preview: URL.createObjectURL(file),
        status: "uploading" as const,
        progress: 0,
      },
    }));
    setItems((items) => [...items, ...queued.map((q) => q.item)]);

    // Upload with limited concurrency so large batches don't saturate the server.
    const queue = [...queued];
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const { file, item } = next;
        if (file.size > MAX_BYTES) {
          patch(item.id, { status: "error", error: "Larger than 25 MB" });
          continue;
        }
        try {
          const res = await uploadFile(file, folder, (p) => patch(item.id, { progress: p }));
          patch(item.id, { ...res, status: "done", progress: 1 });
        } catch (err) {
          patch(item.id, { status: "error", error: (err as Error).message });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  };
}

export function Dropzone({
  onFiles,
  multiple = true,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors",
        compact ? "px-4 py-6" : "px-6 py-10",
        over ? "border-ink bg-stone-50" : "border-stone-300 bg-white hover:border-stone-400",
      )}
    >
      <ImagePlus className="size-6 text-stone-400" strokeWidth={1.5} />
      <p className="mt-2 text-sm text-stone-600">
        Drag images here or{" "}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-ink font-medium underline underline-offset-4"
        >
          browse
        </button>
      </p>
      <p className="mt-1 text-xs text-stone-400">
        JPEG, PNG, WebP, AVIF, TIFF or HEIC · up to 25 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Thumb({ item }: { item: UploadItem }) {
  const src = item.key ? mediaUrl(item.key) : item.preview;
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
      {src && (
        // Admin previews use plain <img> so blob: previews work before upload completes.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      )}
      {item.status === "uploading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-[2px]">
          <Loader2 className="text-ink size-5 animate-spin" />
          <div className="h-1 w-2/3 overflow-hidden rounded-full bg-stone-200">
            <div
              className="bg-ink h-full transition-[width]"
              style={{ width: `${Math.round((item.progress ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      )}
      {item.status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-50/90 p-2 text-center text-xs text-red-700">
          <TriangleAlert className="size-5" />
          {item.error}
        </div>
      )}
    </div>
  );
}

/** Sortable grid of an artwork's images; the first image is the cover. */
export function ImageGrid({
  items,
  onChange,
}: {
  items: UploadItem[];
  onChange: (items: UploadItem[]) => void;
}) {
  if (items.length === 0) return null;

  return (
    <SortableList
      items={items}
      onReorder={onChange}
      layout="grid"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      renderItem={(item, index, handle) => (
        <div className="rounded-xl border border-stone-200 bg-white p-2">
          <div className="relative">
            <Thumb item={item} />
            {index === 0 && item.status === "done" && (
              <span className="bg-ink absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white">
                <Star className="size-3 fill-current" /> Cover
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <DragHandle {...handle} />
            <input
              value={item.alt ?? ""}
              onChange={(e) =>
                onChange(items.map((i) => (i.id === item.id ? { ...i, alt: e.target.value } : i)))
              }
              placeholder="Alt text"
              aria-label="Alt text"
              className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-stone-50 px-2 text-xs focus:border-stone-300 focus:bg-white focus:outline-none"
            />
            {index !== 0 && item.status === "done" && (
              <button
                type="button"
                title="Make cover"
                aria-label="Make cover image"
                onClick={() => onChange([item, ...items.filter((i) => i.id !== item.id)])}
                className="hover:text-ink flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100"
              >
                <Star className="size-4" />
              </button>
            )}
            <button
              type="button"
              title="Remove"
              aria-label="Remove image"
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}
    />
  );
}
