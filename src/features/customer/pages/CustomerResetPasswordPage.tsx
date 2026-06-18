import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import loginImg from "@/assets/customer/login.webp";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { normalizeCustomerApiError } from "@/features/customer/utils/customerErrors";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  otpCode: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numbers only"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type ResetFormValues = z.infer<typeof resetSchema>;

export function CustomerResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? "";
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const form = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema), defaultValues: { email: emailFromState, otpCode: "", newPassword: "", confirmPassword: "" } });

  const onSubmit = async (values: ResetFormValues) => {
    setApiError(null);
    try {
      await customerAuthApi.resetPassword({ email: values.email, otpCode: values.otpCode, newPassword: values.newPassword });
      setSuccess(true);
    } catch (error) {
      setApiError(normalizeCustomerApiError(error).message);
    }
  };

  if (success) {
    return (
      <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer reset password">
        <div className="flex flex-col gap-5 text-center">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
            Your password was reset successfully. Please log in.
          </div>
          <button
            type="button"
            onClick={() => navigate(CUSTOMER_ROUTES.login, { replace: true, state: { message: "Password reset. Please log in." } })}
            className="h-13 w-full rounded-xl bg-[#9c6b54] text-[16px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Go to customer login
          </button>
        </div>
      </CustomerAuthLayout>
    );
  }

  return (
    <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer reset password">
      <div className="mb-7 text-center">
        <h1 className="mb-2 font-['Playfair_Display'] text-[32px] font-normal text-[#954c2a]">
          Reset Password
        </h1>
        <p className="text-[15px] leading-snug text-[#9c6b54]">
          Enter your email, OTP, and new password.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {apiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-600">
            {apiError}
          </div>
        )}
        <Field label="Email" error={form.formState.errors.email?.message}>
          <input
            type="email"
            placeholder="Enter your Email"
            {...form.register("email")}
            className="h-13 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[15px] text-[#2F2925] outline-none placeholder:text-[#c0a898] focus:border-[#954c2a]"
          />
        </Field>
        <Field label="OTP Code" error={form.formState.errors.otpCode?.message}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            {...form.register("otpCode")}
            className="h-13 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[18px] tracking-[0.25em] text-[#2F2925] outline-none placeholder:text-[#c0a898] placeholder:tracking-normal focus:border-[#954c2a]"
          />
        </Field>
        <PasswordField
          label="New Password"
          visible={showPassword}
          toggle={() => setShowPassword((v) => !v)}
          register={form.register("newPassword")}
          error={form.formState.errors.newPassword?.message}
        />
        <PasswordField
          label="Confirm Password"
          visible={showConfirm}
          toggle={() => setShowConfirm((v) => !v)}
          register={form.register("confirmPassword")}
          error={form.formState.errors.confirmPassword?.message}
        />
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-13 w-full rounded-xl bg-[#9c6b54] text-[16px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {form.formState.isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
        <Link
          to={CUSTOMER_ROUTES.forgotPassword}
          className="text-center text-[14px] font-medium text-[#954c2a] hover:underline"
        >
          Need a new OTP?
        </Link>
      </form>
    </CustomerAuthLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[14px] font-medium text-[#9c6b54]">{label}</label>
      {children}
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

function PasswordField({ label, visible, toggle, register, error }: { label: string; visible: boolean; toggle: () => void; register: UseFormRegisterReturn; error?: string }) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          placeholder={label}
          {...register}
          className="h-13 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 pr-12 text-[15px] text-[#2F2925] outline-none placeholder:text-[#c0a898] focus:border-[#954c2a]"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c6b54] hover:text-[#954c2a]"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}
