"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { CandidateDrawer } from "@/components/pipeline/candidate-drawer";
import { useStoreHydration } from "@/hooks/use-store-hydration";

function BootSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStoreHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (isAuthenticated && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, pathname, router, hydrated]);

  if (!hydrated) {
    return <BootSplash />;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <BootSplash />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[240px]"
        )}
      >
        <Header />
        <main className="w-full px-4 pb-6 pt-1 sm:px-6 sm:pb-8 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CandidateDrawer />
    </div>
  );
}
