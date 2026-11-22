"use client";

import { Download, ExternalLink, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import { Button, Card, buttonClasses } from "./ui";

interface CurrentCv {
  src: string;
  fileName: string;
  size: number;
  updatedAt: string;
}

const MAX_BYTES = 15 * 1024 * 1024;

function upload(file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("file", file);
    xhr.open("POST", "/api/admin/cv");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status})`;
      try {
        message = JSON.parse(xhr.responseText).error ?? message;
      } catch {}
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(body);
  });
}

export function CvManager({ current }: { current: CurrentCv | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("The CV must be 15 MB or smaller.");
      return;
    }
    setProgress(0);
    try {
      await upload(file, setProgress);
      toast.success(current ? "CV replaced" : "CV uploaded and published");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/admin/cv", { method: "DELETE" });
      if (!res.ok) throw new Error(`Could not remove the CV (${res.status})`);
      toast.success("CV removed from the site");
      setConfirmRemove(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRemoving(false);
    }
  }

  const uploading = progress !== null;

  return (
    <div className="grid max-w-3xl gap-6">
      {current && (
        <Card title="Current CV">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <FileText className="size-6" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-sm font-medium">{current.fileName}</p>
              <p className="text-[13px] text-stone-500">
                {formatBytes(current.size)} · Updated{" "}
                {new Date(current.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/cv"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary", "sm")}
              >
                <ExternalLink className="size-4" /> View on site
              </a>
              <a href="/cv/download" className={buttonClasses("secondary", "sm")}>
                <Download className="size-4" /> Download
              </a>
              <Button
                variant="secondary"
                size="sm"
                className="text-red-600"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            </div>
          </div>
          <div className="mt-5 hidden overflow-hidden rounded-lg border border-stone-200 md:block">
            <iframe
              key={current.src}
              src={`${current.src}#view=FitH`}
              title="CV preview"
              className="block h-[480px] w-full"
            />
          </div>
        </Card>
      )}

      <Card
        title={current ? "Replace CV" : "Upload CV"}
        description="PDF only, up to 15 MB. Uploading replaces the current CV straight away."
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!uploading) handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragOver ? "border-ink bg-stone-50" : "border-stone-300 bg-white",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="text-ink size-6 animate-spin" />
              <p className="mt-3 text-sm text-stone-600">
                Uploading… {Math.round(progress * 100)}%
              </p>
              <div className="mt-3 h-1 w-48 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="bg-ink h-full transition-[width]"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="size-6 text-stone-400" strokeWidth={1.5} />
              <p className="mt-2 text-sm text-stone-600">
                Drag your CV here or{" "}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-ink font-medium underline underline-offset-4"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-stone-400">PDF · up to 15 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove your CV?"
        description="The CV page and download link will disappear from the public site."
        confirmLabel="Remove"
        pending={removing}
        onConfirm={remove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
