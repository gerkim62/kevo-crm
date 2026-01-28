"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

const NewPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    mode: "onChange",
  });

  const password = watch("password");

  const onSubmit = async (data: NewPasswordFormData) => {
    try {
      setIsLoading(true);
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (error) {
        console.log(error);
        if (error.code === "INVALID_TOKEN")
          toast.error(
            "The reset token is invalid or has expired. Please request a new password reset.",
            {
              duration: 10000,
            }
          );
        else toast.error(error.message || "Failed to reset password");
      } else setIsSubmitted(true);
      setIsLoading(false);
      console.log("New password set successfully");
    } catch (error) {
      console.error("Error setting new password:", error);
      setIsLoading(false);
      // Handle error appropriately, e.g., show a toast notification
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-full bg-muted/20 flex items-center justify-center p-4">
        <div className="bg-background text-foreground rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Password updated!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. You can now sign in
              with your new password.
            </p>
            <Link
              href={"/"}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/20 flex items-center justify-center p-4">
      <div className="bg-background text-foreground rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create new password</h1>
          <p className="text-muted-foreground">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              New password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                id="password"
                className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.password
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
                placeholder="Enter new password"
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
              {errors.password && (
                <AlertCircle className="absolute right-10 top-3.5 h-5 w-5 text-destructive" />
              )}
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Confirm new password
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.confirmPassword
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
                placeholder="Confirm new password"
              />
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
              {errors.confirmPassword && (
                <AlertCircle className="absolute right-10 top-3.5 h-5 w-5 text-destructive" />
              )}
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {password && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">
                Password requirements:
              </p>
              <ul className="space-y-1 text-sm">
                <li
                  className={`flex items-center ${
                    password.length >= 8
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <CheckCircle
                    className={`w-4 h-4 mr-2 ${
                      password.length >= 8
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  At least 8 characters
                </li>
                <li
                  className={`flex items-center ${
                    /[A-Z]/.test(password)
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <CheckCircle
                    className={`w-4 h-4 mr-2 ${
                      /[A-Z]/.test(password)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  One uppercase letter
                </li>
                <li
                  className={`flex items-center ${
                    /[a-z]/.test(password)
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <CheckCircle
                    className={`w-4 h-4 mr-2 ${
                      /[a-z]/.test(password)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  One lowercase letter
                </li>
                <li
                  className={`flex items-center ${
                    /\d/.test(password)
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <CheckCircle
                    className={`w-4 h-4 mr-2 ${
                      /\d/.test(password)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  One number
                </li>
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              !isValid || isLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Updating password...
              </div>
            ) : (
              "Update password"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href={"/"}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewPasswordPage;
