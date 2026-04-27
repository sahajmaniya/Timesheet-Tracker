"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PreviewCardProps = {
  lightSrc: string;
  darkSrc: string;
  lightAlt: string;
  darkAlt: string;
  title: string;
  description: string;
};

export function PreviewCard({
  lightSrc,
  darkSrc,
  lightAlt,
  darkAlt,
  title,
  description,
}: PreviewCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article className="h-fit rounded-2xl border border-border/70 bg-card p-4 transition-all duration-300 hover:border-cyan-300/45 hover:shadow-[0_24px_36px_-30px_rgba(8,47,73,0.7)] motion-reduce:transition-none motion-reduce:hover:shadow-none">
        <button
          type="button"
          className="group relative block w-full overflow-hidden rounded-xl border border-border/70 bg-slate-950/40 text-left"
          onClick={() => setOpen(true)}
          aria-label={`Open ${title} preview`}
        >
          <div className="relative aspect-[3/2]">
            <Image
              src={lightSrc}
              alt={lightAlt}
              width={1200}
              height={630}
              className="h-full w-full object-cover dark:hidden"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <Image
              src={darkSrc}
              alt={darkAlt}
              width={1200}
              height={630}
              className="hidden h-full w-full object-cover dark:block"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/85 px-2 py-1 text-[11px] font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Expand className="h-3 w-3" />
            Expand
          </span>
        </button>
        <p className="mt-3 text-base font-semibold tracking-tight">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl rounded-2xl border border-border/70 p-3 sm:p-4">
          <DialogHeader className="mb-2">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl border border-border/70">
            <Image
              src={lightSrc}
              alt={lightAlt}
              width={1800}
              height={1100}
              className="h-auto w-full dark:hidden"
              sizes="90vw"
            />
            <Image
              src={darkSrc}
              alt={darkAlt}
              width={1800}
              height={1100}
              className="hidden h-auto w-full dark:block"
              sizes="90vw"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
