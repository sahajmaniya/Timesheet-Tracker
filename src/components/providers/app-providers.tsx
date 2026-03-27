"use client";

import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/providers/confirm-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        <ConfirmProvider>
          {children}
          <Toaster
            richColors
            closeButton
            expand
            position="top-right"
            visibleToasts={5}
            toastOptions={{
              className:
                "rounded-xl border border-border/65 bg-gradient-to-br from-background via-background to-muted/20 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]",
              descriptionClassName: "text-muted-foreground",
              actionButtonStyle: {
                borderRadius: "0.65rem",
              },
              cancelButtonStyle: {
                borderRadius: "0.65rem",
              },
            }}
          />
        </ConfirmProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
