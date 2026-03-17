"use client";

import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
