"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/utils";
import { saveSettings } from "@/server/actions/settings";
import { Dropzone, useUploads, type UploadItem } from "./image-uploader";
import { Button, Card, Field, Input, PageHeader, Textarea } from "./ui";

export interface SettingsValues {
  artistName: string;
  tagline: string;
  heroText: string;
  statementTitle: string;
  statement: string;
  bio: string;
  email: string;
  location: string;
  instagram: string;
  website: string;
  seoDescription: string;
  portrait: UploadItem | null;
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const setPortraitItems = (fn: (items: UploadItem[]) => UploadItem[]) =>
    setValues((v) => {
      const next = fn(v.portrait ? [v.portrait] : []);
      return { ...v, portrait: next[next.length - 1] ?? null };
    });
  const uploadPortrait = useUploads(setPortraitItems, "site");

  function bind(key: Exclude<keyof SettingsValues, "portrait">) {
    return {
      id: key,
      value: values[key],
      "aria-invalid": !!errors[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (values.portrait?.status === "uploading") {
      toast.error("Please wait for the portrait to finish uploading.");
      return;
    }
    const p = values.portrait;
    const payload = {
      ...values,
      portrait:
        p?.status === "done" && p.key
          ? { key: p.key, width: p.width!, height: p.height!, blurDataUrl: p.blurDataUrl ?? null }
          : null,
    };
    startTransition(async () => {
      const res = await saveSettings(payload);
      if (!res.ok) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        return;
      }
      setErrors({});
      toast.success(res.message ?? "Saved");
      router.refresh();
    });
  }

  const portrait = values.portrait;
  const portraitSrc = portrait?.key ? mediaUrl(portrait.key) : portrait?.preview;

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title="Statement & site"
        description="The words and details that frame your work."
        actions={
          <Button type="submit" loading={pending}>
            Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Artist statement"
            description="Separate paragraphs with a blank line. The first paragraph is featured on the home page."
          >
            <div className="space-y-5">
              <Field
                label="Statement heading"
                htmlFor="statementTitle"
                error={errors.statementTitle}
                hint="Large heading on the statement page. The words after the first are set in italics."
              >
                <Input {...bind("statementTitle")} placeholder="Artist statement" />
              </Field>
              <Field
                label="Statement"
                htmlFor="statement"
                error={errors.statement}
                hint={`${wordCount(values.statement)} words`}
              >
                <Textarea
                  {...bind("statement")}
                  rows={14}
                  className="font-serif text-[17px] leading-relaxed"
                />
              </Field>
            </div>
          </Card>

          <Card title="Biography" description="Optional. Shown beneath the statement.">
            <Field label="Biography" htmlFor="bio" error={errors.bio}>
              <Textarea {...bind("bio")} rows={8} />
            </Field>
          </Card>

          <Card title="Home page">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Artist name" htmlFor="artistName" error={errors.artistName}>
                <Input {...bind("artistName")} required />
              </Field>
              <Field
                label="Tagline"
                htmlFor="tagline"
                error={errors.tagline}
                hint="e.g. “Painter, London”"
              >
                <Input {...bind("tagline")} />
              </Field>
              <Field
                label="Introduction"
                htmlFor="heroText"
                error={errors.heroText}
                hint="A sentence or two shown beside your name."
                className="sm:col-span-2"
              >
                <Textarea {...bind("heroText")} rows={3} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Portrait" description="Shown on the statement page.">
            {portraitSrc ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portraitSrc} alt="" className="w-full object-cover" />
                </div>
                {portrait?.status === "error" && (
                  <p className="text-[13px] text-red-600">{portrait.error}</p>
                )}
                <div className="flex gap-2">
                  <label className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg border border-stone-300 bg-white px-3 text-[13px] font-medium hover:bg-stone-50">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPortrait([file]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setValues((v) => ({ ...v, portrait: null }))}
                    aria-label="Remove portrait"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Dropzone
                onFiles={(files) => uploadPortrait(files.slice(0, 1))}
                multiple={false}
                compact
              />
            )}
          </Card>

          <Card title="Contact">
            <div className="space-y-4">
              <Field label="Email" htmlFor="email" error={errors.email}>
                <Input {...bind("email")} type="email" />
              </Field>
              <Field label="Studio location" htmlFor="location" error={errors.location}>
                <Input {...bind("location")} placeholder="e.g. Accra, Ghana" />
              </Field>
              <Field
                label="Instagram"
                htmlFor="instagram"
                error={errors.instagram}
                hint="Handle or full URL"
              >
                <Input {...bind("instagram")} placeholder="@yourhandle" />
              </Field>
              <Field label="Website" htmlFor="website" error={errors.website}>
                <Input {...bind("website")} type="url" placeholder="https://" />
              </Field>
            </div>
          </Card>

          <Card title="Search engines">
            <Field
              label="Site description"
              htmlFor="seoDescription"
              error={errors.seoDescription}
              hint={`${values.seoDescription.length}/160 recommended`}
            >
              <Textarea {...bind("seoDescription")} rows={4} />
            </Field>
          </Card>
        </div>
      </div>
    </form>
  );
}
