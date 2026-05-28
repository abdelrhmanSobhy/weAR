import { apiClient } from "../../../lib/axios";
import type { RetailerProfile } from "../useAuthStore";

// --- Interfaces ---
export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  retailerProfile: RetailerProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface AuthSuccessResponse {
  isSuccess: boolean;
  message: string;
  errors: string[];
  data: AuthResponseData;
}

export const authApi = {
  // 1. Email/Password Login
  login: async (credentials: Record<string, unknown>) => {
    const response = await apiClient.post<ApiResponse<AuthSuccessResponse>>(
      "/api/auth/login",
      credentials as unknown as object,
    );
    return response.data;
  },

  // 2. Google Login
  loginWithGoogle: async (googleIdToken: string) => {
    const response = await apiClient.post<ApiResponse<AuthSuccessResponse>>(
      "/api/auth/login/google",
      { googleIdToken },
    );
    return response.data;
  },

  // 3. Register Step 1 (Returns TempStepToken)
  registerStep1: async (data: Record<string, unknown>) => {
    const response = await apiClient.post<
      ApiResponse<{ isSuccess: boolean; data: string; message: string }>
    >("/api/auth/register/step1", data as unknown as object);
    return response.data;
  },

  // 4. Register Step 2 (FormData with Logo and TempStepToken)
  registerStep2: async (formData: FormData) => {
    const response = await apiClient.post<ApiResponse<AuthSuccessResponse>>(
      "/api/auth/register/step2",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  // 5. Logout
  logout: async () => {
    const response = await apiClient.post("/api/auth/logout");
    return response.data;
  },

  // 6. Forgot Password (Send OTP)
  forgotPassword: async (email: string) => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      "/api/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  // 7. Reset Password (Verify OTP)
  resetPassword: async (data: Record<string, unknown>) => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      "/api/auth/reset-password",
      data as unknown as object,
    );
    return response.data;
  },
};
