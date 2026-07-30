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
import { Plus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
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
import { JOB_ROLES, LOCATIONS } from "@/lib/workflow";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Priority, Vacancy } from "@/types";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Vacancy & { pending: number; remaining: number }>();

export default function VacanciesPage() {
  const vacancies = useAppStore((s) => s.vacancies);
  const candidates = useAppStore((s) => s.candidates);
  const agencies = useAppStore((s) => s.agencies);
  const addVacancy = useAppStore((s) => s.addVacancy);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  const rows = useMemo(() => {
    return vacancies
      .map((v) => {
        const pending = candidates.filter(
          (c) =>
            c.vacancyId === v.id &&
            !["completed", "rejected", "visa_shared_agency"].includes(c.currentStage)
        ).length;
        return {
          ...v,
          pending,
          remaining: Math.max(0, v.quantityRequired - v.filledCount),
        };
      })
      .filter((v) => {
        if (user?.role === "agency" && user.agencyId) {
          if (!v.agencyIds.includes(user.agencyId)) return false;
        }
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          v.companyName.toLowerCase().includes(q) ||
          v.jobRole.toLowerCase().includes(q)
        );
      });
  }, [vacancies, candidates, search, user]);

  const columns = [
    columnHelper.accessor("companyName", { header: "Company" }),
    columnHelper.accessor("jobRole", { header: "Role" }),
    columnHelper.accessor("location", {
      header: "Location",
      cell: (info) => LOCATIONS.find((l) => l.value === info.getValue())?.label || info.getValue(),
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
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const submit = () => {
    if (!form.companyName || !form.closingDate || form.agencyIds.length === 0) {
      toast.error("Fill company, closing date, and at least one agency");
      return;
    }
    addVacancy(form);
    toast.success("Vacancy created");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
            Vacancies
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manpower requisitions and agency assignments.
          </p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Vacancy
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open" value={vacancies.filter((v) => v.status === "open").length} />
        <Stat label="Filled" value={vacancies.filter((v) => v.status === "filled").length} />
        <Stat label="Closed" value={vacancies.filter((v) => v.status === "closed").length} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> All Vacancies
          </CardTitle>
          <Input
            className="max-w-xs"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-end gap-2">
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
                  onChange={(e) => setForm({ ...form, quantityRequired: Number(e.target.value) })}
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
                      className={`rounded-full border px-3 py-1 text-xs ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button className="w-full" onClick={submit}>
              Create Vacancy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
