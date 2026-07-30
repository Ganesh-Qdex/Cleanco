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
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-card text-xl font-bold text-foreground shadow-neo">
            C
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-foreground">
            Cleanco
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Pipeline Management System
          </p>
        </div>

        <Card>
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
              <Button type="submit" variant="default" className="w-full" size="lg">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 space-y-3">
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
                    className="flex w-full items-center gap-3 rounded-full bg-card px-3 py-3 text-left shadow-neo-sm transition hover:shadow-neo-xs"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-neo-xs">
                      <Icon className="h-4 w-4 text-foreground" />
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
