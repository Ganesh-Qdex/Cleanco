import type {
  ActivityItem,
  Agency,
  Candidate,
  DocumentFile,
  NotificationItem,
  Priority,
  StageHistoryEntry,
  User,
  Vacancy,
  WorkflowStage,
} from "@/types";
import { COUNTRIES, JOB_ROLES, WORKFLOW_STAGES, getNextStage } from "./workflow";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

/** Fixed clock so mock data is identical on server and client. */
const FIXED_NOW = new Date("2026-07-30T12:00:00.000Z").getTime();

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

function randomDate(daysAgoMax: number, daysAgoMin = 0): string {
  const days = daysAgoMin + Math.floor(rand() * (daysAgoMax - daysAgoMin));
  const d = new Date(FIXED_NOW);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(Math.floor(rand() * 12) + 8, Math.floor(rand() * 60), 0, 0);
  return d.toISOString();
}

function daysAgo(iso: string): number {
  return Math.floor((FIXED_NOW - new Date(iso).getTime()) / 86400000);
}

const FIRST_NAMES = [
  "Rajesh", "Amit", "Suresh", "Priya", "Anil", "Kamala", "Ramesh", "Sunita",
  "Bikash", "Sita", "Ram", "Gita", "Hassan", "Fatima", "Ali", "Ayesha",
  "Rahim", "Nasreen", "Karim", "Salma", "Jose", "Maria", "Juan", "Ana",
  "Nimal", "Chamari", "Asanka", "Dilani", "Vikram", "Deepa", "Mohammed",
  "Aisha", "Imran", "Zara", "Arjun", "Meera", "Prakash", "Lakshmi",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Singh", "Kumar", "Thapa", "Gurung", "Rai", "Khan",
  "Ahmed", "Hussain", "Rahman", "Islam", "Santos", "Reyes", "Cruz",
  "Fernando", "Perera", "Silva", "Wijesinghe", "Malik", "Chowdhury",
];

const AGENCY_NAMES = [
  "Gulf Talent Partners",
  "Asia Manpower Hub",
  "Emirates Recruit Co",
  "Horizon Overseas",
  "Summit HR Solutions",
  "Pacific Staffing",
  "Unity Overseas Services",
  "Bright Path Recruitment",
  "Global Link Manpower",
  "Star Workforce Agency",
];

const COMPANIES = [
  "Cleanco Facilities LLC",
  "Marina Hospitality Group",
  "Desert Pearl Hotels",
  "Skyline Property Mgmt",
  "Al Noor Medical City",
  "Pearl Mall Operations",
  "Azure Residences",
  "Falcon Industrial Park",
  "Oasis Catering Co",
  "Metro Cleaning Services",
  "Gulf Tower Management",
  "Palm Grove Resorts",
];

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

const PIPELINE_STAGES: WorkflowStage[] = WORKFLOW_STAGES.filter(
  (s) => !["manpower_request", "completed", "rejected"].includes(s.id)
).map((s) => s.id);

function makeDoc(
  type: DocumentFile["type"],
  candidateName: string,
  uploadedBy: string,
  date: string
): DocumentFile {
  return {
    id: `doc-${type}-${Math.floor(rand() * 1e9)}`,
    type,
    name: `${type}_${candidateName.replace(/\s/g, "_")}.pdf`,
    url: `#${type}`,
    uploadedAt: date,
    uploadedBy,
  };
}

function buildHistory(
  currentStage: WorkflowStage,
  createdAt: string,
  agencyName: string,
  isRejected: boolean
): StageHistoryEntry[] {
  const history: StageHistoryEntry[] = [];
  let stage: WorkflowStage | null = "cv_received";
  let entered = new Date(createdAt);

  while (stage) {
    const def = WORKFLOW_STAGES.find((s) => s.id === stage)!;
    const daysInStage = 1 + Math.floor(rand() * 5);
    const completed = new Date(entered);
    completed.setDate(completed.getDate() + daysInStage);

    const isCurrent = stage === currentStage && !isRejected;
    const shouldReject =
      isRejected &&
      stage === currentStage &&
      (stage === "basic_screening" || stage === "mohre_approval" || stage === "icp_decision");

    history.push({
      id: `hist-${stage}-${Math.floor(rand() * 1e9)}`,
      stage,
      status: shouldReject ? "rejected" : isCurrent ? "in_progress" : "completed",
      enteredAt: entered.toISOString(),
      completedAt: isCurrent || shouldReject ? (shouldReject ? completed.toISOString() : undefined) : completed.toISOString(),
      daysSpent: isCurrent ? daysAgo(entered.toISOString()) : daysInStage,
      responsibleTeam: def.responsibility,
      remarks: shouldReject
        ? pick(def.rejectionReasons || ["Document issue"])
        : isCurrent
          ? "In progress"
          : "Completed successfully",
      decision: shouldReject ? "rejected" : def.decision && !isCurrent ? "approved" : undefined,
      rejectionReason: shouldReject ? pick(def.rejectionReasons || ["Document issue"]) : undefined,
      paymentAmount: def.fee && !isCurrent && !shouldReject ? def.fee : undefined,
      paymentDate: def.fee && !isCurrent && !shouldReject ? completed.toISOString() : undefined,
    });

    if (isCurrent || shouldReject) break;
    stage = getNextStage(stage);
    entered = completed;
  }

  return history;
}

export function generateAgencies(): Agency[] {
  return AGENCY_NAMES.map((name, i) => ({
    id: `agency-${i + 1}`,
    name,
    country: pick(COUNTRIES),
    contactPerson: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    email: `contact@${name.toLowerCase().replace(/\s/g, "")}.com`,
    phone: `+971 5${Math.floor(rand() * 9)}${Math.floor(1000000 + rand() * 8999999)}`,
    candidatesCount: 0,
    successRate: Math.round(55 + rand() * 40),
    status: rand() > 0.1 ? "active" : "inactive",
  }));
}

export function generateVacancies(agencies: Agency[]): Vacancy[] {
  return Array.from({ length: 30 }, (_, i) => {
    const qty = 5 + Math.floor(rand() * 40);
    const filled = Math.floor(rand() * (qty * 0.7));
    const statusRoll = rand();
    const status = statusRoll > 0.85 ? "filled" : statusRoll > 0.7 ? "closed" : "open";
    return {
      id: `vac-${i + 1}`,
      companyName: pick(COMPANIES),
      jobRole: pick(JOB_ROLES),
      quantityRequired: qty,
      filledCount: status === "filled" ? qty : filled,
      salary: 1200 + Math.floor(rand() * 2800),
      location: pick(["DXB", "AUH", "AL_AIN"] as const),
      priority: pick(PRIORITIES),
      agencyIds: pickN(
        agencies.map((a) => a.id),
        1 + Math.floor(rand() * 3)
      ),
      closingDate: randomDate(0, -45).slice(0, 10),
      status: status as Vacancy["status"],
      createdAt: randomDate(120, 30),
      createdBy: "admin@cleanco.com",
      remarks: "Manpower requisition from BU",
    };
  });
}

export function generateCandidates(agencies: Agency[], vacancies: Vacancy[]): Candidate[] {
  const candidates: Candidate[] = [];

  for (let i = 0; i < 300; i++) {
    const nationality = pick(COUNTRIES);
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    const vacancy = pick(vacancies);
    const agencyId =
      vacancy.agencyIds[Math.floor(rand() * vacancy.agencyIds.length)] || agencies[0].id;
    const agency = agencies.find((a) => a.id === agencyId)!;
    const createdAt = randomDate(150, 5);

    const rejectRoll = rand();
    const isRejected = rejectRoll < 0.08;
    let currentStage: WorkflowStage;

    if (isRejected) {
      currentStage = pick(["basic_screening", "mohre_approval", "icp_decision"] as WorkflowStage[]);
    } else {
      // Weighted towards mid/late stages for realism
      const weight = rand();
      if (weight < 0.12) currentStage = "completed";
      else if (weight < 0.18) currentStage = pick(["visa_issued", "hr_processing", "visa_shared_agency"]);
      else if (weight < 0.35) currentStage = pick(["mohre_approval", "visa_application_icp", "icp_payment", "icp_decision"]);
      else if (weight < 0.55) currentStage = pick(["mol_offer_created", "mohre_submitted", "police_verification", "labour_contract", "download_mohre_offer", "send_mol_agency", "candidate_signs_mol", "upload_signed_mol"]);
      else currentStage = pick(["cv_received", "basic_screening", "offer_issued", "signed_offer"]);
    }

    const history = buildHistory(currentStage, createdAt, agency.name, isRejected);
    const stageEntered = history[history.length - 1]?.enteredAt || createdAt;

    const docs: DocumentFile[] = [];
    if (getStageIndexSafe(currentStage) >= 3 || currentStage === "completed" || isRejected) {
      docs.push(makeDoc("cv", name, agency.name, createdAt));
    }
    if (getStageIndexSafe(currentStage) >= 6 || currentStage === "completed") {
      docs.push(
        makeDoc("passport", name, agency.name, stageEntered),
        makeDoc("photo", name, agency.name, stageEntered),
        makeDoc("police_clearance", name, agency.name, stageEntered),
        makeDoc("signed_offer", name, agency.name, stageEntered)
      );
    }
    if (getStageIndexSafe(currentStage) >= 14 || currentStage === "completed") {
      docs.push(makeDoc("signed_mol", name, "PRO Team", stageEntered));
    }
    if (
      (getStageIndexSafe(currentStage) >= 19 || currentStage === "completed") &&
      !isRejected
    ) {
      docs.push(makeDoc("visa_pdf", name, "PRO Team", stageEntered));
    }

    const finalStage: WorkflowStage = isRejected ? "rejected" : currentStage;

    const candidate: Candidate = {
      id: `cand-${i + 1}`,
      name,
      passportNumber: `${pick(["IN", "NP", "PK", "BD", "PH", "LK"])}${Math.floor(1000000 + rand() * 8999999)}`,
      nationality,
      jobRole: vacancy.jobRole,
      vacancyId: vacancy.id,
      agencyId,
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      currentStage: finalStage,
      priority: vacancy.priority,
      stageEnteredAt: stageEntered,
      documents: docs,
      history: isRejected
        ? [
            ...history.slice(0, -1),
            { ...history[history.length - 1], stage: currentStage, status: "rejected" },
          ]
        : history,
      offerIssueDate:
        getStageIndexSafe(currentStage) >= 5 || currentStage === "completed"
          ? randomDate(daysAgo(createdAt), 2)
          : undefined,
      mohreStatus:
        finalStage === "rejected" && currentStage === "mohre_approval"
          ? "rejected"
          : getStageIndexSafe(currentStage) > 15 || currentStage === "completed"
            ? "approved"
            : getStageIndexSafe(currentStage) === 15
              ? "pending"
              : undefined,
      mohreRejectionReason:
        finalStage === "rejected" && currentStage === "mohre_approval"
          ? pick(["Company block", "Police case", "Document issue"])
          : undefined,
      icpStatus:
        finalStage === "rejected" && currentStage === "icp_decision"
          ? "rejected"
          : getStageIndexSafe(currentStage) > 18 || currentStage === "completed"
            ? "approved"
            : getStageIndexSafe(currentStage) === 18
              ? "pending"
              : undefined,
      icpRejectionReason:
        finalStage === "rejected" && currentStage === "icp_decision"
          ? pick(["Police case", "Document issue (personal)"])
          : undefined,
      labourContractFee:
        getStageIndexSafe(currentStage) >= 10 || currentStage === "completed"
          ? { amount: 50, status: "paid", date: randomDate(60, 5) }
          : undefined,
      mohrePayment:
        getStageIndexSafe(currentStage) >= 15 || currentStage === "completed"
          ? {
              amount: 1800,
              status: rand() > 0.15 ? "paid" : rand() > 0.5 ? "delayed" : "pending",
              date: randomDate(40, 2),
              receipt: `RCP-MH-${Math.floor(10000 + rand() * 89999)}`,
              delayReason: rand() > 0.7 ? "Awaiting finance approval" : undefined,
            }
          : getStageIndexSafe(currentStage) === 15
            ? { amount: 1800, status: "pending" }
            : undefined,
      icpPayment:
        getStageIndexSafe(currentStage) >= 17 || currentStage === "completed"
          ? {
              amount: 800,
              status: rand() > 0.2 ? "paid" : "pending",
              date: randomDate(30, 1),
              receipt: `RCP-ICP-${Math.floor(10000 + rand() * 89999)}`,
            }
          : undefined,
      visaFileName:
        getStageIndexSafe(currentStage) >= 20 || currentStage === "completed"
          ? `${name.replace(/\s/g, "_")}_${pick(["IN", "NP", "PK"])}1234567_visa.pdf`
          : undefined,
      remarks: "",
      createdAt,
      updatedAt: stageEntered,
    };

    candidates.push(candidate);
  }

  // Update agency counts
  agencies.forEach((a) => {
    a.candidatesCount = candidates.filter((c) => c.agencyId === a.id).length;
  });

  return candidates;
}

function getStageIndexSafe(stage: WorkflowStage): number {
  const idx = PIPELINE_STAGES.indexOf(stage);
  if (stage === "completed") return 99;
  if (stage === "rejected") return -1;
  return idx >= 0 ? idx : 0;
}

export function generateNotifications(candidates: Candidate[]): NotificationItem[] {
  const templates = [
    { title: "Agency uploaded candidate", type: "info" as const, msg: (c: Candidate) => `${c.name} uploaded by agency` },
    { title: "Candidate approved", type: "success" as const, msg: (c: Candidate) => `${c.name} passed basic screening` },
    { title: "Offer generated", type: "info" as const, msg: (c: Candidate) => `Offer letter issued for ${c.name}` },
    { title: "Signed documents received", type: "success" as const, msg: (c: Candidate) => `Signed offer received for ${c.name}` },
    { title: "MOHRE Approved", type: "success" as const, msg: (c: Candidate) => `MOHRE approved for ${c.name}` },
    { title: "ICP Approved", type: "success" as const, msg: (c: Candidate) => `ICP approved for ${c.name}` },
    { title: "Visa Issued", type: "success" as const, msg: (c: Candidate) => `Visa issued for ${c.name}` },
    { title: "Payment Pending", type: "warning" as const, msg: (c: Candidate) => `Payment pending for ${c.name}` },
  ];

  return Array.from({ length: 25 }, (_, i) => {
    const c = pick(candidates);
    const t = pick(templates);
    return {
      id: `notif-${i + 1}`,
      title: t.title,
      message: t.msg(c),
      type: t.type,
      read: rand() > 0.4,
      createdAt: randomDate(14),
      candidateId: c.id,
      href: `/pipeline?candidate=${c.id}`,
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateActivities(candidates: Candidate[]): ActivityItem[] {
  return Array.from({ length: 40 }, (_, i) => {
    const c = pick(candidates);
    const actions = [
      "uploaded candidate",
      "advanced stage",
      "approved candidate",
      "recorded payment",
      "uploaded visa",
      "submitted to MOHRE",
      "updated ICP status",
    ];
    const actors = ["Cleanco Admin", "PRO Officer", "Agency Partner", "System"];
    return {
      id: `act-${i + 1}`,
      action: pick(actions),
      actor: pick(actors),
      candidateName: c.name,
      timestamp: randomDate(21),
      type: "pipeline",
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const MOCK_USERS: User[] = [
  {
    id: "user-admin",
    name: "Cleanco Admin",
    email: "admin@cleanco.com",
    role: "admin",
  },
  {
    id: "user-pro",
    name: "PRO Officer",
    email: "pro@cleanco.com",
    role: "pro",
  },
  {
    id: "user-agency",
    name: "Agency Partner",
    email: "agency@cleanco.com",
    role: "agency",
    agencyId: "agency-1",
  },
];

let _cache: {
  agencies: Agency[];
  vacancies: Vacancy[];
  candidates: Candidate[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
} | null = null;

export function getMockData() {
  if (_cache) return _cache;
  const agencies = generateAgencies();
  const vacancies = generateVacancies(agencies);
  const candidates = generateCandidates(agencies, vacancies);
  const notifications = generateNotifications(candidates);
  const activities = generateActivities(candidates);
  _cache = { agencies, vacancies, candidates, notifications, activities };
  return _cache;
}
