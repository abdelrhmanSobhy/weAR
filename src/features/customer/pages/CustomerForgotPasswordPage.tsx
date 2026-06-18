import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import loginImg from "@/assets/customer/login.webp";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { normalizeCustomerApiError } from "@/features/customer/utils/customerErrors";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function CustomerForgotPasswordPage() {
  const navigate = useNavigate();
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const form = useForm<ForgotFormValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  const onSubmit = async (values: ForgotFormValues) => {
    setApiError(null);
    try {
      await customerAuthApi.forgotPassword(values.email);
      setSubmittedEmail(values.email);
    } catch (error) {
      setApiError(normalizeCustomerApiError(error).message);
    }
  };

  return (
    <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer forgot password">
      <div className="mb-7 text-center">
        <h1 className="mb-2 font-['Playfair_Display'] text-[32px] font-normal text-[#954c2a]">
          Forgot Password
        </h1>
        <p className="text-[15px] leading-snug text-[#9c6b54]">
          Enter your email and we&apos;ll send a one-time password.
        </p>
      </div>

      {submittedEmail ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
            If this account exists, an OTP was sent to <strong>{submittedEmail}</strong>.
          </div>
          <button
            type="button"
            onClick={() => navigate(CUSTOMER_ROUTES.resetPassword, { state: { email: submittedEmail } })}
            className="h-13 w-full rounded-xl bg-[#9c6b54] text-[16px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Enter OTP
          </button>
          <Link
            to={CUSTOMER_ROUTES.login}
            className="text-[14px] font-medium text-[#954c2a] hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-600">
              {apiError}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-[#9c6b54]">Email</label>
            <input
              type="email"
              placeholder="Enter your Email"
              {...form.register("email")}
              className="h-13 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[15px] text-[#2F2925] outline-none placeholder:text-[#c0a898] focus:border-[#954c2a]"
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-13 w-full rounded-xl bg-[#9c6b54] text-[16px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {form.formState.isSubmitting ? "Sending..." : "Send OTP"}
          </button>
          <Link
            to={CUSTOMER_ROUTES.login}
            className="text-center text-[14px] font-medium text-[#954c2a] hover:underline"
          >
            Back to login
          </Link>
        </form>
      )}
    </CustomerAuthLayout>
  );
}
