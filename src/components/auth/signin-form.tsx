"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof formSchema>;

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    const callbackUrl = params.get("callbackUrl") || "/dashboard";
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }

    toast.success("Welcome back");
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md border-0 bg-background/90 shadow-xl backdrop-blur">
      <CardHeader className="space-y-2">
        <div className="inline-flex w-fit items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          PunchPilot
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Continue tracking your hours and export monthly timesheets.</CardDescription>
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

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" />Sign in</>}
          </Button>
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
