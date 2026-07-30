"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Clock, GripVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { canTransition, getStageDefinition, getPipelineColumnsForRole, PRO_PIPELINE_STAGES, AGENCY_PIPELINE_STAGES } from "@/lib/workflow";
import { daysBetween, initials } from "@/lib/utils";
import type { Candidate, WorkflowStage } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getRejectionInfo(candidate: Candidate) {
  const rejectedEntry = [...candidate.history]
    .reverse()
    .find((h) => h.status === "rejected");
  const stageId = rejectedEntry?.stage;
  const stageDef = stageId ? getStageDefinition(stageId) : null;
  const reason =
    rejectedEntry?.rejectionReason ||
    candidate.mohreRejectionReason ||
    candidate.icpRejectionReason ||
    rejectedEntry?.remarks ||
    "No reason recorded";

  return {
    stageLabel: stageDef?.shortLabel || "Unknown stage",
    stageTitle: stageDef?.label || "Unknown stage",
    reason,
  };
}

export function PipelineBoard() {
  const candidates = useAppStore((s) => s.candidates);
  const agencies = useAppStore((s) => s.agencies);
  const filters = useAppStore((s) => s.filters);
  const globalSearch = useAppStore((s) => s.globalSearch);
  const moveCandidate = useAppStore((s) => s.moveCandidate);
  const rejectCandidate = useAppStore((s) => s.rejectCandidate);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);
  const user = useAuthStore((s) => s.user);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const matchesFilters = (c: Candidate) => {
    if (user?.role === "agency" && user.agencyId && c.agencyId !== user.agencyId) {
      return false;
    }
    if (filters.nationality && c.nationality !== filters.nationality) return false;
    if (filters.agencyId && c.agencyId !== filters.agencyId) return false;
    if (filters.jobRole && c.jobRole !== filters.jobRole) return false;
    if (filters.priority && c.priority !== filters.priority) return false;
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      const agency = agencies.find((a) => a.id === c.agencyId);
      if (
        !c.name.toLowerCase().includes(q) &&
        !c.passportNumber.toLowerCase().includes(q) &&
        !c.jobRole.toLowerCase().includes(q) &&
        !(agency?.name.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  };

  const columns = useMemo(
    () => getPipelineColumnsForRole(user?.role || "admin"),
    [user?.role]
  );
  const isPro = user?.role === "pro";
  const isAgency = user?.role === "agency";
  const roleStages = isPro
    ? PRO_PIPELINE_STAGES
    : isAgency
      ? AGENCY_PIPELINE_STAGES
      : null;

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (!matchesFilters(c)) return false;
      if (c.currentStage === "completed" || c.currentStage === "rejected") return false;
      if (roleStages && !roleStages.includes(c.currentStage)) return false;
      if (filters.stage && c.currentStage !== filters.stage) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, filters, globalSearch, agencies, user, roleStages]);

  const rejectedCandidates = useMemo(() => {
    if (isPro || isAgency) return [];
    return candidates.filter((c) => {
      if (c.currentStage !== "rejected") return false;
      if (!matchesFilters(c)) return false;
      if (filters.stage && filters.stage !== "rejected") return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, filters, globalSearch, agencies, user, isPro, isAgency]);

  const byStage = useMemo(() => {
    const map: Record<string, Candidate[]> = {};
    columns.forEach((s) => {
      map[s.id] = [];
    });
    filtered.forEach((c) => {
      if (map[c.currentStage]) map[c.currentStage].push(c);
    });
    return map;
  }, [filtered, columns]);

  const activeCandidate = candidates.find((c) => c.id === activeId);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || !user) return;
    const candidateId = String(active.id);
    const toStage = String(over.id) as WorkflowStage;
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.currentStage === toStage) return;

    if (roleStages) {
      if (!roleStages.includes(candidate.currentStage) || !roleStages.includes(toStage)) {
        toast.error(
          isAgency
            ? "Agency can only move between Offer from RM and Pre-approved MOL"
            : "PRO can only move candidates between Stage 1 and Stage 2"
        );
        return;
      }
    }

    if (toStage === "rejected") {
      if (isPro || isAgency) {
        toast.error("Cannot reject from this board view");
        return;
      }
      rejectCandidate(candidateId, "Rejected via pipeline board", user.name);
      toast.error("Candidate moved to Rejected");
      return;
    }

    if (candidate.currentStage === "rejected") {
      moveCandidate(candidateId, toStage, {
        remarks: `Reopened into ${getStageDefinition(toStage)?.label}`,
        actor: user.name,
      });
      toast.success(`Reopened → ${getStageDefinition(toStage)?.shortLabel}`);
      return;
    }

    if (!canTransition(candidate.currentStage, user.role)) {
      toast.error("Your role cannot move this candidate");
      return;
    }

    moveCandidate(candidateId, toStage, {
      remarks: `Moved via pipeline board`,
      actor: user.name,
    });
    toast.success(`Moved to ${getStageDefinition(toStage)?.shortLabel || toStage}`);
  };

  const showActiveColumns = !filters.stage || filters.stage !== "rejected";
  const showRejectedColumn = !isPro && !isAgency && (!filters.stage || filters.stage === "rejected");
  const wideColumns = isPro || isAgency;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {showActiveColumns &&
          columns.map((col) => (
            <PipelineColumn
              key={col.id}
              id={col.id}
              title={col.label}
              color={col.color}
              count={byStage[col.id]?.length || 0}
              candidates={byStage[col.id] || []}
              agencies={agencies}
              onOpen={setSelected}
              wide={wideColumns}
            />
          ))}
        {showRejectedColumn && (
          <PipelineColumn
            id="rejected"
            title="Rejected candidates"
            color="#EF4444"
            count={rejectedCandidates.length}
            candidates={rejectedCandidates}
            agencies={agencies}
            onOpen={setSelected}
            showRejectionInfo
          />
        )}
      </div>
      <DragOverlay>
        {activeCandidate && (
          <CandidateCard
            candidate={activeCandidate}
            agencyName={agencies.find((a) => a.id === activeCandidate.agencyId)?.name}
            dragging
            showRejectionInfo={activeCandidate.currentStage === "rejected"}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function PipelineColumn({
  id,
  title,
  color,
  count,
  candidates,
  agencies,
  onOpen,
  showRejectionInfo,
  wide,
}: {
  id: string;
  title: string;
  color: string;
  count: number;
  candidates: Candidate[];
  agencies: { id: string; name: string }[];
  onOpen: (id: string) => void;
  showRejectionInfo?: boolean;
  wide?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex shrink-0 flex-col rounded-[20px] border border-border/50 bg-muted/30 shadow-inner-soft",
        wide ? "w-[420px]" : "w-[300px]",
        showRejectionInfo && "border-red-500/30 bg-red-500/5",
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2 px-3 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-snug">{title}</h3>
            {showRejectionInfo && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Stage rejected from + reason
              </p>
            )}
          </div>
        </div>
        <Badge variant={showRejectionInfo ? "destructive" : "muted"} className="shrink-0">
          {count}
        </Badge>
      </div>
      <ScrollArea className="h-[calc(100vh-260px)] px-2 pb-3">
        <div className="space-y-2">
          {candidates.slice(0, 40).map((c) => (
            <DraggableCard
              key={c.id}
              candidate={c}
              agencyName={agencies.find((a) => a.id === c.agencyId)?.name}
              onOpen={() => onOpen(c.id)}
              showRejectionInfo={showRejectionInfo}
            />
          ))}
          {candidates.length > 40 && (
            <p className="px-2 py-1 text-center text-xs text-muted-foreground">
              +{candidates.length - 40} more
            </p>
          )}
          {candidates.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">No candidates</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function DraggableCard({
  candidate,
  agencyName,
  onOpen,
  showRejectionInfo,
}: {
  candidate: Candidate;
  agencyName?: string;
  onOpen: () => void;
  showRejectionInfo?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CandidateCard
        candidate={candidate}
        agencyName={agencyName}
        onClick={onOpen}
        showRejectionInfo={showRejectionInfo}
      />
    </div>
  );
}

function CandidateCard({
  candidate,
  agencyName,
  onClick,
  dragging,
  showRejectionInfo,
}: {
  candidate: Candidate;
  agencyName?: string;
  onClick?: () => void;
  dragging?: boolean;
  showRejectionInfo?: boolean;
}) {
  const days = daysBetween(candidate.stageEnteredAt);
  const stage = getStageDefinition(candidate.currentStage);
  const rejection = showRejectionInfo ? getRejectionInfo(candidate) : null;

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border border-border/60 bg-card p-3 shadow-neo-sm transition hover:shadow-neo",
        showRejectionInfo && "border-red-500/25",
        dragging && "rotate-2 shadow-glass"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-1 h-4 w-4 text-muted-foreground/50" />
        <Avatar className="h-9 w-9">
          <AvatarImage src={candidate.photoUrl} />
          <AvatarFallback className="text-xs">{initials(candidate.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{candidate.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {candidate.nationality} · {candidate.jobRole}
          </p>
        </div>
      </div>

      {rejection ? (
        <div className="mt-3 space-y-1.5">
          <Badge variant="destructive" className="max-w-full truncate text-[10px]" title={rejection.stageTitle}>
            From: {rejection.stageLabel}
          </Badge>
          <p
            className="rounded-xl bg-red-500/10 px-2 py-1.5 text-[11px] leading-snug text-red-600 dark:text-red-400"
            title={rejection.reason}
          >
            Reason: {rejection.reason}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {stage?.shortLabel}
          </Badge>
          <Badge
            variant={
              candidate.priority === "urgent"
                ? "destructive"
                : candidate.priority === "high"
                  ? "warning"
                  : "muted"
            }
            className="capitalize text-[10px]"
          >
            {candidate.priority}
          </Badge>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{agencyName}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {days}d
        </span>
      </div>
    </motion.div>
  );
}
