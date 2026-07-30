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
  Download,
  Pencil,
  ShieldAlert,
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
  PIPELINE_COLUMNS,
  requiresPoliceVerification,
  type StageAction,
} from "@/lib/workflow";
import { daysBetween, formatCurrency, formatDate, initials } from "@/lib/utils";
import { toast } from "sonner";
import type { DocumentFile } from "@/types";

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
  const needsPolice =
    candidate && requiresPoliceVerification(candidate.nationality);

  const resetForm = () => {
    setRemarks("");
    setRejectionReason("");
  };

  const runAction = (action: StageAction) => {
    if (!candidate || !user || !stage) return;

    if (action.type === "reject") {
      rejectCandidate(
        candidate.id,
        rejectionReason || remarks || "Rejected",
        user.name
      );
      toast.error("Candidate rejected");
      resetForm();
      return;
    }

    if (action.type === "download") {
      toast.success(`${action.label} — file ready (mock download)`);
      return;
    }

    if (action.type === "modify") {
      toast.success("Nawakis modification recorded (mock)");
      return;
    }

    // advance
    const docs: DocumentFile[] | undefined =
      action.id === "upload_visa"
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
        : action.id === "upload_tickets"
          ? [
              {
                id: `doc-ticket-${Date.now()}`,
                type: "flight_ticket",
                name: `ticket_${candidate.passportNumber}.pdf`,
                url: "#ticket",
                uploadedAt: new Date().toISOString(),
                uploadedBy: user.name,
              },
            ]
          : action.id === "upload_send_mol" || action.id === "create_mol"
            ? [
                {
                  id: `doc-mol-${Date.now()}`,
                  type: "mol_offer",
                  name: `mol_${candidate.passportNumber}.pdf`,
                  url: "#mol",
                  uploadedAt: new Date().toISOString(),
                  uploadedBy: user.name,
                },
              ]
            : undefined;

    const policeNote =
      action.id === "send_offer" && needsPolice
        ? " Police verification / good conduct certificate required for this nationality."
        : "";

    advanceCandidate(candidate.id, {
      remarks:
        remarks ||
        `${action.label}.${policeNote}`,
      decision: stage.decision ? "approved" : undefined,
      actor: user.name,
      offerIssueDate:
        action.id === "send_offer" ? new Date().toISOString() : undefined,
      paymentAmount: stage.fee,
      paymentDate: stage.fee ? new Date().toISOString() : undefined,
      paymentReceipt: stage.fee
        ? `RCP-${Date.now().toString().slice(-6)}`
        : undefined,
      visaFileName:
        action.id === "upload_visa"
          ? `${candidate.name.replace(/\s/g, "_")}_${candidate.passportNumber}_visa.pdf`
          : undefined,
      documents: docs,
    });

    toast.success(
      next
        ? `Moved to ${getStageDefinition(next).shortLabel}`
        : "Stage completed"
    );
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
                    {needsPolice && candidate.currentStage === "cv_received" && (
                      <Badge variant="warning">Police verification required</Badge>
                    )}
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

                    {canAct &&
                      candidate.currentStage !== "completed" &&
                      candidate.currentStage !== "rejected" && (
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

                          {stage.decision && (
                            <div>
                              <Label>Rejection Reason</Label>
                              <Select
                                value={rejectionReason}
                                onValueChange={setRejectionReason}
                              >
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

                          <div className="flex flex-col gap-2 pt-1">
                            {stage.actions.map((action) => {
                              const isReject = action.type === "reject";
                              const isDownload = action.type === "download";
                              const isModify = action.type === "modify";
                              const showPoliceNote =
                                action.id === "send_offer" && needsPolice;

                              return (
                                <div key={action.id} className="space-y-1.5">
                                  <Button
                                    variant={
                                      isReject
                                        ? "destructive"
                                        : isDownload || isModify
                                          ? "outline"
                                          : "default"
                                    }
                                    className="w-full justify-center"
                                    onClick={() => runAction(action)}
                                  >
                                    {isDownload && <Download className="h-4 w-4" />}
                                    {isModify && <Pencil className="h-4 w-4" />}
                                    {action.label}
                                  </Button>
                                  {showPoliceNote && (
                                    <p className="flex items-start gap-1.5 text-xs text-amber-600">
                                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                      Police verification / good conduct certificate
                                      required for {candidate.nationality}.
                                    </p>
                                  )}
                                  {action.note && !showPoliceNote && (
                                    <p className="text-xs text-muted-foreground">
                                      {action.note}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {!canAct && (
                      <p className="text-sm text-muted-foreground">
                        Your role cannot update this stage.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline">
                    <ol className="relative ml-3 space-y-4 border-l border-border/70">
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
                                {h.daysSpent != null && ` · ${h.daysSpent}d`} ·{" "}
                                {h.responsibleTeam}
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
                    {PIPELINE_COLUMNS.map((s) => {
                      const done = candidate.history.some(
                        (h) => h.stage === s.id && h.status === "completed"
                      );
                      const current = candidate.currentStage === s.id;
                      return (
                        <span
                          key={s.id}
                          title={s.label}
                          className={`h-2.5 w-2.5 rounded-full ${
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
