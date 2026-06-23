import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CreditCard, ImageIcon, Info, MapPin, ShoppingBag } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/features/customer/components/product";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { computeSubtotal, computeItemCount } from "@/features/customer/cart/types/cart";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useCustomerAddresses } from "@/features/customer/queries/profileAvatar.queries";
import { useCheckout, useCreatePaymentIntent, useConfirmPayment } from "@/features/customer/queries/orders.queries";
import { customerCartApi } from "@/features/customer/api/customerCart.api";
import type { CustomerAddress } from "@/features/customer/types/profileAvatar";

const paymentSchema = z.object({
  cardName: z.string().min(3, "Cardholder name is required"),
  cardNumber: z.string().regex(/^\d{16}$/, "Must be exactly 16 digits"),
  ccv: z.string().regex(/^\d{3,4}$/, "Invalid CCV"),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "MM/YY format required"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type Step = "address" | "payment" | "processing" | "success";

export function CustomerCheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const customerId = user?.id ?? "";

  const addressesQuery = useCustomerAddresses();
  const addresses: CustomerAddress[] = addressesQuery.data ?? [];
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress;

  const [step, setStep] = useState<Step>("address");
  const [apiError, setApiError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [placedTotal, setPlacedTotal] = useState(0);
  const [placedAddress, setPlacedAddress] = useState<CustomerAddress | null>(null);

  const { mutateAsync: checkout } = useCheckout(customerId);
  const { mutateAsync: createPaymentIntent } = useCreatePaymentIntent(customerId);
  const { mutateAsync: confirmPayment } = useConfirmPayment(customerId);

  const subtotal = computeSubtotal(items);
  const itemCount = computeItemCount(items);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { cardName: "", cardNumber: "", ccv: "", expiryDate: "" },
  });

  const handleProceedToPayment = async () => {
    if (!selectedAddress) return;
    setSyncError(null);
    setSyncing(true);
    try {
      await customerCartApi.clearCart(customerId);
      for (const item of items) {
        await customerCartApi.addItem(customerId, item.productId, item.quantity);
      }
      setStep("payment");
    } catch {
      setSyncError("Failed to sync cart. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handlePayment = async (values: PaymentFormValues) => {
    void values;
    setApiError(null);
    setStep("processing");
    try {
      const shippingLine = [
        selectedAddress?.line1,
        selectedAddress?.city,
        selectedAddress?.country,
      ]
        .filter(Boolean)
        .join(", ");

      const orderId = await checkout({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: shippingLine,
        paymentMethod: "Credit Card",
      });

      await createPaymentIntent(orderId);
      await confirmPayment(orderId);

      setPlacedTotal(subtotal);
      setPlacedAddress(selectedAddress);
      clearCart();
      setStep("success");
    } catch (err: unknown) {
      setStep("payment");
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

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-['Playfair_Display'] font-normal text-[#2F2925]">Order placed!</h1>
          <p className="text-[#6F625B]">
            Your order of{" "}
            <span className="font-semibold text-[#2F2925]">${placedTotal.toFixed(2)}</span>{" "}
            has been received and payment confirmed.
          </p>
          {placedAddress && (
            <p className="text-sm text-[#6F625B]">
              Ships to {placedAddress.city}, {placedAddress.country}
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            asChild
            className={cn("rounded-full bg-[#9c6b54] text-white hover:bg-[#7d5643]", customerTheme.focusRing)}
          >
            <Link to={CUSTOMER_ROUTES.shop}>Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline" className={cn("rounded-full", customerTheme.focusRing)}>
            <Link to={CUSTOMER_ROUTES.home}>
              <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <h1 className="text-3xl font-['Playfair_Display'] font-normal text-[#2F2925]">Nothing to check out</h1>
        <p className="text-[#6F625B]">Your cart is empty. Add some items before checking out.</p>
        <Button
          asChild
          className={cn("rounded-full bg-[#9c6b54] text-white hover:bg-[#7d5643]", customerTheme.focusRing)}
        >
          <Link to={CUSTOMER_ROUTES.cart}>Back to Cart</Link>
        </Button>
      </div>
    );
  }

  const inputClass =
    "h-[44px] w-full rounded-2xl border border-[#e8ddd5] bg-white px-4 text-[#2F2925] text-sm outline-none transition-colors focus:border-[#9c6b54] placeholder:text-[#b5a9a2]";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-['Playfair_Display'] font-normal text-[#2F2925]">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {user && (
            <section className={`${customerTheme.card} space-y-2 p-5`} aria-label="Customer profile">
              <h2 className="text-lg font-['Playfair_Display'] font-normal text-[#2F2925]">Account</h2>
              <p className="font-medium text-[#2F2925]">{user.fullName}</p>
              <p className="text-sm text-[#6F625B]">{user.email}</p>
              {user.phoneNumber && <p className="text-sm text-[#6F625B]">{user.phoneNumber}</p>}
            </section>
          )}

          <section className={`${customerTheme.card} space-y-4 p-5`} aria-label="Delivery address">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-['Playfair_Display'] font-normal text-[#2F2925]">Delivery address</h2>
              <Link
                to={CUSTOMER_ROUTES.addresses}
                className={cn("text-sm font-semibold text-[#9c6b54] hover:text-[#7d5643]", customerTheme.focusRing)}
              >
                <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                Add / edit addresses
              </Link>
            </div>

            {addressesQuery.isLoading && <p className="text-sm text-[#6F625B]">Loading addresses…</p>}

            {!addressesQuery.isLoading && addresses.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#e8ddd5] p-6 text-center">
                <p className="text-sm text-[#6F625B]">No address saved yet.</p>
                <Button asChild variant="outline" className={cn("mt-3 rounded-full", customerTheme.focusRing)}>
                  <Link to={CUSTOMER_ROUTES.addresses}>Add an address</Link>
                </Button>
              </div>
            )}

            {addresses.length > 0 && (
              <ul role="list" className="space-y-3">
                {addresses.map((addr) => (
                  <li key={addr.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                        selectedAddress?.id === addr.id
                          ? "border-[#9c6b54] bg-[#fef7f0]"
                          : "border-[#e8ddd5] bg-white hover:bg-[#fef7f0]",
                      )}
                    >
                      <input
                        type="radio"
                        name="checkout-address"
                        value={addr.id}
                        checked={selectedAddress?.id === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-[#9c6b54]"
                        disabled={step === "payment" || step === "processing"}
                      />
                      <div className="text-sm">
                        <p className="font-semibold text-[#2F2925]">{addr.fullName}</p>
                        <p className="text-[#6F625B]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p className="text-[#6F625B]">{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}</p>
                        <p className="text-[#6F625B]">{addr.country}</p>
                        {addr.isDefault && (
                          <span className="mt-1 inline-block rounded-full bg-[#9c6b54]/10 px-2 py-0.5 text-xs font-medium text-[#9c6b54]">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(step === "payment" || step === "processing") && (
            <section className={`${customerTheme.card} space-y-5 p-5`} aria-label="Payment details">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#9c6b54]" aria-hidden="true" />
                <h2 className="text-lg font-['Playfair_Display'] font-normal text-[#2F2925]">
                  Payment details
                </h2>
              </div>

              {apiError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {apiError}
                </div>
              )}

              <form
                id="payment-form"
                onSubmit={form.handleSubmit(handlePayment)}
                className="flex flex-col gap-4"
              >
                <div className="relative pb-5">
                  <label className="mb-1.5 block text-sm text-[#6F625B]">Cardholder name</label>
                  <input
                    type="text"
                    placeholder="Name on card"
                    {...form.register("cardName")}
                    className={`${inputClass} ${form.formState.errors.cardName ? "border-red-400" : ""}`}
                  />
                  {form.formState.errors.cardName && (
                    <span className="absolute bottom-0 left-1 text-[11px] text-red-500">
                      {form.formState.errors.cardName.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-[2] pb-5">
                    <label className="mb-1.5 block text-sm text-[#6F625B]">Card number</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="1234 5678 9012 3456"
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
                    <label className="mb-1.5 block text-sm text-[#6F625B]">CCV</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="123"
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
                    <label className="mb-1.5 block text-sm text-[#6F625B]">Expiry date</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="MM/YY"
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

                <p className="flex items-center gap-2 text-xs text-[#b5a9a2]">
                  <Info className="h-3.5 w-3.5 text-[#9c6b54]" aria-hidden="true" />
                  Your payment is secured and encrypted
                </p>
              </form>

              <button
                type="button"
                onClick={() => setStep("address")}
                className={cn("text-sm text-[#6F625B] underline hover:text-[#2F2925]", customerTheme.focusRing)}
              >
                ← Back to address
              </button>
            </section>
          )}

          <section className={`${customerTheme.card} space-y-4 p-5`} aria-label="Order items">
            <h2 className="text-lg font-['Playfair_Display'] font-normal text-[#2F2925]">Items ({itemCount})</h2>
            <ul role="list" className="divide-y divide-[#e8ddd5]">
              {items.map((item) => {
                const effectivePrice = item.discountedPrice ?? item.unitPrice;
                return (
                  <li
                    key={`${item.productId}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`}
                    className="flex gap-3 py-4"
                  >
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-16 w-14 shrink-0 rounded-xl object-cover bg-[#fef7f0]"
                      />
                    ) : (
                      <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl bg-[#fef7f0] text-[#9c6b54]">
                        <ImageIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex flex-1 justify-between gap-2 min-w-0">
                      <div>
                        <p className="font-medium text-[#2F2925]">{item.productName}</p>
                        {item.brand && <p className="text-xs text-[#9c6b54]">{item.brand}</p>}
                        <p className="text-sm text-[#6F625B]">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(" · ")}
                          {" "}× {item.quantity}
                        </p>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-[#2F2925]">
                        <PriceDisplay price={effectivePrice * item.quantity} discountedPrice={null} currency="USD" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className={`${customerTheme.card} h-fit space-y-5 p-6`} aria-label="Order totals">
          <h2 className="text-xl font-['Playfair_Display'] font-normal text-[#2F2925]">Order total</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#6F625B]">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</dt>
              <dd className="font-semibold">
                <PriceDisplay price={subtotal} discountedPrice={null} currency="USD" />
              </dd>
            </div>
            <div className="flex justify-between border-t border-[#e8ddd5] pt-3">
              <dt className="font-['Playfair_Display'] font-normal text-[#2F2925]">Total</dt>
              <dd className="text-lg font-['Playfair_Display'] font-normal text-[#2F2925]">
                <PriceDisplay price={subtotal} discountedPrice={null} currency="USD" />
              </dd>
            </div>
          </dl>

          {step === "address" && (
            <>
              {syncError && (
                <p className="text-sm text-red-500">{syncError}</p>
              )}
              <Button
                type="button"
                className={cn("w-full rounded-full bg-[#9c6b54] text-white hover:bg-[#7d5643]", customerTheme.focusRing)}
                disabled={((!selectedAddress && addresses.length > 0) || syncing)}
                onClick={handleProceedToPayment}
              >
                {syncing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Preparing…
                  </span>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </>
          )}

          {(step === "payment" || step === "processing") && (
            <Button
              form="payment-form"
              type="submit"
              disabled={step === "processing"}
              className={cn("w-full rounded-full bg-[#9c6b54] text-white hover:bg-[#7d5643]", customerTheme.focusRing)}
            >
              {step === "processing" ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing…
                </span>
              ) : (
                `Pay $${subtotal.toFixed(2)}`
              )}
            </Button>
          )}

          <Button asChild variant="outline" className={cn("w-full rounded-full", customerTheme.focusRing)}>
            <Link to={CUSTOMER_ROUTES.cart}>Back to Cart</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
