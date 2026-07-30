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
      [
        "mohre_submitted",
        "police_verification",
        "labour_contract",
        "download_mohre_offer",
        "send_mol_agency",
        "candidate_signs_mol",
        "upload_signed_mol",
        "mohre_approval",
      ].includes(c.currentStage)
    );
    const approved = candidates.filter((c) => c.mohreStatus === "approved");
    const rejected = candidates.filter(
      (c) => c.mohreStatus === "rejected" || (c.currentStage === "rejected" && c.mohreRejectionReason)
    );
    return { pending, approved, rejected };
  }, [candidates]);

  const icp = useMemo(() => {
    const pending = candidates.filter((c) =>
      ["visa_application_icp", "icp_payment", "icp_decision"].includes(c.currentStage)
    );
    const approved = candidates.filter((c) => c.icpStatus === "approved");
    const rejected = candidates.filter(
      (c) => c.icpStatus === "rejected" || (c.currentStage === "rejected" && c.icpRejectionReason)
    );
    return { pending, approved, rejected };
  }, [candidates]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
          Government Processing
        </h1>
        <p className="mt-1 text-muted-foreground">
          MOHRE and ICP case tracking with approval and rejection states.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="MOHRE Pending" value={mohre.pending.length} />
        <Stat title="ICP Pending" value={icp.pending.length} />
        <Stat title="Gov. Rejections" value={mohre.rejected.length + icp.rejected.length} />
      </div>

      <Tabs defaultValue="mohre">
        <TabsList>
          <TabsTrigger value="mohre">MOHRE</TabsTrigger>
          <TabsTrigger value="icp">ICP</TabsTrigger>
        </TabsList>

        <TabsContent value="mohre">
          <GovTabs
            pending={mohre.pending}
            approved={mohre.approved}
            rejected={mohre.rejected}
            onOpen={setSelected}
            rejectionKey="mohre"
          />
        </TabsContent>
        <TabsContent value="icp">
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
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
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
    <Tabs defaultValue="pending" className="mt-4">
      <TabsList>
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
        <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
      </TabsList>
      {(["pending", "approved", "rejected"] as const).map((tab) => {
        const list = tab === "pending" ? pending : tab === "approved" ? approved : rejected;
        return (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize text-base">{tab} Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.slice(0, 50).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpen(c.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 px-3 py-3 text-left hover:bg-muted/40"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.photoUrl} />
                      <AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.passportNumber} · {getStageDefinition(c.currentStage)?.shortLabel} ·{" "}
                        {formatDate(c.updatedAt)}
                      </p>
                    </div>
                    {tab === "rejected" && (
                      <Badge variant="destructive">
                        {rejectionKey === "mohre"
                          ? c.mohreRejectionReason
                          : c.icpRejectionReason}
                      </Badge>
                    )}
                    {tab === "approved" && <Badge variant="success">Approved</Badge>}
                    {tab === "pending" && <Badge variant="warning">Pending</Badge>}
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
