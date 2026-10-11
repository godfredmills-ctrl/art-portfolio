"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/admin/ui";
import { login } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state?.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Field label="Email" htmlFor="email" error={state?.errors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          defaultValue={state?.values?.email}
          aria-invalid={!!state?.errors?.email}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={state?.errors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state?.errors?.password}
        />
      </Field>

      <Button type="submit" loading={pending} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
