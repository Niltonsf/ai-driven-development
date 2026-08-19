"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/shared/utils/cn";

const ActionMenuRoot = DropdownMenuPrimitive.Root;
const ActionMenuTrigger = DropdownMenuPrimitive.Trigger;
const ActionMenuGroup = DropdownMenuPrimitive.Group;

const ActionMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, align = "end", ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "z-[99999] min-w-[10rem] rounded-2xl border border-ui-popover-border bg-ui-popover-bg p-2 shadow-ui-popover focus:outline-none",
        "data-[state=open]:animate-ui-overlay-in data-[state=closed]:animate-ui-overlay-out",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
ActionMenuContent.displayName = "ActionMenuContent";

const ActionMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    danger?: boolean;
  }
>(({ className, danger, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition focus:outline-none",
      danger
        ? "text-ui-error-600 hover:bg-ui-error-50 focus:bg-ui-error-50"
        : "text-ui-menu-itemFg hover:bg-ui-menu-itemHoverBg hover:text-ui-menu-itemHoverFg focus:bg-ui-menu-itemHoverBg focus:text-ui-menu-itemHoverFg",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  />
));
ActionMenuItem.displayName = "ActionMenuItem";

const ActionMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-xs font-semibold text-ui-gray-500", className)}
    {...props}
  />
));
ActionMenuLabel.displayName = "ActionMenuLabel";

const ActionMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("my-1 h-px bg-ui-menu-separator", className)}
    {...props}
  />
));
ActionMenuSeparator.displayName = "ActionMenuSeparator";

export const ActionMenu = Object.assign(ActionMenuRoot, {
  Trigger: ActionMenuTrigger,
  Content: ActionMenuContent,
  Item: ActionMenuItem,
  Group: ActionMenuGroup,
  Label: ActionMenuLabel,
  Separator: ActionMenuSeparator,
});
