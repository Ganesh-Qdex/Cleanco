"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";
import { ROLE_EMAILS } from "@/lib/workflow";
import { MOCK_USERS } from "@/lib/mock-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => { success: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email) => {
        const normalized = email.trim().toLowerCase();
        const mapped = ROLE_EMAILS[normalized];
        if (!mapped) {
          return {
            success: false,
            error: "Use admin@cleanco.com, pro@cleanco.com, or agency@cleanco.com",
          };
        }
        const user =
          MOCK_USERS.find((u) => u.email === normalized) ||
          ({
            id: `user-${mapped.role}`,
            name: mapped.name,
            email: normalized,
            role: mapped.role as UserRole,
            agencyId: mapped.agencyId,
          } satisfies User);
        set({ user, isAuthenticated: true });
        return { success: true };
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "cleanco-auth", skipHydration: true }
  )
);
