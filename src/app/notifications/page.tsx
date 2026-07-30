"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/app-store";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-muted-foreground">Pipeline events and government updates.</p>
        </div>
        <Button variant="outline" onClick={markAll}>
          Mark all read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                markRead(n.id);
                if (n.candidateId) setSelected(n.candidateId);
              }}
              className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                n.read ? "border-border/40 bg-transparent" : "border-primary/20 bg-primary/5"
              }`}
            >
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</p>
              </div>
              <Badge
                variant={
                  n.type === "success"
                    ? "success"
                    : n.type === "warning"
                      ? "warning"
                      : n.type === "error"
                        ? "destructive"
                        : "default"
                }
              >
                {n.type}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
