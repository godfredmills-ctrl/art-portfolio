import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Statement & site" };

export default async function ContentPage() {
  await requireUser();
  const s = await db.siteSettings.findUnique({ where: { id: 1 } });

  return (
    <SettingsForm
      initial={{
        artistName: s?.artistName ?? "",
        tagline: s?.tagline ?? "",
        heroText: s?.heroText ?? "",
        statementTitle: s?.statementTitle ?? "",
        statement: s?.statement ?? "",
        bio: s?.bio ?? "",
        email: s?.email ?? "",
        location: s?.location ?? "",
        instagram: s?.instagram ?? "",
        website: s?.website ?? "",
        seoDescription: s?.seoDescription ?? "",
        portrait:
          s?.portraitKey && s.portraitWidth && s.portraitHeight
            ? {
                id: "portrait",
                key: s.portraitKey,
                width: s.portraitWidth,
                height: s.portraitHeight,
                blurDataUrl: s.portraitBlur,
                status: "done",
              }
            : null,
      }}
    />
  );
}
