"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth";
import { toast } from "sonner";

// Zod schema for email validation
const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);

      // Simulate API call
      const res = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/forgot-password/reset",
      });

      if (res.error) {
        console.error("Error sending reset password email:", res.error);
        toast.error(res.error.message || "Failed to send reset password email");

        return setIsLoading(false);
      }

      setIsLoading(false);
      setIsSubmitted(true);

      console.log("Reset password request for:", data.email);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-md border">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground mb-4">
              Check your email
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent password reset instructions to{" "}
              <span className="font-semibold text-foreground">
                {getValues("email")}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Didn't receive the email? Confirm that an account exists with
              this email or check your spam folder.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to reset form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-md border">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-card-foreground mb-2">
            Reset your password
          </h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you instructions to reset
            your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <input
                {...register("email")}
                type="email"
                id="email"
                className={`w-full px-4 py-3 pl-11 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring ${
                  errors.email
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-background hover:border-border/80"
                }`}
                placeholder="Enter your email"
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              {errors.email && (
                <AlertCircle className="absolute right-3 top-3.5 h-5 w-5 text-destructive" />
              )}
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              !isValid || isLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                Sending reset link...
              </div>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href={"/"}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
