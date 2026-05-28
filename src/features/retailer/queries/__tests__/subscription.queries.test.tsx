import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  subscriptionKeys,
  useSubscriptionPlans,
} from "../subscription.queries";

describe("subscription queries", () => {
  it("creates stable query keys for plan catalogue and retailer subscription", () => {
    expect(subscriptionKeys.plans("Monthly")).toEqual([
      "subscriptions",
      "plans",
      "Monthly",
    ]);
    expect(subscriptionKeys.current("retailer-1")).toEqual([
      "subscriptions",
      "retailer",
      "retailer-1",
      "current",
    ]);
  });

  it("keeps the subscription plans query enabled for public pricing", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSubscriptionPlans("Yearly"), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("fetching");
  });
});
