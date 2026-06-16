import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import loginImg from "@/assets/customer/login.webp";
import googleIcon from "@/assets/auth/google.svg";
import { CustomerAuthLayout } from "@/features/customer/components/CustomerAuthLayout";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { normalizeCustomerApiError } from "@/features/customer/utils/customerErrors";
import {
  customerAuthApi,
  extractCustomerAuthData,
  getCustomerProfile,
} from "@/features/customer/api/customerAuth.api";

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const googleLoginConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const locationState = location.state as { message?: string } | null;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await customerAuthApi.login({
        email,
        password,
        rememberMe,
      });
      const authData = extractCustomerAuthData(response);

      if (authData?.accessToken && authData.refreshToken) {
        const profile = getCustomerProfile(authData, { email });

        login(
          profile,
          {
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
          },
          "customer",
        );
        navigate(CUSTOMER_ROUTES.home, { replace: true });
        return;
      }

      setErrorMsg(response.message || "Invalid customer credentials.");
    } catch (error: unknown) {
      setErrorMsg(
        normalizeCustomerApiError(error).message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthLayout imageSrc={loginImg} imageAlt="Customer Login">
      {/* Title */}
      <div className="mb-7 text-center">
        <h1 className="mb-2 font-['Playfair_Display'] text-[32px] font-normal text-[#954c2a]">
          Login
        </h1>
        <p className="text-[15px] leading-snug text-[#9c6b54]">
          Welcome back! Please log in to access
          <br />
          your account
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {locationState?.message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[13px] text-emerald-700">
            {locationState.message}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-600">
            {errorMsg}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-[#9c6b54]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email"
            className="h-13 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[15px] text-[#2F2925] outline-none transition-colors placeholder:text-[#c0a898] focus:border-[#954c2a]"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-[#9c6b54]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Password"
              className="h-13 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 pr-12 text-[15px] text-[#2F2925] outline-none transition-colors placeholder:text-[#c0a898] focus:border-[#954c2a]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c6b54] hover:text-[#954c2a]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-1.5 text-right">
            <Link
              to={CUSTOMER_ROUTES.forgotPassword}
              className="text-[13px] text-[#9c6b54] hover:text-[#954c2a] transition-colors"
            >
              Forget Password?
            </Link>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 text-[14px] text-[#9c6b54] cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded accent-[#954c2a]"
          />
          Remember me
        </label>

        {/* Login button */}
        <button
          type="submit"
          disabled={isLoading}
          className="h-13 w-full rounded-xl bg-[#9c6b54] text-[16px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Login"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e8ddd5]" />
          <span className="text-[13px] font-medium text-[#9c6b54]">OR</span>
          <div className="h-px flex-1 bg-[#e8ddd5]" />
        </div>

        {/* Google login */}
        <button
          type="button"
          disabled={!googleLoginConfigured}
          onClick={() =>
            setErrorMsg(
              "Customer Google login is blocked until runtime config and the deployed response contract are confirmed.",
            )
          }
          className="flex h-13 w-full items-center justify-center gap-3 rounded-xl border border-[#e8ddd5] bg-white text-[15px] font-medium text-[#2F2925] transition-colors hover:bg-[#fef7f0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={googleIcon} alt="Google" className="h-5 w-5" />
          Login with Google
        </button>
        {!googleLoginConfigured && (
          <p className="text-center text-[12px] text-[#9c6b54]">
            Customer Google login is pending confirmed runtime configuration.
          </p>
        )}

        {/* Sign up link */}
        <div className="mt-1 text-center text-[14px] text-[#9c6b54]">
          Don&apos;t have an account?{" "}
          <Link to={CUSTOMER_ROUTES.signup} className="font-semibold text-[#954c2a] hover:underline">
            Sign Up ↗
          </Link>
        </div>
      </form>
    </CustomerAuthLayout>
  );
}
