import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import signupImg from "@/assets/customer/signup.webp";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { normalizeCustomerApiError } from "@/features/customer/utils/customerErrors";
import {
  customerAuthApi,
  extractCustomerAuthData,
  extractTempStepToken,
  getCustomerProfile,
  isSuccessfulResponse,
  type CustomerGender,
} from "@/features/customer/api/customerAuth.api";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

type SignupStep = 1 | 2;

export function CustomerSignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [step, setStep] = useState<SignupStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<CustomerGender>("Male");
  const [createAvatar, setCreateAvatar] = useState<boolean | null>(null);
  const [tempStepToken, setTempStepToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const response = await customerAuthApi.register({ fullName, email, password, phoneNumber });
      const nextTempToken = extractTempStepToken(response);
      if (nextTempToken) {
        setTempStepToken(nextTempToken);
        setStep(2);
        setMessage("Step 1 complete — finish your profile to get started.");
      } else {
        setErrorMsg(response.message || "Could not retrieve registration token.");
      }
    } catch (error: unknown) {
      setErrorMsg(normalizeCustomerApiError(error, "Registration failed. Please try again.").message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);
    if (!tempStepToken) {
      setErrorMsg("Session expired. Please restart registration.");
      setStep(1);
      return;
    }
    if (createAvatar === null) {
      setErrorMsg("Please choose whether to create an avatar now.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await customerAuthApi.completeProfile({ tempStepToken, age: Number(age), gender, createAvatar });
      const authData = extractCustomerAuthData(response);
      if (authData?.accessToken && authData?.refreshToken) {
        const profile = getCustomerProfile(authData, { fullName, email, phoneNumber, age: Number(age), gender, createAvatar });
        login(profile, { accessToken: authData.accessToken, refreshToken: authData.refreshToken }, "customer");
        navigate(CUSTOMER_ROUTES.home, { replace: true });
        return;
      }
      if (isSuccessfulResponse(response)) {
        navigate(CUSTOMER_ROUTES.login, { replace: true, state: { message: "Account created! You can sign in now." } });
        return;
      }
      setErrorMsg(response.message || "Could not complete profile.");
    } catch (error: unknown) {
      setErrorMsg(normalizeCustomerApiError(error, "Profile setup failed. Please try again.").message);
    } finally {
      setIsLoading(false);
    }
  };

  /* Shared input class */
  const inputCls = "h-13 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[15px] text-[#2F2925] outline-none transition-colors placeholder:text-[#c0a898] focus:border-[#954c2a]";
  const labelCls = "mb-1.5 block text-[14px] font-medium text-[#9c6b54]";

  return (
    <CustomerAuthLayout imageSrc={signupImg} imageAlt="Customer Signup">

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="mb-2 font-['Playfair_Display'] text-[32px] font-normal text-[#954c2a]">
          Sign Up
        </h1>
        <p className="text-[15px] leading-snug text-[#9c6b54]">
          Welcome to weAR — create your account
        </p>

        {/* Step indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold", step === 1 ? "bg-[#9c6b54] text-white" : "bg-[#e8ddd5] text-[#9c6b54]")}>1</span>
          <div className="h-px w-8 bg-[#e8ddd5]" />
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold", step === 2 ? "bg-[#9c6b54] text-white" : "bg-[#e8ddd5] text-[#9c6b54]")}>2</span>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-600">
          {errorMsg}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[13px] text-emerald-700">
          {message}
        </div>
      )}

      {/* ── Step 1: basic info ── */}
      {step === 1 && (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className={cn(inputCls, "pr-12")} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c6b54] hover:text-[#954c2a]" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter your phone number" className={inputCls} required />
          </div>

          <button type="submit" disabled={isLoading} className={cn("mt-2 h-13 w-full rounded-xl text-[16px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60", customerTheme.accentBg)}>
            {isLoading ? "Please wait…" : "Next →"}
          </button>

          <div className="text-center text-[14px] text-[#9c6b54]">
            Already have an account?{" "}
            <Link to={CUSTOMER_ROUTES.login} className="font-semibold text-[#954c2a] hover:underline">Login ↗</Link>
          </div>
        </form>
      )}

      {/* ── Step 2: profile details ── */}
      {step === 2 && (
        <form onSubmit={handleCompleteProfile} className="flex flex-col gap-5">
          <div>
            <label className={labelCls}>Age</label>
            <input type="number" min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Your age" className={inputCls} required />
          </div>

          <fieldset>
            <legend className={labelCls}>Gender</legend>
            <div className="mt-2 flex gap-4">
              {(["Male", "Female"] as CustomerGender[]).map((option) => (
                <label key={option} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-[14px] font-medium transition-colors", gender === option ? "border-[#9c6b54] bg-[#9c6b54] text-white" : "border-[#e8ddd5] text-[#6F625B] hover:border-[#9c6b54]")}>
                  <input type="radio" name="gender" value={option} checked={gender === option} onChange={() => setGender(option)} className="sr-only" />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelCls}>Create avatar now?</legend>
            <div className="mt-2 flex gap-4">
              {([["Yes", true], ["No, later", false]] as [string, boolean][]).map(([label, val]) => (
                <label key={label} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-[14px] font-medium transition-colors", createAvatar === val ? "border-[#9c6b54] bg-[#9c6b54] text-white" : "border-[#e8ddd5] text-[#6F625B] hover:border-[#9c6b54]")}>
                  <input type="radio" name="createAvatar" checked={createAvatar === val} onChange={() => setCreateAvatar(val)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)} className="flex h-13 flex-1 items-center justify-center rounded-xl border border-[#e8ddd5] text-[15px] font-medium text-[#9c6b54] hover:border-[#9c6b54] transition-colors">
              ← Back
            </button>
            <button type="submit" disabled={isLoading} className={cn("flex h-13 flex-1 items-center justify-center rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60", customerTheme.accentBg)}>
              {isLoading ? "Creating account…" : "Create Account"}
            </button>
          </div>
        </form>
      )}
    </CustomerAuthLayout>
  );
}
