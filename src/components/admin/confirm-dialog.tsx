"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./ui";

/** Accessible confirmation modal built on the native <dialog> element. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !pending) onCancel();
      }}
      className="text-ink backdrop:bg-ink/40 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-2xl backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 className="font-serif text-2xl">{title}</h2>
        {description && <div className="mt-2 text-sm text-stone-600">{description}</div>}
      </div>
      <div className="flex justify-end gap-2 border-t border-stone-100 bg-stone-50 px-6 py-4">
        <Button variant="secondary" onClick={onCancel} disabled={pending} type="button">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={pending} type="button">
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
