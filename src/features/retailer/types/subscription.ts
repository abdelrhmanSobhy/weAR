export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp?: string;
  traceId?: string;
}

export type BillingCycle = "Monthly" | "Yearly" | "SaaS";

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  billingCycle: BillingCycle | string;
  priceAmount: number;
  currency: string;
  maxActiveProducts: number;
  maxMonthlyTryOns: number;
  supportLevel: string;
  isActive: boolean;
  isWhiteLabel: boolean;
  includesSourceCode: boolean;
  includesMobileApps: boolean;
  hasSla: boolean;
  hasDedicatedTeam: boolean;
  isUnlimited: boolean;
}

export interface SubscriptionPlanGroup {
  tier: string;
  plans: SubscriptionPlan[];
}

export interface CurrentSubscription {
  subscriptionId: string;
  status: number;
  startDate: string;
  endDate: string;
  trialEndsAt?: string | null;
  isRecurringEnabled: boolean;
  isActive: boolean;
  isInTrial: boolean;
  currentPlan: SubscriptionPlan;
  pendingDowngradePlan?: SubscriptionPlan | null;
  canUpgrade: boolean;
  canDowngrade: boolean;
  canCancel: boolean;
  canStartTrial: boolean;
}

export interface CurrentSubscriptionDetails {
  subscriptionId: string;
  status: number;
  startDate: string;
  endDate: string;
  trialEndsAt?: string | null;
  isRecurringEnabled: boolean;
  planId: string;
  planName: string;
  tier: string;
  billingCycle: BillingCycle | string;
  priceAmount: number;
  currency: string;
  maxActiveProducts: number;
  maxMonthlyTryOns: number;
  supportLevel: string;
  isUnlimited: boolean;
  isWhiteLabel: boolean;
  includesSourceCode: boolean;
  includesMobileApps: boolean;
  hasSla: boolean;
  hasDedicatedTeam: boolean;
  pendingDowngradePlanId?: string | null;
  pendingDowngradePlanName?: string | null;
  pendingDowngradeEffectiveAt?: string | null;
}

export interface TrialSubscription {
  subscriptionId: string;
  planId: string;
  planName: string;
  tier: string;
  status: number;
  startDate: string;
  endDate: string;
  trialEndsAt: string;
  isRecurringEnabled: boolean;
  isActive: boolean;
  isInTrial: boolean;
}

export interface SelectSubscriptionPayload {
  planId: string;
  paymentMethodId: string;
  billingCycle: BillingCycle | string;
}

export interface UpgradeSubscriptionPayload {
  newPlanId: string;
  paymentMethodId: string;
}

export interface DowngradeSubscriptionPayload {
  newPlanId: string;
}
