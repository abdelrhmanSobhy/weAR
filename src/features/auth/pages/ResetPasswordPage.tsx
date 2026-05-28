import React from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { authApi } from "../api/auth.api";
import loginPageImage from "@/assets/auth/loginpage.webp";

const resetSchema = z
  .object({
    otpCode: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numbers only"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // If arrived without email, redirect back
  React.useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otpCode: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetFormValues) => {
    setApiError(null);
    try {
      const response = await authApi.resetPassword({
        email,
        otpCode: values.otpCode,
        newPassword: values.newPassword,
      });

      const resData = response.data as Record<string, unknown> | undefined;
      if (response.success && (resData?.isSuccess as boolean | undefined)) {
        setSuccess(true);
      } else {
        setApiError(
          response.message || "Failed to reset password. Please try again.",
        );
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | Record<string, unknown>
          | undefined;
        const code = data?.code as string | undefined;
        if (code === "INVALID_OTP") {
          setApiError("Invalid or expired OTP. Please request a new one.");
        } else {
          setApiError(
            (data?.message as string) ||
              "Something went wrong. Please try again.",
          );
        }
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError(String(error));
      }
    }
  };

  if (success) {
    return (
      <AuthPageLayout imageSrc={loginPageImage} imageAlt="Reset Password">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="rounded-full bg-[#f5ede8] p-5">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B6A092"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            className="text-[28px] font-bold text-[#B6A092]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Password Reset!
          </h2>
          <p className="max-w-[300px] text-[14px] text-[#9FA59D]">
            Your password has been updated. All existing sessions have been
            logged out. Please log in again.
          </p>
          <button
            onClick={() => navigate("/login/retailer")}
            className="h-[56px] w-full max-w-[320px] rounded-[18px] bg-[#B6A092] text-[16px] font-bold text-white hover:opacity-90 transition-opacity"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Go to Login
          </button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout imageSrc={loginPageImage} imageAlt="Reset Password">
      <header className="text-center mb-8">
        <h1
          className="text-[#B6A092]"
          style={{
            fontFamily: '"PT Serif", serif',
            fontWeight: 700,
            fontSize: "42px",
            lineHeight: "100%",
          }}
        >
          Reset Password
        </h1>
        <p
          className="mx-auto mt-3 max-w-[355px] text-center text-[#C9A390D9] text-[15px]"
          style={{ fontFamily: "Roboto, sans-serif" }}
        >
          Enter the 6-digit OTP sent to <strong>{email}</strong> and your new
          password.
        </p>
      </header>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-1"
      >
        {apiError && (
          <div className="mb-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 text-center">
            {apiError}
          </div>
        )}

        {/* OTP */}
        <div className="relative pb-6">
          <label
            className="mb-2 block text-[15px] text-[#949E96]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            OTP Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            {...form.register("otpCode")}
            className={`h-[60px] w-full rounded-[18px] border ${
              form.formState.errors.otpCode
                ? "border-red-400"
                : "border-[#CFC4BC]"
            } bg-white px-4 text-[20px] tracking-[0.3em] text-black outline-none placeholder:text-[#CFCFCF] placeholder:tracking-normal focus:border-[#C9A390]`}
          />
          {form.formState.errors.otpCode && (
            <p className="absolute bottom-1 left-2 text-[12px] text-red-500">
              {form.formState.errors.otpCode.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="relative pb-6">
          <label
            className="mb-2 block text-[15px] text-[#949E96]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              {...form.register("newPassword")}
              className={`h-[60px] w-full rounded-[18px] border ${
                form.formState.errors.newPassword
                  ? "border-red-400"
                  : "border-[#CFC4BC]"
              } bg-white px-4 pr-14 text-[16px] text-black outline-none placeholder:text-[#CFCFCF] focus:border-[#C9A390]`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9FA59D] hover:text-[#C9A390]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="absolute bottom-1 left-2 text-[12px] text-red-500">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative pb-6">
          <label
            className="mb-2 block text-[15px] text-[#949E96]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              {...form.register("confirmPassword")}
              className={`h-[60px] w-full rounded-[18px] border ${
                form.formState.errors.confirmPassword
                  ? "border-red-400"
                  : "border-[#CFC4BC]"
              } bg-white px-4 pr-14 text-[16px] text-black outline-none placeholder:text-[#CFCFCF] focus:border-[#C9A390]`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9FA59D] hover:text-[#C9A390]"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="absolute bottom-1 left-2 text-[12px] text-red-500">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-[60px] w-full rounded-[18px] bg-[#B6A092] text-[18px] text-white hover:opacity-95 font-bold disabled:cursor-not-allowed disabled:opacity-70 transition-opacity"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          {form.formState.isSubmitting ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-center text-[14px] text-[#B6A092] hover:underline pt-3"
        >
          ← Resend OTP
        </button>
      </form>
    </AuthPageLayout>
  );
}
