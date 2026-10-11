import Link from "next/link";

export default function NotFound() {
  return (
    <div className="gutter bg-paper flex min-h-screen flex-col justify-between py-10">
      <Link href="/" className="label text-muted hover:text-ink">
        ← Back to the index
      </Link>
      <div>
        <p className="label text-muted">Error 404</p>
        <h1 className="mt-4 font-serif text-[clamp(4rem,14vw,13rem)] leading-[0.85] tracking-[-0.02em]">
          Nothing <em>hangs here.</em>
        </h1>
        <p className="text-ink-2 mt-8 max-w-md text-lg">
          The page you were looking for may have moved, or the work is no longer on view.
        </p>
      </div>
      <Link href="/works" className="label link-underline self-start">
        Browse all works
      </Link>
    </div>
  );
}
