"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useAppStore } from "@/stores/app-store";
import { WORKFLOW_STAGES } from "@/lib/workflow";
import { toast } from "sonner";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUIStore();
  const candidates = useAppStore((s) => s.candidates);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">Preferences, roles, and workflow reference.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Mock authentication session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {user?.name}</p>
            <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Role:</span>
              <Badge className="capitalize">{user?.role}</Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
              Light
            </Button>
            <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
              Dark
            </Button>
            <Button variant="outline" onClick={toggleSidebar}>
              {sidebarCollapsed ? "Expand" : "Collapse"} Sidebar
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Workflow Stages (Excel Source of Truth)</CardTitle>
            <CardDescription>
              {WORKFLOW_STAGES.length} stages · {candidates.length} candidates in system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {WORKFLOW_STAGES.filter((s) => s.id !== "rejected" && s.id !== "completed").map((s) => (
                <div key={s.id} className="rounded-2xl border border-border/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {s.order}
                    </span>
                    <p className="text-sm font-medium">{s.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.responsibility}
                    {s.fee ? ` · Fee ${s.fee} AED` : ""}
                  </p>
                  {s.actions.length > 0 && (
                    <p className="mt-1 text-[11px] text-primary/80">
                      Actions: {s.actions.map((a) => a.label).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Data</CardTitle>
            <CardDescription>Reset local persisted mock data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                localStorage.removeItem("cleanco-app-data");
                localStorage.removeItem("cleanco-app-data-v2");
                toast.success("Cleared app data — reload to regenerate");
                setTimeout(() => window.location.reload(), 600);
              }}
            >
              Reset Mock Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
