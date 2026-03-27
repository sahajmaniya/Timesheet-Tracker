"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmDialogOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmDialogOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? undefined : onCancel())}>
      <DialogContent className="max-w-md rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 p-5 sm:p-6">
        <DialogHeader className="pr-8">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <DialogTitle>{options?.title ?? "Are you sure?"}</DialogTitle>
          <DialogDescription>{options?.description ?? "Please confirm this action."}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            {options?.cancelText ?? "Cancel"}
          </Button>
          <Button
            variant={options?.destructive ? "destructive" : "default"}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {options?.confirmText ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

