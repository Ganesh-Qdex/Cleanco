import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-foreground shadow-neo-sm hover:opacity-95",
        secondary:
          "rounded-full bg-card text-foreground shadow-neo-sm hover:shadow-neo-xs",
        outline:
          "rounded-full bg-card text-foreground shadow-neo-sm hover:shadow-neo-xs",
        ghost:
          "rounded-full text-muted-foreground hover:text-foreground hover:shadow-neo-xs",
        destructive:
          "rounded-full bg-destructive text-white shadow-neo-sm hover:opacity-95",
        soft:
          "rounded-full bg-card text-foreground shadow-neo-sm hover:shadow-neo-xs",
        neo:
          "rounded-full bg-card text-foreground shadow-neo-sm hover:shadow-neo-xs active:shadow-neo-inset",
        inset:
          "rounded-full bg-card text-foreground shadow-neo-inset",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-7 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "neo",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
