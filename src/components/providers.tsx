"use client";

import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <Toaster richColors position="top-right" closeButton />
    </>
  );
}
