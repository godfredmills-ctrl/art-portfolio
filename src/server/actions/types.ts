export type ActionResult<T = undefined> =
  | ({ ok: true; message?: string } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string; errors?: Record<string, string> };

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Submitted values echoed back, since React resets the form after an action. */
  values?: Record<string, string>;
} | null;
