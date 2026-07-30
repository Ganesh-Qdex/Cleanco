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
  const isAgency = user?.role === "agency";
  const columns = getPipelineColumnsForRole(user?.role || "admin");

  const title = isPro ? "PRO Pipeline" : isAgency ? "Agency Pipeline" : "Pipeline";
  const subtitle = isPro
    ? "Stage 1 — Signed offer with docs · Stage 2 — Signed offers / Nawakis."
    : isAgency
      ? "Offer letter from RM · Pre approved MOL offer letters. Download and upload signed documents."
      : "Drag candidates across workflow stages. Click a card for full history and actions.";

  const filterCols = isPro || isAgency ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-6";

  return (
    <div className="page">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <Card>
        <CardContent className={`grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 ${filterCols}`}>
          <Input
            placeholder="Search pipeline..."
            value={globalSearch}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 min-w-0"
          />
          <Select
            value={filters.nationality || "all"}
            onValueChange={(v) => setFilters({ nationality: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-11 w-full">
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
          {!isAgency && (
            <Select
              value={filters.agencyId || "all"}
              onValueChange={(v) => setFilters({ agencyId: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-11 w-full">
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
          )}
          {!isPro && !isAgency && (
            <Select
              value={filters.jobRole || "all"}
              onValueChange={(v) => setFilters({ jobRole: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-11 w-full">
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
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {columns.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.shortLabel}
                </SelectItem>
              ))}
              {!isPro && !isAgency && <SelectItem value="rejected">Rejected</SelectItem>}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-11 w-full"
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
