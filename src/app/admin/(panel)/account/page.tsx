import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/admin/account-forms";
import { AdminsManager } from "@/components/admin/admins-manager";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  const admins = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, lastLoginAt: true },
  });

  return (
    <>
      <PageHeader title="Account" description="Your sign-in details and who can manage the site." />
      <div className="grid max-w-3xl gap-6">
        <Card title="Profile">
          <ProfileForm name={user.name ?? ""} email={user.email} />
        </Card>
        <Card
          title="Password"
          description="Changing your password signs you out on every other device."
        >
          <PasswordForm />
        </Card>
        <Card title="Admins" description="Everyone listed here can sign in and manage the site.">
          <AdminsManager
            currentUserId={user.id}
            admins={admins.map((a) => ({
              ...a,
              lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
            }))}
          />
        </Card>
      </div>
    </>
  );
}
