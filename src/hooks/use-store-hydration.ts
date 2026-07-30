"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";

/**
 * Gates rendering until Zustand persist stores have rehydrated on the client.
 * Prevents SSR/client HTML mismatches from localStorage and Date-based seed data.
 */
export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function rehydrate() {
      await Promise.all([
        useAuthStore.persist.rehydrate(),
        useAppStore.persist.rehydrate(),
        useUIStore.persist.rehydrate(),
      ]);

      const theme = useUIStore.getState().theme;
      document.documentElement.classList.toggle("dark", theme === "dark");

      if (!cancelled) setHydrated(true);
    }

    void rehydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  return hydrated;
}
