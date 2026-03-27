"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signupSchema } from "@/lib/validators";
import type { SignupInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    void (async () => {
      const providers = await getProviders();
      setGoogleEnabled(Boolean(providers?.google));
    })();
  }, []);

  const onSubmit = async (values: SignupInput) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not create account");
      return;
    }

    toast.success("Account created. Please sign in and verify your code.");
    router.push(`/auth/signin?email=${encodeURIComponent(values.email)}`);
  };

  const onGoogleSignUp = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
    setGoogleLoading(false);
  };

  return (
    <Card className="w-full max-w-md border-0 bg-background/90 shadow-xl backdrop-blur">
      <CardHeader className="space-y-2">
        <div className="inline-flex w-fit items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          New Account
        </div>
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Set up your profile and start logging shifts in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        {googleEnabled && (
          <div className="mb-4 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              onClick={() => void onGoogleSignUp()}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.9H12z" />
                </svg>
              )}
              Sign up with Google
            </Button>
            <div className="relative text-center text-xs tracking-wide text-muted-foreground">
              <span className="relative z-10 bg-background px-2">Or create an account with email</span>
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <p className="text-xs text-muted-foreground">
            Use at least 8 characters, including uppercase, lowercase, and a number.
          </p>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" />Create account</>}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/auth/signin">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
