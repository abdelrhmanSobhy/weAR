import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import {
  ApiErrorState,
  ProductGrid,
  ProductRail,
} from "@/features/customer/components/product";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import {
  useCustomerCategories,
  useCustomerOffers,
  useCustomerProducts,
} from "@/features/customer/queries/catalog.queries";
import { useToggleCustomerFavorite } from "@/features/customer/queries/favorites.queries";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Mona A.",
    rating: 5,
    quote:
      "The virtual try-on helped me find the perfect fit without any returns. Absolutely love weAR!",
  },
  {
    name: "Leila K.",
    rating: 5,
    quote:
      "I can move from inspiration to a short list in minutes. The catalog feels boutique but the filters make it practical.",
  },
  {
    name: "Sara M.",
    rating: 4,
    quote:
      "Finally a fashion platform that understands my body shape. The recommendations are spot on.",
  },
];

const features = [
  {
    icon: "✦",
    title: "Fit-aware recommendations",
    desc: "Smart suggestions tailored to your measurements and body shape.",
  },
  {
    icon: "◈",
    title: "Virtual Try-On AR",
    desc: "See how any outfit looks on your avatar before you buy.",
  },
  {
    icon: "⊹",
    title: "Curated collections",
    desc: "Boutique-quality edits for every occasion and style.",
  },
];

export function CustomerHomePage() {
  const categoriesQuery = useCustomerCategories();
  const offersQuery = useCustomerOffers();
  const bestSellersQuery = useCustomerProducts({
    pageNumber: 1,
    pageSize: 8,
    sortBy: "sales",
    sortDirection: "desc",
  });
  const newArrivalsQuery = useCustomerProducts({
    pageNumber: 1,
    pageSize: 8,
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  const allProductsQuery = useCustomerProducts({ pageNumber: 1, pageSize: 8 });
  const toggleFavorite = useToggleCustomerFavorite();

  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : [];
  const offers = Array.isArray(offersQuery.data) ? offersQuery.data : [];

  return (
    <div className="space-y-14 sm:space-y-20">

      {/* ── Hero ── */}
      <section className="relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-10">
        <div
          className="relative flex min-h-[520px] flex-col items-start justify-center px-6 py-16 sm:min-h-[600px] sm:px-12 lg:px-20"
          style={{
            background:
              "linear-gradient(135deg, #fef7f0 0%, #f5ede6 40%, #edddd0 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[#e8d4c4]/40" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 translate-y-1/3 rounded-full bg-[#d4bfaf]/30" />

          <div className="relative z-10 max-w-xl">
            <span className="mb-4 inline-block rounded-full bg-[#9c6b54]/10 px-4 py-1 text-[13px] font-medium text-[#9c6b54]">
              Virtual Fitting Room
            </span>
            <h1
              className={cn(
                "text-[42px] font-normal leading-[1.15] text-[#2F2925] sm:text-[52px] lg:text-[60px]",
                customerTheme.headingFont,
              )}
            >
              {offers?.[0]?.title ?? (
                <>
                  Dress Your Best,
                  <br />
                  <em>Every Day.</em>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[#6F625B]">
              {offers?.[0]?.description ??
                "Discover fashion selected for real wardrobes. Try on virtually, style confidently."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={CUSTOMER_ROUTES.shop}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90",
                  customerTheme.accentBg,
                )}
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={CUSTOMER_ROUTES.tryOn}
                className="inline-flex items-center gap-2 rounded-full border border-[#9c6b54] px-7 py-3 text-[15px] font-medium text-[#9c6b54] transition-colors hover:bg-[#9c6b54] hover:text-white"
              >
                Try On AR
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">
              Browse by category
            </p>
            <h2 className={cn("mt-1 text-[28px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
              Shop Collections
            </h2>
          </div>
          <Link
            to={CUSTOMER_ROUTES.shop}
            className="flex items-center gap-1 text-[14px] font-medium text-[#9c6b54] hover:text-[#954c2a]"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {categoriesQuery.isError ? (
          <ApiErrorState
            title="Categories unavailable"
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse rounded-2xl bg-[#e8ddd5]"
                  />
                ))
              : categories.slice(0, 8).map((category, i) => (
                  <Link
                    key={category.id}
                    to={`${CUSTOMER_ROUTES.shop}?category=${category.id}`}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-[#e8ddd5] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md",
                    )}
                  >
                    {/* Accent dot */}
                    <span
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-[18px]"
                      style={{
                        background: `hsl(${20 + i * 15} 40% 92%)`,
                      }}
                    >
                      {["👗", "👔", "👟", "👜", "🧥", "🧣", "💍", "🕶"][i % 8]}
                    </span>
                    <h3 className={cn("text-[16px] font-medium text-[#2F2925]", customerTheme.headingFont)}>
                      {category.name}
                    </h3>
                    <p className="mt-1 text-[13px] text-[#9c6b54]">
                      {category.productCount ?? 0} products
                    </p>
                    <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-[#9c6b54] opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
          </div>
        )}
      </section>

      {/* ── Try-On AR promo ── */}
      <section
        className="relative overflow-hidden rounded-3xl px-8 py-14 text-white sm:px-14"
        style={{
          background: "linear-gradient(135deg, #3d2015 0%, #6b3120 40%, #9c6b54 100%)",
        }}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/4 -translate-y-1/4 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 translate-y-1/4 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <span className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-[13px] font-medium">
              Coming soon
            </span>
            <h2 className={cn("text-[32px] font-normal leading-tight sm:text-[38px]", customerTheme.headingFont)}>
              Try before you buy — virtually.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">
              Our AR fitting room lets you see exactly how any outfit looks on
              your avatar before placing an order. No guessing, no returns.
            </p>
          </div>
          <Link
            to={CUSTOMER_ROUTES.tryOn}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-[#6b3120] transition-opacity hover:opacity-90"
          >
            Launch Try-On
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">
              Top picks
            </p>
            <h2 className={cn("mt-1 text-[28px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
              Best Sellers
            </h2>
          </div>
          <Link
            to={CUSTOMER_ROUTES.shop}
            className="flex items-center gap-1 text-[14px] font-medium text-[#9c6b54] hover:text-[#954c2a]"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {bestSellersQuery.isError ? (
          <ApiErrorState
            title="Best sellers unavailable"
            onRetry={() => bestSellersQuery.refetch()}
          />
        ) : (
          <ProductRail
            title=""
            products={bestSellersQuery.data?.items}
            isLoading={bestSellersQuery.isLoading}
            onToggleFavorite={(id) => toggleFavorite.mutate(id)}
          />
        )}
      </section>

      {/* ── New Arrivals ── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">
              Just landed
            </p>
            <h2 className={cn("mt-1 text-[28px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
              New Arrivals
            </h2>
          </div>
          <Link
            to={CUSTOMER_ROUTES.shop}
            className="flex items-center gap-1 text-[14px] font-medium text-[#9c6b54] hover:text-[#954c2a]"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {newArrivalsQuery.isError ? (
          <ApiErrorState
            title="New arrivals unavailable"
            onRetry={() => newArrivalsQuery.refetch()}
          />
        ) : (
          <ProductRail
            title=""
            products={newArrivalsQuery.data?.items}
            isLoading={newArrivalsQuery.isLoading}
            onToggleFavorite={(id) => toggleFavorite.mutate(id)}
          />
        )}
      </section>

      {/* ── All Products ── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className={cn("text-[28px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
            All Products
          </h2>
          <Link
            to={CUSTOMER_ROUTES.shop}
            className="flex items-center gap-1 text-[14px] font-medium text-[#9c6b54] hover:text-[#954c2a]"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {allProductsQuery.isError ? (
          <ApiErrorState
            title="Products unavailable"
            onRetry={() => allProductsQuery.refetch()}
          />
        ) : (
          <ProductGrid
            products={allProductsQuery.data?.items}
            isLoading={allProductsQuery.isLoading}
            onToggleFavorite={(id) => toggleFavorite.mutate(id)}
          />
        )}
      </section>

      {/* ── Why weAR ── */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">
            Why choose us
          </p>
          <h2 className={cn("mt-1 text-[28px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
            Designed around you
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#e8ddd5] bg-white p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fef7f0] text-[22px] text-[#9c6b54]">
                {f.icon}
              </div>
              <h3 className={cn("text-[16px] font-medium text-[#2F2925]", customerTheme.headingFont)}>
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6F625B]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">
            What our customers say
          </p>
          <h2 className={cn("mt-1 text-[28px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
            Loved by thousands
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.name}
              className="flex flex-col gap-4 rounded-2xl border border-[#e8ddd5] bg-white p-6"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[#9c6b54] text-[#9c6b54]"
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-[14px] leading-relaxed text-[#2F2925]">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="text-[13px] font-semibold text-[#9c6b54]">
                — {item.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

    </div>
  );
}
