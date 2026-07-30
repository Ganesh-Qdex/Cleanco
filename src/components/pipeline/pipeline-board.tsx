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
import { PIPELINE_COLUMNS, canTransition, getStageDefinition } from "@/lib/workflow";
import { daysBetween, initials } from "@/lib/utils";
import type { Candidate, WorkflowStage } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PipelineBoard() {
  const candidates = useAppStore((s) => s.candidates);
  const agencies = useAppStore((s) => s.agencies);
  const filters = useAppStore((s) => s.filters);
  const globalSearch = useAppStore((s) => s.globalSearch);
  const moveCandidate = useAppStore((s) => s.moveCandidate);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);
  const user = useAuthStore((s) => s.user);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (user?.role === "agency" && user.agencyId && c.agencyId !== user.agencyId) {
        return false;
      }
      if (filters.nationality && c.nationality !== filters.nationality) return false;
      if (filters.agencyId && c.agencyId !== filters.agencyId) return false;
      if (filters.jobRole && c.jobRole !== filters.jobRole) return false;
      if (filters.stage && c.currentStage !== filters.stage) return false;
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
      return c.currentStage !== "manpower_request";
    });
  }, [candidates, filters, globalSearch, agencies, user]);

  const byStage = useMemo(() => {
    const map: Record<string, Candidate[]> = {};
    PIPELINE_COLUMNS.forEach((s) => {
      map[s.id] = [];
    });
    map["completed"] = [];
    map["rejected"] = [];
    filtered.forEach((c) => {
      if (map[c.currentStage]) map[c.currentStage].push(c);
      else if (c.currentStage === "completed") map.completed.push(c);
      else if (c.currentStage === "rejected") map.rejected.push(c);
    });
    return map;
  }, [filtered]);

  const activeCandidate = filtered.find((c) => c.id === activeId);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || !user) return;
    const candidateId = String(active.id);
    const toStage = String(over.id) as WorkflowStage;
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.currentStage === toStage) return;

    if (!canTransition(candidate.currentStage, user.role)) {
      toast.error("Your role cannot move this candidate");
      return;
    }

    // Agency cannot move to government stages
    if (user.role === "agency") {
      const allowed: WorkflowStage[] = [
        "cv_received",
        "signed_offer",
        "candidate_signs_mol",
        "visa_shared_agency",
        "completed",
      ];
      if (!allowed.includes(toStage)) {
        toast.error("Agency cannot update government stages");
        return;
      }
    }

    moveCandidate(candidateId, toStage, {
      remarks: `Moved via pipeline board`,
      actor: user.name,
    });
    toast.success(`Moved to ${getStageDefinition(toStage)?.shortLabel || toStage}`);
  };

  const columns = [
    ...PIPELINE_COLUMNS,
    getStageDefinition("completed"),
    getStageDefinition("rejected"),
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <PipelineColumn
            key={col.id}
            id={col.id}
            title={col.shortLabel}
            color={col.color}
            count={byStage[col.id]?.length || 0}
            candidates={byStage[col.id] || []}
            agencies={agencies}
            onOpen={setSelected}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCandidate && (
          <CandidateCard
            candidate={activeCandidate}
            agencyName={agencies.find((a) => a.id === activeCandidate.agencyId)?.name}
            dragging
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
}: {
  id: string;
  title: string;
  color: string;
  count: number;
  candidates: Candidate[];
  agencies: { id: string; name: string }[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-[20px] border border-border/50 bg-muted/30 shadow-inner-soft",
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <Badge variant="muted">{count}</Badge>
      </div>
      <ScrollArea className="h-[calc(100vh-260px)] px-2 pb-3">
        <div className="space-y-2">
          {candidates.slice(0, 40).map((c) => (
            <DraggableCard
              key={c.id}
              candidate={c}
              agencyName={agencies.find((a) => a.id === c.agencyId)?.name}
              onOpen={() => onOpen(c.id)}
            />
          ))}
          {candidates.length > 40 && (
            <p className="px-2 py-1 text-center text-xs text-muted-foreground">
              +{candidates.length - 40} more
            </p>
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
}: {
  candidate: Candidate;
  agencyName?: string;
  onOpen: () => void;
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
      <CandidateCard candidate={candidate} agencyName={agencyName} onClick={onOpen} />
    </div>
  );
}

function CandidateCard({
  candidate,
  agencyName,
  onClick,
  dragging,
}: {
  candidate: Candidate;
  agencyName?: string;
  onClick?: () => void;
  dragging?: boolean;
}) {
  const days = daysBetween(candidate.stageEnteredAt);
  const stage = getStageDefinition(candidate.currentStage);

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border border-border/60 bg-card p-3 shadow-neo-sm transition hover:shadow-neo",
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
