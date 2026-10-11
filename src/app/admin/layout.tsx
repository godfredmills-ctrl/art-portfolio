import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-ink min-h-screen bg-[#f7f6f3]">
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "rounded-xl! border-stone-200! font-sans! shadow-lg!",
          },
        }}
      />
    </div>
  );
}
