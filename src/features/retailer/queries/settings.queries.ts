import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api/settings.api";
import type {
  ChangePasswordPayload,
  UpdateNotificationPreferencesPayload,
  UpdateRetailerProfilePayload,
} from "../types/settings";

export const settingsKeys = {
  all: ["settings"] as const,
  retailer: (retailerId: string) => [...settingsKeys.all, retailerId] as const,
  profile: (retailerId: string) =>
    [...settingsKeys.retailer(retailerId), "profile"] as const,
  notifications: (retailerId: string) =>
    [...settingsKeys.retailer(retailerId), "notifications"] as const,
};

export const useRetailerProfileSettings = (retailerId: string) => {
  return useQuery({
    queryKey: settingsKeys.profile(retailerId),
    queryFn: () => settingsApi.getProfile(retailerId),
    enabled: !!retailerId,
  });
};

export const useUpdateRetailerProfileSettings = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRetailerProfilePayload) =>
      settingsApi.updateProfile(retailerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile(retailerId) });
    },
  });
};

export const useChangeRetailerPassword = (retailerId: string) => {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      settingsApi.changePassword(retailerId, payload),
  });
};

export const useNotificationPreferences = (retailerId: string) => {
  return useQuery({
    queryKey: settingsKeys.notifications(retailerId),
    queryFn: () => settingsApi.getNotifications(retailerId),
    enabled: !!retailerId,
  });
};

export const useUpdateNotificationPreferences = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferencesPayload) =>
      settingsApi.updateNotifications(retailerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.notifications(retailerId),
      });
    },
  });
};

export const useDeleteRetailerAccount = (retailerId: string) => {
  return useMutation({
    mutationFn: () => settingsApi.deleteAccount(retailerId),
  });
};
