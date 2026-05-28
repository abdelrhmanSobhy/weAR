import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/notification.api";
import type { GetNotificationsParams } from "../types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  retailer: (retailerId: string) =>
    [...notificationKeys.all, retailerId] as const,
  list: (retailerId: string, params: GetNotificationsParams) =>
    [...notificationKeys.retailer(retailerId), "list", params] as const,
};

export const useNotifications = (
  retailerId: string,
  params: GetNotificationsParams,
) => {
  return useQuery({
    queryKey: notificationKeys.list(retailerId, params),
    queryFn: () => notificationApi.getNotifications(retailerId, params),
    enabled: !!retailerId,
    // Refetch periodically to simulate real-time updates
    refetchInterval: 30000, 
  });
};

export const useMarkNotificationRead = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(retailerId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.retailer(retailerId),
      });
    },
  });
};

export const useMarkAllNotificationsRead = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(retailerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.retailer(retailerId),
      });
    },
  });
};

export const useDeleteNotification = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(retailerId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.retailer(retailerId),
      });
    },
  });
};
