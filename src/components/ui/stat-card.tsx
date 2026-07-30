import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[100px] min-w-0 w-full flex-col justify-between rounded-[24px] bg-card p-5 shadow-neo",
        className
      )}
    >
      <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="truncate text-3xl font-bold leading-none tracking-tight">{value}</p>
        {hint ? (
          <p className="shrink-0 pb-0.5 text-[11px] leading-tight text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function StatsRow({
  columns = 3,
  children,
  className,
}: {
  columns?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
