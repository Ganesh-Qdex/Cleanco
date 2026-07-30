"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Plus, Upload } from "lucide-react";
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
import { COUNTRIES, JOB_ROLES, getStageDefinition } from "@/lib/workflow";
import { daysBetween, formatDate, initials } from "@/lib/utils";
import type { Candidate } from "@/types";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Candidate>();

export default function CandidatesPage() {
  const candidates = useAppStore((s) => s.candidates);
  const agencies = useAppStore((s) => s.agencies);
  const vacancies = useAppStore((s) => s.vacancies);
  const addCandidate = useAppStore((s) => s.addCandidate);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);
  const globalSearch = useAppStore((s) => s.globalSearch);
  const filters = useAppStore((s) => s.filters);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    passportNumber: "",
    nationality: "India",
    jobRole: "Cleaner",
    vacancyId: "",
    agencyId: user?.agencyId || "agency-1",
    remarks: "",
  });

  const rows = useMemo(() => {
    return candidates.filter((c) => {
      if (user?.role === "agency" && user.agencyId && c.agencyId !== user.agencyId) return false;
      if (filters.nationality && c.nationality !== filters.nationality) return false;
      if (filters.agencyId && c.agencyId !== filters.agencyId) return false;
      if (filters.jobRole && c.jobRole !== filters.jobRole) return false;
      if (filters.stage && c.currentStage !== filters.stage) return false;
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const agency = agencies.find((a) => a.id === c.agencyId);
        const vacancy = vacancies.find((v) => v.id === c.vacancyId);
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.passportNumber.toLowerCase().includes(q) &&
          !(agency?.name.toLowerCase().includes(q)) &&
          !(vacancy?.companyName.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, user, filters, globalSearch, agencies, vacancies]);

  const columns = [
    columnHelper.accessor("name", {
      header: "Candidate",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={info.row.original.photoUrl} />
            <AvatarFallback className="text-xs">{initials(info.getValue())}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{info.getValue()}</p>
            <p className="text-xs text-muted-foreground">{info.row.original.passportNumber}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("nationality", { header: "Nationality" }),
    columnHelper.accessor("jobRole", { header: "Role" }),
    columnHelper.accessor("agencyId", {
      header: "Agency",
      cell: (info) => agencies.find((a) => a.id === info.getValue())?.name || "—",
    }),
    columnHelper.accessor("currentStage", {
      header: "Stage",
      cell: (info) => (
        <Badge variant="outline">{getStageDefinition(info.getValue())?.shortLabel}</Badge>
      ),
    }),
    columnHelper.accessor("stageEnteredAt", {
      header: "Days",
      cell: (info) => `${daysBetween(info.getValue())}d`,
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      cell: (info) => <Badge className="capitalize" variant="muted">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      cell: (info) => formatDate(info.getValue()),
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  const canUpload = user?.role === "agency" || user?.role === "admin";

  const submit = () => {
    if (!form.name || !form.passportNumber || !form.vacancyId) {
      toast.error("Name, passport, and vacancy are required");
      return;
    }
    const vacancy = vacancies.find((v) => v.id === form.vacancyId);
    const now = new Date().toISOString();
    addCandidate({
      name: form.name,
      passportNumber: form.passportNumber,
      nationality: form.nationality,
      jobRole: form.jobRole || vacancy?.jobRole || "Cleaner",
      vacancyId: form.vacancyId,
      agencyId: form.agencyId,
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.name)}`,
      currentStage: "cv_received",
      priority: vacancy?.priority || "medium",
      documents: [
        {
          id: `doc-cv-${Date.now()}`,
          type: "cv",
          name: `CV_${form.name.replace(/\s/g, "_")}.pdf`,
          url: "#cv",
          uploadedAt: now,
          uploadedBy: user?.name || "Agency",
        },
      ],
      remarks: form.remarks,
    });
    toast.success("Candidate uploaded — status: Basic Screening queue");
    setOpen(false);
    setForm({
      name: "",
      passportNumber: "",
      nationality: "India",
      jobRole: "Cleaner",
      vacancyId: "",
      agencyId: user?.agencyId || "agency-1",
      remarks: "",
    });
  };

  const assignedVacancies = vacancies.filter(
    (v) =>
      v.status === "open" &&
      (user?.role === "admin" || (user?.agencyId && v.agencyIds.includes(user.agencyId)))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
            Candidates
          </h1>
          <p className="mt-1 text-muted-foreground">
            {rows.length} candidates · click a row to open timeline drawer
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload Candidate
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidate Directory</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border/60 text-left text-muted-foreground">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-2 font-medium">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-border/40 hover:bg-muted/30"
                  onClick={() => setSelected(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Candidate</DialogTitle>
            <DialogDescription>
              Agency upload moves candidate to CV Received / Basic Screening.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Candidate Name</Label>
              <Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Passport Number</Label>
                <Input className="mt-1.5" value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} />
              </div>
              <div>
                <Label>Nationality</Label>
                <Select value={form.nationality} onValueChange={(v) => setForm({ ...form, nationality: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Assigned Vacancy</Label>
              <Select value={form.vacancyId} onValueChange={(v) => {
                const vac = vacancies.find((x) => x.id === v);
                setForm({ ...form, vacancyId: v, jobRole: vac?.jobRole || form.jobRole });
              }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select vacancy" /></SelectTrigger>
                <SelectContent>
                  {assignedVacancies.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.companyName} — {v.jobRole}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Job Role</Label>
              <Select value={form.jobRole} onValueChange={(v) => setForm({ ...form, jobRole: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-dashed border-border p-4 text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Mock document upload</p>
              <p className="text-xs text-muted-foreground">CV, Passport, Photo, Police Clearance</p>
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea className="mt-1.5" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>
            <Button className="w-full" onClick={submit}>Upload Candidate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
