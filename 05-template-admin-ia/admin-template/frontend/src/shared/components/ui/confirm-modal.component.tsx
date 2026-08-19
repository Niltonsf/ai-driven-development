"use client";

import type { ReactNode } from "react";
import { Modal } from "./modal.component";
import { Button } from "./button.component";

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "danger";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  loading,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content className="max-w-[480px] p-6 lg:p-8">
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
          {description ? <Modal.Description>{description}</Modal.Description> : null}
        </Modal.Header>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
