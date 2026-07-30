"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Moon, Search, Sun, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";
import { initials } from "@/lib/utils";
import Link from "next/link";

export function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useAppStore((s) => s.notifications);
  const setSearch = useAppStore((s) => s.setSearch);
  const globalSearch = useAppStore((s) => s.globalSearch);
  const { theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [query, setQuery] = useState(globalSearch);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-3 bg-background px-4 sm:px-6 lg:px-8">
      <Button
        variant="neo"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative min-w-0 max-w-md flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearch(query);
              router.push("/vacancies");
            }
          }}
          placeholder="Search..."
          className="h-11 pl-11"
        />
      </div>

      <div className="ml-auto flex h-11 shrink-0 items-center gap-2">
        <Button variant="neo" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Link href="/notifications" className="inline-flex">
          <Button variant="neo" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </Link>

        <div className="hidden h-11 items-center gap-2 rounded-full bg-card pl-1.5 pr-1 shadow-neo-sm sm:flex">
          <Avatar className="h-8 w-8 shadow-none">
            <AvatarFallback className="rounded-full text-[11px]">
              {user ? initials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 max-w-[140px] lg:block">
            <p className="truncate text-sm font-medium leading-tight">{user?.name}</p>
            <p className="truncate text-[11px] capitalize leading-tight text-muted-foreground">
              {user?.role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
