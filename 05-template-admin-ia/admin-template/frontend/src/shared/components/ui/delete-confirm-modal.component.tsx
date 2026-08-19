"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "./modal.component";
import { Button } from "./button.component";
import { Input } from "./input.component";

export interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When provided, user must type this string to enable confirm. */
  typeToConfirm?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  title = "Delete",
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  typeToConfirm,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  const [typed, setTyped] = useState("");
  const canConfirm = typeToConfirm ? typed === typeToConfirm : true;
  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) setTyped("");
        onOpenChange(o);
      }}
    >
      <Modal.Content className="max-w-[480px] p-6 lg:p-8">
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
          {description ? <Modal.Description>{description}</Modal.Description> : null}
        </Modal.Header>
        {typeToConfirm ? (
          <div className="mt-4">
            <p className="mb-2 text-sm text-ui-gray-600">
              Type <span className="font-semibold text-ui-gray-800">{typeToConfirm}</span> to confirm.
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typeToConfirm}
            />
          </div>
        ) : null}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            loading={loading}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
