"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Sparkles, Undo2, Upload, User2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PositionsManager } from "@/components/profile/positions-manager";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators";
import { weekdayKeys } from "@/lib/work-schedule";
import type { Position } from "@/types/position";

type ProfileData = {
  name: string | null;
  email: string | null;
  image: string | null;
  signature: string | null;
  monthlySummaryEmailEnabled: boolean;
};

export function ProfileSettingsForm({
  initialProfile,
  initialPositions,
}: {
  initialProfile: ProfileData;
  initialPositions: Position[];
}) {
  const { update } = useSession();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingImageFileName, setPendingImageFileName] = useState("avatar.jpg");
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [drawingSignature, setDrawingSignature] = useState(false);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadImageRef = useRef<HTMLImageElement | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureDrawingRef = useRef(false);
  const signatureCtxReadyRef = useRef(false);
  const signatureLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const signatureHistoryRef = useRef<ImageData[]>([]);
  const displayEmail = profile.email ? profile.email.replace(/\s+/g, "") : "No email";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile.name ?? "",
      image: "",
      monthlySummaryEmailEnabled: profile.monthlySummaryEmailEnabled,
    },
  });
  const scheduledDays = new Set(
    positions.flatMap((position) => weekdayKeys.filter((day) => position.workSchedule[day].enabled)),
  );
  const profileCompletionCount = [
    Boolean((watch("name") ?? "").trim().length >= 2),
    Boolean(profile.image),
    Boolean(profile.signature),
    positions.some((position) => position.hourlyRate > 0),
    scheduledDays.size > 0,
  ].filter(Boolean).length;

  const onSubmit = async (values: ProfileUpdateInput) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        monthlySummaryEmailEnabled: values.monthlySummaryEmailEnabled,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not update profile");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      ...body.profile,
    }));
    await update({
      name: body.profile?.name ?? values.name,
    });
    toast.success("Profile updated");
  };

  const onUploadAvatar = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not upload image");
        return;
      }
      setProfile((prev) => ({
        ...prev,
        ...body.profile,
      }));
      await update({
        name: body.profile?.name ?? profile.name ?? null,
      });
      toast.success("Profile photo updated");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendMonthlySummaryTestEmail = async () => {
    const res = await fetch("/api/monthly-summary/test", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not send test summary email");
      return;
    }
    toast.success("Monthly summary email sent", {
      description: body.month ? `Summary sent for ${body.month}` : undefined,
    });
  };

  const removeAvatar = async () => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name ?? "", image: "" }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not remove photo");
      return;
    }
    setProfile((prev) => ({
      ...prev,
      ...body.profile,
    }));
    await update({
      name: body.profile?.name ?? profile.name ?? null,
    });
    toast.success("Profile photo removed");
  };

  const closeImageEditor = () => {
    setEditingImage(false);
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    if (pendingImageUrl) {
      URL.revokeObjectURL(pendingImageUrl);
      setPendingImageUrl(null);
    }
  };

  const startImageEditor = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPendingImageUrl(objectUrl);
    setPendingImageFileName(file.name);
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    setEditingImage(true);
  };

  const buildEditedAvatarFile = async () => {
    const image = uploadImageRef.current;
    if (!image || !pendingImageUrl) return null;

    const previewSize = 280;
    const outputSize = 512;

    const naturalWidth = image.naturalWidth || previewSize;
    const naturalHeight = image.naturalHeight || previewSize;
    const coverScale = Math.max(previewSize / naturalWidth, previewSize / naturalHeight);
    const finalScale = coverScale * avatarZoom;
    const scaleRatio = outputSize / previewSize;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, outputSize, outputSize);
    ctx.translate(
      outputSize / 2 + avatarOffsetX * scaleRatio,
      outputSize / 2 + avatarOffsetY * scaleRatio,
    );
    ctx.scale(finalScale * scaleRatio, finalScale * scaleRatio);
    ctx.drawImage(image, -naturalWidth / 2, -naturalHeight / 2, naturalWidth, naturalHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.92);
    });
    if (!blob) return null;
    return new File([blob], `edited-${pendingImageFileName.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
    });
  };

  const applyEditedAvatar = async () => {
    const editedFile = await buildEditedAvatarFile();
    if (!editedFile) {
      toast.error("Could not prepare edited image.");
      return;
    }
    closeImageEditor();
    await onUploadAvatar(editedFile);
  };

  const initSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || signatureCtxReadyRef.current) return;

    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 560;
    const cssHeight = canvas.clientHeight || 170;
    canvas.width = Math.floor(cssWidth * ratio);
    canvas.height = Math.floor(cssHeight * ratio);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#0f172a";

    signatureCtxReadyRef.current = true;
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    signatureHistoryRef.current.push(snapshot);
    if (signatureHistoryRef.current.length > 30) signatureHistoryRef.current.shift();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const undoSignatureStroke = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const previous = signatureHistoryRef.current.pop();
    if (!previous) return;
    ctx.putImageData(previous, 0, 0);
  };

  const pointerPosition = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startSignatureStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPosition(event);
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    signatureHistoryRef.current.push(snapshot);
    if (signatureHistoryRef.current.length > 30) signatureHistoryRef.current.shift();
    signatureDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    ctx.beginPath();
    ctx.moveTo(x, y);
    signatureLastPointRef.current = { x, y };
  };

  const moveSignatureStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!signatureDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPosition(event);
    const last = signatureLastPointRef.current;
    if (!last) {
      signatureLastPointRef.current = { x, y };
      return;
    }
    const midX = (last.x + x) / 2;
    const midY = (last.y + y) / 2;
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();
    signatureLastPointRef.current = { x, y };
  };

  const endSignatureStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    signatureDrawingRef.current = false;
    signatureLastPointRef.current = null;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.closePath();
  };

  const saveDrawnSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      toast.error("Signature pad is not ready yet.");
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    if (!dataUrl || dataUrl.length < 200) {
      toast.error("Please draw your signature first.");
      return;
    }

    setDrawingSignature(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name ?? "", signature: dataUrl }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not save signature");
        return;
      }
      setProfile((prev) => ({
        ...prev,
        ...body.profile,
      }));
      toast.success("Signature saved");
    } finally {
      setDrawingSignature(false);
    }
  };

  const removeSignature = async () => {
    setDrawingSignature(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name ?? "", signature: "" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not remove signature");
        return;
      }
      setProfile((prev) => ({
        ...prev,
        ...body.profile,
      }));
      clearSignatureCanvas();
      toast.success("Signature removed");
    } finally {
      setDrawingSignature(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      initSignatureCanvas();
      if (!profile.signature) return;
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        const displayWidth = canvas.clientWidth || 560;
        const displayHeight = canvas.clientHeight || 170;
        clearSignatureCanvas();
        signatureHistoryRef.current = [];
        const ratio = Math.min(displayWidth / img.width, displayHeight / img.height);
        const drawW = img.width * ratio;
        const drawH = img.height * ratio;
        const x = (displayWidth - drawW) / 2;
        const y = (displayHeight - drawH) / 2;
        ctx.drawImage(img, x, y, drawW, drawH);
      };
      img.src = profile.signature;
    }, 60);
    return () => window.clearTimeout(timer);
  }, [profile.signature]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-gradient-to-br from-violet-100/70 via-background to-cyan-100/70 p-4 sm:p-6 dark:from-violet-950/30 dark:to-cyan-950/30">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
        <h1 className="mt-1 text-2xl font-bold">Profile & Preferences</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your jobs, profile, signature, and monthly recap.</p>
      </section>

      <PositionsManager positions={positions} onPositionsChange={setPositions} />

      <Card className="overflow-hidden border-border/65 bg-gradient-to-br from-sky-200/45 via-background to-indigo-200/35 shadow-[0_22px_45px_-30px_rgba(59,130,246,0.25)] dark:from-sky-500/8 dark:to-indigo-500/6 dark:shadow-[0_22px_45px_-30px_rgba(59,130,246,0.45)]">
        <CardContent className="p-2.5 sm:p-4">
          <div className="overflow-hidden rounded-[1.15rem] border border-border/55 bg-gradient-to-br from-slate-100/70 via-background to-sky-100/45 dark:from-slate-900/35 dark:to-sky-950/25">
            <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
              <div className="border-b border-border/55 bg-gradient-to-b from-slate-100/85 via-background/70 to-slate-100/30 p-5 sm:p-6 dark:from-slate-800/30 dark:to-slate-900/20 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={profile.name}
                  email={profile.email}
                  image={profile.image}
                  className="h-24 w-24 shrink-0 border-2"
                />
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-tight sm:text-2xl">{profile.name ?? "Timesheet User"}</p>
                  <p
                    className="mt-1 block w-full break-all text-sm leading-snug text-muted-foreground sm:truncate sm:break-normal sm:text-base"
                    title={displayEmail}
                  >
                    {displayEmail}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
                <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-800/90 dark:text-cyan-200/90">
                    Profile Completion
                  </p>
                  <p className="mt-1 text-lg font-bold text-cyan-900 dark:text-cyan-100">
                    {profileCompletionCount}/5 complete
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Complete profile, signature, position rates, and schedules for best workflow.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800/90 dark:text-emerald-200/90">
                    Positions
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {positions.length} position{positions.length === 1 ? "" : "s"} · {scheduledDays.size} day{scheduledDays.size === 1 ? "" : "s"} scheduled
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scheduled days drive quick entry helpers and the missing-shift check.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
                <p className="font-medium">Profile Image</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload a local image file (PNG/JPG/WebP), max 2MB.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => startImageEditor(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="max-w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="ml-2">{uploading ? "Uploading..." : "Upload Photo"}</span>
                  </Button>
                  {profile.image && (
                    <Button type="button" variant="ghost" size="sm" className="max-w-full" onClick={removeAvatar}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-violet-400/25 bg-violet-500/10 p-3 text-sm">
                <p className="font-semibold text-violet-900 dark:text-violet-100">Quick Tips</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Use profile signature once and reuse it in monthly PDF output.</li>
                  <li>Add each job you hold under Positions, with its own hourly rate.</li>
                  <li>Keep each position&apos;s schedule updated for faster daily entry creation.</li>
                </ul>
              </div>

              <div className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-800/90 dark:text-cyan-200/90">
                  Monthly Recap
                </p>
                <p className="mt-1 text-lg font-bold text-cyan-900 dark:text-cyan-100">
                  Email Summary
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Receive an automatic end-of-month summary with your total worked hours and gross pay estimate.
                </p>
                <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    {...register("monthlySummaryEmailEnabled")}
                  />
                  Send monthly recap to my email
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 h-9 w-full border-cyan-500/30 bg-background/80 text-cyan-900 hover:bg-cyan-500/10 dark:text-cyan-100"
                  onClick={() => void sendMonthlySummaryTestEmail()}
                >
                  Preview Monthly Recap Email
                </Button>
              </div>
              </div>

              <div className="bg-gradient-to-b from-background/95 via-background to-slate-100/40 p-5 sm:p-7 dark:to-slate-900/10">
                <CardHeader className="p-0">
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Edit your name and the signature used on your timesheet PDFs.</CardDescription>
                </CardHeader>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 rounded-xl border border-border/70 bg-card/70 p-4">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                        <User2 className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wider">Name</span>
                      </div>
                      <Label htmlFor="name" className="sr-only">Name</Label>
                      <Input id="name" {...register("name")} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1 rounded-xl border border-border/70 bg-card/70 p-4">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wider">Email</span>
                      </div>
                      <Input value={profile.email ?? ""} disabled />
                    </div>

                    <div className="space-y-1 rounded-xl border border-border/70 bg-card/70 p-4 sm:col-span-2">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wider">Draw Signature</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Draw once and we will use it in your generated timesheet PDFs.</p>
                      <div className="mt-3 rounded-xl border border-border/70 bg-background/70 p-3">
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-muted-foreground">Signature Pad</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={undoSignatureStroke}>
                              <Undo2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Undo
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={clearSignatureCanvas}>
                              Clear
                            </Button>
                            {profile.signature && (
                              <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => void removeSignature()} disabled={drawingSignature}>
                                Remove saved
                              </Button>
                            )}
                          </div>
                        </div>
                        <canvas
                          ref={signatureCanvasRef}
                          className="h-[140px] w-full touch-none rounded-lg border border-dashed border-slate-300 bg-white sm:h-[170px] dark:border-slate-500 dark:bg-white"
                          onPointerDown={startSignatureStroke}
                          onPointerMove={moveSignatureStroke}
                          onPointerUp={endSignatureStroke}
                          onPointerLeave={endSignatureStroke}
                          onPointerCancel={endSignatureStroke}
                          onMouseEnter={initSignatureCanvas}
                          onTouchStart={initSignatureCanvas}
                        />
                        <div className="mt-3 flex justify-end">
                          <Button type="button" size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => void saveDrawnSignature()} disabled={drawingSignature}>
                            {drawingSignature ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save signature"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editingImage} onOpenChange={(open) => (open ? setEditingImage(true) : closeImageEditor())}>
        <DialogContent className="max-w-lg p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>Edit Profile Photo</DialogTitle>
            <DialogDescription>Reposition and zoom your image before upload.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-border bg-muted">
              {pendingImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={uploadImageRef}
                  src={pendingImageUrl}
                  alt="Avatar preview"
                  className="h-full w-full select-none object-cover"
                  style={{
                    transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px) scale(${avatarZoom})`,
                    transformOrigin: "center",
                  }}
                  draggable={false}
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Zoom</Label>
                <Input
                  type="range"
                  min="1"
                  max="2.6"
                  step="0.01"
                  value={avatarZoom}
                  onChange={(e) => setAvatarZoom(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Move Left / Right</Label>
                <Input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarOffsetX}
                  onChange={(e) => setAvatarOffsetX(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Move Up / Down</Label>
                <Input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarOffsetY}
                  onChange={(e) => setAvatarOffsetY(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={closeImageEditor}>
              Cancel
            </Button>
            <Button type="button" onClick={applyEditedAvatar} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
