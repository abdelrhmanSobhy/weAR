import { apiClient } from "@/lib/axios";
import type {
  GetNotificationsParams,
  NotificationsResponse,
} from "../types/notification";
import type { ApiResponse } from "@/features/auth/api/auth.api";

export const notificationApi = {
  getNotifications: async (
    retailerId: string,
    params: GetNotificationsParams,
  ) => {
    const response = await apiClient.get<ApiResponse<NotificationsResponse>>(
      `/api/retailers/${retailerId}/notifications`,
      { params },
    );
    return response.data;
  },

  markAsRead: async (retailerId: string, id: string) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/notifications/${id}/read`,
    );
    return response.data;
  },

  markAllAsRead: async (retailerId: string) => {
    const response = await apiClient.put<ApiResponse<number>>(
      `/api/retailers/${retailerId}/notifications/read-all`,
    );
    return response.data;
  },

  deleteNotification: async (retailerId: string, id: string) => {
    const response = await apiClient.delete(
      `/api/retailers/${retailerId}/notifications/${id}`,
    );
    return response.data;
  },
};
