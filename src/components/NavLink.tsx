import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Enhanced NavLink that supports standard active/pending class props
 * while maintaining full compatibility with react-router-dom.
 */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        className={(state) =>
          cn(
            typeof className === "function" ? className(state) : className,
            state.isActive && "active",
            state.isPending && "pending"
          )
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";
