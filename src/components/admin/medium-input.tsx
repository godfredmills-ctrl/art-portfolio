"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";

/** Tag-style input for an artwork's mediums, with suggestions from existing ones. */
export function MediumInput({
  value,
  onChange,
  suggestions,
  id,
  invalid,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  id?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function commit(raw: string) {
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const part of parts) {
      if (!next.some((m) => m.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    onChange(next);
    setDraft("");
  }

  const available = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div
      aria-invalid={invalid}
      className="focus-within:border-ink focus-within:ring-ink/10 flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2 py-1.5 shadow-xs focus-within:ring-2 aria-[invalid=true]:border-red-500"
    >
      {value.map((m) => (
        <span
          key={m}
          className="text-ink inline-flex items-center gap-1 rounded-md bg-stone-100 py-0.5 pr-1 pl-2 text-[13px]"
        >
          {m}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== m))}
            aria-label={`Remove ${m}`}
            className="hover:text-ink rounded p-0.5 text-stone-400 hover:bg-stone-200"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        onChange={(e) => {
          // Selecting a datalist option fires a change with the full value.
          const v = e.target.value;
          if (v.endsWith(",")) commit(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={value.length ? "" : "e.g. Oil, Cold wax, Linen"}
        className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-stone-400"
      />
      <datalist id={listId}>
        {available.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
