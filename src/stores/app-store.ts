"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActivityItem,
  Agency,
  Candidate,
  DocumentFile,
  NotificationItem,
  StageHistoryEntry,
  Vacancy,
  WorkflowStage,
} from "@/types";
import { getMockData } from "@/lib/mock-data";
import { getNextStage, getStageDefinition } from "@/lib/workflow";
import { daysBetween } from "@/lib/utils";

const seed = getMockData();

interface AppState {
  agencies: Agency[];
  vacancies: Vacancy[];
  candidates: Candidate[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
  selectedCandidateId: string | null;
  globalSearch: string;
  filters: {
    nationality: string;
    agencyId: string;
    jobRole: string;
    stage: string;
    priority: string;
    visaStatus: string;
  };
  setSearch: (q: string) => void;
  setFilters: (f: Partial<AppState["filters"]>) => void;
  setSelectedCandidate: (id: string | null) => void;
  addVacancy: (v: Omit<Vacancy, "id" | "createdAt" | "filledCount">) => void;
  updateVacancy: (id: string, patch: Partial<Vacancy>) => void;
  addCandidate: (c: Omit<Candidate, "id" | "createdAt" | "updatedAt" | "history" | "stageEnteredAt">) => void;
  updateCandidate: (id: string, patch: Partial<Candidate>) => void;
  moveCandidate: (
    id: string,
    toStage: WorkflowStage,
    meta?: {
      remarks?: string;
      decision?: "approved" | "rejected";
      rejectionReason?: string;
      documents?: DocumentFile[];
      paymentAmount?: number;
      paymentDate?: string;
      paymentReceipt?: string;
      paymentDelayReason?: string;
      offerIssueDate?: string;
      visaFileName?: string;
      actor?: string;
    }
  ) => void;
  advanceCandidate: (id: string, meta?: Parameters<AppState["moveCandidate"]>[2]) => void;
  rejectCandidate: (id: string, reason: string, actor?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addAgency: (a: Omit<Agency, "id" | "candidatesCount" | "successRate">) => void;
  addNotification: (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
}

function pushActivity(
  activities: ActivityItem[],
  action: string,
  actor: string,
  candidateName?: string
): ActivityItem[] {
  return [
    {
      id: `act-${Date.now()}`,
      action,
      actor,
      candidateName,
      timestamp: new Date().toISOString(),
      type: "pipeline",
    },
    ...activities,
  ].slice(0, 100);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      agencies: seed.agencies,
      vacancies: seed.vacancies,
      candidates: seed.candidates,
      notifications: seed.notifications,
      activities: seed.activities,
      selectedCandidateId: null,
      globalSearch: "",
      filters: {
        nationality: "",
        agencyId: "",
        jobRole: "",
        stage: "",
        priority: "",
        visaStatus: "",
      },
      setSearch: (q) => set({ globalSearch: q }),
      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      setSelectedCandidate: (id) => set({ selectedCandidateId: id }),
      addVacancy: (v) =>
        set((s) => ({
          vacancies: [
            {
              ...v,
              id: `vac-${Date.now()}`,
              createdAt: new Date().toISOString(),
              filledCount: 0,
            },
            ...s.vacancies,
          ],
          activities: pushActivity(s.activities, "created vacancy", "Cleanco Admin"),
        })),
      updateVacancy: (id, patch) =>
        set((s) => ({
          vacancies: s.vacancies.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),
      addCandidate: (c) => {
        const now = new Date().toISOString();
        const history: StageHistoryEntry[] = [
          {
            id: `hist-${Date.now()}`,
            stage: "cv_received",
            status: "in_progress",
            enteredAt: now,
            responsibleTeam: "Agency",
            remarks: c.remarks || "Candidate uploaded",
            documents: c.documents,
          },
        ];
        const candidate: Candidate = {
          ...c,
          id: `cand-${Date.now()}`,
          currentStage: c.currentStage || "cv_received",
          stageEnteredAt: now,
          createdAt: now,
          updatedAt: now,
          history,
        };
        set((s) => ({
          candidates: [candidate, ...s.candidates],
          agencies: s.agencies.map((a) =>
            a.id === candidate.agencyId
              ? { ...a, candidatesCount: a.candidatesCount + 1 }
              : a
          ),
          activities: pushActivity(
            s.activities,
            "uploaded candidate",
            "Agency Partner",
            candidate.name
          ),
          notifications: [
            {
              id: `notif-${Date.now()}`,
              title: "Agency uploaded candidate",
              message: `${candidate.name} uploaded by agency`,
              type: "info",
              read: false,
              createdAt: now,
              candidateId: candidate.id,
              href: `/pipeline?candidate=${candidate.id}`,
            },
            ...s.notifications,
          ],
        }));
      },
      updateCandidate: (id, patch) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
          ),
        })),
      moveCandidate: (id, toStage, meta = {}) => {
        const candidate = get().candidates.find((c) => c.id === id);
        if (!candidate) return;
        const now = new Date().toISOString();
        const def = getStageDefinition(toStage);
        const daysSpent = daysBetween(candidate.stageEnteredAt, now);

        const closedHistory = candidate.history.map((h, idx) =>
          idx === candidate.history.length - 1 && h.status === "in_progress"
            ? {
                ...h,
                status: (meta.decision === "rejected" ? "rejected" : "completed") as StageHistoryEntry["status"],
                completedAt: now,
                daysSpent,
                remarks: meta.remarks || h.remarks,
                decision: meta.decision,
                rejectionReason: meta.rejectionReason,
              }
            : h
        );

        const newEntry: StageHistoryEntry = {
          id: `hist-${Date.now()}`,
          stage: toStage,
          status: toStage === "rejected" || toStage === "completed" ? "completed" : "in_progress",
          enteredAt: now,
          responsibleTeam: def?.responsibility || "System",
          remarks: meta.remarks,
          documents: meta.documents,
          paymentAmount: meta.paymentAmount,
          paymentDate: meta.paymentDate,
          paymentReceipt: meta.paymentReceipt,
          paymentDelayReason: meta.paymentDelayReason,
          decision: meta.decision,
          rejectionReason: meta.rejectionReason,
        };

        const patch: Partial<Candidate> = {
          currentStage: toStage,
          stageEnteredAt: now,
          updatedAt: now,
          history: toStage === "rejected" ? closedHistory : [...closedHistory, newEntry],
          documents: meta.documents
            ? [...candidate.documents, ...meta.documents]
            : candidate.documents,
        };

        if (meta.offerIssueDate) patch.offerIssueDate = meta.offerIssueDate;
        if (meta.visaFileName) patch.visaFileName = meta.visaFileName;
        if (toStage === "mohre_approval") {
          patch.mohreStatus = meta.decision === "rejected" ? "rejected" : "pending";
        }
        if (meta.decision === "approved" && candidate.currentStage === "mohre_approval") {
          patch.mohreStatus = "approved";
        }
        if (meta.decision === "approved" && candidate.currentStage === "icp_decision") {
          patch.icpStatus = "approved";
        }
        if (meta.paymentAmount === 1800) {
          patch.mohrePayment = {
            amount: 1800,
            status: meta.paymentDelayReason ? "delayed" : "paid",
            date: meta.paymentDate,
            receipt: meta.paymentReceipt,
            delayReason: meta.paymentDelayReason,
          };
        }
        if (meta.paymentAmount === 800) {
          patch.icpPayment = {
            amount: 800,
            status: "paid",
            date: meta.paymentDate,
            receipt: meta.paymentReceipt,
          };
        }
        if (meta.paymentAmount === 50) {
          patch.labourContractFee = {
            amount: 50,
            status: "paid",
            date: meta.paymentDate,
          };
        }
        if (meta.rejectionReason) {
          if (candidate.currentStage === "mohre_approval" || toStage === "rejected") {
            patch.mohreRejectionReason = meta.rejectionReason;
            patch.mohreStatus = "rejected";
          }
          if (candidate.currentStage === "icp_decision") {
            patch.icpRejectionReason = meta.rejectionReason;
            patch.icpStatus = "rejected";
          }
        }

        set((s) => ({
          candidates: s.candidates.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          activities: pushActivity(
            s.activities,
            `moved to ${def?.label || toStage}`,
            meta.actor || "User",
            candidate.name
          ),
        }));
      },
      advanceCandidate: (id, meta) => {
        const candidate = get().candidates.find((c) => c.id === id);
        if (!candidate) return;
        if (meta?.decision === "rejected") {
          get().rejectCandidate(id, meta.rejectionReason || "Rejected", meta.actor);
          return;
        }
        const next = getNextStage(candidate.currentStage);
        if (!next) return;
        get().moveCandidate(id, next, meta);
      },
      rejectCandidate: (id, reason, actor) => {
        get().moveCandidate(id, "rejected", {
          decision: "rejected",
          rejectionReason: reason,
          remarks: reason,
          actor,
        });
      },
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      addAgency: (a) =>
        set((s) => ({
          agencies: [
            {
              ...a,
              id: `agency-${Date.now()}`,
              candidatesCount: 0,
              successRate: 0,
            },
            ...s.agencies,
          ],
        })),
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              ...n,
              id: `notif-${Date.now()}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ],
        })),
    }),
    {
      name: "cleanco-app-data",
      skipHydration: true,
      partialize: (s) => ({
        agencies: s.agencies,
        vacancies: s.vacancies,
        candidates: s.candidates,
        notifications: s.notifications,
        activities: s.activities,
      }),
    }
  )
);
