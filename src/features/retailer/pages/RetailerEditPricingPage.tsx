import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";

import planDetailsImg from "@/assets/Dashboard/planDetails.webp";
import basicImg from "@/assets/auth/pricing/basic.webp";
import standardImg from "@/assets/auth/pricing/standard.webp";
import enterpriseImg from "@/assets/auth/pricing/enterprise.webp";
import saasImg from "@/assets/auth/pricing/saas.webp";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { usePaymentMethods } from "@/features/retailer/queries/payment.queries";
import {
  useCancelSubscription,
  useCurrentSubscription,
  useCurrentSubscriptionDetails,
  useDowngradeSubscriptionPlan,
  useSelectSubscriptionPlan,
  useSubmitSaasEnquiry,
  useSubscriptionPlans,
  useToggleRecurringBilling,
  useUpgradeSubscriptionPlan,
} from "@/features/retailer/queries/subscription.queries";
import type {
  BillingCycle,
  CurrentSubscription,
  CurrentSubscriptionDetails,
  SubscriptionPlan,
} from "@/features/retailer/types/subscription";
import {
  getBackendPlanChangeAction,
  isSaasPlan,
} from "@/features/retailer/utils/subscription-plan-change";

interface DisplayPlan {
  id?: string;
  name: string;
  tier: string;
  desc: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle | string;
  img: string;
  isPopular?: boolean;
  isCurrent?: boolean;
  isWhiteLabel?: boolean;
  features: string[];
}

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const getPlanImage = (name?: string, tier?: string) => {
  const key = `${name || ""} ${tier || ""}`.toLowerCase();
  if (key.includes("basic")) return basicImg;
  if (key.includes("enterprise")) return enterpriseImg;
  if (key.includes("saas") || key.includes("white")) return saasImg;
  return standardImg;
};

const getDescription = (
  plan?: Pick<SubscriptionPlan, "tier" | "isWhiteLabel">,
) => {
  if (plan?.isWhiteLabel) return "Solution for big organizations";
  const tier = plan?.tier?.toLowerCase() || "";
  if (tier.includes("basic")) return "A simple start for everyone";
  if (tier.includes("standard")) return "For small to medium businesses";
  return "Solution for big organizations";
};

const buildFeatures = (plan: SubscriptionPlan | CurrentSubscriptionDetails) => {
  const features = [
    "Virtual Fitting Room with 3D Avatars",
    "Full AI Style Recommendations",
    "Product Catalog & Inventory Management",
    "Retailer Analytics Dashboard",
    "Return & Refund Management System",
  ];

  features.push(
    plan.isUnlimited
      ? "Unlimited active products"
      : `Up to ${plan.maxActiveProducts.toLocaleString()} active products`,
  );
  features.push(
    plan.isUnlimited
      ? "Unlimited monthly virtual try-ons"
      : `Up to ${plan.maxMonthlyTryOns.toLocaleString()} monthly virtual try-ons`,
  );

  if (plan.supportLevel) features.push(`${plan.supportLevel} support`);
  if (plan.isWhiteLabel)
    features.push("100% White-Label Platform - Your branding, your domain");
  if (plan.includesMobileApps)
    features.push(
      "Custom Mobile Applications - iOS & Android apps under your name",
    );
  if (plan.includesSourceCode) features.push("Source Code Access");
  if (plan.hasDedicatedTeam)
    features.push("Dedicated Development Team for custom features");
  if (plan.hasSla) features.push("Priority 24/7 Support with SLAs");

  return features;
};

const getTierRank = (plan?: Pick<DisplayPlan, "tier" | "isWhiteLabel">) => {
  const tier = plan?.tier?.toLowerCase() || "";
  if (plan?.isWhiteLabel || tier.includes("saas") || tier.includes("white"))
    return 4;
  if (tier.includes("enterprise")) return 3;
  if (tier.includes("standard")) return 2;
  if (tier.includes("basic")) return 1;
  return 0;
};

const getDisplayPrice = (
  plan: Pick<
    SubscriptionPlan,
    "priceAmount" | "billingCycle" | "isWhiteLabel" | "tier"
  >,
) => {
  const isSaas =
    plan.isWhiteLabel ||
    plan.billingCycle === "SaaS" ||
    plan.tier?.toLowerCase().includes("saas");

  return isSaas && (!plan.priceAmount || plan.priceAmount <= 0)
    ? 5000
    : plan.priceAmount;
};

const toDisplayPlan = (
  plan: SubscriptionPlan,
  currentPlanId?: string,
): DisplayPlan => ({
  id: plan.id,
  name: plan.name || plan.tier,
  tier: plan.tier,
  desc: getDescription(plan),
  price: getDisplayPrice(plan),
  currency: plan.currency || "$",
  billingCycle: plan.billingCycle,
  img: getPlanImage(plan.name, plan.tier),
  isPopular: plan.tier?.toLowerCase().includes("standard"),
  isCurrent: !!currentPlanId && plan.id === currentPlanId,
  isWhiteLabel: plan.isWhiteLabel || plan.billingCycle === "SaaS",
  features: buildFeatures(plan),
});

const fallbackPlans: DisplayPlan[] = [
  {
    name: "Basic",
    tier: "Basic",
    desc: "A simple start for everyone",
    price: 50,
    currency: "$",
    billingCycle: "Monthly",
    img: basicImg,
    features: [
      "Virtual Fitting Room with 3D Avatars",
      "Full AI Style Recommendations",
      "Product Catalog & Inventory Management",
      "Retailer Analytics Dashboard",
      "Return & Refund Management System",
      "Up to 250 active products",
      "Up to 1,000 monthly virtual try-ons",
      "Email support (48-hour response)",
    ],
  },
  {
    name: "Standard",
    tier: "Standard",
    desc: "For small to medium businesses",
    price: 150,
    currency: "$",
    billingCycle: "Monthly",
    img: standardImg,
    isPopular: true,
    isCurrent: true,
    features: [
      "Virtual Fitting Room with 3D Avatars",
      "Full AI Style Recommendations",
      "Product Catalog & Inventory Management",
      "Retailer Analytics Dashboard",
      "Return & Refund Management System",
      "Up to 1,000 active products",
      "Up to 10,000 monthly virtual try-ons",
      "Priority support (24-hour response)",
    ],
  },
  {
    name: "Enterprise",
    tier: "Enterprise",
    desc: "Solution for big organizations",
    price: 300,
    currency: "$",
    billingCycle: "Monthly",
    img: enterpriseImg,
    features: [
      "Virtual Fitting Room with 3D Avatars",
      "Full AI Style Recommendations",
      "Product Catalog & Inventory Management",
      "Retailer Analytics Dashboard",
      "Return & Refund Management System",
      "Unlimited active products",
      "Unlimited monthly virtual try-ons",
      "24/7 phone & chat support",
    ],
  },
];

const fallbackSaasPlan: DisplayPlan = {
  name: "SaaS / White Label",
  tier: "SaaS",
  desc: "Solution for big organizations",
  price: 5000,
  currency: "$",
  billingCycle: "SaaS",
  img: saasImg,
  isWhiteLabel: true,
  features: [
    "100% White-Label Platform - Your branding, your domain",
    "Custom Mobile Applications - iOS & Android apps under your name",
    "Source Code Access",
    "Dedicated Development Team for custom features",
    "Priority 24/7 Support with SLAs",
    "Unlimited active products",
    "Unlimited monthly virtual try-ons",
  ],
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string; details?: string[] } };
      }
    ).response;
    return response?.data?.message || response?.data?.details?.[0];
  }
  return error instanceof Error
    ? error.message
    : "Subscription request failed.";
};

export function RetailerEditPricingPage() {
  const [currentView, setCurrentView] = useState<
    "overview" | "details" | "upgrade"
  >("overview");
  const user = useAuthStore((state) => state.user);
  const retailerId = user?.id || "";
  const currentSubscription = useCurrentSubscription(retailerId);
  const subscriptionDetails = useCurrentSubscriptionDetails(retailerId);

  return (
    <div className="flex flex-col font-sans w-full max-w-full items-center">
      {currentView === "overview" && (
        <CurrentPlanView
          current={currentSubscription.data?.data}
          isLoading={currentSubscription.isLoading}
          onViewDetails={() => setCurrentView("details")}
          onUpgrade={() => setCurrentView("upgrade")}
        />
      )}
      {currentView === "details" && (
        <PlanDetailsView
          details={subscriptionDetails.data?.data}
          current={currentSubscription.data?.data}
          isLoading={subscriptionDetails.isLoading}
          onBack={() => setCurrentView("overview")}
          onUpgrade={() => setCurrentView("upgrade")}
        />
      )}
      {currentView === "upgrade" && (
        <UpgradePlanView
          current={currentSubscription.data?.data}
          retailerId={retailerId}
          onBack={() => setCurrentView("overview")}
        />
      )}
    </div>
  );
}

function CurrentPlanView({
  current,
  isLoading,
  onViewDetails,
  onUpgrade,
}: {
  current?: CurrentSubscription;
  isLoading: boolean;
  onViewDetails: () => void;
  onUpgrade: () => void;
}) {
  const plan = current?.currentPlan;
  const price = plan?.priceAmount ?? 150;
  const billingCycle = plan?.billingCycle || "Monthly";
  const suffix =
    billingCycle === "Yearly"
      ? "/Year"
      : billingCycle === "SaaS"
        ? ""
        : "/month";
  const statusLabel = current?.isInTrial
    ? "TRIAL"
    : current?.isActive
      ? "ONGOING"
      : "INACTIVE";

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1328px]">
      <h1
        className="text-[24px] md:text-[28px] font-bold text-[#B6A092]"
        style={{ fontFamily: '"PT Serif", serif' }}
      >
        Your Current Plan
      </h1>
      {isLoading && (
        <p className="text-[13px] text-[#949E96]">
          Loading current subscription...
        </p>
      )}
      <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-4 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch">
          <div className="w-full md:w-[280px] h-[180px] shrink-0 rounded-[16px] overflow-hidden bg-[#FEF9F2]">
            <img
              src={getPlanImage(plan?.name, plan?.tier)}
              alt="Plan"
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>

          <div className="flex flex-col justify-between flex-1 w-full">
            <div className="flex justify-between items-start">
              <div>
                <h2
                  className="text-[20px] font-bold text-[#C9A390]"
                  style={{ fontFamily: '"PT Serif", serif' }}
                >
                  {plan?.name || "Standard"}
                </h2>
                <p className="text-[14px] text-[#C9A390]/80 mt-1">
                  {getDescription(plan)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E0F2E9] px-3 py-1 text-[11px] font-bold text-[#4CAF50]">
                ● {statusLabel}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap gap-4 md:gap-8 text-[13px] text-[#949E96]">
                <p>Plan Type: {billingCycle}</p>
                <div className="flex gap-4">
                  <span>Start: {formatDate(current?.startDate)}</span>
                  <span>End: {formatDate(current?.endDate)}</span>
                </div>
              </div>
              {current?.pendingDowngradePlan && (
                <p className="text-[13px] text-[#C9A390] mt-1">
                  Pending downgrade: {current.pendingDowngradePlan.name}
                </p>
              )}
              <p className="text-[13px] text-[#949E96] mt-1">
                include full access to every platform feature.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-6 gap-4">
              <div className="flex items-start">
                <span className="text-[16px] font-bold text-[#C9A390] mt-1 mr-1">
                  {plan?.currency || "$"}
                </span>
                <span
                  className="text-[42px] font-bold text-[#C9A390] leading-none"
                  style={{ fontFamily: '"PT Serif", serif' }}
                >
                  {price}
                </span>
                <span className="text-[14px] text-[#949E96] mb-1 ml-1">
                  {suffix}
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={onUpgrade}
                  disabled={
                    current
                      ? !current.canUpgrade && !current.canDowngrade
                      : false
                  }
                  className="flex-1 sm:flex-none px-6 py-3 bg-[#B6A092] disabled:opacity-60 text-white text-[14px] font-bold rounded-[10px] hover:bg-[#9F8062] transition-colors"
                >
                  Upgrade Your Plan
                </button>
                <button
                  onClick={onViewDetails}
                  className="flex-1 sm:flex-none px-6 py-3 border border-[#E4DCD1] text-[#C9A390] text-[14px] font-bold rounded-[10px] hover:bg-[#FEF9F2] transition-colors"
                >
                  View Your Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanDetailsView({
  details,
  current,
  isLoading,
  onBack,
  onUpgrade,
}: {
  details?: CurrentSubscriptionDetails;
  current?: CurrentSubscription;
  isLoading: boolean;
  onBack: () => void;
  onUpgrade: () => void;
}) {
  const retailerId = useAuthStore((state) => state.user?.id || "");
  const cancelSubscription = useCancelSubscription(retailerId);
  const toggleRecurring = useToggleRecurringBilling(retailerId);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const features = details ? buildFeatures(details) : fallbackPlans[1].features;
  const price = details
    ? getDisplayPrice({
        priceAmount: details.priceAmount,
        billingCycle: details.billingCycle,
        isWhiteLabel: details.isWhiteLabel,
        tier: details.tier,
      })
    : 1440;
  const billingCycle = details?.billingCycle || "Yearly";
  const suffix =
    billingCycle === "Yearly"
      ? "/Year"
      : billingCycle === "SaaS"
        ? ""
        : "/month";
  const hasCancelableSubscription =
    !!current?.canCancel || !!current?.isActive || !!details?.subscriptionId;

  const runAction = async (action: "toggle" | "cancel") => {
    setApiError(null);
    setApiMessage(null);
    try {
      if (action === "toggle") {
        await toggleRecurring.mutateAsync();
        setApiMessage("Recurring billing updated successfully.");
      } else {
        await cancelSubscription.mutateAsync();
        setApiMessage("Subscription cancelled successfully.");
      }
    } catch (error) {
      setApiError(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full items-center">
      <div className="w-full max-w-[1328px] flex justify-start">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#C9A390] hover:text-[#B6A092] font-bold w-fit transition-colors text-[18px]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          <ChevronLeft size={20} /> Your Plan Details
        </button>
      </div>
      {isLoading && (
        <p className="w-full max-w-[1328px] text-[13px] text-[#949E96]">
          Loading subscription details...
        </p>
      )}
      {apiError && (
        <p className="w-full max-w-[1328px] text-[13px] font-semibold text-red-500">
          {apiError}
        </p>
      )}
      {apiMessage && (
        <p className="w-full max-w-[1328px] text-[13px] font-semibold text-[#4CAF50]">
          {apiMessage}
        </p>
      )}

      <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 md:p-8 shadow-sm flex flex-col lg:flex-row gap-8 w-full max-w-[1328px] lg:h-[796px]">
        <div className="w-full lg:w-[420px] shrink-0 rounded-[24px] border border-[#E4DCD1] p-8 flex flex-col bg-white h-full shadow-sm">
          <div className="text-center mb-8 mt-4">
            <h3
              className="text-[24px] font-bold text-[#949E96]"
              style={{ fontFamily: '"PT Serif", serif' }}
            >
              {details?.planName || "Standard"}
            </h3>
            <p className="text-[13px] text-[#C9A390] mt-1">
              {getDescription({
                tier: details?.tier || "Standard",
                isWhiteLabel: details?.isWhiteLabel || false,
              })}
            </p>
            <div className="flex items-start justify-center mt-8">
              <span className="text-[18px] font-bold text-[#949E96] mt-2 mr-1">
                {details?.currency || "$"}
              </span>
              <span
                className="text-[54px] font-bold text-[#949E96] leading-none"
                style={{ fontFamily: '"PT Serif", serif' }}
              >
                {price}
              </span>
              <span className="text-[14px] text-[#949E96] mt-auto mb-2 ml-1">
                {suffix}
              </span>
            </div>
            {details?.pendingDowngradePlanName && (
              <p className="text-[12px] text-[#C9A390] mt-3">
                Downgrades to {details.pendingDowngradePlanName} on{" "}
                {formatDate(details.pendingDowngradeEffectiveAt)}
              </p>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-4 mb-8 px-2 overflow-y-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3"
                style={{
                  color: "rgba(0, 0, 0, 0.50)",
                  fontFeatureSettings: "'liga' off, 'clig' off",
                  fontFamily: "Hanuman, sans-serif",
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "120%",
                  letterSpacing: "0.14px",
                }}
              >
                <span className="text-[6px] mt-1.5 text-[#949E96]">●</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 mt-auto">
            <button
              onClick={onUpgrade}
              className="w-full py-4 border border-[#E4DCD1] text-[#C9A390] text-[13px] font-bold tracking-widest rounded-[12px] hover:bg-[#FEF9F2] transition-colors uppercase"
            >
              Upgrade
            </button>
            <button
              onClick={() => runAction("toggle")}
              disabled={!current?.isActive || toggleRecurring.isPending}
              className="w-full py-3 border border-[#E4DCD1] text-[#949E96] text-[12px] font-bold tracking-widest rounded-[12px] hover:bg-[#FEF9F2] disabled:opacity-60 transition-colors uppercase"
            >
              {current?.isRecurringEnabled
                ? "Disable Recurring"
                : "Enable Recurring"}
            </button>
            <button
              onClick={() => runAction("cancel")}
              disabled={
                !hasCancelableSubscription || cancelSubscription.isPending
              }
              className="w-full py-3 border border-[#E4DCD1] text-red-400 text-[12px] font-bold tracking-widest rounded-[12px] hover:bg-red-50 disabled:opacity-60 transition-colors uppercase"
            >
              Cancel Subscription
            </button>
          </div>
        </div>

        <div className="flex-1 rounded-[24px] overflow-hidden bg-[#FEF9F2] h-full min-h-[400px] lg:min-h-0">
          <img
            src={planDetailsImg}
            alt="Plan Details"
            className="w-full h-full object-cover mix-blend-multiply"
          />
        </div>
      </div>
    </div>
  );
}

function UpgradePlanView({
  current,
  retailerId,
  onBack,
}: {
  current?: CurrentSubscription;
  retailerId: string;
  onBack: () => void;
}) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("Yearly");
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const plansQuery = useSubscriptionPlans(billingCycle);
  const paymentMethodsQuery = usePaymentMethods(retailerId);
  const upgradePlan = useUpgradeSubscriptionPlan(retailerId);
  const downgradePlan = useDowngradeSubscriptionPlan(retailerId);
  const selectPlan = useSelectSubscriptionPlan(retailerId);
  const submitSaasEnquiry = useSubmitSaasEnquiry(retailerId);

  const plans = useMemo(() => {
    const apiPlans =
      plansQuery.data?.data?.flatMap((group) => group.plans) || [];

    const locallyFilteredPlans = apiPlans.filter((plan) => {
      if (billingCycle === "SaaS") return isSaasPlan(plan);
      return plan.billingCycle === billingCycle && !isSaasPlan(plan);
    });

    if (!locallyFilteredPlans.length) {
      return billingCycle === "SaaS" ? [fallbackSaasPlan] : fallbackPlans;
    }

    return locallyFilteredPlans.map((plan) =>
      toDisplayPlan(plan, current?.currentPlan?.id),
    );
  }, [billingCycle, current?.currentPlan?.id, plansQuery.data?.data]);

  const currentRank = current?.currentPlan
    ? getTierRank(current.currentPlan)
    : 0;

  const getSuffix = () => {
    if (billingCycle === "Monthly") return "/month";
    if (billingCycle === "Yearly") return "/Year";
    return "";
  };

  const handlePlanAction = async (plan: DisplayPlan) => {
    setApiError(null);
    setApiMessage(null);

    const getPlanChangeAction = () => getBackendPlanChangeAction(plan, current);

    const getPaymentMethodId = async () => {
      let methods = paymentMethodsQuery.data?.data || [];

      if (!methods.length && !paymentMethodsQuery.isFetching) {
        const refreshed = await paymentMethodsQuery.refetch();
        methods = refreshed.data?.data || [];
      }

      const availableMethods = methods.filter((method) => !method.isExpired);
      return (
        availableMethods.find((method) => method.isDefault)?.id ||
        availableMethods[0]?.id
      );
    };

    const performUpgrade = async () => {
      const paymentMethodId = await getPaymentMethodId();
      if (!paymentMethodId) {
        throw new Error(
          "Please add a payment method or set a default card before upgrading.",
        );
      }
      await upgradePlan.mutateAsync({ newPlanId: plan.id!, paymentMethodId });
      setApiMessage("Subscription upgraded successfully.");
    };

    const performDowngrade = async () => {
      await downgradePlan.mutateAsync({ newPlanId: plan.id! });
      setApiMessage("Downgrade scheduled for the next renewal date.");
    };

    try {
      if (!retailerId)
        throw new Error("User session not found. Please log in again.");
      if (!plan.id) throw new Error("Selected plan is missing an API plan id.");

      if (isSaasPlan(plan) || billingCycle === "SaaS") {
        await submitSaasEnquiry.mutateAsync();
        setApiMessage("SaaS enquiry submitted successfully.");
        return;
      }

      const action = getPlanChangeAction();

      if (action === "current") {
        setApiMessage("This is already your current plan.");
        return;
      }

      if (action === "select") {
        const paymentMethodId = await getPaymentMethodId();
        if (!paymentMethodId)
          throw new Error(
            "Please add a payment method before selecting a plan.",
          );
        await selectPlan.mutateAsync({
          planId: plan.id,
          paymentMethodId,
          billingCycle: plan.billingCycle,
        });
        setApiMessage("Subscription activated successfully.");
        return;
      }

      try {
        if (action === "upgrade") {
          await performUpgrade();
        } else {
          await performDowngrade();
        }
      } catch (error) {
        const message = getErrorMessage(error).toLowerCase();
        if (action === "downgrade" && message.includes("upgradeplan")) {
          await performUpgrade();
          return;
        }
        if (action === "upgrade" && message.includes("downgradeplan")) {
          await performDowngrade();
          return;
        }
        throw error;
      }
    } catch (error) {
      setApiError(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1328px]">
      <div className="flex items-center justify-between relative">
        <button
          onClick={onBack}
          className="text-[#949E96] hover:text-[#5C5550] font-bold text-[14px] tracking-widest uppercase flex items-center gap-1 absolute left-0 z-10"
        >
          <ChevronLeft size={16} /> Skip
        </button>

        <div className="w-full text-center">
          <h1
            className="text-[28px] md:text-[36px] font-bold text-[#B6A092]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            {billingCycle === "SaaS"
              ? "SaaS / White-Label Solution"
              : "Subscription Plan"}
          </h1>
          <p className="text-[14px] text-[#949E96] mt-2">
            {billingCycle === "SaaS"
              ? "For businesses wanting their own standalone VFR platform"
              : "All plans include full access to every platform feature. choose the best plan fit your needs."}
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[600px] rounded-[15px] bg-[#FEF9F2] border border-[#E4DCD1] p-1">
        {(["Monthly", "Yearly", "SaaS"] as const).map((cycle) => (
          <button
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            className={`flex-1 rounded-[12px] py-3 text-[14px] font-bold transition-all ${billingCycle === cycle ? "bg-[#C9A390] text-white shadow-sm" : "text-[#C9A390] hover:bg-white/50"}`}
          >
            {cycle}
          </button>
        ))}
      </div>

      {plansQuery.isLoading && (
        <p className="text-[13px] text-[#949E96]">Loading latest plans...</p>
      )}
      {apiError && (
        <p className="text-[13px] font-semibold text-red-500">{apiError}</p>
      )}
      {apiMessage && (
        <p className="text-[13px] font-semibold text-[#4CAF50]">{apiMessage}</p>
      )}

      {billingCycle === "SaaS" ? (
        <div className="flex flex-col lg:flex-row gap-6 mt-4 lg:h-[700px]">
          <PlanCard
            plan={plans[0]}
            suffix=""
            currentRank={currentRank}
            onAction={handlePlanAction}
          />
          <div className="flex-1 rounded-[20px] overflow-hidden bg-[#FEF9F2] h-full min-h-[400px] lg:min-h-0">
            <img
              src={saasImg}
              alt="SaaS Details"
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id || plan.name}
              plan={plan}
              suffix={getSuffix()}
              currentRank={currentRank}
              onAction={handlePlanAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  suffix,
  currentRank,
  onAction,
}: {
  plan: DisplayPlan;
  suffix: string;
  currentRank: number;
  onAction: (plan: DisplayPlan) => void;
}) {
  const rank = getTierRank(plan);
  const label = plan.isCurrent
    ? "Your Current Plan"
    : rank > currentRank || plan.isWhiteLabel
      ? "Upgrade"
      : "Select";

  return (
    <div
      className={`relative rounded-[20px] border p-6 flex flex-col bg-white overflow-hidden ${plan.isPopular ? "border-[#C9A390] shadow-md transform md:-translate-y-4" : "border-[#E4DCD1]"}`}
    >
      {plan.isPopular && (
        <div
          className="absolute top-6 -right-2 bg-[#C9A390] text-white text-[12px] font-bold px-8 py-2 tracking-wider z-10 shadow-sm"
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 15% 50%)",
          }}
        >
          Popular
        </div>
      )}

      <div className="h-[120px] rounded-[12px] overflow-hidden bg-[#FEF9F2] mb-6">
        <img
          src={plan.img}
          alt={plan.name}
          className="w-full h-full object-cover mix-blend-multiply"
        />
      </div>

      <div className="text-center mb-8">
        <h3
          className="text-[20px] font-bold text-[#949E96]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          {plan.name}
        </h3>
        <p className="text-[12px] text-[#C9A390] mt-1">{plan.desc}</p>
        <div className="flex items-start justify-center mt-4">
          <span className="text-[14px] font-bold text-[#949E96] mt-1 mr-1">
            {plan.currency}
          </span>
          <span
            className="text-[42px] font-bold text-[#949E96] leading-none"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            {plan.price}
          </span>
          <span className="text-[13px] text-[#949E96] mt-auto mb-1 ml-1">
            {suffix}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 mb-8 px-1">
        {plan.features.map((feature, fIdx) => (
          <div
            key={fIdx}
            className="flex items-start gap-3"
            style={{
              color: "rgba(0, 0, 0, 0.50)",
              fontFeatureSettings: "'liga' off, 'clig' off",
              fontFamily: "Hanuman, sans-serif",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "120%",
              letterSpacing: "0.14px",
            }}
          >
            <span className="text-[6px] mt-1.5 text-[#949E96]">●</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAction(plan)}
        disabled={plan.isCurrent}
        className={`w-full py-3 border text-[12px] font-bold tracking-widest rounded-[10px] uppercase mt-auto transition-colors ${plan.isCurrent ? "border-[#E4DCD1] text-[#949E96] bg-gray-50 cursor-default" : "border-[#E4DCD1] text-[#C9A390] hover:bg-[#FEF9F2]"}`}
      >
        {label}
      </button>
    </div>
  );
}
