"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/stores/app-store";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const candidates = useAppStore((s) => s.candidates);
  const setSelected = useAppStore((s) => s.setSelectedCandidate);

  const labour = useMemo(
    () => candidates.filter((c) => c.labourContractFee).map((c) => ({
      id: c.id,
      name: c.name,
      passport: c.passportNumber,
      ...c.labourContractFee!,
      type: "Labour Contract (50 AED)" as const,
    })),
    [candidates]
  );

  const mohre = useMemo(
    () => candidates.filter((c) => c.mohrePayment).map((c) => ({
      id: c.id,
      name: c.name,
      passport: c.passportNumber,
      ...c.mohrePayment!,
      type: "MOHRE (1800 AED)" as const,
      delayReason: c.mohrePayment?.delayReason,
    })),
    [candidates]
  );

  const icp = useMemo(
    () => candidates.filter((c) => c.icpPayment).map((c) => ({
      id: c.id,
      name: c.name,
      passport: c.passportNumber,
      ...c.icpPayment!,
      type: "ICP (800 AED)" as const,
    })),
    [candidates]
  );

  const totals = useMemo(() => {
    const sum = (list: { amount: number; status: string }[]) =>
      list.filter((x) => x.status === "paid").reduce((a, b) => a + b.amount, 0);
    const pendingCount =
      mohre.filter((x) => x.status !== "paid").length +
      icp.filter((x) => x.status !== "paid").length;
    return {
      labour: sum(labour),
      mohre: sum(mohre),
      icp: sum(icp),
      pendingCount,
    };
  }, [labour, mohre, icp]);

  return (
    <div className="page">
      <div>
        <h1 className="page-title">
          Payments
        </h1>
        <p className="page-subtitle">
          Government fee tracking — 50 / 1800 / 800 AED.
        </p>
      </div>

      <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Labour Fees Paid</p><p className="mt-1 text-2xl font-bold leading-none">{formatCurrency(totals.labour)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">MOHRE Fees Paid</p><p className="mt-1 text-2xl font-bold leading-none">{formatCurrency(totals.mohre)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">ICP Fees Paid</p><p className="mt-1 text-2xl font-bold leading-none">{formatCurrency(totals.icp)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Pending Payments</p><p className="mt-1 text-2xl font-bold leading-none">{totals.pendingCount}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="mohre" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="labour">Labour (50)</TabsTrigger>
          <TabsTrigger value="mohre">MOHRE (1800)</TabsTrigger>
          <TabsTrigger value="icp">ICP (800)</TabsTrigger>
        </TabsList>
        {[
          { key: "labour", rows: labour },
          { key: "mohre", rows: mohre },
          { key: "icp", rows: icp },
        ].map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tab.rows.slice(0, 60).map((r) => (
                  <button
                    key={`${r.id}-${r.type}`}
                    onClick={() => setSelected(r.id)}
                    className="flex w-full items-center justify-between rounded-[20px] bg-card px-4 py-3 text-left shadow-neo-sm transition hover:shadow-neo-xs"
                  >
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.passport} · {r.type}
                        {"receipt" in r && r.receipt ? ` · ${r.receipt}` : ""}
                        {r.date ? ` · ${formatDate(r.date)}` : ""}
                      </p>
                      {"delayReason" in r && r.delayReason && (
                        <p className="mt-1 text-xs text-amber-600">Delay: {String(r.delayReason)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(r.amount)}</p>
                      <Badge
                        variant={
                          r.status === "paid" ? "success" : r.status === "delayed" ? "warning" : "muted"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
