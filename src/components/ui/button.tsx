import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:shadow-sm",
        destructive: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline: "rounded-xl border border-border/60 bg-background hover:bg-muted/30 hover:border-border text-foreground",
        secondary: "rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "rounded-xl hover:bg-muted/40 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        chip: "rounded-full bg-muted/30 text-foreground border border-border/30 hover:bg-muted/50 font-normal",
        chipActive: "rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 font-medium",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
        chip: "h-8 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
