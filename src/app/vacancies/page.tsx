"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Plus, Upload, Users, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { COUNTRIES, JOB_ROLES, LOCATIONS, getStageDefinition } from "@/lib/workflow";
import { cn, daysBetween, formatCurrency, formatDate, initials } from "@/lib/utils";
import type { Priority, Vacancy, VacancyStatus } from "@/types";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Vacancy & { pending: number; remaining: number }>();

export default function VacanciesPage() {
  const vacancies = useAppStore((s) => s.vacancies);
  const candidates = useAppStore((s) => s.candidates);
  const agencies = useAppStore((s) => s.agencies);
  const addVacancy = useAppStore((s) => s.addVacancy);
  const addCandidate = useAppStore((s) => s.addCandidate);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);
  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VacancyStatus | "all">(
    user?.role === "agency" ? "open" : "all"
  );
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    jobRole: "Cleaner",
    quantityRequired: 10,
    salary: 1500,
    location: "DXB" as const,
    priority: "medium" as Priority,
    agencyIds: [] as string[],
    closingDate: "",
    status: "open" as const,
    createdBy: user?.email || "admin@cleanco.com",
  });

  const [candForm, setCandForm] = useState({
    name: "",
    passportNumber: "",
    nationality: "India",
    jobRole: "Cleaner",
    vacancyId: "",
    agencyId: user?.agencyId || "agency-1",
    remarks: "",
  });

  const scopedVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      if (user?.role === "agency" && user.agencyId) {
        return v.agencyIds.includes(user.agencyId);
      }
      return true;
    });
  }, [vacancies, user]);

  const statusCounts = useMemo(
    () => ({
      open: scopedVacancies.filter((v) => v.status === "open").length,
      filled: scopedVacancies.filter((v) => v.status === "filled").length,
      closed: scopedVacancies.filter((v) => v.status === "closed").length,
    }),
    [scopedVacancies]
  );

  const rows = useMemo(() => {
    return scopedVacancies
      .map((v) => {
        const pending = candidates.filter(
          (c) =>
            c.vacancyId === v.id &&
            !["completed", "rejected"].includes(c.currentStage)
        ).length;
        return {
          ...v,
          pending,
          remaining: Math.max(0, v.quantityRequired - v.filledCount),
        };
      })
      .filter((v) => {
        if (statusFilter !== "all" && v.status !== statusFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          v.companyName.toLowerCase().includes(q) ||
          v.jobRole.toLowerCase().includes(q)
        );
      });
  }, [scopedVacancies, candidates, search, statusFilter]);

  const selectedVacancy = selectedVacancyId
    ? vacancies.find((v) => v.id === selectedVacancyId)
    : null;

  const filteredCandidates = useMemo(() => {
    const vacancyIds =
      selectedVacancyId
        ? [selectedVacancyId]
        : rows.map((v) => v.id);

    return candidates
      .filter((c) => {
        if (user?.role === "agency" && user.agencyId && c.agencyId !== user.agencyId) {
          return false;
        }
        if (!vacancyIds.includes(c.vacancyId)) return false;
        if (!candidateSearch) return true;
        const q = candidateSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.passportNumber.toLowerCase().includes(q) ||
          c.nationality.toLowerCase().includes(q) ||
          c.jobRole.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [candidates, rows, selectedVacancyId, candidateSearch, user]);

  const toggleStatus = (status: VacancyStatus) => {
    setSelectedVacancyId(null);
    setStatusFilter((prev) => (prev === status ? "all" : status));
  };

  const canUpload = user?.role === "agency" || user?.role === "admin";
  const isAgency = user?.role === "agency";

  const canUploadToVacancy = (v: Vacancy) => {
    if (!canUpload) return false;
    if (v.status !== "open" || v.quantityRequired - v.filledCount <= 0) return false;
    if (isAgency && user?.agencyId) return v.agencyIds.includes(user.agencyId);
    return true;
  };

  const openUpload = (vacancyId?: string) => {
    const preferred =
      (vacancyId && vacancies.find((v) => v.id === vacancyId)) ||
      (selectedVacancyId && vacancies.find((v) => v.id === selectedVacancyId)) ||
      null;

    const vac =
      (preferred && canUploadToVacancy(preferred) ? preferred : null) ||
      scopedVacancies.find((v) => canUploadToVacancy(v));

    if (!vac) {
      toast.error("No unfilled vacancies available to upload candidates");
      return;
    }

    setCandForm({
      name: "",
      passportNumber: "",
      nationality: "India",
      jobRole: vac.jobRole || "Cleaner",
      vacancyId: vac.id,
      agencyId: user?.agencyId || vac.agencyIds[0] || "agency-1",
      remarks: "",
    });
    setUploadOpen(true);
  };

  const submitCandidate = () => {
    if (!candForm.name || !candForm.passportNumber || !candForm.vacancyId) {
      toast.error("Name, passport, and vacancy are required");
      return;
    }
    const vacancy = vacancies.find((v) => v.id === candForm.vacancyId);
    if (!vacancy || !canUploadToVacancy(vacancy)) {
      toast.error("You can only upload to unfilled open vacancies assigned to you");
      return;
    }
    const now = new Date().toISOString();
    addCandidate({
      name: candForm.name,
      passportNumber: candForm.passportNumber,
      nationality: candForm.nationality,
      jobRole: candForm.jobRole || vacancy.jobRole || "Cleaner",
      vacancyId: candForm.vacancyId,
      agencyId: isAgency && user?.agencyId ? user.agencyId : candForm.agencyId,
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candForm.name)}`,
      currentStage: "cv_received",
      priority: vacancy.priority || "medium",
      documents: [
        {
          id: `doc-cv-${Date.now()}`,
          type: "cv",
          name: `CV_${candForm.name.replace(/\s/g, "_")}.pdf`,
          url: "#cv",
          uploadedAt: now,
          uploadedBy: user?.name || "Agency",
        },
      ],
      remarks: candForm.remarks,
    });
    toast.success("Candidate uploaded to vacancy");
    setUploadOpen(false);
    setSelectedVacancyId(candForm.vacancyId);
    setStatusFilter("open");
  };

  const unfilledVacancies = scopedVacancies.filter((v) => canUploadToVacancy(v));

  const columns = [
    columnHelper.accessor("companyName", { header: "Company" }),
    columnHelper.accessor("jobRole", { header: "Role" }),
    columnHelper.accessor("location", {
      header: "Location",
      cell: (info) =>
        LOCATIONS.find((l) => l.value === info.getValue())?.label || info.getValue(),
    }),
    columnHelper.accessor("quantityRequired", { header: "Required" }),
    columnHelper.accessor("filledCount", { header: "Filled" }),
    columnHelper.accessor("remaining", { header: "Remaining" }),
    columnHelper.accessor("pending", { header: "Pending" }),
    columnHelper.accessor("salary", {
      header: "Salary",
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      cell: (info) => (
        <Badge
          variant={
            info.getValue() === "urgent"
              ? "destructive"
              : info.getValue() === "high"
                ? "warning"
                : "muted"
          }
          className="capitalize"
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge
          variant={
            info.getValue() === "open"
              ? "success"
              : info.getValue() === "filled"
                ? "default"
                : "muted"
          }
          className="capitalize"
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor("closingDate", {
      header: "Closing",
      cell: (info) => formatDate(info.getValue()),
    }),
    ...(canUpload
      ? [
          columnHelper.display({
            id: "actions",
            header: "Upload",
            cell: ({ row }) => {
              const v = row.original;
              const allowed = canUploadToVacancy(v);
              return (
                <Button
                  size="sm"
                  variant={allowed ? "default" : "outline"}
                  disabled={!allowed}
                  onClick={(e) => {
                    e.stopPropagation();
                    openUpload(v.id);
                  }}
                  title={
                    allowed
                      ? "Upload candidate to this vacancy"
                      : "Only unfilled open vacancies allow uploads"
                  }
                >
                  <Upload className="h-3.5 w-3.5" />
                  {allowed ? "Upload" : "Full"}
                </Button>
              );
            },
          }),
        ]
      : []),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const submitVacancy = () => {
    if (!form.companyName || !form.closingDate || form.agencyIds.length === 0) {
      toast.error("Fill company, closing date, and at least one agency");
      return;
    }
    addVacancy(form);
    toast.success("Vacancy created");
    setOpen(false);
  };

  const candidateFilterLabel = selectedVacancy
    ? `${selectedVacancy.companyName} — ${selectedVacancy.jobRole}`
    : statusFilter !== "all"
      ? `${statusFilter} vacancies`
      : "all vacancies";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vacancies</h1>
          <p className="page-subtitle">
            {isAgency
              ? "Upload candidates on unfilled open vacancies assigned to your agency."
              : "Click Open / Filled / Closed to filter. Agencies can upload on unfilled vacancies."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpload && (
            <Button variant="outline" onClick={() => openUpload()}>
              <Upload className="h-4 w-4" />
              Upload Candidate
            </Button>
          )}
          {user?.role === "admin" && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Vacancy
            </Button>
          )}
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Open"
          value={statusCounts.open}
          active={statusFilter === "open"}
          onClick={() => toggleStatus("open")}
        />
        <Stat
          label="Filled"
          value={statusCounts.filled}
          active={statusFilter === "filled"}
          onClick={() => toggleStatus("filled")}
        />
        <Stat
          label="Closed"
          value={statusCounts.closed}
          active={statusFilter === "closed"}
          onClick={() => toggleStatus("closed")}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            {statusFilter === "all"
              ? "All Vacancies"
              : `${statusFilter.charAt(0).toUpperCase()}${statusFilter.slice(1)} Vacancies`}
            <Badge variant="muted">{rows.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {statusFilter !== "all" && (
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("all")}>
                Show all
              </Button>
            )}
            <Input
              className="max-w-xs"
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-black/[0.06] text-left text-muted-foreground">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-2 font-medium">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const active = selectedVacancyId === row.original.id;
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "cursor-pointer border-b border-black/[0.04] hover:bg-muted/40",
                      active && "bg-muted shadow-neo-inset"
                    )}
                    onClick={() =>
                      setSelectedVacancyId((id) =>
                        id === row.original.id ? null : row.original.id
                      )
                    }
                    title="Click to filter candidates for this vacancy"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              Candidates
              <Badge variant="muted">{filteredCandidates.length}</Badge>
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing candidates for {candidateFilterLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(selectedVacancyId || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedVacancyId(null);
                  setStatusFilter("all");
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear filter
              </Button>
            )}
            <Input
              className="max-w-xs"
              placeholder="Search candidates..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
            />
            {canUpload && selectedVacancyId && selectedVacancy && canUploadToVacancy(selectedVacancy) && (
              <Button size="sm" onClick={() => openUpload(selectedVacancyId)}>
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredCandidates.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No candidates match this filter.
            </p>
          )}
          {filteredCandidates.slice(0, 50).map((c) => {
            const agency = agencies.find((a) => a.id === c.agencyId);
            const stage = getStageDefinition(c.currentStage);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className="flex w-full items-center gap-3 rounded-[22px] bg-card px-3 py-3 text-left shadow-neo-sm transition hover:shadow-neo-xs"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={c.photoUrl} />
                  <AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.passportNumber} · {c.nationality} · {agency?.name}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <Badge variant="outline">{stage?.shortLabel}</Badge>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {daysBetween(c.stageEnteredAt)}d in stage
                  </p>
                </div>
              </button>
            );
          })}
          {filteredCandidates.length > 50 && (
            <p className="pt-2 text-center text-xs text-muted-foreground">
              Showing 50 of {filteredCandidates.length} candidates
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Vacancy</DialogTitle>
            <DialogDescription>Manpower request from business unit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Company Name</Label>
              <Input
                className="mt-1.5"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>
            <div>
              <Label>Job Role</Label>
              <Select value={form.jobRole} onValueChange={(v) => setForm({ ...form, jobRole: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={form.quantityRequired}
                  onChange={(e) =>
                    setForm({ ...form, quantityRequired: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Salary (AED)</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Select
                  value={form.location}
                  onValueChange={(v) => setForm({ ...form, location: v as typeof form.location })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Closing Date</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={form.closingDate}
                onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Assign Agencies</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {agencies.map((a) => {
                  const selected = form.agencyIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          agencyIds: selected
                            ? form.agencyIds.filter((id) => id !== a.id)
                            : [...form.agencyIds, a.id],
                        })
                      }
                      className={`rounded-full px-3 py-1.5 text-xs transition-shadow ${
                        selected
                          ? "bg-card text-foreground shadow-neo-inset"
                          : "bg-card text-muted-foreground shadow-neo-xs"
                      }`}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button className="w-full" onClick={submitVacancy}>
              Create Vacancy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Candidate</DialogTitle>
            <DialogDescription>
              Upload to an unfilled open vacancy. Candidate starts at CV received.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Candidate Name</Label>
              <Input
                className="mt-1.5"
                value={candForm.name}
                onChange={(e) => setCandForm({ ...candForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Passport Number</Label>
                <Input
                  className="mt-1.5"
                  value={candForm.passportNumber}
                  onChange={(e) =>
                    setCandForm({ ...candForm, passportNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Nationality</Label>
                <Select
                  value={candForm.nationality}
                  onValueChange={(v) => setCandForm({ ...candForm, nationality: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Assigned Vacancy (unfilled only)</Label>
              <Select
                value={candForm.vacancyId}
                onValueChange={(v) => {
                  const vac = vacancies.find((x) => x.id === v);
                  setCandForm({
                    ...candForm,
                    vacancyId: v,
                    jobRole: vac?.jobRole || candForm.jobRole,
                  });
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select unfilled vacancy" />
                </SelectTrigger>
                <SelectContent>
                  {unfilledVacancies.length === 0 && (
                    <SelectItem value="none" disabled>
                      No unfilled vacancies
                    </SelectItem>
                  )}
                  {unfilledVacancies.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.companyName} — {v.jobRole} ({v.quantityRequired - v.filledCount} left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                className="mt-1.5"
                value={candForm.remarks}
                onChange={(e) => setCandForm({ ...candForm, remarks: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={submitCandidate}>
              Upload Candidate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 w-full text-left"
    >
      <div
        className={cn(
          "flex h-full min-h-[104px] w-full flex-col justify-between rounded-[24px] bg-card p-5 transition-shadow",
          active ? "shadow-neo-inset" : "shadow-neo hover:shadow-neo-sm"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={cn(
              "mt-1 h-2 w-2 shrink-0 rounded-full",
              label === "Open" && "bg-emerald-500",
              label === "Filled" && "bg-sky-500",
              label === "Closed" && "bg-zinc-400",
              active && "ring-2 ring-offset-2 ring-offset-card",
              active && label === "Open" && "ring-emerald-500/40",
              active && label === "Filled" && "ring-sky-500/40",
              active && label === "Closed" && "ring-zinc-400/40"
            )}
          />
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-3xl font-bold tracking-tight leading-none">{value}</p>
          <p className="pb-0.5 text-right text-[11px] leading-tight text-muted-foreground">
            {active ? "Filtering · clear" : "Click to filter"}
          </p>
        </div>
      </div>
    </button>
  );
}
