"use client";

import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { COUNTRIES, JOB_ROLES, getPipelineColumnsForRole } from "@/lib/workflow";
import { Button } from "@/components/ui/button";

export default function PipelinePage() {
  const agencies = useAppStore((s) => s.agencies);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const setSearch = useAppStore((s) => s.setSearch);
  const globalSearch = useAppStore((s) => s.globalSearch);
  const user = useAuthStore((s) => s.user);
  const isPro = user?.role === "pro";
  const columns = getPipelineColumnsForRole(user?.role || "admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
          {isPro ? "PRO Pipeline" : "Pipeline"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isPro
            ? "Stage 1 — Signed offer with docs · Stage 2 — Signed offers / Nawakis. Click a card for Create MOL, Download, Modify."
            : "Drag candidates across workflow stages. Click a card for full history and actions."}
        </p>
      </div>

      <Card>
        <CardContent
          className={`grid gap-3 p-4 md:grid-cols-2 ${isPro ? "xl:grid-cols-4" : "xl:grid-cols-6"}`}
        >
          <Input
            placeholder="Search pipeline..."
            value={globalSearch}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={filters.nationality || "all"}
            onValueChange={(v) => setFilters({ nationality: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nationalities</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.agencyId || "all"}
            onValueChange={(v) => setFilters({ agencyId: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Agency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agencies</SelectItem>
              {agencies.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isPro && (
            <Select
              value={filters.jobRole || "all"}
              onValueChange={(v) => setFilters({ jobRole: v === "all" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Job Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {JOB_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.stage || "all"}
            onValueChange={(v) => setFilters({ stage: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {columns.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.shortLabel}
                </SelectItem>
              ))}
              {!isPro && <SelectItem value="rejected">Rejected</SelectItem>}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                nationality: "",
                agencyId: "",
                jobRole: "",
                stage: "",
                priority: "",
                visaStatus: "",
                vacancyId: "",
                vacancyStatus: "",
              });
              setSearch("");
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      <PipelineBoard />
    </div>
  );
}
