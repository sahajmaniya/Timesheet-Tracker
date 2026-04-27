"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/validators";

const formSchema = resetPasswordSchema.extend({
  token: z.string().trim().min(20),
  confirmPassword: z.string().min(8, "Confirm your new password"),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type FormData = z.infer<typeof formSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: values.token,
        password: values.password,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (body?.code === "token_used") {
        toast.error("This reset link was already used. Request a new one.");
      } else if (body?.code === "token_expired") {
        toast.error("This reset link has expired. Request a new one.");
      } else {
        toast.error(body.error || "Could not reset password.");
      }
      return;
    }

    toast.success("Password reset. Please sign in.");
    router.push("/auth/signin");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md border-0 bg-background/90 shadow-xl backdrop-blur">
      <CardHeader className="space-y-2">
        <div className="inline-flex w-fit items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          Account Recovery
        </div>
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>Set a new password for your PunchPilot account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters, including uppercase, lowercase, and a number.
          </p>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Update password
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/auth/signin">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
