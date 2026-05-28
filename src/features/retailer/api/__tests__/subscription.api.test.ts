import { beforeEach, describe, expect, it, vi } from "vitest";
import { subscriptionApi } from "../subscription.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("subscriptionApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches subscription plans with a billingCycle filter", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await subscriptionApi.getPlans("Monthly");

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/subscription-plans",
      {
        params: { billingCycle: "Monthly" },
      },
    );
  });

  it("starts a retailer trial", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: { subscriptionId: "sub-1" } },
    });

    const result = await subscriptionApi.startTrial("retailer-1");

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/subscriptions/trial",
    );
    expect(result.data.subscriptionId).toBe("sub-1");
  });

  it("selects a subscription plan using a saved payment method", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: "sub-1" },
    });

    await subscriptionApi.selectPlan("retailer-1", {
      planId: "plan-1",
      paymentMethodId: "pm-1",
      billingCycle: "Yearly",
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/subscriptions/select",
      { planId: "plan-1", paymentMethodId: "pm-1", billingCycle: "Yearly" },
    );
  });

  it("calls lifecycle and billing endpoints", async () => {
    mockedApiClient.post.mockResolvedValue({
      data: { success: true, data: true },
    });
    mockedApiClient.patch.mockResolvedValue({
      data: { success: true, data: true },
    });

    await subscriptionApi.upgradePlan("retailer-1", {
      newPlanId: "plan-2",
      paymentMethodId: "pm-1",
    });
    await subscriptionApi.downgradePlan("retailer-1", { newPlanId: "plan-1" });
    await subscriptionApi.cancelSubscription("retailer-1");
    await subscriptionApi.toggleRecurring("retailer-1");
    await subscriptionApi.submitSaasEnquiry("retailer-1");

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/subscriptions/upgrade",
      { newPlanId: "plan-2", paymentMethodId: "pm-1" },
    );
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/subscriptions/downgrade",
      { newPlanId: "plan-1" },
    );
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/subscriptions/cancel",
    );
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/subscription/recurring",
    );
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/subscriptions/saas-enquiry",
    );
  });
});
