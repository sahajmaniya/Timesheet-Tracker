"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Sparkles, Upload, User2 } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators";

type ProfileData = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export function ProfileSettingsForm({ initialProfile }: { initialProfile: ProfileData }) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const displayEmail = profile.email ? profile.email.replace(/\s+/g, "") : "No email";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile.name ?? "",
      image: "",
    },
  });

  const onSubmit = async (values: ProfileUpdateInput) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not update profile");
      return;
    }

    setProfile(body.profile);
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
      setProfile(body.profile);
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
    setProfile(body.profile);
    toast.success("Profile photo removed");
  };

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
            <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="border-b border-border/55 bg-gradient-to-b from-slate-100/85 via-background/70 to-slate-100/30 p-6 dark:from-slate-800/30 dark:to-slate-900/20 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={profile.name}
                  email={profile.email}
                  image={profile.image}
                  className="h-24 w-24 shrink-0 border-2"
                />
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-tight sm:text-2xl">{profile.name ?? "Student Assistant"}</p>
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
                    onChange={(e) => onUploadAvatar(e.target.files?.[0] ?? null)}
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
                        <span className="text-xs uppercase tracking-wider">Photo Upload</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use the upload button on the left panel to select an image from your computer.
                      </p>
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
    </div>
  );
}
