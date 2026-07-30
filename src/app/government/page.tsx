"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/stores/app-store";
import { getStageDefinition } from "@/lib/workflow";
import { formatDate, initials } from "@/lib/utils";

export default function GovernmentPage() {
  const candidates = useAppStore((s) => s.candidates);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);

  const mohre = useMemo(() => {
    const pending = candidates.filter((c) =>
      ["upload_preapproved_mol", "stage2_signed_nawakis", "mohre_approved"].includes(
        c.currentStage
      )
    );
    const approved = candidates.filter((c) => c.mohreStatus === "approved");
    const rejected = candidates.filter(
      (c) =>
        c.mohreStatus === "rejected" ||
        (c.currentStage === "rejected" && c.mohreRejectionReason)
    );
    return { pending, approved, rejected };
  }, [candidates]);

  const icp = useMemo(() => {
    const pending = candidates.filter((c) => c.currentStage === "upload_visa");
    const approved = candidates.filter((c) => c.icpStatus === "approved");
    const rejected = candidates.filter(
      (c) =>
        c.icpStatus === "rejected" ||
        (c.currentStage === "rejected" && c.icpRejectionReason)
    );
    return { pending, approved, rejected };
  }, [candidates]);

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Government Processing</h1>
        <p className="page-subtitle">
          MOHRE and ICP case tracking with approval and rejection states.
        </p>
      </div>

      <div className="page-grid grid-cols-1 sm:grid-cols-3">
        <Stat title="MOHRE Pending" value={mohre.pending.length} />
        <Stat title="ICP Pending" value={icp.pending.length} />
        <Stat title="Gov. Rejections" value={mohre.rejected.length + icp.rejected.length} />
      </div>

      <Tabs defaultValue="mohre" className="w-full">
        <TabsList className="w-full max-w-full">
          <TabsTrigger value="mohre">MOHRE</TabsTrigger>
          <TabsTrigger value="icp">ICP</TabsTrigger>
        </TabsList>

        <TabsContent value="mohre" className="mt-4">
          <GovTabs
            pending={mohre.pending}
            approved={mohre.approved}
            rejected={mohre.rejected}
            onOpen={setSelected}
            rejectionKey="mohre"
          />
        </TabsContent>
        <TabsContent value="icp" className="mt-4">
          <GovTabs
            pending={icp.pending}
            approved={icp.approved}
            rejected={icp.rejected}
            onOpen={setSelected}
            rejectionKey="icp"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col justify-center p-5">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold leading-none">{value}</p>
      </CardContent>
    </Card>
  );
}

function GovTabs({
  pending,
  approved,
  rejected,
  onOpen,
  rejectionKey,
}: {
  pending: ReturnType<typeof useAppStore.getState>["candidates"];
  approved: typeof pending;
  rejected: typeof pending;
  onOpen: (id: string) => void;
  rejectionKey: "mohre" | "icp";
}) {
  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
        <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
      </TabsList>
      {(["pending", "approved", "rejected"] as const).map((tab) => {
        const list = tab === "pending" ? pending : tab === "approved" ? approved : rejected;
        return (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="capitalize text-base">{tab} Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.slice(0, 50).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpen(c.id)}
                    className="flex w-full items-center gap-3 rounded-[20px] bg-card px-3 py-3 text-left shadow-neo-sm transition hover:shadow-neo-xs"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={c.photoUrl} />
                      <AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.passportNumber} · {getStageDefinition(c.currentStage)?.shortLabel} ·{" "}
                        {formatDate(c.updatedAt)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {tab === "rejected" && (
                        <Badge variant="destructive" className="max-w-[140px] truncate">
                          {rejectionKey === "mohre"
                            ? c.mohreRejectionReason
                            : c.icpRejectionReason}
                        </Badge>
                      )}
                      {tab === "approved" && <Badge variant="success">Approved</Badge>}
                      {tab === "pending" && <Badge variant="warning">Pending</Badge>}
                    </div>
                  </button>
                ))}
                {list.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No cases</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
