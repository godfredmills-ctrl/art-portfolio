import { Loader2 } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2 shadow-sm",
  secondary: "bg-white text-ink border border-stone-300 hover:bg-stone-50 shadow-xs",
  ghost: "text-stone-600 hover:bg-stone-100 hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

export function buttonClasses(variant: Variant = "primary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
    variants[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(buttonClasses(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

const fieldBase =
  "w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink shadow-xs transition-colors placeholder:text-stone-400 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:bg-stone-50 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/10";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "h-10 pr-8", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-stone-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-stone-200 bg-white shadow-xs", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4">
          <div>
            {title && <h2 className="text-ink text-[15px] font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-stone-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "accent";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-600",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/15",
    accent: "bg-orange-50 text-orange-700 ring-orange-600/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-transparent ring-inset",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-ink text-sm font-medium">
          {label}
        </label>
        {description && <p className="text-[13px] text-stone-500">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-visible:outline-accent relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
          checked ? "bg-ink" : "bg-stone-300",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-ink font-serif text-4xl leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <p className="text-ink font-serif text-2xl">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
