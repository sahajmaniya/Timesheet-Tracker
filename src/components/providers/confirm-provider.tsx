"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ConfirmDialog, type ConfirmDialogOptions } from "@/components/ui/confirm-dialog";

type ConfirmContextValue = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const closeWith = useCallback((value: boolean) => {
    setOpen(false);
    resolver?.(value);
    setResolver(null);
    setTimeout(() => setOptions(null), 150);
  }, [resolver]);

  const confirm = useCallback((nextOptions: ConfirmDialogOptions) => {
    setOptions(nextOptions);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={open}
        options={options}
        onConfirm={() => closeWith(true)}
        onCancel={() => closeWith(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}

