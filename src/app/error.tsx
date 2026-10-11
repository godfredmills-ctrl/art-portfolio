"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="gutter bg-paper flex min-h-screen flex-col items-start justify-center gap-8">
      <p className="label text-muted">Something went wrong</p>
      <h1 className="font-serif text-6xl leading-none md:text-8xl">
        A brief <em>interruption.</em>
      </h1>
      <p className="text-ink-2 max-w-md">
        We couldn’t load this page. Please try again in a moment.
        {error.digest && <span className="label text-muted mt-3 block">Ref: {error.digest}</span>}
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-ink text-paper hover:bg-accent rounded-full px-6 py-3 text-sm transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
