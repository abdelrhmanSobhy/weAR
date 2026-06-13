import { customerTheme } from "@/features/customer/styles/customerTheme";

interface PriceDisplayProps {
  price: number;
  discountedPrice?: number | null;
  currency?: string | null;
}

const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

export function PriceDisplay({
  price,
  discountedPrice,
  currency = "USD",
}: PriceDisplayProps) {
  const hasDiscount =
    typeof discountedPrice === "number" && discountedPrice > 0 && discountedPrice < price;
  const displayCurrency = currency || "USD";

  if (!hasDiscount) {
    return (
      <span className={`font-semibold ${customerTheme.darkText}`}>
        {formatPrice(price, displayCurrency)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`font-semibold ${customerTheme.darkText}`}>
        {formatPrice(discountedPrice, displayCurrency)}
      </span>
      <span className="text-sm text-[#8B7A70] line-through">
        {formatPrice(price, displayCurrency)}
      </span>
    </span>
  );
}
