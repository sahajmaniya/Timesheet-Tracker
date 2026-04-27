"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validators";
import type { ForgotPasswordInput } from "@/lib/validators";

const formSchema = forgotPasswordSchema.extend({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not send reset link.");
      return;
    }

    setSubmitted(true);
    if (typeof body.devResetUrl === "string") {
      setDevResetUrl(body.devResetUrl);
    }
    toast.success(body.message || "Check your email for reset instructions.");
  };

  return (
    <Card className="w-full max-w-md border-0 bg-background/90 shadow-xl backdrop-blur">
      <CardHeader className="space-y-2">
        <div className="inline-flex w-fit items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          Account Recovery
        </div>
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>Enter your account email and we will send a secure reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send reset link
              </>
            )}
          </Button>
        </form>

        {submitted ? (
          <p className="mt-4 text-sm text-muted-foreground">
            If your email exists, a reset link is on the way.
          </p>
        ) : null}

        {devResetUrl ? (
          <p className="mt-3 break-all rounded-md border bg-muted/35 p-2 text-xs text-muted-foreground">
            Dev reset link: <a className="underline" href={devResetUrl}>{devResetUrl}</a>
          </p>
        ) : null}

        <p className="mt-4 text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/auth/signin">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
