import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-3 py-1 text-[10px] font-normal uppercase tracking-zara-wide transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-foreground/20 bg-transparent text-foreground hover:border-foreground/40",
        secondary: "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
        destructive: "border-destructive/30 bg-transparent text-destructive hover:border-destructive/50",
        outline: "border-border bg-background text-foreground hover:bg-muted/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
