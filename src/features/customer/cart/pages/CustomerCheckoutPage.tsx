import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ImageIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/features/customer/components/product";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { computeSubtotal, computeItemCount } from "@/features/customer/cart/types/cart";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useCustomerAddresses } from "@/features/customer/queries/profileAvatar.queries";
import type { CustomerAddress } from "@/features/customer/types/profileAvatar";

export function CustomerCheckoutPage() {
  const items = useCartStore((s) => s.items);
  const user = useAuthStore((s) => s.user);
  const addressesQuery = useCustomerAddresses();
  const addresses: CustomerAddress[] = addressesQuery.data ?? [];

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress;

  const subtotal = computeSubtotal(items);
  const itemCount = computeItemCount(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <h1 className="text-3xl font-['Playfair_Display'] font-normal text-[#2F2925]">Nothing to check out</h1>
        <p className="text-[#6F625B]">Your cart is empty. Add some items before checking out.</p>
        <Button asChild className={cn("rounded-full bg-[#9c6b54] text-white hover:bg-[#7d5643]", customerTheme.focusRing)}>
          <Link to={CUSTOMER_ROUTES.cart}>Back to Cart</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-['Playfair_Display'] font-normal text-[#2F2925]">Checkout preview</h1>

      {/* Unavailability notice */}
      <div className={`${customerTheme.softCard} flex gap-3 p-4`} role="note" aria-label="Checkout notice">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#9c6b54]" aria-hidden="true" />
        <p className="text-sm text-[#4D433D]">
          <strong>Order submission and payment are not yet available.</strong> This is a preview of your order.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Customer profile summary */}
          {user && (
            <section className={`${customerTheme.card} space-y-3 p-5`} aria-label="Customer profile">
              <h2 className="text-lg font-['Playfair_Display'] font-normal text-[#2F2925]">Account</h2>
              <p className="font-medium text-[#2F2925]">{user.fullName}</p>
              <p className="text-sm text-[#6F625B]">{user.email}</p>
              {user.phoneNumber && <p className="text-sm text-[#6F625B]">{user.phoneNumber}</p>}
            </section>
          )}

          {/* Address selection */}
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
                      />
                      <div className="text-sm">
                        <p className="font-semibold text-[#2F2925]">{addr.fullName}</p>
                        <p className="text-[#6F625B]">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p className="text-[#6F625B]">{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}</p>
                        <p className="text-[#6F625B]">{addr.country}</p>
                        {addr.isDefault && <span className="mt-1 inline-block rounded-full bg-[#9c6b54]/10 px-2 py-0.5 text-xs font-medium text-[#9c6b54]">Default</span>}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Cart items read-only list */}
          <section className={`${customerTheme.card} space-y-4 p-5`} aria-label="Order items">
            <h2 className="text-lg font-['Playfair_Display'] font-normal text-[#2F2925]">Items ({itemCount})</h2>
            <ul role="list" className="divide-y divide-[#e8ddd5]">
              {items.map((item) => {
                const effectivePrice = item.discountedPrice ?? item.unitPrice;
                return (
                  <li key={`${item.productId}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`} className="flex gap-3 py-4">
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

        {/* Summary sidebar */}
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

          <Button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full opacity-60"
            aria-disabled="true"
          >
            Order submission unavailable
          </Button>

          <p className="text-center text-xs text-[#7d5643]">
            Payment and order placement will be available in a future update.
          </p>

          <Button asChild variant="outline" className={cn("w-full rounded-full", customerTheme.focusRing)}>
            <Link to={CUSTOMER_ROUTES.cart}>Back to Cart</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
