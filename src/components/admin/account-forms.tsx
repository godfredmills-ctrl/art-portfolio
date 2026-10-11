"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePassword, updateProfile } from "@/server/actions/auth";
import type { FormState } from "@/server/actions/types";
import { Button, Field, Input } from "./ui";

function useToastResult(state: FormState, onSuccess?: () => void) {
  const last = useRef<FormState>(null);
  useEffect(() => {
    if (!state || state === last.current) return;
    last.current = state;
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      onSuccess?.();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  useToastResult(state);

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={state?.errors?.name}>
          <Input
            id="name"
            name="name"
            defaultValue={state?.values?.name ?? name}
            autoComplete="name"
          />
        </Field>
        <Field label="Email" htmlFor="email" error={state?.errors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={state?.values?.email ?? email}
            autoComplete="email"
            aria-invalid={!!state?.errors?.email}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changePassword, null);
  useToastResult(state, () => formRef.current?.reset());

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <Field
        label="Current password"
        htmlFor="currentPassword"
        error={state?.errors?.currentPassword}
      >
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state?.errors?.currentPassword}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="New password"
          htmlFor="newPassword"
          error={state?.errors?.newPassword}
          hint="At least 10 characters, with a letter and a number."
        >
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state?.errors?.newPassword}
          />
        </Field>
        <Field
          label="Confirm new password"
          htmlFor="confirmPassword"
          error={state?.errors?.confirmPassword}
        >
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!state?.errors?.confirmPassword}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}
