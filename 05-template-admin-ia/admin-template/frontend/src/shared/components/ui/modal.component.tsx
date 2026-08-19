"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/shared/utils/cn";

const ModalRoot = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalPortal = DialogPrimitive.Portal;
const ModalClose = DialogPrimitive.Close;

const ModalOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[99999] bg-ui-modal-overlay backdrop-blur-[32px] data-[state=open]:animate-ui-overlay-in data-[state=closed]:animate-ui-overlay-out",
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = "ModalOverlay";

const ModalContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
    overlayClassName?: string;
  }
>(({ className, children, showClose = true, overlayClassName, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay className={overlayClassName} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[99999] w-full max-w-[700px] -translate-x-1/2 -translate-y-1/2",
        "no-scrollbar max-h-[90vh] overflow-y-auto rounded-3xl bg-ui-modal-bg p-4 shadow-ui-cardLg lg:p-11",
        "data-[state=open]:animate-ui-content-in data-[state=closed]:animate-ui-content-out",
        "focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      {showClose ? (
        <DialogPrimitive.Close
          aria-label="Close"
          className="transition-color absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-ui-modal-closeBg text-ui-modal-closeFg hover:bg-ui-modal-closeHoverBg hover:text-ui-modal-closeHoverFg focus:outline-none focus:ring-3 focus:ring-ui-brand-500/20"
        >
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6.04 16.54a.75.75 0 1 0 1.06 1.06L12 12.71l4.9 4.9a.75.75 0 1 0 1.06-1.07L13.06 11.65l4.9-4.9a.75.75 0 1 0-1.06-1.06l-4.9 4.9-4.9-4.9a.75.75 0 0 0-1.06 1.06l4.9 4.9-4.9 4.9z" />
          </svg>
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = "ModalContent";

function ModalHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-5 flex flex-col gap-1", className)} {...props} />
  );
}

const ModalTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold text-ui-gray-800", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-ui-gray-500", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm text-ui-gray-700", className)}
      {...props}
    />
  );
}

function ModalFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-6 flex items-center justify-end gap-3 border-t border-ui-card-border pt-5",
        className,
      )}
      {...props}
    />
  );
}

export type ModalProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;

export const Modal = Object.assign(ModalRoot, {
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
});

export type { ReactNode };
