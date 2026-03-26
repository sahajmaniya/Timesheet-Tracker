"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function initialsFromName(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "User";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

export function UserAvatar({
  name,
  email,
  image,
  className,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = initialsFromName(name, email);
  const generated = useMemo(
    () =>
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        name || email || "User",
      )}&backgroundType=gradientLinear`,
    [name, email],
  );
  const source = image || generated;
  const showFallback = !source || failedSource === source;

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-full border bg-muted text-sm font-semibold text-foreground",
        className,
      )}
      role="img"
      aria-label={name || email || "User avatar"}
    >
      {!showFallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source}
          alt={name || email || "User avatar"}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(source)}
        />
      )}
      {showFallback && (
        <span className="relative z-10 text-xl tracking-wide">{initials}</span>
      )}
    </div>
  );
}
