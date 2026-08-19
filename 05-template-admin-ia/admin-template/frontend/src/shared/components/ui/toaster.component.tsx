"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-2xl border border-ui-toast-border bg-ui-toast-bg shadow-ui-cardLg p-4 text-sm text-ui-toast-fg",
          title: "font-semibold text-ui-toast-fg",
          description: "text-ui-toast-fgMuted",
          actionButton:
            "bg-ui-brand-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-ui-brand-600",
          cancelButton:
            "bg-ui-gray-100 text-ui-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-ui-gray-200",
        },
      }}
    />
  );
}

type ToastBody = {
  description?: string;
  action?: { label: string; onClick: () => void };
};

export const showToast = {
  success: (message: string, body?: ToastBody) => sonnerToast.success(message, body),
  error: (message: string, body?: ToastBody) => sonnerToast.error(message, body),
  warning: (message: string, body?: ToastBody) => sonnerToast.warning(message, body),
  info: (message: string, body?: ToastBody) => sonnerToast.info(message, body),
  message: (message: string, body?: ToastBody) => sonnerToast(message, body),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
