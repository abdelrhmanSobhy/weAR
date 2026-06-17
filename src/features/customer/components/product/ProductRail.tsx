import { ProductCard } from "@/features/customer/components/product/ProductCard";
import { ProductCardSkeleton } from "@/features/customer/components/product/ProductCardSkeleton";
import type { CustomerProduct } from "@/features/customer/types/catalog";

interface ProductRailProps {
  title: string;
  products?: CustomerProduct[];
  isLoading?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

export function ProductRail({
  title,
  products = [],
  isLoading = false,
  onToggleFavorite,
}: ProductRailProps) {
  return (
    <section aria-label={title || "Product rail"} className="space-y-4">
      {title && <h2 className="text-2xl font-bold text-[#2F2925]">{title}</h2>}
      <div className="flex gap-4 overflow-x-auto pb-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="w-64 shrink-0">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((product) => (
              <div key={product.id} className="w-64 shrink-0">
                <ProductCard
                  product={product}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
      </div>
    </section>
  );
}
