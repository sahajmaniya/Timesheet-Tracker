"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Sparkles, Upload, User2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { DAY_LABELS, weekdayKeys, type WeekdayKey, type WorkSchedule } from "@/lib/work-schedule";

type ProfileData = {
  name: string | null;
  email: string | null;
  image: string | null;
  signature: string | null;
  workSchedule: WorkSchedule;
};

export function ProfileSettingsForm({ initialProfile }: { initialProfile: ProfileData }) {
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
  const [activeScheduleDay, setActiveScheduleDay] = useState<WeekdayKey>("mon");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadImageRef = useRef<HTMLImageElement | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureDrawingRef = useRef(false);
  const signatureCtxReadyRef = useRef(false);
  const displayEmail = profile.email ? profile.email.replace(/\s+/g, "") : "No email";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile.name ?? "",
      image: "",
      workSchedule: profile.workSchedule,
    },
  });
  const watchedSchedule = watch("workSchedule");
  const DAY_SHORT_LABELS: Record<WeekdayKey, string> = {
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
  };

  const applyScheduleTemplate = (template: "typical_office" | "empty") => {
    if (template === "empty") {
      for (const day of weekdayKeys) {
        setValue(`workSchedule.${day}.enabled`, false);
      }
      toast.success("Cleared schedule template");
      return;
    }

    for (const day of weekdayKeys) {
      const isMonWed = day === "mon" || day === "wed";
      const isFri = day === "fri";
      const enabled = isMonWed || isFri;
      setValue(`workSchedule.${day}.enabled`, enabled);
      if (isMonWed) {
        setValue(`workSchedule.${day}.start`, "09:00");
        setValue(`workSchedule.${day}.end`, "17:00");
        setValue(`workSchedule.${day}.breakStart`, "12:30");
        setValue(`workSchedule.${day}.breakEnd`, "13:00");
      } else if (isFri) {
        setValue(`workSchedule.${day}.start`, "12:00");
        setValue(`workSchedule.${day}.end`, "17:00");
        setValue(`workSchedule.${day}.breakStart`, "14:30");
        setValue(`workSchedule.${day}.breakEnd`, "15:00");
      }
    }
    toast.success("Applied Mon/Wed/Fri template");
  };

  const onSubmit = async (values: ProfileUpdateInput) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, workSchedule: values.workSchedule }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not update profile");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      ...body.profile,
      workSchedule: body.profile?.workSchedule ?? prev.workSchedule,
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
        workSchedule: body.profile?.workSchedule ?? prev.workSchedule,
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
      workSchedule: body.profile?.workSchedule ?? prev.workSchedule,
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    signatureDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveSignatureStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!signatureDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endSignatureStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    signatureDrawingRef.current = false;
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
        workSchedule: body.profile?.workSchedule ?? prev.workSchedule,
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
        workSchedule: body.profile?.workSchedule ?? prev.workSchedule,
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
        <p className="mt-2 text-sm text-muted-foreground">Update how your account appears in the app.</p>
      </section>

      <Card className="overflow-hidden border-border/65 bg-gradient-to-br from-sky-200/45 via-background to-indigo-200/35 shadow-[0_22px_45px_-30px_rgba(59,130,246,0.25)] dark:from-sky-500/8 dark:to-indigo-500/6 dark:shadow-[0_22px_45px_-30px_rgba(59,130,246,0.45)]">
        <CardContent className="p-3 sm:p-4">
          <div className="overflow-hidden rounded-[1.15rem] border border-border/55 bg-gradient-to-br from-slate-100/70 via-background to-sky-100/45 dark:from-slate-900/35 dark:to-sky-950/25">
            <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="border-b border-border/55 bg-gradient-to-b from-slate-100/85 via-background/70 to-slate-100/30 p-6 dark:from-slate-800/30 dark:to-slate-900/20 xl:border-b-0 xl:border-r">
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
                    className="mt-1 block w-full overflow-hidden text-ellipsis [white-space:nowrap] text-sm leading-snug text-muted-foreground sm:text-base"
                    title={displayEmail}
                  >
                    {displayEmail}
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
                    className="whitespace-nowrap"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="ml-2">{uploading ? "Uploading..." : "Upload Photo"}</span>
                  </Button>
                  {profile.image && (
                    <Button type="button" variant="ghost" size="sm" className="whitespace-nowrap" onClick={removeAvatar}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              </div>

              <div className="bg-gradient-to-b from-background/95 via-background to-slate-100/40 dark:to-slate-900/10 p-6 sm:p-7">
                <CardHeader className="p-0">
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Edit your name and profile photo.</CardDescription>
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

                  <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Regular Shift Schedule</p>
                        <p className="text-xs text-muted-foreground">
                          Used by &quot;Apply Regular Shift&quot; in entry form. Configure times per weekday.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyScheduleTemplate("typical_office")}
                        >
                          Apply M/W/F Template
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => applyScheduleTemplate("empty")}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {weekdayKeys.map((day) => {
                        const dayConfig = watchedSchedule?.[day];
                        const active = activeScheduleDay === day;
                        const statusText = dayConfig?.enabled
                          ? `${dayConfig.start}-${dayConfig.end}`
                          : "Off";
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setActiveScheduleDay(day)}
                            className={`rounded-lg border px-2.5 py-2 text-left transition ${
                              active
                                ? "border-primary/45 bg-primary/10 text-foreground"
                                : "border-border/70 bg-background/60 text-muted-foreground hover:bg-accent/60"
                            }`}
                          >
                            <p className="text-xs font-semibold">{DAY_SHORT_LABELS[day]}</p>
                            <p className="truncate text-[10px]">{statusText}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-lg border border-border/60 bg-background/60 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{DAY_LABELS[activeScheduleDay]}</p>
                        <label className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-2 py-1 text-xs">
                          <input type="checkbox" {...register(`workSchedule.${activeScheduleDay}.enabled`)} />
                          Enabled
                        </label>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Start</Label>
                          <Input type="time" {...register(`workSchedule.${activeScheduleDay}.start`)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">End</Label>
                          <Input type="time" {...register(`workSchedule.${activeScheduleDay}.end`)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Break Start</Label>
                          <Input type="time" {...register(`workSchedule.${activeScheduleDay}.breakStart`)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Break End</Label>
                          <Input type="time" {...register(`workSchedule.${activeScheduleDay}.breakEnd`)} />
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Used by &quot;Apply Regular Shift&quot; in entry form. Configure times per weekday.
                    </p>

                    {errors.workSchedule && (
                      <p className="mt-2 text-xs text-destructive">
                        Please check your schedule times (end must be after start, break end after break start).
                      </p>
                    )}
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
            <div className="mx-auto h-[280px] w-[280px] overflow-hidden rounded-2xl border border-border bg-muted">
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
