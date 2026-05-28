import { describe, expect, it } from "vitest";
import {
  getBackendPlanChangeAction,
  isSaasPlan,
} from "../subscription-plan-change";
import type { CurrentSubscription } from "../../types/subscription";

const currentSubscription = {
  subscriptionId: "sub-1",
  currentPlan: {
    id: "standard-monthly",
    name: "Standard Monthly",
    tier: "Standard",
    billingCycle: "Monthly",
    priceAmount: 150,
    currency: "$",
    maxActiveProducts: 1000,
    maxMonthlyTryOns: 10000,
    supportLevel: "Priority",
    isActive: true,
    isWhiteLabel: false,
    includesSourceCode: false,
    includesMobileApps: false,
    hasSla: false,
    hasDedicatedTeam: false,
    isUnlimited: false,
  },
  status: 1,
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-02-01T00:00:00Z",
  isRecurringEnabled: true,
  isActive: true,
  isInTrial: false,
  canUpgrade: true,
  canDowngrade: true,
  canCancel: true,
  canStartTrial: false,
} satisfies CurrentSubscription;

describe("subscription plan change helpers", () => {
  it("uses upgrade for a higher-priced plan even when the tier name is lower", () => {
    expect(
      getBackendPlanChangeAction(
        { id: "basic-yearly", tier: "Basic", price: 500 },
        currentSubscription,
      ),
    ).toBe("upgrade");
  });

  it("uses downgrade for a lower-priced plan", () => {
    expect(
      getBackendPlanChangeAction(
        { id: "basic-monthly", tier: "Basic", price: 50 },
        currentSubscription,
      ),
    ).toBe("downgrade");
  });

  it("detects SaaS and white-label plans without relying only on billing cycle", () => {
    expect(isSaasPlan({ tier: "SaaS", price: 5000 })).toBe(true);
    expect(isSaasPlan({ name: "White Label", billingCycle: "Yearly" })).toBe(
      true,
    );
    expect(isSaasPlan({ tier: "Standard", billingCycle: "Monthly" })).toBe(
      false,
    );
  });
});
