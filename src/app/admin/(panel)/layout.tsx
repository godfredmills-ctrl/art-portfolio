import { Sidebar } from "@/components/admin/sidebar";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/data";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);

  return (
    <div className="lg:pl-64">
      <Sidebar artistName={settings.artistName} userEmail={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</main>
    </div>
  );
}
