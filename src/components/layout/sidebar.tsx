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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import type { UserRole } from "@/types";

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
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const items = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/50 bg-sidebar/90 backdrop-blur-xl transition-all duration-300",
        sidebarCollapsed ? "w-[76px]" : "w-[260px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-neo-sm">
          <span className="text-sm font-bold">C</span>
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
              Cleanco
            </p>
            <p className="truncate text-[11px] text-muted-foreground">Pipeline System</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-primary/10 shadow-neo-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-sidebar-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="m-3 flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground shadow-neo-sm hover:text-foreground"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        {!sidebarCollapsed && "Collapse"}
      </button>
    </aside>
  );
}
