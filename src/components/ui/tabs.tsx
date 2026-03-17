"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextType = {
  value: string;
  setValue: (next: string) => void;
};

const TabsContext = React.createContext<TabsContextType | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-2xl border border-border/70 bg-muted/40 p-1 text-muted-foreground backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { value: current, setValue } = useTabsContext();
  const active = current === value;

  return (
    <button
      type="button"
      className={cn(
        "rounded-xl px-3 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-[0_6px_18px_-10px_rgba(15,23,42,0.55)]"
          : "hover:bg-background/70 hover:text-foreground",
        className,
      )}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { value: current } = useTabsContext();
  if (current !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
