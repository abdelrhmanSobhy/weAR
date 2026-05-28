import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthPageLayout } from "../components/AuthPageLayout";
import signupImg from "@/assets/auth/signupstep1.webp";
import { authApi } from "../api/auth.api";

export default function RetailerSignupStep1Page() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await authApi.registerStep1({
        fullName,
        email,
        password,
        brandName,
      });

      if (response.success && response.data.isSuccess) {
        // نحتفظ بالـ TempStepToken ونبعته لصفحة الخطوة التانية
        const tempToken = response.data.data;
        navigate("/signup/retailer/step-2", { state: { tempToken } });
      } else {
        setErrorMsg(response.message || "Registration failed");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | Record<string, unknown>
          | undefined;
        setErrorMsg(
          (data?.message as string) || "Email or Brand Name already exists.",
        );
      } else if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg(String(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout imageSrc={signupImg} imageAlt="Step 1">
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <h1
            className="mb-2 text-[32px] font-bold text-[#A37E6B] md:text-[36px]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Sign-up
          </h1>
          <p className="text-[14px] text-[#B6A092]">
            Welcome to weAR
            <br />
            Create your account here! (Step 1/2)
          </p>
        </div>

        <form onSubmit={handleNext} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 text-[13px] text-red-600 bg-red-50 rounded-[12px] text-center">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#A37E6B]">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="h-[50px] w-full rounded-[14px] border border-[#E4DCD1] px-4 text-[14px] outline-none focus:border-[#C9A390]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#A37E6B]">
              Brand Name
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your Brand"
              className="h-[50px] w-full rounded-[14px] border border-[#E4DCD1] px-4 text-[14px] outline-none focus:border-[#C9A390]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#A37E6B]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-[50px] w-full rounded-[14px] border border-[#E4DCD1] px-4 text-[14px] outline-none focus:border-[#C9A390]"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#A37E6B]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-[50px] w-full rounded-[14px] border border-[#E4DCD1] px-4 text-[14px] outline-none focus:border-[#C9A390]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-[50px] w-full items-center justify-center rounded-[14px] bg-[#C9A390] text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-70"
          >
            {isLoading ? "Processing..." : "Next"}
          </button>

          <div className="mt-2 text-center text-[13px] text-[#B6A092]">
            Have an account?{" "}
            <Link
              to="/login/retailer"
              className="font-bold text-[#A37E6B] hover:underline"
            >
              Login ↗
            </Link>
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
}
