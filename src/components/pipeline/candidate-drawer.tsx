"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  FileText,
  MapPin,
  Building2,
  CheckCircle2,
  Circle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea, Label, Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  getStageDefinition,
  getNextStage,
  canTransition,
  WORKFLOW_STAGES,
} from "@/lib/workflow";
import { daysBetween, formatCurrency, formatDate, initials } from "@/lib/utils";
import { toast } from "sonner";

export function CandidateDrawer() {
  const selectedId = useAppStore((s) => s.selectedCandidateId);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);
  const candidates = useAppStore((s) => s.candidates);
  const agencies = useAppStore((s) => s.agencies);
  const vacancies = useAppStore((s) => s.vacancies);
  const advanceCandidate = useAppStore((s) => s.advanceCandidate);
  const rejectCandidate = useAppStore((s) => s.rejectCandidate);
  const user = useAuthStore((s) => s.user);

  const [remarks, setRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [receipt, setReceipt] = useState("");
  const [delayReason, setDelayReason] = useState("");

  const candidate = useMemo(
    () => candidates.find((c) => c.id === selectedId),
    [candidates, selectedId]
  );

  const agency = agencies.find((a) => a.id === candidate?.agencyId);
  const vacancy = vacancies.find((v) => v.id === candidate?.vacancyId);
  const stage = candidate ? getStageDefinition(candidate.currentStage) : null;
  const next = candidate ? getNextStage(candidate.currentStage) : null;
  const canAct =
    candidate && user
      ? canTransition(candidate.currentStage, user.role)
      : false;

  const daysInStage = candidate ? daysBetween(candidate.stageEnteredAt) : 0;

  const resetForm = () => {
    setRemarks("");
    setRejectionReason("");
    setReceipt("");
    setDelayReason("");
  };

  const handleAdvance = (decision?: "approved" | "rejected") => {
    if (!candidate || !user) return;
    if (decision === "rejected") {
      rejectCandidate(
        candidate.id,
        rejectionReason || remarks || "Rejected",
        user.name
      );
      toast.error("Candidate rejected");
      resetForm();
      return;
    }

    const fee = stage?.fee;
    advanceCandidate(candidate.id, {
      remarks: remarks || `Advanced from ${stage?.label}`,
      decision: stage?.decision ? "approved" : undefined,
      actor: user.name,
      offerIssueDate:
        candidate.currentStage === "offer_issued"
          ? new Date().toISOString()
          : undefined,
      paymentAmount: fee,
      paymentDate: fee ? new Date().toISOString() : undefined,
      paymentReceipt: fee ? receipt || `RCP-${Date.now().toString().slice(-6)}` : undefined,
      paymentDelayReason: delayReason || undefined,
      visaFileName:
        candidate.currentStage === "hr_processing"
          ? `${candidate.name.replace(/\s/g, "_")}_${candidate.passportNumber}_visa.pdf`
          : undefined,
      documents:
        candidate.currentStage === "visa_issued"
          ? [
              {
                id: `doc-visa-${Date.now()}`,
                type: "visa_pdf",
                name: `visa_${candidate.passportNumber}.pdf`,
                url: "#visa",
                uploadedAt: new Date().toISOString(),
                uploadedBy: user.name,
              },
            ]
          : undefined,
    });
    toast.success(`Moved to ${getStageDefinition(next!)?.label || "next stage"}`);
    resetForm();
  };

  return (
    <Sheet open={!!candidate} onOpenChange={(o) => !o && setSelected(null)}>
      <SheetContent className="p-0 sm:max-w-xl">
        {candidate && stage && (
          <>
            <SheetHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={candidate.photoUrl} alt={candidate.name} />
                  <AvatarFallback>{initials(candidate.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <SheetTitle>{candidate.name}</SheetTitle>
                  <SheetDescription className="mt-1">
                    {candidate.passportNumber} · {candidate.nationality}
                  </SheetDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{stage.shortLabel}</Badge>
                    <Badge variant="muted" className="capitalize">
                      {candidate.priority}
                    </Badge>
                    <Badge variant="outline">{candidate.jobRole}</Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <InfoChip icon={Building2} label="Agency" value={agency?.name || "—"} />
                  <InfoChip icon={MapPin} label="Vacancy" value={vacancy?.companyName || "—"} />
                  <InfoChip icon={Clock} label="Days in stage" value={`${daysInStage}d`} />
                  <InfoChip icon={Calendar} label="Entered" value={formatDate(candidate.stageEnteredAt)} />
                </div>

                <Tabs defaultValue="action">
                  <TabsList className="w-full">
                    <TabsTrigger value="action" className="flex-1">
                      Action
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="flex-1">
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="flex-1">
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex-1">
                      Payments
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="action" className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Current Stage
                      </p>
                      <p className="mt-1 font-semibold">{stage.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{stage.purpose}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Responsibility: {stage.responsibility}
                      </p>
                      {stage.documents && (
                        <p className="mt-2 text-xs text-primary">
                          Required: {stage.documents.join(", ")}
                        </p>
                      )}
                      {stage.fee && (
                        <p className="mt-1 text-xs font-medium text-amber-600">
                          Fee: {formatCurrency(stage.fee)}
                        </p>
                      )}
                    </div>

                    {canAct && candidate.currentStage !== "completed" && candidate.currentStage !== "rejected" && (
                      <div className="space-y-3">
                        <div>
                          <Label>Remarks</Label>
                          <Textarea
                            className="mt-1.5"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add stage remarks..."
                          />
                        </div>

                        {stage.fee && (
                          <>
                            <div>
                              <Label>Payment Receipt</Label>
                              <Input
                                className="mt-1.5"
                                value={receipt}
                                onChange={(e) => setReceipt(e.target.value)}
                                placeholder="Receipt number"
                              />
                            </div>
                            {stage.id === "mohre_approval" && (
                              <div>
                                <Label>Payment Delay Reason (optional)</Label>
                                <Input
                                  className="mt-1.5"
                                  value={delayReason}
                                  onChange={(e) => setDelayReason(e.target.value)}
                                  placeholder="If payment delayed..."
                                />
                              </div>
                            )}
                          </>
                        )}

                        {stage.decision && (
                          <div>
                            <Label>Rejection Reason</Label>
                            <Select value={rejectionReason} onValueChange={setRejectionReason}>
                              <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Select reason if rejecting" />
                              </SelectTrigger>
                              <SelectContent>
                                {(stage.rejectionReasons || ["Other"]).map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {stage.decision && (
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleAdvance("rejected")}
                            >
                              Reject
                            </Button>
                          )}
                          {next && (
                            <Button className="flex-1" onClick={() => handleAdvance("approved")}>
                              {stage.decision ? "Approve & Continue" : "Complete Stage"}
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {!canAct && (
                      <p className="text-sm text-muted-foreground">
                        Your role cannot update this government/business stage.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline">
                    <ol className="relative space-y-4 border-l border-border/70 ml-3">
                      {candidate.history.map((h) => {
                        const def = getStageDefinition(h.stage);
                        const Icon =
                          h.status === "rejected"
                            ? XCircle
                            : h.status === "completed"
                              ? CheckCircle2
                              : Circle;
                        return (
                          <li key={h.id} className="ml-4">
                            <span className="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-neo-sm">
                              <Icon
                                className={
                                  h.status === "rejected"
                                    ? "h-4 w-4 text-red-500"
                                    : h.status === "completed"
                                      ? "h-4 w-4 text-emerald-500"
                                      : "h-4 w-4 text-primary"
                                }
                              />
                            </span>
                            <div className="rounded-2xl border border-border/50 bg-card/60 p-3">
                              <p className="text-sm font-medium">{def?.label || h.stage}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatDate(h.enteredAt)}
                                {h.daysSpent != null && ` · ${h.daysSpent}d`} · {h.responsibleTeam}
                              </p>
                              {h.remarks && (
                                <p className="mt-1 text-xs text-foreground/80">{h.remarks}</p>
                              )}
                              {h.rejectionReason && (
                                <Badge variant="destructive" className="mt-2">
                                  {h.rejectionReason}
                                </Badge>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </TabsContent>

                  <TabsContent value="docs" className="space-y-3">
                    {candidate.documents.length === 0 && (
                      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    )}
                    {candidate.documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-neo-sm"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.type.replace(/_/g, " ")} · {formatDate(d.uploadedAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          Preview
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="payments" className="space-y-3">
                    <PaymentRow
                      label="Labour Contract (50 AED)"
                      amount={candidate.labourContractFee?.amount}
                      status={candidate.labourContractFee?.status}
                      date={candidate.labourContractFee?.date}
                    />
                    <PaymentRow
                      label="MOHRE Approval (1800 AED)"
                      amount={candidate.mohrePayment?.amount}
                      status={candidate.mohrePayment?.status}
                      date={candidate.mohrePayment?.date}
                      receipt={candidate.mohrePayment?.receipt}
                      delay={candidate.mohrePayment?.delayReason}
                    />
                    <PaymentRow
                      label="ICP Payment (800 AED)"
                      amount={candidate.icpPayment?.amount}
                      status={candidate.icpPayment?.status}
                      date={candidate.icpPayment?.date}
                      receipt={candidate.icpPayment?.receipt}
                    />
                  </TabsContent>
                </Tabs>

                <Separator />
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Workflow Progress
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {WORKFLOW_STAGES.filter((s) => s.id !== "rejected").map((s) => {
                      const done = candidate.history.some(
                        (h) => h.stage === s.id && h.status === "completed"
                      );
                      const current = candidate.currentStage === s.id;
                      return (
                        <span
                          key={s.id}
                          title={s.label}
                          className={`h-2 w-2 rounded-full ${
                            current
                              ? "bg-primary ring-2 ring-primary/30"
                              : done
                                ? "bg-emerald-500"
                                : "bg-border"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function PaymentRow({
  label,
  amount,
  status,
  date,
  receipt,
  delay,
}: {
  label: string;
  amount?: number;
  status?: string;
  date?: string;
  receipt?: string;
  delay?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Badge
          variant={
            status === "paid" ? "success" : status === "delayed" ? "warning" : "muted"
          }
        >
          {status || "N/A"}
        </Badge>
      </div>
      {amount != null && (
        <p className="mt-1 text-xs text-muted-foreground">
          {formatCurrency(amount)}
          {date && ` · ${formatDate(date)}`}
          {receipt && ` · ${receipt}`}
        </p>
      )}
      {delay && <p className="mt-1 text-xs text-amber-600">Delay: {delay}</p>}
    </div>
  );
}
