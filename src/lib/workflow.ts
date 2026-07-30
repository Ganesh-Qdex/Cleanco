import type { UserRole, WorkflowStage } from "@/types";

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
}

export const WORKFLOW_STAGES: StageDefinition[] = [
  {
    id: "manpower_request",
    label: "Manpower Request Received",
    shortLabel: "Request",
    order: 1,
    responsibility: "Business Unit / Admin",
    purpose: "Receive manpower requirement from client.",
    roles: ["admin"],
    color: "#3B82F6",
  },
  {
    id: "vacancy_submitted",
    label: "Vacancy Submitted to Agencies",
    shortLabel: "Submitted",
    order: 2,
    responsibility: "Admin",
    purpose: "Assign vacancy to recruitment agencies.",
    roles: ["admin"],
    color: "#60A5FA",
  },
  {
    id: "cv_received",
    label: "CV Received",
    shortLabel: "CV",
    order: 3,
    responsibility: "Agency",
    purpose: "Agency uploads candidate CVs.",
    documents: ["CV"],
    roles: ["agency", "admin"],
    color: "#93C5FD",
  },
  {
    id: "basic_screening",
    label: "Basic Screening",
    shortLabel: "Screening",
    order: 4,
    responsibility: "Recruitment Manager",
    purpose: "Review candidate profile.",
    roles: ["admin"],
    decision: true,
    color: "#2563EB",
  },
  {
    id: "offer_issued",
    label: "Offer Letter Issued",
    shortLabel: "Offer",
    order: 5,
    responsibility: "Recruitment Manager",
    purpose: "Generate Offer Letter. Record offer issue date.",
    roles: ["admin"],
    color: "#1D4ED8",
  },
  {
    id: "signed_offer",
    label: "Signed Offer Received",
    shortLabel: "Signed Offer",
    order: 6,
    responsibility: "Agency",
    purpose: "Collect signed offer and required documents.",
    documents: [
      "Passport",
      "Candidate Photo",
      "Police Clearance / Good Conduct",
      "Signed Offer Letter",
    ],
    roles: ["agency", "admin"],
    color: "#1E40AF",
  },
  {
    id: "mol_offer_created",
    label: "PRO Creates MOL Offer",
    shortLabel: "MOL Create",
    order: 7,
    responsibility: "PRO Team",
    purpose: "Generate MOL Offer (~40 applications/day).",
    roles: ["pro", "admin"],
    color: "#F59E0B",
  },
  {
    id: "mohre_submitted",
    label: "MOHRE Application Submitted",
    shortLabel: "MOHRE Sub",
    order: 8,
    responsibility: "PRO",
    purpose: "Submit application to MOHRE.",
    roles: ["pro", "admin"],
    color: "#FBBF24",
  },
  {
    id: "police_verification",
    label: "Police Verification",
    shortLabel: "Police",
    order: 9,
    responsibility: "Government",
    purpose: "Country-specific police verification checklist.",
    roles: ["pro", "admin"],
    color: "#F97316",
  },
  {
    id: "labour_contract",
    label: "MOHRE Labour Contract Issued",
    shortLabel: "Contract",
    order: 10,
    responsibility: "Government",
    purpose: "Pre-approval labour contract issued.",
    fee: 50,
    roles: ["pro", "admin"],
    color: "#EA580C",
  },
  {
    id: "download_mohre_offer",
    label: "Download MOHRE Offer Letter",
    shortLabel: "Download",
    order: 11,
    responsibility: "PRO",
    purpose: "Download the MOHRE offer letter.",
    roles: ["pro", "admin"],
    color: "#DC2626",
  },
  {
    id: "send_mol_agency",
    label: "Send MOL to Agency",
    shortLabel: "Send MOL",
    order: 12,
    responsibility: "HR / PRO",
    purpose: "Share MOL offer with agency.",
    roles: ["pro", "admin"],
    color: "#EF4444",
  },
  {
    id: "candidate_signs_mol",
    label: "Candidate Signs MOL",
    shortLabel: "Sign MOL",
    order: 13,
    responsibility: "Agency",
    purpose: "Collect candidate signature on MOL.",
    roles: ["agency", "admin"],
    color: "#F87171",
  },
  {
    id: "upload_signed_mol",
    label: "Upload Signed MOL",
    shortLabel: "Upload MOL",
    order: 14,
    responsibility: "PRO",
    purpose: "Upload signed MOL offer.",
    documents: ["Signed MOL"],
    roles: ["pro", "admin"],
    color: "#FB7185",
  },
  {
    id: "mohre_approval",
    label: "MOHRE Approval",
    shortLabel: "MOHRE",
    order: 15,
    responsibility: "Government / PRO",
    purpose: "MOHRE approval or rejection. Fee 1800 AED.",
    fee: 1800,
    roles: ["pro", "admin"],
    decision: true,
    rejectionReasons: ["Company block", "Police case", "Document issue"],
    color: "#BE185D",
  },
  {
    id: "visa_application_icp",
    label: "Visa Application (ICP)",
    shortLabel: "ICP App",
    order: 16,
    responsibility: "PRO",
    purpose: "Upload visa application in ICP portal.",
    roles: ["pro", "admin"],
    color: "#7C3AED",
  },
  {
    id: "icp_payment",
    label: "ICP Payment",
    shortLabel: "ICP Pay",
    order: 17,
    responsibility: "PRO",
    purpose: "Record ICP payment. Fee 800 AED.",
    fee: 800,
    roles: ["pro", "admin"],
    color: "#8B5CF6",
  },
  {
    id: "icp_decision",
    label: "ICP Decision",
    shortLabel: "ICP",
    order: 18,
    responsibility: "Government / PRO",
    purpose: "ICP approval or rejection.",
    roles: ["pro", "admin"],
    decision: true,
    rejectionReasons: ["Police case", "Document issue (personal)"],
    color: "#A78BFA",
  },
  {
    id: "visa_issued",
    label: "Visa Issued",
    shortLabel: "Visa",
    order: 19,
    responsibility: "Government",
    purpose: "Visa issued successfully. Upload visa PDF.",
    documents: ["Visa PDF"],
    roles: ["pro", "admin"],
    color: "#10B981",
  },
  {
    id: "hr_processing",
    label: "HR Processing",
    shortLabel: "HR",
    order: 20,
    responsibility: "HR",
    purpose: "Rename visa file (passport/name) & share with HR.",
    roles: ["admin", "pro"],
    color: "#34D399",
  },
  {
    id: "visa_shared_agency",
    label: "Visa Shared with Agency",
    shortLabel: "Shared",
    order: 21,
    responsibility: "HR / Admin",
    purpose: "Visa shared with agency. Workflow complete.",
    roles: ["admin", "agency"],
    color: "#059669",
  },
  {
    id: "completed",
    label: "Completed",
    shortLabel: "Done",
    order: 22,
    responsibility: "System",
    purpose: "Candidate visa process completed.",
    roles: ["admin", "pro", "agency"],
    color: "#047857",
  },
  {
    id: "rejected",
    label: "Rejected",
    shortLabel: "Rejected",
    order: 99,
    responsibility: "System",
    purpose: "Candidate rejected at a decision stage.",
    roles: ["admin", "pro", "agency"],
    color: "#EF4444",
  },
];

export const PIPELINE_COLUMNS = WORKFLOW_STAGES.filter(
  (s) => s.id !== "completed" && s.id !== "rejected" && s.id !== "manpower_request"
);

export const ACTIVE_PIPELINE_STAGES = [
  ...PIPELINE_COLUMNS.map((s) => s.id),
  "completed" as const,
  "rejected" as const,
];

const STAGE_ORDER = WORKFLOW_STAGES.filter((s) => s.id !== "rejected").map((s) => s.id);

export function getStageDefinition(stage: WorkflowStage): StageDefinition {
  return WORKFLOW_STAGES.find((s) => s.id === stage)!;
}

export function getNextStage(current: WorkflowStage): WorkflowStage | null {
  if (current === "rejected" || current === "completed") return null;
  if (current === "visa_shared_agency") return "completed";
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function canTransition(
  stage: WorkflowStage,
  role: UserRole,
  action: "advance" | "reject" | "approve" = "advance"
): boolean {
  const def = getStageDefinition(stage);
  if (!def) return false;
  if (role === "admin") return true;
  if (role === "agency") {
    const agencyStages: WorkflowStage[] = [
      "cv_received",
      "signed_offer",
      "candidate_signs_mol",
      "visa_shared_agency",
    ];
    return agencyStages.includes(stage) && action !== "reject";
  }
  if (role === "pro") {
    return def.roles.includes("pro");
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
