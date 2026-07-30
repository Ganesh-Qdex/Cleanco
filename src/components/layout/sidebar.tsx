"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Landmark,
  BarChart3,
  Settings,
  Bell,
  ChevronLeft,
  Building2,
  CreditCard,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";

export const SIDEBAR_W_COLLAPSED = 72;
export const SIDEBAR_W_EXPANDED = 240;

const NAV: {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "pro", "agency"] },
  { href: "/vacancies", label: "Vacancies", icon: Briefcase, roles: ["admin", "agency"] },
  { href: "/pipeline", label: "Pipeline", icon: Kanban, roles: ["admin", "pro", "agency"] },
  { href: "/government", label: "Government", icon: Landmark, roles: ["admin", "pro"] },
  { href: "/payments", label: "Payments", icon: CreditCard, roles: ["admin", "pro"] },
  { href: "/agencies", label: "Agencies", icon: Building2, roles: ["admin"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ["admin", "pro", "agency"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "pro", "agency"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const items = NAV.filter((n) => user && n.roles.includes(user.role));
  const collapsed = sidebarCollapsed;

  return (
    <>
      {!collapsed && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar shadow-neo-sm transition-[width,transform] duration-300",
          collapsed
            ? "-translate-x-full lg:w-[72px] lg:translate-x-0"
            : "w-[min(240px,85vw)] lg:w-[240px]"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center",
            collapsed ? "justify-center px-0" : "gap-3 px-4"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-sm font-bold shadow-neo-sm">
            C
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
                Cleanco
              </p>
              <p className="truncate text-[11px] text-muted-foreground">Pipeline System</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav
          className={cn(
            "flex flex-1 flex-col gap-1.5 overflow-y-auto py-3",
            collapsed ? "items-center px-2" : "px-3"
          )}
        >
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    setSidebarCollapsed(true);
                  }
                }}
                className={cn(
                  "relative flex items-center transition-colors",
                  collapsed
                    ? "h-11 w-11 justify-center rounded-full"
                    : "h-11 w-full gap-3 rounded-full px-3"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-full shadow-neo-inset"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-[18px] w-[18px] shrink-0",
                    active ? "text-foreground" : "text-sidebar-foreground"
                  )}
                />
                {!collapsed && (
                  <span
                    className={cn(
                      "relative z-10 truncate text-sm font-medium",
                      active ? "text-foreground" : "text-sidebar-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={cn("shrink-0 p-2", collapsed && "flex justify-center")}>
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "hidden items-center justify-center gap-2 rounded-full bg-card text-xs text-muted-foreground shadow-neo-sm hover:text-foreground lg:flex",
              collapsed ? "h-11 w-11" : "h-10 w-full px-3"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
