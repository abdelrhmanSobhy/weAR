import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Info, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useCheckout, useCreatePaymentIntent, useConfirmPayment } from "../queries/orders.queries";
import type { CartDto } from "../api/customerCart.api";

const paymentSchema = z.object({
  cardName: z.string().min(3, "Cardholder name is required"),
  cardNumber: z.string().regex(/^\d{16}$/, "Must be exactly 16 digits"),
  ccv: z.string().regex(/^\d{3,4}$/, "Invalid CCV"),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "MM/YY format required"),
  shippingAddress: z.string().min(5, "Shipping address is required"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type Step = "form" | "processing" | "success";

export function CustomerCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const customerId = user?.id ?? "";

  const cart: CartDto | undefined = location.state?.cart;

  const [step, setStep] = useState<Step>("form");
  const [apiError, setApiError] = useState<string | null>(null);

  const { mutateAsync: checkout } = useCheckout(customerId);
  const { mutateAsync: createPaymentIntent } = useCreatePaymentIntent(customerId);
  const { mutateAsync: confirmPayment } = useConfirmPayment(customerId);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardName: "",
      cardNumber: "",
      ccv: "",
      expiryDate: "",
      shippingAddress: "",
    },
  });

  if (!cart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] gap-4">
        <ShoppingBag size={48} className="text-[#C9A390]" />
        <p className="text-[#949E96]" style={{ fontFamily: '"Hanuman", sans-serif' }}>
          No cart data found.
        </p>
        <button
          onClick={() => navigate("/customer/cart")}
          className="rounded-[12px] bg-[#B6A092] px-6 py-3 text-white text-sm font-semibold hover:bg-[#9F8062] transition"
        >
          Go to Cart
        </button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] gap-6">
        <CheckCircle2 size={64} className="text-[#4E9F6E]" />
        <h2
          className="text-[#4A4A4A] text-[28px] font-bold"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Payment Successful!
        </h2>
        <p className="text-[#949E96] text-[16px]" style={{ fontFamily: '"Hanuman", sans-serif' }}>
          Your order has been placed and is being processed.
        </p>
        <button
          onClick={() => navigate("/customer/dashboard")}
          className="rounded-[12px] bg-[#B6A092] px-8 py-3.5 text-white font-bold text-[15px] hover:bg-[#9F8062] transition"
          style={{ fontFamily: '"Hanuman", sans-serif' }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const onSubmit = async (values: PaymentFormValues) => {
    setApiError(null);
    setStep("processing");

    try {
      const orderId = await checkout({
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: values.shippingAddress,
        paymentMethod: "Credit Card",
      });

      await createPaymentIntent(orderId);

      await confirmPayment(orderId);

      setStep("success");
    } catch (err: unknown) {
      setStep("form");
      const apiMsg =
        typeof err === "object" && err !== null && "response" in err
          ? (
              err as {
                response?: { data?: { message?: string; errors?: string[] } };
              }
            ).response?.data
          : undefined;

      setApiError(
        apiMsg?.message ||
          apiMsg?.errors?.[0] ||
          (err instanceof Error ? err.message : null) ||
          "Payment failed. Please try again.",
      );
    }
  };

  const labelStyle = {
    color: "#949E96",
    fontFamily: '"Hanuman", sans-serif',
    fontSize: "16px",
    fontWeight: 400,
  };

  const inputClass =
    "h-[45px] w-full rounded-[12px] border border-[#E4DCD1] bg-white px-4 text-[#949E96] outline-none transition-colors focus:border-[#B6A092] placeholder:text-[#C9C9C9]";

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4">
      <div className="max-w-[1100px] mx-auto">
        <h1
          className="text-[#B6A092] text-[32px] mb-8"
          style={{ fontFamily: '"PT Serif", serif', fontWeight: 700 }}
        >
          Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Payment Form */}
          <div className="flex-1 rounded-[24px] border border-[#E4DCD1] bg-white p-8">
            <h2
              className="text-[#C9A390] text-[22px] mb-6"
              style={{ fontFamily: '"Hanuman", sans-serif' }}
            >
              Payment Details
            </h2>

            {apiError && (
              <div className="mb-5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {apiError}
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* Shipping Address */}
              <div className="relative pb-5">
                <label className="mb-2 block" style={labelStyle}>
                  Shipping Address
                </label>
                <input
                  type="text"
                  placeholder="123 Main St, City, Country"
                  {...form.register("shippingAddress")}
                  className={`${inputClass} ${
                    form.formState.errors.shippingAddress ? "border-red-400" : ""
                  }`}
                />
                {form.formState.errors.shippingAddress && (
                  <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                    {form.formState.errors.shippingAddress.message}
                  </span>
                )}
              </div>

              {/* Cardholder Name */}
              <div className="relative pb-5">
                <label className="mb-2 block" style={labelStyle}>
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="Name on card"
                  {...form.register("cardName")}
                  className={`${inputClass} ${
                    form.formState.errors.cardName ? "border-red-400" : ""
                  }`}
                />
                {form.formState.errors.cardName && (
                  <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                    {form.formState.errors.cardName.message}
                  </span>
                )}
              </div>

              {/* Card Number + CCV + Expiry */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-[2] pb-5">
                  <label className="mb-2 block" style={labelStyle}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="1234 5678 9012 3456"
                    {...form.register("cardNumber")}
                    className={`${inputClass} ${
                      form.formState.errors.cardNumber ? "border-red-400" : ""
                    }`}
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
                    placeholder="123"
                    {...form.register("ccv")}
                    className={`${inputClass} ${
                      form.formState.errors.ccv ? "border-red-400" : ""
                    }`}
                  />
                  {form.formState.errors.ccv && (
                    <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                      {form.formState.errors.ccv.message}
                    </span>
                  )}
                </div>

                <div className="relative flex-1 pb-5">
                  <label className="mb-2 block" style={labelStyle}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    {...form.register("expiryDate")}
                    className={`${inputClass} ${
                      form.formState.errors.expiryDate ? "border-red-400" : ""
                    }`}
                  />
                  {form.formState.errors.expiryDate && (
                    <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                      {form.formState.errors.expiryDate.message}
                    </span>
                  )}
                </div>
              </div>

              <p
                className="flex items-center gap-2 text-[13px] text-[#BFC7DE]"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                <Info size={16} className="text-[#C9A390]" />
                Your payment is secured and encrypted
              </p>

              <button
                type="submit"
                disabled={step === "processing"}
                className="mt-2 w-full rounded-[12px] bg-[#B6A092] py-3.5 text-white font-bold text-[15px] hover:bg-[#9F8062] transition disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                {step === "processing" ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  `Pay $${cart.totalAmount.toFixed(2)}`
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/customer/cart")}
                className="w-full rounded-[12px] border border-[#E4DCD1] py-3.5 text-[#C9A390] font-bold text-[15px] hover:bg-[#F5F1EF] transition"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                Back to Cart
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-[340px] shrink-0">
            <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 sticky top-8">
              <h2
                className="text-[#C9A390] text-[18px] mb-4"
                style={{ fontFamily: '"Hanuman", sans-serif' }}
              >
                Order Summary
              </h2>

              <div className="flex flex-col gap-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[8px] bg-[#F5F1EF] flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag size={16} className="text-[#C9A390]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-[#4A4A4A] text-[13px] font-medium leading-tight"
                        style={{ fontFamily: '"Hanuman", sans-serif' }}
                      >
                        {item.productName}
                      </p>
                      <p
                        className="text-[#949E96] text-[12px]"
                        style={{ fontFamily: '"Hanuman", sans-serif' }}
                      >
                        × {item.quantity}
                      </p>
                    </div>
                    <span
                      className="text-[#B6A092] text-[13px] font-semibold"
                      style={{ fontFamily: '"Hanuman", sans-serif' }}
                    >
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E4DCD1] pt-4 flex justify-between items-center">
                <span
                  className="text-[#4A4A4A] font-semibold"
                  style={{ fontFamily: '"Hanuman", sans-serif' }}
                >
                  Total
                </span>
                <span
                  className="text-[#B6A092] text-[26px] font-bold"
                  style={{ fontFamily: '"PT Serif", serif' }}
                >
                  ${cart.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
