"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const DEMO = [
  { email: "admin@cleanco.com", role: "Admin", icon: Shield },
  { email: "pro@cleanco.com", role: "PRO Team", icon: Building2 },
  { email: "agency@cleanco.com", role: "Agency", icon: Users },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@cleanco.com");
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = login(email);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Welcome to Cleanco Pipeline");
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#e2e8f0_0%,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.2)_0%,_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary text-xl font-bold text-white shadow-neo">
            C
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Cleanco
          </h1>
          <p className="mt-2 text-muted-foreground">Pipeline Management System</p>
        </div>

        <Card className="glass-panel border-white/30">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your Cleanco email. No password required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cleanco.com"
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quick access
              </p>
              {DEMO.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      const result = login(d.email);
                      if (result.success) {
                        toast.success(`Signed in as ${d.role}`);
                        router.push("/dashboard");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-3 py-2.5 text-left transition hover:bg-accent/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.role}</p>
                      <p className="text-xs text-muted-foreground">{d.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
