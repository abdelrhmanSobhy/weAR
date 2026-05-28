import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { AuthPageLayout } from "../components/AuthPageLayout";
import signupImg2 from "@/assets/auth/signupstep2.webp";
import { authApi } from "../api/auth.api";

export default function RetailerSignupStep2Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginAction = useAuthStore((state) => state.login);

  const tempToken = location.state?.tempToken;

  const [businessType, setBusinessType] = useState("Fashion");
  const [has3DModels, setHas3DModels] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!tempToken) {
    navigate("/signup/retailer");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("TempStepToken", tempToken);
      formData.append("BusinessType", businessType);
      formData.append("Has3DModels", String(has3DModels));

      if (logoFile) {
        formData.append("BrandLogoFile", logoFile);
      }

      const response = await authApi.registerStep2(formData);

      if (response.success && response.data.isSuccess) {
        const { retailerProfile, accessToken, refreshToken } =
          response.data.data;

        loginAction(retailerProfile, { accessToken, refreshToken }, "retailer");

        navigate("/signup/retailer/pricing");
      } else {
        setErrorMsg(response.message || "Failed to complete registration.");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | Record<string, unknown>
          | undefined;
        setErrorMsg(
          (data?.message as string) || "An error occurred. Please try again.",
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
    <AuthPageLayout imageSrc={signupImg2} imageAlt="Step 2">
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <h1
            className="mb-2 text-[32px] font-bold text-[#A37E6B] md:text-[36px]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Almost there!
          </h1>
          <p className="text-[14px] text-[#B6A092]">
            Tell us a bit about your business (Step 2/2)
          </p>
        </div>

        <form onSubmit={handleComplete} className="flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 text-[13px] text-red-600 bg-red-50 rounded-[12px] text-center">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#A37E6B]">
              Business Type
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="h-[50px] w-full rounded-[14px] border border-[#E4DCD1] bg-white px-4 text-[14px] text-[#5C5550] outline-none focus:border-[#C9A390]"
            >
              <option value="Fashion">Fashion & Apparel</option>
              <option value="Accessories">Accessories</option>
              <option value="Sportswear">Sportswear</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#A37E6B]">
              Brand Logo (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[80px] w-full cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[#E4DCD1] bg-[#FEF9F2]/50 hover:bg-[#FEF9F2] transition-colors"
            >
              <ImagePlus size={24} className="text-[#C9A390] mb-1" />
              <span className="text-[12px] text-[#B6A092]">
                {logoFile ? logoFile.name : "Click to upload image (Max 2MB)"}
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg"
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-3 rounded-[14px] border border-[#E4DCD1] p-4">
            <input
              type="checkbox"
              checked={has3DModels}
              onChange={(e) => setHas3DModels(e.target.checked)}
              className="h-5 w-5 rounded text-[#C9A390] accent-[#C9A390]"
            />
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#5C5550]">
                I already have 3D Models
              </span>
              <span className="text-[12px] text-[#B6A092]">
                Check this if you have existing GLB/GLTF files
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-[50px] w-full items-center justify-center rounded-[14px] bg-[#C9A390] text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-70"
          >
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
