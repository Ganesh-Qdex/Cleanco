"use client";

import { useMemo } from "react";
import {
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileWarning,
  Plane,
  Building2,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";
import { getStageDefinition } from "@/lib/workflow";
import { motion } from "framer-motion";

const COLORS = ["#4b5563", "#6b7280", "#9ca3af", "#374151", "#d1d5db", "#1f2937"];

export default function DashboardPage() {
  const candidates = useAppStore((s) => s.candidates);
  const vacancies = useAppStore((s) => s.vacancies);
  const activities = useAppStore((s) => s.activities);
  const agencies = useAppStore((s) => s.agencies);
  const user = useAuthStore((s) => s.user);

  const scoped = useMemo(() => {
    if (user?.role === "agency" && user.agencyId) {
      return candidates.filter((c) => c.agencyId === user.agencyId);
    }
    return candidates;
  }, [candidates, user]);

  const isPro = user?.role === "pro";
  const isAgency = user?.role === "agency";

  const kpis = useMemo(() => {
    if (isAgency) {
      return [
        {
          label: "Offer letter from RM",
          value: scoped.filter((c) => c.currentStage === "offer_from_rm").length,
          icon: Briefcase,
          tone: "text-foreground",
        },
        {
          label: "Pre-approved MOL",
          value: scoped.filter((c) => c.currentStage === "preapproved_mol_agency").length,
          icon: Clock,
          tone: "text-foreground",
        },
        {
          label: "Agency Queue",
          value: scoped.filter((c) =>
            ["offer_from_rm", "preapproved_mol_agency"].includes(c.currentStage)
          ).length,
          icon: Users,
          tone: "text-foreground",
        },
        {
          label: "Open Vacancies",
          value: vacancies.filter(
            (v) =>
              v.status === "open" &&
              (!user?.agencyId || v.agencyIds.includes(user.agencyId))
          ).length,
          icon: Building2,
          tone: "text-foreground",
        },
      ];
    }

    if (isPro) {
      return [
        {
          label: "Stage 1 — Signed Offer",
          value: scoped.filter((c) => c.currentStage === "signed_offer_docs").length,
          icon: Briefcase,
          tone: "text-foreground",
        },
        {
          label: "Stage 2 — Nawakis",
          value: scoped.filter((c) => c.currentStage === "stage2_signed_nawakis").length,
          icon: Clock,
          tone: "text-foreground",
        },
        {
          label: "PRO Queue Total",
          value: scoped.filter((c) =>
            ["signed_offer_docs", "stage2_signed_nawakis"].includes(c.currentStage)
          ).length,
          icon: Users,
          tone: "text-foreground",
        },
        {
          label: "MOHRE Pending",
          value: scoped.filter((c) =>
            ["mohre_approved", "upload_preapproved_mol"].includes(c.currentStage)
          ).length,
          icon: FileWarning,
          tone: "text-foreground",
        },
        {
          label: "ICP / Visa",
          value: scoped.filter((c) => c.currentStage === "upload_visa").length,
          icon: Plane,
          tone: "text-foreground",
        },
        {
          label: "Rejected",
          value: scoped.filter((c) => c.currentStage === "rejected").length,
          icon: XCircle,
          tone: "text-red-500",
        },
      ];
    }

    const openVacancies = vacancies.filter((v) => v.status === "open").length;
    const filledVacancies = vacancies.filter((v) => v.status === "filled").length;
    return [
      { label: "Open Vacancies", value: openVacancies, icon: Briefcase, tone: "text-foreground" },
      { label: "Filled Vacancies", value: filledVacancies, icon: CheckCircle2, tone: "text-foreground" },
      { label: "Total Candidates", value: scoped.length, icon: Users, tone: "text-foreground" },
      {
        label: "Visa Issued",
        value: scoped.filter((c) =>
          ["upload_visa", "flight_bookings", "completed"].includes(c.currentStage)
        ).length,
        icon: Plane,
        tone: "text-foreground",
      },
      {
        label: "Rejected",
        value: scoped.filter((c) => c.currentStage === "rejected").length,
        icon: XCircle,
        tone: "text-red-500",
      },
      {
        label: "MOHRE Pending",
        value: scoped.filter((c) =>
          ["upload_preapproved_mol", "preapproved_mol_agency", "stage2_signed_nawakis", "mohre_approved"].includes(
            c.currentStage
          )
        ).length,
        icon: Clock,
        tone: "text-foreground",
      },
      {
        label: "ICP / Visa Pending",
        value: scoped.filter((c) => c.currentStage === "upload_visa").length,
        icon: FileWarning,
        tone: "text-foreground",
      },
      {
        label: "Agency Pending",
        value: scoped.filter((c) =>
          ["cv_received", "offer_from_rm", "preapproved_mol_agency"].includes(c.currentStage)
        ).length,
        icon: Building2,
        tone: "text-foreground",
      },
      {
        label: "Processing",
        value: scoped.filter(
          (c) => !["completed", "rejected"].includes(c.currentStage)
        ).length,
        icon: Loader2,
        tone: "text-primary",
      },
    ];
  }, [scoped, vacancies, isPro, isAgency, user?.agencyId]);

  const monthlyVisa = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((m, i) => ({
      month: m,
      issued: 8 + ((i * 7 + scoped.length) % 25),
    }));
  }, [scoped.length]);

  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    scoped.forEach((c) => {
      map[c.nationality] = (map[c.nationality] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [scoped]);

  const stageData = useMemo(() => {
    const map: Record<string, number> = {};
    scoped.forEach((c) => {
      const label = getStageDefinition(c.currentStage)?.shortLabel || c.currentStage;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [scoped]);

  const agencyPerf = useMemo(() => {
    return agencies.slice(0, 6).map((a) => {
      const total = scoped.filter((c) => c.agencyId === a.id).length;
      const done = scoped.filter(
        (c) =>
          c.agencyId === a.id &&
          ["completed", "flight_bookings", "upload_visa"].includes(c.currentStage)
      ).length;
      return { name: a.name.split(" ")[0], success: total ? Math.round((done / total) * 100) : a.successRate };
    });
  }, [agencies, scoped]);

  return (
    <div className="page">
      <div>
        <h1 className="page-title">
          {isAgency ? "Agency Dashboard" : isPro ? "PRO Dashboard" : "Dashboard"}
        </h1>
        <p className="page-subtitle">
          {isAgency
            ? "Offer letters from RM and pre-approved MOL tasks for your agency."
            : isPro
              ? "Your Stage 1 & Stage 2 MOL / Nawakis workload."
              : "Recruitment pipeline overview for Cleanco manpower operations."}
        </p>
      </div>

      <div className="page-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="min-w-0"
            >
              <Card className="h-full">
                <CardContent className="flex h-full items-center gap-3 p-4 sm:gap-4 sm:p-5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card shadow-neo-xs ${k.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-2xl font-bold tracking-tight leading-none mt-1">{k.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="page-grid grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Visa Issued</CardTitle>
            <CardDescription>Trend of successful visa issuances</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyVisa}>
                <defs>
                  <linearGradient id="visaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4b5563" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#4b5563" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="issued" stroke="#4b5563" fill="url(#visaFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Country Distribution</CardTitle>
            <CardDescription>Candidate nationality mix</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={countryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {countryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline Analytics</CardTitle>
            <CardDescription>Candidates by current stage</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6b7280" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agency Performance</CardTitle>
            <CardDescription>Success rate %</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agencyPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="success" fill="#9ca3af" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest pipeline events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activities.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-[20px] bg-card px-4 py-3 shadow-neo-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {a.actor} {a.action}
                    {a.candidateName ? ` — ${a.candidateName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.timestamp)}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {a.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
