import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "../api/subscription.api";
import type {
  BillingCycle,
  DowngradeSubscriptionPayload,
  SelectSubscriptionPayload,
  UpgradeSubscriptionPayload,
} from "../types/subscription";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  plans: (billingCycle?: BillingCycle | string) =>
    [...subscriptionKeys.all, "plans", billingCycle || "all"] as const,
  retailer: (retailerId: string) =>
    [...subscriptionKeys.all, "retailer", retailerId] as const,
  current: (retailerId: string) =>
    [...subscriptionKeys.retailer(retailerId), "current"] as const,
  details: (retailerId: string) =>
    [...subscriptionKeys.retailer(retailerId), "details"] as const,
};

export const useSubscriptionPlans = (billingCycle?: BillingCycle | string) => {
  return useQuery({
    queryKey: subscriptionKeys.plans(billingCycle),
    queryFn: () => subscriptionApi.getPlans(billingCycle),
  });
};

export const useCurrentSubscription = (retailerId: string) => {
  return useQuery({
    queryKey: subscriptionKeys.current(retailerId),
    queryFn: () => subscriptionApi.getCurrentSubscription(retailerId),
    enabled: !!retailerId,
    retry: false,
  });
};

export const useCurrentSubscriptionDetails = (retailerId: string) => {
  return useQuery({
    queryKey: subscriptionKeys.details(retailerId),
    queryFn: () => subscriptionApi.getCurrentSubscriptionDetails(retailerId),
    enabled: !!retailerId,
    retry: false,
  });
};

const invalidateRetailerSubscription = (
  queryClient: ReturnType<typeof useQueryClient>,
  retailerId: string,
) => {
  queryClient.invalidateQueries({
    queryKey: subscriptionKeys.retailer(retailerId),
  });
};

export const useStartTrial = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionApi.startTrial(retailerId),
    onSuccess: () => invalidateRetailerSubscription(queryClient, retailerId),
  });
};

export const useSelectSubscriptionPlan = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SelectSubscriptionPayload) =>
      subscriptionApi.selectPlan(retailerId, payload),
    onSuccess: () => invalidateRetailerSubscription(queryClient, retailerId),
  });
};

export const useUpgradeSubscriptionPlan = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpgradeSubscriptionPayload) =>
      subscriptionApi.upgradePlan(retailerId, payload),
    onSuccess: () => invalidateRetailerSubscription(queryClient, retailerId),
  });
};

export const useDowngradeSubscriptionPlan = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DowngradeSubscriptionPayload) =>
      subscriptionApi.downgradePlan(retailerId, payload),
    onSuccess: () => invalidateRetailerSubscription(queryClient, retailerId),
  });
};

export const useCancelSubscription = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionApi.cancelSubscription(retailerId),
    onSuccess: () => invalidateRetailerSubscription(queryClient, retailerId),
  });
};

export const useToggleRecurringBilling = (retailerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionApi.toggleRecurring(retailerId),
    onSuccess: () => invalidateRetailerSubscription(queryClient, retailerId),
  });
};

export const useSubmitSaasEnquiry = (retailerId: string) => {
  return useMutation({
    mutationFn: () => subscriptionApi.submitSaasEnquiry(retailerId),
  });
};
