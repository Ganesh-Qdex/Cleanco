import type { UserRole, WorkflowStage } from "@/types";

export type StageActionType = "reject" | "advance" | "download" | "modify";

export interface StageAction {
  id: string;
  label: string;
  type: StageActionType;
  /** Shown under the primary advance button (e.g. police verification note) */
  note?: string;
}

export interface StageDefinition {
  id: WorkflowStage;
  label: string;
  shortLabel: string;
  order: number;
  responsibility: string;
  purpose: string;
  documents?: string[];
  fee?: number;
  roles: UserRole[];
  decision?: boolean;
  rejectionReasons?: string[];
  color: string;
  actions: StageAction[];
}

/** Nationalities that typically need police clearance / good conduct. */
export const POLICE_VERIFICATION_COUNTRIES = [
  "India",
  "Pakistan",
  "Bangladesh",
  "Nepal",
  "Sri Lanka",
] as const;

export function requiresPoliceVerification(nationality: string) {
  return (POLICE_VERIFICATION_COUNTRIES as readonly string[]).includes(nationality);
}

export const WORKFLOW_STAGES: StageDefinition[] = [
  {
    id: "cv_received",
    label: "CV received from agency",
    shortLabel: "CV Received",
    order: 1,
    responsibility: "Admin / Recruitment Manager",
    purpose: "Review CV from agency. Reject or send offer letter (police verification if required).",
    documents: ["CV"],
    roles: ["admin"],
    decision: true,
    rejectionReasons: ["Profile mismatch", "Document issue", "Not suitable"],
    color: "#3B82F6",
    actions: [
      { id: "reject", label: "Rejected", type: "reject" },
      {
        id: "send_offer",
        label: "Send offer letter to agency",
        type: "advance",
        note: "Police verification / good conduct certificate required if applicable for nationality",
      },
    ],
  },
  {
    id: "signed_offer_docs",
    label: "Stage 1 - Signed offer with docs (PRO)",
    shortLabel: "Stage 1",
    order: 2,
    responsibility: "PRO Team",
    purpose: "Signed offer + passport, photo, police clearance received. Create and download MOL.",
    documents: ["Signed Offer", "Passport", "Photo", "Police Clearance"],
    roles: ["pro", "admin"],
    color: "#F59E0B",
    actions: [
      { id: "create_mol", label: "Create MOL", type: "advance" },
      { id: "download_mol", label: "DOWNLOAD MOL", type: "download" },
    ],
  },
  {
    id: "upload_preapproved_mol",
    label: "Upload pre approved MOL Letter",
    shortLabel: "Pre-approved MOL",
    order: 3,
    responsibility: "PRO / Admin",
    purpose: "Upload pre-approved MOL and send to agency, or reject.",
    documents: ["MOL Offer"],
    roles: ["admin"],
    decision: true,
    rejectionReasons: ["Company block", "Document issue", "MOL error"],
    color: "#F97316",
    actions: [
      { id: "reject", label: "Rejected", type: "reject" },
      {
        id: "upload_send_mol",
        label: "Upload the MOL and send to agency",
        type: "advance",
      },
    ],
  },
  {
    id: "stage2_signed_nawakis",
    label: "Stage 2 - Signed offers / Nawakis (PRO)",
    shortLabel: "Stage 2",
    order: 4,
    responsibility: "PRO Team",
    purpose: "Modification of MOL offer (Nawakis) — modify and download.",
    roles: ["pro", "admin"],
    color: "#EF4444",
    actions: [
      { id: "modify", label: "Modify", type: "modify" },
      { id: "download", label: "Download", type: "advance" },
    ],
  },
  {
    id: "mohre_approved",
    label: "Mohre approved candidates",
    shortLabel: "MOHRE Approved",
    order: 5,
    responsibility: "PRO / Government",
    purpose: "MOHRE approved. Download offer letter and proceed to ICP portal, or reject.",
    fee: 1800,
    roles: ["pro", "admin"],
    decision: true,
    rejectionReasons: ["Company block", "Police case", "Document issue"],
    color: "#BE185D",
    actions: [
      { id: "reject", label: "Rejected", type: "reject" },
      {
        id: "download_icp",
        label: "Download Mohre offer letter and ICP portal",
        type: "advance",
      },
    ],
  },
  {
    id: "upload_visa",
    label: "Upload approved visa",
    shortLabel: "Upload Visa",
    order: 6,
    responsibility: "PRO / Admin",
    purpose: "Upload approved visa PDF or reject.",
    documents: ["Visa PDF"],
    fee: 800,
    roles: ["pro", "admin"],
    decision: true,
    rejectionReasons: ["Police case", "Document issue (personal)", "ICP rejection"],
    color: "#10B981",
    actions: [
      { id: "reject", label: "Reject", type: "reject" },
      { id: "upload_visa", label: "Upload visa", type: "advance" },
    ],
  },
  {
    id: "flight_bookings",
    label: "Flight bookings",
    shortLabel: "Flights",
    order: 7,
    responsibility: "Admin / HR",
    purpose: "Upload flight tickets for candidate travel.",
    documents: ["Flight Tickets"],
    roles: ["admin", "pro"],
    color: "#059669",
    actions: [{ id: "upload_tickets", label: "Upload tickets", type: "advance" }],
  },
  {
    id: "completed",
    label: "Completed",
    shortLabel: "Done",
    order: 8,
    responsibility: "System",
    purpose: "Candidate pipeline completed.",
    roles: ["admin", "pro", "agency"],
    color: "#047857",
    actions: [],
  },
  {
    id: "rejected",
    label: "Rejected",
    shortLabel: "Rejected",
    order: 99,
    responsibility: "System",
    purpose: "Candidate rejected.",
    roles: ["admin", "pro", "agency"],
    color: "#EF4444",
    actions: [],
  },
];

/** Only the 7 operational pipeline columns. */
export const PIPELINE_COLUMNS = WORKFLOW_STAGES.filter(
  (s) => s.id !== "completed" && s.id !== "rejected"
);

/** PRO pipeline: Stage 1 signed offer + Stage 2 Nawakis only. */
export const PRO_PIPELINE_STAGES: WorkflowStage[] = [
  "signed_offer_docs",
  "stage2_signed_nawakis",
];

export const PRO_PIPELINE_COLUMNS = PIPELINE_COLUMNS.filter((s) =>
  PRO_PIPELINE_STAGES.includes(s.id)
);

export function getPipelineColumnsForRole(role: UserRole) {
  if (role === "pro") return PRO_PIPELINE_COLUMNS;
  return PIPELINE_COLUMNS;
}

const STAGE_ORDER = WORKFLOW_STAGES.filter((s) => s.id !== "rejected").map((s) => s.id);

export function getStageDefinition(stage: WorkflowStage): StageDefinition {
  return (
    WORKFLOW_STAGES.find((s) => s.id === stage) ||
    WORKFLOW_STAGES.find((s) => s.id === "cv_received")!
  );
}

export function getNextStage(current: WorkflowStage): WorkflowStage | null {
  if (current === "rejected" || current === "completed") return null;
  if (current === "flight_bookings") return "completed";
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function canTransition(
  stage: WorkflowStage,
  role: UserRole,
  _action: "advance" | "reject" | "approve" = "advance"
): boolean {
  const def = getStageDefinition(stage);
  if (!def) return false;
  if (role === "admin") return true;
  if (role === "agency") {
    return stage === "cv_received" && _action !== "reject";
  }
  if (role === "pro") {
    return PRO_PIPELINE_STAGES.includes(stage);
  }
  return false;
}

export function getStageIndex(stage: WorkflowStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export const COUNTRIES = [
  "India",
  "Nepal",
  "Pakistan",
  "Bangladesh",
  "Philippines",
  "Sri Lanka",
] as const;

export const JOB_ROLES = [
  "Cleaner",
  "Housekeeper",
  "Janitor",
  "Supervisor",
  "Facility Manager",
  "Laundry Attendant",
  "Kitchen Helper",
  "Security Guard",
  "Driver",
  "Maintenance Technician",
] as const;

export const LOCATIONS = [
  { value: "DXB", label: "Dubai" },
  { value: "AUH", label: "Abu Dhabi" },
  { value: "AL_AIN", label: "Al Ain" },
] as const;

export const ROLE_EMAILS: Record<string, { role: UserRole; name: string; agencyId?: string }> = {
  "admin@cleanco.com": { role: "admin", name: "Cleanco Admin" },
  "pro@cleanco.com": { role: "pro", name: "PRO Officer" },
  "agency@cleanco.com": { role: "agency", name: "Agency Partner", agencyId: "agency-1" },
};
