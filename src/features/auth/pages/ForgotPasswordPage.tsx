import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { authApi } from "../api/auth.api";
import loginPageImage from "@/assets/auth/loginpage.webp";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sent, setSent] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [apiError, setApiError] = React.useState<string | null>(null);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setApiError(null);
    try {
      await authApi.forgotPassword(values.email);
      // API always returns 200 regardless of email existence (anti-enumeration)
      setSubmittedEmail(values.email);
      setSent(true);
    } catch {
      setApiError("Something went wrong. Please try again.");
    }
  };

  if (sent) {
    return (
      <AuthPageLayout imageSrc={loginPageImage} imageAlt="Forgot Password">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="rounded-full bg-[#f5ede8] p-5">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B6A092" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-[28px] font-bold text-[#B6A092]" style={{ fontFamily: '"PT Serif", serif' }}>
            Check your email
          </h2>
          <p className="max-w-[320px] text-[14px] text-[#9FA59D]">
            We sent a 6-digit OTP to <strong>{submittedEmail}</strong>. It expires in 15 minutes.
          </p>
          <button
            onClick={() => navigate("/reset-password", { state: { email: submittedEmail } })}
            className="h-[56px] w-full max-w-[320px] rounded-[18px] bg-[#B6A092] text-[16px] font-bold text-white hover:opacity-90 transition-opacity"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Enter OTP
          </button>
          <button
            onClick={() => navigate("/login/retailer")}
            className="text-[13px] text-[#B6A092] hover:underline"
          >
            ← Back to Login
          </button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout imageSrc={loginPageImage} imageAlt="Forgot Password">
      <header className="text-center mb-8">
        <h1
          className="text-[#B6A092]"
          style={{ fontFamily: '"PT Serif", serif', fontWeight: 700, fontSize: "42px", lineHeight: "100%" }}
        >
          Forgot Password
        </h1>
        <p className="mx-auto mt-3 max-w-[355px] text-center text-[#C9A390D9] text-[15px]" style={{ fontFamily: "Roboto, sans-serif", lineHeight: "130%" }}>
          Enter your email and we'll send you a one-time password to reset your account.
        </p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {apiError && (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 text-center">
            {apiError}
          </div>
        )}

        <div className="relative pb-6">
          <label className="mb-2 block text-[15px] text-[#949E96]" style={{ fontFamily: '"PT Serif", serif' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            {...form.register("email")}
            className={`h-[60px] w-full rounded-[18px] border ${
              form.formState.errors.email ? "border-red-400" : "border-[#CFC4BC]"
            } bg-white px-4 text-[16px] text-black outline-none placeholder:text-[#CFCFCF] focus:border-[#C9A390]`}
          />
          {form.formState.errors.email && (
            <p className="absolute bottom-1 left-2 text-[12px] text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-[60px] w-full rounded-[18px] bg-[#B6A092] text-[18px] text-white hover:opacity-95 font-bold disabled:cursor-not-allowed disabled:opacity-70 transition-opacity"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          {form.formState.isSubmitting ? "Sending..." : "Send OTP"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login/retailer")}
          className="text-center text-[14px] text-[#B6A092] hover:underline pt-2"
        >
          ← Back to Login
        </button>
      </form>
    </AuthPageLayout>
  );
}
