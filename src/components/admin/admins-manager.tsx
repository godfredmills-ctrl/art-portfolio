"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createAdmin, deleteAdmin } from "@/server/actions/users";
import { ConfirmDialog } from "./confirm-dialog";
import { Badge, Button, Field, Input } from "./ui";

export interface AdminRow {
  id: string;
  email: string;
  name: string | null;
  lastLoginAt: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "Never signed in";
  return `Last signed in ${new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export function AdminsManager({
  admins,
  currentUserId,
}: {
  admins: AdminRow[];
  currentUserId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createAdmin, null);
  const [toRemove, setToRemove] = useState<AdminRow | null>(null);
  const [removing, startRemoving] = useTransition();
  const handled = useRef(state);

  useEffect(() => {
    if (!state || state === handled.current) return;
    handled.current = state;
    if (state.ok) {
      toast.success(state.message ?? "Admin created");
      formRef.current?.reset();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  function confirmRemove() {
    if (!toRemove) return;
    startRemoving(async () => {
      const res = await deleteAdmin(toRemove.id);
      if (res.ok) toast.success(res.message ?? "Removed");
      else toast.error(res.message);
      setToRemove(null);
    });
  }

  const values = state?.ok ? undefined : state?.values;

  return (
    <div className="space-y-6">
      <ul className="-my-2 divide-y divide-stone-100">
        {admins.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-medium text-stone-600 uppercase">
              {(a.name || a.email).charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink flex items-center gap-2 truncate text-sm font-medium">
                {a.name || a.email}
                {a.id === currentUserId && <Badge>You</Badge>}
              </p>
              <p className="truncate text-[13px] text-stone-500">
                {a.name ? `${a.email} · ` : ""}
                {formatDate(a.lastLoginAt)}
              </p>
            </div>
            {a.id !== currentUserId && (
              <button
                type="button"
                onClick={() => setToRemove(a)}
                title="Remove admin"
                aria-label={`Remove ${a.email}`}
                className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <form
        ref={formRef}
        action={action}
        className="space-y-4 border-t border-stone-100 pt-5"
        noValidate
      >
        <p className="text-ink text-sm font-medium">Add an admin</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (optional)" htmlFor="new-name" error={state?.errors?.name}>
            <Input id="new-name" name="name" defaultValue={values?.name} autoComplete="off" />
          </Field>
          <Field label="Email" htmlFor="new-email" error={state?.errors?.email}>
            <Input
              id="new-email"
              name="email"
              type="email"
              defaultValue={values?.email}
              autoComplete="off"
              aria-invalid={!!state?.errors?.email}
            />
          </Field>
          <Field
            label="Password"
            htmlFor="new-password"
            error={state?.errors?.password}
            hint="At least 10 characters, with a letter and a number."
          >
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!state?.errors?.password}
            />
          </Field>
          <Field
            label="Confirm password"
            htmlFor="new-confirm"
            error={state?.errors?.confirmPassword}
          >
            <Input
              id="new-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!state?.errors?.confirmPassword}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            Create admin
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={!!toRemove}
        title="Remove this admin?"
        description={<>{toRemove?.email} will be signed out and can no longer manage the site.</>}
        confirmLabel="Remove"
        pending={removing}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
