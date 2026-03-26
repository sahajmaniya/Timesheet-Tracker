"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const requestOtpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RequestOtpData = z.infer<typeof requestOtpSchema>;
const signInFormSchema = requestOtpSchema.extend({
  otp: z.string(),
});

type SignInFormData = z.infer<typeof signInFormSchema>;

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: params.get("email") ?? "",
      password: "",
      otp: "",
    },
  });

  const requestOtp = async (values: RequestOtpData) => {
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not send verification code");
        return;
      }

      setChallengeId(body.challengeId);
      toast.success("Verification code sent to your email.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Could not reach server: ${error.message}`
          : "Could not reach server. Please try again.",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (values: SignInFormData) => {
    if (!challengeId) {
      await requestOtp(values);
      return;
    }

    if (!/^\d{6}$/.test(values.otp)) {
      toast.error("Enter a valid 6-digit verification code.");
      return;
    }

    try {
      const callbackUrl = params.get("callbackUrl") || "/dashboard";
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        otp: values.otp,
        challengeId,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error("Invalid verification code or expired session");
        return;
      }

      toast.success("Welcome back");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Sign-in failed: ${error.message}`
          : "Sign-in failed. Please try again.",
      );
    }
  };

  const onResendCode = async () => {
    const values = getValues();
    const parsed = requestOtpSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Check email/password first.");
      return;
    }
    await requestOtp(parsed.data);
  };

  return (
    <Card className="w-full max-w-md border-0 bg-background/90 shadow-xl backdrop-blur">
      <CardHeader className="space-y-2">
        <div className="inline-flex w-fit items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          PunchPilot
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          {challengeId
            ? "Enter the 6-digit code sent to your email to complete sign-in."
            : "Enter your email and password to request a one-time verification code."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {challengeId && (
            <div className="space-y-1">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                {...register("otp")}
              />
            </div>
          )}

          {!challengeId ? (
            <Button className="w-full" type="button" disabled={otpLoading} onClick={() => void requestOtp(getValues())}>
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><MailCheck className="mr-2 h-4 w-4" />Send OTP Code</>}
            </Button>
          ) : (
            <>
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" />Verify & Sign in</>}
              </Button>
              <Button className="w-full" type="button" variant="outline" onClick={() => void onResendCode()}>
                Resend Code
              </Button>
              <Button
                className="w-full"
                type="button"
                variant="ghost"
                onClick={() => {
                  setChallengeId(null);
                  setValue("otp", "");
                }}
              >
                Use different credentials
              </Button>
            </>
          )}
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/auth/signup">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
