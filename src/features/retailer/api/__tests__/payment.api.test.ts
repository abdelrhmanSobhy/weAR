import { beforeEach, describe, expect, it, vi } from "vitest";
import { paymentApi } from "../payment.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("paymentApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists retailer payment methods", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await paymentApi.getPaymentMethods("retailer-1");

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/payment-methods",
    );
  });

  it("adds a tokenized payment method", async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, data: "pm-1" },
    });

    await paymentApi.addPaymentMethod("retailer-1", {
      providerType: "Visa",
      cardholderName: "Test User",
      cardNumberLast4: "4242",
      expiryDate: "12/30",
      stripePaymentMethodId: "pm_card_visa",
      isSaved: true,
      setAsDefault: true,
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/payment-methods",
      {
        providerType: "Visa",
        cardholderName: "Test User",
        cardNumberLast4: "4242",
        expiryDate: "12/30",
        stripePaymentMethodId: "pm_card_visa",
        isSaved: true,
        setAsDefault: true,
      },
    );
  });

  it("gets, deletes, and sets a default payment method", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, data: { id: "pm-1" } },
    });
    mockedApiClient.delete.mockResolvedValueOnce({ data: undefined });
    mockedApiClient.put.mockResolvedValueOnce({
      data: { success: true, data: true },
    });

    await paymentApi.getPaymentMethod("retailer-1", "pm-1");
    await paymentApi.deletePaymentMethod("retailer-1", "pm-1");
    await paymentApi.setDefaultPaymentMethod("retailer-1", "pm-1");

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/payment-methods/pm-1",
    );
    expect(mockedApiClient.delete).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/payment-methods/pm-1",
    );
    expect(mockedApiClient.put).toHaveBeenCalledWith(
      "/api/retailers/retailer-1/payment-methods/pm-1/default",
    );
  });
});
