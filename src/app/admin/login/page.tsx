import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-ink text-paper relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <p className="label text-paper/50">Studio</p>
        <div>
          <p className="font-serif text-7xl leading-[0.9] tracking-tight">{settings.artistName}</p>
          <p className="text-paper/60 mt-6 max-w-sm">
            Manage works, series and the words that accompany them.
          </p>
        </div>
        <div
          aria-hidden
          className="bg-accent/30 pointer-events-none absolute -right-40 -bottom-40 size-[36rem] rounded-full blur-3xl"
        />
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-5xl tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-stone-500">Sign in to manage your portfolio.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
      </div>
    </div>
  );
}
