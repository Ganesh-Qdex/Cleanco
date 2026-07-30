"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import { COUNTRIES } from "@/lib/workflow";
import { toast } from "sonner";

export default function AgenciesPage() {
  const agencies = useAppStore((s) => s.agencies);
  const addAgency = useAppStore((s) => s.addAgency);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "India",
    contactPerson: "",
    email: "",
    phone: "",
    status: "active" as const,
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Agencies
          </h1>
          <p className="page-subtitle">Recruitment agency partners and performance.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Agency
        </Button>
      </div>

      <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {agencies.map((a) => (
          <Card key={a.id} className="h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="min-w-0">
                <CardTitle className="text-base">{a.name}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{a.country}</p>
              </div>
              <Badge variant={a.status === "active" ? "success" : "muted"} className="shrink-0">{a.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Contact:</span> {a.contactPerson}</p>
              <p><span className="text-muted-foreground">Email:</span> {a.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {a.phone}</p>
              <div className="flex gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Candidates</p>
                  <p className="font-semibold">{a.candidatesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success</p>
                  <p className="font-semibold">{a.successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Agency</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input className="mt-1.5" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!form.name) return toast.error("Name required");
                addAgency(form);
                toast.success("Agency added");
                setOpen(false);
              }}
            >
              Save Agency
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
