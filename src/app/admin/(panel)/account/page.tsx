import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/admin/account-forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Account" description="Your sign-in details." />
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
      </div>
    </>
  );
}
