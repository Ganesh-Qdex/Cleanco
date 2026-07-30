"use client";

import { useMemo } from "react";
import {
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
import { useAppStore } from "@/stores/app-store";
import { daysBetween } from "@/lib/utils";

const COLORS = ["#4b5563", "#6b7280", "#9ca3af", "#374151", "#d1d5db", "#1f2937"];

export default function ReportsPage() {
  const candidates = useAppStore((s) => s.candidates);
  const agencies = useAppStore((s) => s.agencies);
  const vacancies = useAppStore((s) => s.vacancies);

  const stats = useMemo(() => {
    const completed = candidates.filter((c) =>
      ["completed", "flight_bookings", "upload_visa"].includes(c.currentStage)
    ).length;
    const successRate = candidates.length
      ? Math.round((completed / candidates.length) * 100)
      : 0;
    const avgDays =
      candidates.length === 0
        ? 0
        : Math.round(
            candidates.reduce((a, c) => a + daysBetween(c.createdAt, c.updatedAt), 0) /
              candidates.length
          );
    const paymentPending = candidates.filter(
      (c) =>
        c.mohrePayment?.status === "pending" ||
        c.mohrePayment?.status === "delayed" ||
        c.icpPayment?.status === "pending"
    ).length;
    const govPending = candidates.filter((c) =>
      [
        "upload_preapproved_mol",
        "stage2_signed_nawakis",
        "mohre_approved",
        "upload_visa",
      ].includes(c.currentStage)
    ).length;

    const rejectionReasons: Record<string, number> = {};
    candidates.forEach((c) => {
      const reason = c.mohreRejectionReason || c.icpRejectionReason;
      if (reason) rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
    });

    const country = Object.entries(
      candidates.reduce<Record<string, number>>((acc, c) => {
        acc[c.nationality] = (acc[c.nationality] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    const agencyPerf = agencies.map((a) => {
      const total = candidates.filter((c) => c.agencyId === a.id).length;
      const done = candidates.filter(
        (c) =>
          c.agencyId === a.id &&
          ["completed", "flight_bookings", "upload_visa"].includes(c.currentStage)
      ).length;
      return {
        name: a.name.split(" ").slice(0, 2).join(" "),
        rate: total ? Math.round((done / total) * 100) : 0,
        total,
      };
    });

    const fulfillment = vacancies.map((v) => ({
      name: v.jobRole,
      filled: v.filledCount,
      required: v.quantityRequired,
      pct: Math.round((v.filledCount / v.quantityRequired) * 100),
    }));

    return {
      successRate,
      avgDays,
      paymentPending,
      govPending,
      rejectionData: Object.entries(rejectionReasons).map(([name, value]) => ({ name, value })),
      country,
      agencyPerf,
      fulfillment: fulfillment.slice(0, 8),
    };
  }, [candidates, agencies, vacancies]);

  return (
    <div className="page">
      <div>
        <h1 className="page-title">
          Reports
        </h1>
        <p className="page-subtitle">
          Visa success, processing time, agency and government analytics.
        </p>
      </div>

      <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Visa Success Rate" value={`${stats.successRate}%`} />
        <Metric title="Avg Processing Time" value={`${stats.avgDays} days`} />
        <Metric title="Pending Gov Cases" value={String(stats.govPending)} />
        <Metric title="Payment Pending" value={String(stats.paymentPending)} />
      </div>

      <div className="page-grid grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rejection Analysis</CardTitle>
            <CardDescription>MOHRE / ICP rejection reasons</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rejectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Country Statistics</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.country} dataKey="value" nameKey="name" outerRadius={95}>
                  {stats.country.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agency Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.agencyPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rate" fill="#6b7280" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vacancy Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.fulfillment}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="filled" fill="#60a5fa" radius={[10, 10, 0, 0]} />
                <Bar dataKey="required" fill="#cbd5e1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
