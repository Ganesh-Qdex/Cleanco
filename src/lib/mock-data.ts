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
  (s) => !["completed", "rejected"].includes(s.id)
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
  _agencyName: string,
  isRejected: boolean
): StageHistoryEntry[] {
  const history: StageHistoryEntry[] = [];
  let stage: WorkflowStage | null = "cv_received";
  let entered = new Date(createdAt);

  const rejectable: WorkflowStage[] = [
    "cv_received",
    "upload_preapproved_mol",
    "mohre_approved",
    "upload_visa",
  ];

  while (stage) {
    const def = WORKFLOW_STAGES.find((s) => s.id === stage)!;
    const daysInStage = 1 + Math.floor(rand() * 5);
    const completed = new Date(entered);
    completed.setDate(completed.getDate() + daysInStage);

    const isCurrent = stage === currentStage && !isRejected;
    const shouldReject =
      isRejected && stage === currentStage && rejectable.includes(stage);

    history.push({
      id: `hist-${stage}-${Math.floor(rand() * 1e9)}`,
      stage,
      status: shouldReject ? "rejected" : isCurrent ? "in_progress" : "completed",
      enteredAt: entered.toISOString(),
      completedAt:
        isCurrent || shouldReject
          ? shouldReject
            ? completed.toISOString()
            : undefined
          : completed.toISOString(),
      daysSpent: isCurrent ? daysAgo(entered.toISOString()) : daysInStage,
      responsibleTeam: def.responsibility,
      remarks: shouldReject
        ? pick(def.rejectionReasons || ["Document issue"])
        : isCurrent
          ? "In progress"
          : "Completed successfully",
      decision: shouldReject
        ? "rejected"
        : def.decision && !isCurrent
          ? "approved"
          : undefined,
      rejectionReason: shouldReject
        ? pick(def.rejectionReasons || ["Document issue"])
        : undefined,
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
      currentStage = pick([
        "cv_received",
        "upload_preapproved_mol",
        "mohre_approved",
        "upload_visa",
      ] as WorkflowStage[]);
    } else {
      const weight = rand();
      if (weight < 0.1) currentStage = "completed";
      else if (weight < 0.22) currentStage = "flight_bookings";
      else if (weight < 0.36) currentStage = "upload_visa";
      else if (weight < 0.5) currentStage = "mohre_approved";
      else if (weight < 0.62) currentStage = "stage2_signed_nawakis";
      else if (weight < 0.74) currentStage = "upload_preapproved_mol";
      else if (weight < 0.86) currentStage = "signed_offer_docs";
      else currentStage = "cv_received";
    }

    const history = buildHistory(currentStage, createdAt, agency.name, isRejected);
    const stageEntered = history[history.length - 1]?.enteredAt || createdAt;
    const idx = getStageIndexSafe(currentStage);

    const docs: DocumentFile[] = [];
    docs.push(makeDoc("cv", name, agency.name, createdAt));
    if (idx >= 1 || currentStage === "completed") {
      docs.push(
        makeDoc("passport", name, agency.name, stageEntered),
        makeDoc("photo", name, agency.name, stageEntered),
        makeDoc("police_clearance", name, agency.name, stageEntered),
        makeDoc("signed_offer", name, agency.name, stageEntered)
      );
    }
    if (idx >= 2 || currentStage === "completed") {
      docs.push(makeDoc("mol_offer", name, "PRO Team", stageEntered));
    }
    if (idx >= 3 || currentStage === "completed") {
      docs.push(makeDoc("signed_mol", name, "PRO Team", stageEntered));
    }
    if ((idx >= 5 || currentStage === "completed") && !isRejected) {
      docs.push(makeDoc("visa_pdf", name, "PRO Team", stageEntered));
    }
    if ((idx >= 6 || currentStage === "completed") && !isRejected) {
      docs.push(makeDoc("flight_ticket", name, "Admin", stageEntered));
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
        idx >= 1 || currentStage === "completed"
          ? randomDate(daysAgo(createdAt), 2)
          : undefined,
      mohreStatus:
        finalStage === "rejected" && currentStage === "mohre_approved"
          ? "rejected"
          : idx >= 4 || currentStage === "completed"
            ? "approved"
            : idx === 4
              ? "pending"
              : undefined,
      mohreRejectionReason:
        finalStage === "rejected" && currentStage === "mohre_approved"
          ? pick(["Company block", "Police case", "Document issue"])
          : undefined,
      icpStatus:
        finalStage === "rejected" && currentStage === "upload_visa"
          ? "rejected"
          : idx >= 5 || currentStage === "completed"
            ? "approved"
            : undefined,
      icpRejectionReason:
        finalStage === "rejected" && currentStage === "upload_visa"
          ? pick(["Police case", "Document issue (personal)"])
          : undefined,
      labourContractFee:
        idx >= 2 || currentStage === "completed"
          ? { amount: 50, status: "paid", date: randomDate(60, 5) }
          : undefined,
      mohrePayment:
        idx >= 4 || currentStage === "completed"
          ? {
              amount: 1800,
              status: rand() > 0.15 ? "paid" : rand() > 0.5 ? "delayed" : "pending",
              date: randomDate(40, 2),
              receipt: `RCP-MH-${Math.floor(10000 + rand() * 89999)}`,
              delayReason: rand() > 0.7 ? "Awaiting finance approval" : undefined,
            }
          : undefined,
      icpPayment:
        idx >= 5 || currentStage === "completed"
          ? {
              amount: 800,
              status: rand() > 0.2 ? "paid" : "pending",
              date: randomDate(30, 1),
              receipt: `RCP-ICP-${Math.floor(10000 + rand() * 89999)}`,
            }
          : undefined,
      visaFileName:
        idx >= 5 || currentStage === "completed"
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
