"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, MailCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

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

  useEffect(() => {
    void (async () => {
      const providers = await getProviders();
      setGoogleEnabled(Boolean(providers?.google));
    })();
  }, []);

  const requestOtp = async (values: RequestOtpData) => {
    const normalizedEmail = values.email.trim().toLowerCase();
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: values.password,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not send verification code");
        return;
      }

      setChallengeId(body.challengeId);
      setValue("otp", "");
      toast.success("Verification code sent to your email.");
      if (typeof body.devOtp === "string") {
        toast.message(`DEV OTP: ${body.devOtp}`);
      }
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

    const normalizedOtp = values.otp.replace(/\D/g, "").slice(0, 6);

    if (!/^\d{6}$/.test(normalizedOtp)) {
      toast.error("Enter a valid 6-digit verification code.");
      return;
    }

    try {
      const callbackUrl = params.get("callbackUrl") || "/dashboard";
      const result = await signIn("credentials", {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        otp: normalizedOtp,
        challengeId,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error(
          result.error === "CredentialsSignin"
            ? "Sign-in rejected (CredentialsSignin). Request a new code and retry."
            : `Sign-in failed (${result.error}). Request a new code and retry.`,
        );
        setChallengeId(null);
        setValue("otp", "");
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

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    const callbackUrl = params.get("callbackUrl") || "/dashboard";
    await signIn("google", { callbackUrl });
    setGoogleLoading(false);
  };

  return (
    <Card className="w-full max-w-md rounded-[1.35rem] border border-border/70 bg-background/90 shadow-none">
      <CardHeader className="space-y-2 pb-5">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-300/45 bg-cyan-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-900 dark:border-cyan-700/50 dark:bg-cyan-900/30 dark:text-cyan-100">
          <ShieldCheck className="h-3 w-3" />
          Secure Access
        </div>
        <CardTitle className="text-2xl font-black tracking-tight">Sign in</CardTitle>
        <CardDescription>
          {challengeId
            ? "Enter the 6-digit code we just sent to your email."
            : "Use your email and password. We will send a verification code to complete sign in."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {googleEnabled && (
          <div className="mb-4 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={() => void onGoogleSignIn()}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.9H12z" />
                </svg>
              )}
              Sign in with Google
            </Button>
            <div className="relative text-center text-xs tracking-wide text-muted-foreground">
              <span className="relative z-10 bg-background px-2">Or continue with email and verification code</span>
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" className="h-10 rounded-xl" disabled={Boolean(challengeId)} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link className="text-xs font-medium text-foreground underline-offset-4 hover:underline" href="/auth/forgot-password">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" className="h-10 rounded-xl" disabled={Boolean(challengeId)} {...register("password")} />
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
                className="h-10 rounded-xl"
                {...register("otp")}
              />
            </div>
          )}

          {!challengeId ? (
            <Button className="h-11 w-full rounded-xl" type="button" disabled={otpLoading} onClick={() => void requestOtp(getValues())}>
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><MailCheck className="mr-2 h-4 w-4" />Send verification code</>}
            </Button>
          ) : (
            <>
              <Button className="h-11 w-full rounded-xl" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" />Verify and sign in</>}
              </Button>
              <Button className="h-11 w-full rounded-xl" type="button" variant="outline" onClick={() => void onResendCode()}>
                Resend Code
              </Button>
              <Button
                className="h-11 w-full rounded-xl"
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
