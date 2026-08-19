"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/shared/utils/cn";

const ActionPopoverRoot = PopoverPrimitive.Root;
const ActionPopoverTrigger = PopoverPrimitive.Trigger;
const ActionPopoverAnchor = PopoverPrimitive.Anchor;
const ActionPopoverClose = PopoverPrimitive.Close;

const ActionPopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, sideOffset = 8, align = "end", ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-[99999] w-56 rounded-2xl border border-ui-popover-border bg-ui-popover-bg p-2 shadow-ui-popover focus:outline-none",
        "data-[state=open]:animate-ui-overlay-in data-[state=closed]:animate-ui-overlay-out",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
ActionPopoverContent.displayName = "ActionPopoverContent";

export const ActionPopover = Object.assign(ActionPopoverRoot, {
  Trigger: ActionPopoverTrigger,
  Anchor: ActionPopoverAnchor,
  Content: ActionPopoverContent,
  Close: ActionPopoverClose,
});
