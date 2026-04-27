import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const isDateLike = type === "date" || type === "time" || type === "month";
  return (
    <input
      type={type}
      className={cn(
        "h-10 min-w-0 w-full max-w-full rounded-xl border border-input/80 bg-background/80 px-3 py-2 text-sm shadow-sm ring-offset-background transition-all placeholder:text-muted-foreground/90 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50",
        isDateLike && "pr-2 [-webkit-appearance:none] [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:min-w-0",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
