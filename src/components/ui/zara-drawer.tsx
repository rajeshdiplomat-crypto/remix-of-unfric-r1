import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const ZaraDrawer = DialogPrimitive.Root;

const ZaraDrawerTrigger = DialogPrimitive.Trigger;

const ZaraDrawerClose = DialogPrimitive.Close;

const ZaraDrawerPortal = DialogPrimitive.Portal;

const ZaraDrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
ZaraDrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface ZaraDrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  onClose?: () => void;
}

const ZaraDrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ZaraDrawerContentProps
>(({ className, children, onClose, ...props }, ref) => (
  <ZaraDrawerPortal>
    <ZaraDrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 left-0 z-50 h-full w-[300px] bg-card shadow-xl",
        "data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left",
        "focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </ZaraDrawerPortal>
));
ZaraDrawerContent.displayName = DialogPrimitive.Content.displayName;

export {
  ZaraDrawer,
  ZaraDrawerTrigger,
  ZaraDrawerClose,
  ZaraDrawerContent,
  ZaraDrawerOverlay,
  ZaraDrawerPortal,
};
