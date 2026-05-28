import type { CurrentSubscription } from "../types/subscription";

type PlanLike = {
  id?: string;
  name?: string;
  tier?: string;
  billingCycle?: string;
  isWhiteLabel?: boolean;
};

type PricedPlanLike = PlanLike & {
  price?: number;
};

export const isSaasPlan = (plan?: PlanLike) => {
  const tier = plan?.tier?.toLowerCase() || "";
  const name = plan?.name?.toLowerCase() || "";

  return (
    !!plan?.isWhiteLabel ||
    plan?.billingCycle === "SaaS" ||
    tier.includes("saas") ||
    tier.includes("white") ||
    name.includes("saas") ||
    name.includes("white")
  );
};

export const getBackendPlanChangeAction = (
  selectedPlan: PricedPlanLike,
  current?: CurrentSubscription,
) => {
  if (!current?.subscriptionId) return "select" as const;
  if (selectedPlan.id && selectedPlan.id === current.currentPlan?.id) {
    return "current" as const;
  }

  const selectedPrice = Number(selectedPlan.price || 0);
  const activePrice = Number(current.currentPlan?.priceAmount || 0);

  // Backend lifecycle validation is price-based. For example, moving from
  // Standard Monthly ($150) to Basic Yearly ($500) must call UpgradePlan.
  return selectedPrice >= activePrice
    ? ("upgrade" as const)
    : ("downgrade" as const);
};
