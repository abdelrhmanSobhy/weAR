import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  ChangePasswordPayload,
  NotificationPreferences,
  RetailerProfileSettings,
  UpdateNotificationPreferencesPayload,
  UpdateRetailerProfilePayload,
} from "../types/settings";

export const settingsApi = {
  getProfile: async (retailerId: string) => {
    const response = await apiClient.get<ApiResponse<RetailerProfileSettings>>(
      `/api/retailers/${retailerId}/profile`,
    );
    return response.data;
  },

  updateProfile: async (
    retailerId: string,
    payload: UpdateRetailerProfilePayload,
  ) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/profile`,
      payload,
    );
    return response.data;
  },

  changePassword: async (retailerId: string, payload: ChangePasswordPayload) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/profile/password`,
      payload,
    );
    return response.data;
  },

  uploadAvatar: async (retailerId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/profile/avatar`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  deleteAvatar: async (retailerId: string) => {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/profile/avatar`,
    );
    return response.data;
  },

  uploadBrandLogo: async (retailerId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/profile/brand-logo`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  deleteBrandLogo: async (retailerId: string) => {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/profile/brand-logo`,
    );
    return response.data;
  },

  getNotifications: async (retailerId: string) => {
    const response = await apiClient.get<ApiResponse<NotificationPreferences>>(
      `/api/retailers/${retailerId}/settings/notifications`,
    );
    return response.data;
  },

  updateNotifications: async (
    retailerId: string,
    payload: UpdateNotificationPreferencesPayload,
  ) => {
    const response = await apiClient.patch<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/settings/notifications`,
      payload,
    );
    return response.data;
  },

  deleteAccount: async (retailerId: string) => {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/account`,
    );
    return response.data;
  },
};
