import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 items-center justify-center rounded-full border-0 px-2.5 text-[11px] font-medium leading-none transition-shadow",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground shadow-neo-xs",
        secondary: "bg-card text-foreground shadow-neo-xs",
        success: "bg-card text-emerald-700 shadow-neo-xs dark:text-emerald-400",
        warning: "bg-card text-amber-700 shadow-neo-xs dark:text-amber-400",
        destructive: "bg-card text-red-600 shadow-neo-xs dark:text-red-400",
        outline: "bg-card text-foreground shadow-neo-xs",
        muted: "bg-card text-muted-foreground shadow-neo-inset",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
