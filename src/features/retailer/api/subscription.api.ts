import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  BillingCycle,
  CurrentSubscription,
  CurrentSubscriptionDetails,
  DowngradeSubscriptionPayload,
  SelectSubscriptionPayload,
  SubscriptionPlanGroup,
  TrialSubscription,
  UpgradeSubscriptionPayload,
} from "../types/subscription";

export const subscriptionApi = {
  getPlans: async (billingCycle?: BillingCycle | string) => {
    const response = await apiClient.get<ApiResponse<SubscriptionPlanGroup[]>>(
      "/api/subscription-plans",
      { params: billingCycle ? { billingCycle } : undefined },
    );
    return response.data;
  },

  startTrial: async (retailerId: string) => {
    const response = await apiClient.post<ApiResponse<TrialSubscription>>(
      `/api/retailers/${retailerId}/subscriptions/trial`,
    );
    return response.data;
  },

  selectPlan: async (
    retailerId: string,
    payload: SelectSubscriptionPayload,
  ) => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/subscriptions/select`,
      payload,
    );
    return response.data;
  },

  upgradePlan: async (
    retailerId: string,
    payload: UpgradeSubscriptionPayload,
  ) => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/subscriptions/upgrade`,
      payload,
    );
    return response.data;
  },

  downgradePlan: async (
    retailerId: string,
    payload: DowngradeSubscriptionPayload,
  ) => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/subscriptions/downgrade`,
      payload,
    );
    return response.data;
  },

  cancelSubscription: async (retailerId: string) => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/subscriptions/cancel`,
    );
    return response.data;
  },

  getCurrentSubscription: async (retailerId: string) => {
    const response = await apiClient.get<ApiResponse<CurrentSubscription>>(
      `/api/retailers/${retailerId}/subscription/current`,
    );
    return response.data;
  },

  getCurrentSubscriptionDetails: async (retailerId: string) => {
    const response = await apiClient.get<
      ApiResponse<CurrentSubscriptionDetails>
    >(`/api/retailers/${retailerId}/subscription/current/details`);
    return response.data;
  },

  toggleRecurring: async (retailerId: string) => {
    const response = await apiClient.patch<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/subscription/recurring`,
    );
    return response.data;
  },

  submitSaasEnquiry: async (retailerId: string) => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/subscriptions/saas-enquiry`,
    );
    return response.data;
  },
};
