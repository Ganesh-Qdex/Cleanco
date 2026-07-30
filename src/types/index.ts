export type UserRole = "admin" | "pro" | "agency";

export type VacancyStatus = "open" | "closed" | "filled";
export type Priority = "low" | "medium" | "high" | "urgent";
export type DecisionStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "paid" | "delayed";

export type WorkflowStage =
  | "manpower_request"
  | "vacancy_submitted"
  | "cv_received"
  | "basic_screening"
  | "offer_issued"
  | "signed_offer"
  | "mol_offer_created"
  | "mohre_submitted"
  | "police_verification"
  | "labour_contract"
  | "download_mohre_offer"
  | "send_mol_agency"
  | "candidate_signs_mol"
  | "upload_signed_mol"
  | "mohre_approval"
  | "visa_application_icp"
  | "icp_payment"
  | "icp_decision"
  | "visa_issued"
  | "hr_processing"
  | "visa_shared_agency"
  | "completed"
  | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  agencyId?: string;
}

export interface Agency {
  id: string;
  name: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  candidatesCount: number;
  successRate: number;
  status: "active" | "inactive";
}

export interface Vacancy {
  id: string;
  companyName: string;
  jobRole: string;
  quantityRequired: number;
  filledCount: number;
  salary: number;
  location: "DXB" | "AUH" | "AL_AIN";
  priority: Priority;
  agencyIds: string[];
  closingDate: string;
  status: VacancyStatus;
  createdAt: string;
  createdBy: string;
  remarks?: string;
}

export interface DocumentFile {
  id: string;
  type:
    | "passport"
    | "photo"
    | "cv"
    | "police_clearance"
    | "signed_offer"
    | "mol_offer"
    | "signed_mol"
    | "mohre_approval"
    | "visa_pdf"
    | "other";
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface StageHistoryEntry {
  id: string;
  stage: WorkflowStage;
  status: "completed" | "rejected" | "skipped" | "in_progress";
  enteredAt: string;
  completedAt?: string;
  daysSpent?: number;
  responsibleTeam: string;
  remarks?: string;
  documents?: DocumentFile[];
  decision?: DecisionStatus;
  rejectionReason?: string;
  paymentAmount?: number;
  paymentDate?: string;
  paymentReceipt?: string;
  paymentDelayReason?: string;
}

export interface Candidate {
  id: string;
  name: string;
  passportNumber: string;
  nationality: string;
  jobRole: string;
  vacancyId: string;
  agencyId: string;
  photoUrl?: string;
  currentStage: WorkflowStage;
  priority: Priority;
  stageEnteredAt: string;
  documents: DocumentFile[];
  history: StageHistoryEntry[];
  offerIssueDate?: string;
  mohreStatus?: DecisionStatus;
  mohreRejectionReason?: string;
  icpStatus?: DecisionStatus;
  icpRejectionReason?: string;
  mohrePayment?: {
    amount: number;
    status: PaymentStatus;
    date?: string;
    receipt?: string;
    delayReason?: string;
  };
  labourContractFee?: {
    amount: number;
    status: PaymentStatus;
    date?: string;
  };
  icpPayment?: {
    amount: number;
    status: PaymentStatus;
    date?: string;
    receipt?: string;
  };
  visaFileName?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  candidateId?: string;
  href?: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  actor: string;
  candidateName?: string;
  timestamp: string;
  type: string;
}
