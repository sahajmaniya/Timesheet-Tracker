"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const supportFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  category: z.enum(["General", "Import", "Export", "Billing", "Bug"]),
  subject: z.string().trim().min(4, "Please add a short subject").max(120, "Subject is too long"),
  message: z.string().trim().min(20, "Please share a few more details").max(2500, "Message is too long"),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

const defaultValues: SupportFormValues = {
  name: "",
  email: "",
  category: "General",
  subject: "",
  message: "",
};

export function SupportQueryForm() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!res.ok) {
        toast.error(body.error || "Could not submit your query right now.");
        return;
      }

      toast.success(body.message || "Support query submitted successfully.");
      reset(defaultValues);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.8rem] border border-cyan-300/45 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(236,254,255,0.76)_55%,rgba(209,250,229,0.62)_100%)] p-5 shadow-[0_30px_70px_-45px_rgba(6,78,59,0.55)] backdrop-blur-xl dark:border-cyan-900/45 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9)_0%,rgba(10,27,44,0.86)_55%,rgba(6,78,59,0.4)_100%)] sm:p-7"
    >
      <div className="mb-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/45 bg-cyan-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.17em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/35 dark:text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          Support Form
        </p>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">The more details you add, the faster we can resolve it.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="support-name" className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Your Name</Label>
          <Input id="support-name" placeholder="Ex: Sahaj Maniya" className="placeholder:text-slate-500 dark:placeholder:text-slate-400" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-email" className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Best Reply Email</Label>
          <Input id="support-email" type="email" placeholder="Where we should send updates" className="placeholder:text-slate-500 dark:placeholder:text-slate-400" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-2">
          <Label htmlFor="support-category" className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Issue Type</Label>
          <select
            id="support-category"
            className="h-10 w-full rounded-xl border border-input/80 bg-background/80 px-3 text-sm text-slate-700 shadow-sm ring-offset-background transition-all focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 dark:text-slate-200"
            {...register("category")}
          >
            <option value="General">General</option>
            <option value="Import">Import</option>
            <option value="Export">Export</option>
            <option value="Billing">Billing</option>
            <option value="Bug">Bug</option>
          </select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-subject" className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Short Summary</Label>
          <Input id="support-subject" placeholder="Ex: ISA PDF exports wrong date block" className="placeholder:text-slate-500 dark:placeholder:text-slate-400" {...register("subject")} />
          {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="support-message" className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">What happened?</Label>
        <Textarea
          id="support-message"
          rows={7}
          placeholder="Please include: 1) your role (SA/ISA), 2) month/date involved, 3) expected result, 4) actual result/error text."
          className="min-h-[150px] rounded-xl border-input/80 bg-background/80 placeholder:text-slate-500 dark:placeholder:text-slate-400"
          {...register("message")}
        />
        <p className="text-[11px] text-slate-600 dark:text-slate-400">Tip: include one screenshot filename or exact error line to speed up diagnosis.</p>
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <div className="mt-5 flex justify-start">
        <Button type="submit" disabled={submitting} className="h-11 w-full sm:w-auto sm:min-w-[210px]">
          <SendHorizonal className="h-4 w-4" />
          {submitting ? "Sending Request..." : "Send Request"}
        </Button>
      </div>
    </form>
  );
}
