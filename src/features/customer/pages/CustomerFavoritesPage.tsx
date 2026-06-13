import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/features/customer/components/product";
import { useCustomerFavorites } from "@/features/customer/queries/favorites.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";

export function CustomerFavoritesPage() {
  const favorites = useCustomerFavorites();
  const products = favorites.data ?? [];

  if (favorites.isLoading) {
    return (
      <section className={`${customerTheme.card} p-8`} aria-busy="true">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          Favorites
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">
          Loading your saved products…
        </h1>
      </section>
    );
  }

  if (favorites.isError) {
    return (
      <section className={`${customerTheme.card} p-8`} role="alert">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          Favorites
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">
          Could not load favorites
        </h1>
        <p className="mt-3 max-w-2xl text-[#6F625B]">
          Your wishlist is still safe. Refresh the page or continue shopping and
          try again later.
        </p>
        <Button asChild className="mt-5 rounded-full">
          <Link to={CUSTOMER_ROUTES.shop}>Continue Shopping</Link>
        </Button>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className={`${customerTheme.card} p-8 text-center`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4EDE7] text-[#A37E6B]">
          <Heart className="h-7 w-7" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          Favorites
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">
          Your wishlist is empty
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[#6F625B]">
          Save products while browsing the storefront, then return here to compare
          styles before trying them on.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to={CUSTOMER_ROUTES.shop}>Browse Products</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
            Favorites
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-[#2F2925]">
            Saved products
          </h1>
          <p className="mt-2 text-[#6F625B]">
            {products.length} saved {products.length === 1 ? "item" : "items"}.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link to={CUSTOMER_ROUTES.shop}>Continue Shopping</Link>
        </Button>
      </div>

      <ProductGrid products={products} />
    </section>
  );
}
