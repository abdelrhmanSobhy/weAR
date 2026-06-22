import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Check } from "lucide-react";

import { useAuthStore } from "@/features/auth/useAuthStore";
import { useAddPaymentMethod } from "@/features/retailer/queries/payment.queries";
import { useSelectSubscriptionPlan } from "@/features/retailer/queries/subscription.queries";

import logoImage from "@/assets/auth/logo.webp";
import fallbackPlanImg from "@/assets/auth/pricing/standard.webp";

import visaSvg from "@/assets/auth/payment/visa.svg";
import mastercardSvg from "@/assets/auth/payment/mastercard.svg";
import paypalSvg from "@/assets/auth/payment/paypal.svg";
import applepaySvg from "@/assets/auth/payment/applepay.svg";
import stripeSvg from "@/assets/auth/payment/stripe.svg";
import gpaySvg from "@/assets/auth/payment/gpay.svg";
import bitpaySvg from "@/assets/auth/payment/bitpay.svg";

const paymentSchema = z.object({
  cardName: z.string().min(3, "Cardholder name is required"),
  cardNumber: z.string().regex(/^\d{16}$/, "Must be exactly 16 digits"),
  ccv: z.string().regex(/^\d{3,4}$/, "Invalid CCV"),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{4})$/, "MM/YYYY format required (e.g. 12/2027)"),
  saveDetails: z.boolean().optional(),
  enableRecurring: z.boolean().optional(),
  balanceThreshold: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function RetailerPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const retailerId = user?.id || "";
  const { mutateAsync: addPaymentMethod } = useAddPaymentMethod(retailerId);
  const { mutateAsync: selectSubscriptionPlan } =
    useSelectSubscriptionPlan(retailerId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // user is already authenticated after signup step 2; no login call needed here

  const planData = location.state?.finalSignupData || {
    plan: "Standard",
    desc: "For small to medium businesses",
    price: "150",
    billing: "Monthly",
    img: fallbackPlanImg,
    businessName: "My Awesome Brand",
  };

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardName: "",
      cardNumber: "",
      ccv: "",
      expiryDate: "",
      saveDetails: false,
      enableRecurring: true,
      balanceThreshold: "50,000",
    },
  });

  const enableRecurring = form.watch("enableRecurring");

  const today = new Date();
  const formatDate = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const startDateStr = formatDate(today);

  const billingType = planData.billing || "Monthly";
  const endDate = new Date(today);

  if (billingType.toLowerCase().includes("year")) {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  const endDateStr = formatDate(endDate);

  const onSubmit = async (values: PaymentFormValues) => {
    setIsProcessing(true);
    setApiError(null);

    try {
      if (!retailerId)
        throw new Error("User session not found. Please log in again.");

      const firstDigit = values.cardNumber[0];
      const firstTwo = parseInt(values.cardNumber.slice(0, 2), 10);
      let providerType = "Visa";
      if (firstDigit === "5" && firstTwo >= 51 && firstTwo <= 55) providerType = "Mastercard";
      else if (firstDigit === "3") providerType = "Stripe";

      const paymentMethodResponse = await addPaymentMethod({
        providerType,
        cardholderName: values.cardName,
        cardNumberLast4: values.cardNumber.slice(-4),
        expiryDate: values.expiryDate,
        // Since Stripe Elements is not implemented yet in the UI, we send a test Stripe PaymentMethod ID:
        stripePaymentMethodId: "pm_card_visa",
        isSaved: values.saveDetails ?? false,
        setAsDefault: true,
      });

      const paymentMethodId = paymentMethodResponse.data;
      if (!planData.planId) {
        throw new Error(
          "Selected plan is missing an API plan id. Please choose the plan again.",
        );
      }

      await selectSubscriptionPlan({
        planId: planData.planId,
        paymentMethodId,
        billingCycle: planData.billing || "Monthly",
      });

      navigate("/retailer", { replace: true });
    } catch (error: unknown) {
      const apiMessage =
        typeof error === "object" && error !== null && "response" in error
          ? (
              error as {
                response?: { data?: { message?: string; details?: string[] } };
              }
            ).response?.data
          : undefined;

      setApiError(
        apiMessage?.message ||
          apiMessage?.details?.[0] ||
          (error instanceof Error ? error.message : null) ||
          "Payment failed. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const labelStyle = {
    color: "#949E96",
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: '"Hanuman", sans-serif',
    fontSize: "18px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "100%",
    letterSpacing: "0.18px",
  };

  const testimonialStyle = {
    color: "rgba(182, 160, 146, 0.70)",
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: '"Hanuman", sans-serif',
    fontSize: "18px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "150%",
    letterSpacing: "0.18px",
  };

  const inputClass =
    "h-[45px] w-full rounded-[12px] border border-[#E4DCD1] bg-white px-4 text-[#949E96] outline-none transition-colors focus:border-[#B6A092] placeholder:text-[#949E96]";

  const paymentLogos = [
    visaSvg,
    mastercardSvg,
    paypalSvg,
    applepaySvg,
    stripeSvg,
    gpaySvg,
    bitpaySvg,
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FAFAFA] px-4 py-10 font-sans">
      <div className="flex flex-col lg:flex-row w-full max-w-[1250px] min-h-[90vh] lg:max-h-[850px] rounded-[24px] border border-[#E4DCD1] bg-white shadow-sm overflow-hidden">
        <div className="flex-1 flex flex-col justify-start px-8 lg:px-[50px] lg:border-r border-b lg:border-b-0 border-[#E4DCD1] bg-white">
          <h1
            className="text-[#B6A092] text-[32px] mt-[50px] mb-[50px]"
            style={{
              fontFamily: '"PT Serif", serif',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            Payment Method
          </h1>

          <div className="flex flex-wrap gap-x-[25px] mb-8 pb-8 border-b border-[#F0EDEB]">
            {paymentLogos.map((logo, i) => (
              <img
                key={i}
                src={logo}
                alt="Payment Method"
                className="h-[48px] w-[70px] object-contain rounded-[10px] bg-white transition-transform hover:-translate-y-1"
              />
            ))}
          </div>

          <form
            id="payment-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            {apiError && (
              <div className="mb-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {apiError}
              </div>
            )}
            <div className="relative pb-5">
              <label className="mb-2 block" style={labelStyle}>
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="Enter Your Name"
                {...form.register("cardName")}
                className={`${inputClass} ${form.formState.errors.cardName ? "border-red-400" : ""}`}
              />
              {form.formState.errors.cardName && (
                <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                  {form.formState.errors.cardName.message}
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-[2] pb-5">
                <label className="mb-2 block" style={labelStyle}>
                  Card Number
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Enter Your Card Number"
                  {...form.register("cardNumber")}
                  className={`${inputClass} ${form.formState.errors.cardNumber ? "border-red-400" : ""}`}
                />
                {form.formState.errors.cardNumber && (
                  <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                    {form.formState.errors.cardNumber.message}
                  </span>
                )}
              </div>

              <div className="relative flex-1 pb-5">
                <label className="mb-2 block" style={labelStyle}>
                  CCV
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="000"
                  {...form.register("ccv")}
                  className={`${inputClass} ${form.formState.errors.ccv ? "border-red-400" : ""}`}
                />
                {form.formState.errors.ccv && (
                  <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                    {form.formState.errors.ccv.message}
                  </span>
                )}
              </div>

              <div className="relative flex-1 pb-5">
                <label className="mb-2 block" style={labelStyle}>
                  Date
                </label>
                <input
                  type="text"
                  maxLength={7}
                  placeholder="MM/YYYY"
                  {...form.register("expiryDate")}
                  className={`${inputClass} ${form.formState.errors.expiryDate ? "border-red-400" : ""}`}
                />
                {form.formState.errors.expiryDate && (
                  <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                    {form.formState.errors.expiryDate.message}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-3">
              <p
                className="flex items-center gap-2 text-[14px] text-[#BFC7DE]"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                <Info size={18} className="text-[#C9A390]" />
                Credit Card payments may take up to 24h to be processed
              </p>

              <label
                className="flex cursor-pointer items-center gap-3 text-[16px] text-[#8A8A8A]"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                <div className="relative flex h-5 w-5 items-center justify-center rounded-[4px] border border-[#E4DCD1] bg-white">
                  <input
                    type="checkbox"
                    {...form.register("saveDetails")}
                    className="peer absolute h-full w-full cursor-pointer opacity-0"
                  />
                  <Check
                    size={14}
                    className="pointer-events-none hidden text-[#B6A092] peer-checked:block"
                  />
                </div>
                Save my payment details for future
              </label>
            </div>

            <div className="mt-4 border-t border-[#F0EDEB] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <h3
                    className="text-[18px] text-[#C9A390]"
                    style={{ fontFamily: '"Hanuman", sans-serif' }}
                  >
                    Enable recurring payments
                  </h3>
                  <span className="rounded-full bg-[#E5F5EC] px-3 py-1 text-[10px] font-bold text-[#4E9F6E]">
                    Highly Recommended
                  </span>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    {...form.register("enableRecurring")}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#B6A092] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>

              <p
                className="text-[14px] leading-relaxed text-[#BFC7DE] mb-3 max-w-[85%]"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                Never miss a payment. Enable recurring billing for seamless,
                automatic renewals and uninterrupted access to your plan.
              </p>

              {enableRecurring && (
                <div className="w-[60%]">
                  <label
                    className="mb-2 block text-[14px] text-[#BFC7DE]"
                    style={{ fontFamily: '"Hanuman", sans-serif' }}
                  >
                    When my balance is above
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#949E96]">
                      $
                    </span>
                    <input
                      type="text"
                      {...form.register("balanceThreshold")}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div
          className="flex flex-col bg-white shrink-0 p-8 lg:p-10 justify-center"
          style={{ width: "100%", maxWidth: "480px", height: "100%" }}
        >
          <h2
            className="text-[#C9A390] text-[20px] mb-5"
            style={{ fontFamily: '"Hanuman", sans-serif' }}
          >
            Your Chosen Plan Price
          </h2>

          <div className="rounded-[16px] border border-[#E4DCD1] bg-white p-4 mb-6 flex gap-4 items-center">
            <div
              className="shrink-0 rounded-[12px] bg-[#FDFCFB] overflow-hidden flex items-center justify-center border border-[#F0EDEB]"
              style={{ width: "175.132px", height: "126.566px" }}
            >
              <img
                src={planData.img || fallbackPlanImg}
                alt="Plan"
                className="w-[90%] h-[90%] object-contain"
              />
            </div>
            <div className="flex flex-col justify-center flex-1">
              <h4
                className="text-[#949E96] text-[22px] mb-1 font-medium"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                {planData.plan}
              </h4>
              <p
                className="text-[#C9A390] text-[15px] mb-3 leading-tight"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                {planData.desc}
              </p>

              <div
                className="flex flex-col gap-0.5 text-[#8A8A8A] text-[12px] mb-2"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                <p className="text-[#555] font-medium">
                  Plan Type: {billingType}
                </p>
                <div className="flex justify-between pr-2">
                  <p>Start:{startDateStr}</p>
                  <p>End:{endDateStr}</p>
                </div>
                <p className="text-[#BFC7DE]">
                  include full access to every platform feature.
                </p>
              </div>

              <div className="flex items-start text-[#C9A390] mt-1">
                <span className="text-[14px] mt-1 mr-0.5">$</span>
                <span
                  className="text-[38px] leading-none"
                  style={{ fontFamily: '"PT Serif", serif' }}
                >
                  {planData.price}
                </span>
                <span className="text-[14px] self-end mb-1 ml-1 text-[#8A8A8A]">
                  /
                  {billingType.toLowerCase().includes("year")
                    ? "year"
                    : "month"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E4DCD1]">
            <div>
              <span
                className="block text-[18px] text-[#949E96]"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                Total:
              </span>
              <span className="block text-[11px] text-[#BFC7DE]">
                (Incl. VAT)
              </span>
            </div>
            <span
              className="text-[32px] text-[#949E96]"
              style={{ fontFamily: '"PT Serif", serif', fontWeight: 700 }}
            >
              ${planData.price}
            </span>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              form="payment-form"
              type="submit"
              disabled={isProcessing}
              className="flex-1 rounded-[12px] bg-[#B6A092] py-3.5 text-[15px] font-bold text-white transition hover:bg-[#9F8062] disabled:opacity-70 flex justify-center items-center"
              style={{
                fontFamily: '"Hanuman", sans-serif',
                letterSpacing: "0.5px",
              }}
            >
              {isProcessing ? "Processing..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-[12px] border border-[#E4DCD1] bg-white py-3.5 text-[15px] font-bold text-[#C9A390] transition hover:bg-[#F5F1EF]"
              style={{
                fontFamily: '"Hanuman", sans-serif',
                letterSpacing: "0.5px",
              }}
            >
              Change Your Plan
            </button>
          </div>

          <div className="mt-auto rounded-[16px] border border-[#E4DCD1] bg-white p-6">
            <p className="mb-5 text-left" style={testimonialStyle}>
              With weAR , customers found their perfect size on the first try.
              Every confident purchase counts. This platform is literally
              changing how people shop online.
            </p>
            <div className="flex justify-start items-center gap-2">
              <img
                src={logoImage}
                alt="weAR logo"
                className="h-8 object-contain opacity-70"
              />
              <span
                className="text-[#B6A092] text-[26px] translate-y-1"
                style={{ fontFamily: '"Allura", cursive' }}
              >
                weAR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
