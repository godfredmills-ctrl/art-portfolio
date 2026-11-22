import type { Metadata } from "next";
import { CvManager } from "@/components/admin/cv-manager";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "CV" };

export default async function CvAdminPage() {
  await requireUser();
  const s = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: { cvKey: true, cvFileName: true, cvSize: true, cvUpdatedAt: true },
  });

  return (
    <>
      <PageHeader
        title="CV"
        description="Upload your CV as a PDF. It appears on the public site at /cv with a download button."
      />
      <CvManager
        current={
          s?.cvKey && s.cvFileName && s.cvSize != null && s.cvUpdatedAt
            ? {
                src: `/cv/view?v=${s.cvUpdatedAt.getTime()}`,
                fileName: s.cvFileName,
                size: s.cvSize,
                updatedAt: s.cvUpdatedAt.toISOString(),
              }
            : null
        }
      />
    </>
  );
}
