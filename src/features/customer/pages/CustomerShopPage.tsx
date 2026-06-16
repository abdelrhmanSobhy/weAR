import { BarChart2, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  ApiErrorState,
  ProductGrid,
} from "@/features/customer/components/product";
import {
  useCustomerCategories,
  useCustomerProducts,
} from "@/features/customer/queries/catalog.queries";
import { useCompareStore, COMPARE_MAX, COMPARE_MIN } from "@/features/customer/compare/useCompareStore";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";
import {
  parseShopQuery,
  serializeShopQuery,
  toCatalogParams,
  type ShopQueryState,
} from "./shopQueryParams";

const filterGroups = [
  ["colors", "Colors", ["Black", "White", "Blue", "Beige", "Green"]],
  ["sizes", "Sizes", ["XS", "S", "M", "L", "XL"]],
  ["fabricMaterials", "Materials", ["Cotton", "Linen", "Denim", "Silk"]],
  ["bodyShapes", "Body shapes", ["Pear", "Hourglass", "Rectangle", "Apple"]],
  ["fabricPatterns", "Patterns", ["Solid", "Striped", "Floral", "Checked"]],
  ["brands", "Brands", ["weAR", "Luna", "Atelier", "North"]],
] as const;

const sortOptions = [
  ["featured", "Featured"],
  ["price:asc", "Price: low to high"],
  ["price:desc", "Price: high to low"],
  ["name:asc", "Name: A-Z"],
] as const;

type MultiKey = (typeof filterGroups)[number][0];

export function CustomerShopPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const compareIds = useCompareStore((s) => s.productIds);
  const addToCompare = useCompareStore((s) => s.add);
  const removeFromCompare = useCompareStore((s) => s.remove);
  const clearCompare = useCompareStore((s) => s.clear);
  const isFull = compareIds.length >= COMPARE_MAX;

  const handleToggleCompare = (productId: string) => {
    if (compareIds.includes(productId)) {
      removeFromCompare(productId);
    } else {
      addToCompare(productId);
    }
  };

  const queryState = useMemo(
    () => parseShopQuery(location.search),
    [location.search],
  );
  const [draftSearch, setDraftSearch] = useState(queryState.search);
  const catalogParams = useMemo(
    () => toCatalogParams(queryState),
    [queryState],
  );
  const productsQuery = useCustomerProducts(catalogParams);
  const categoriesQuery = useCustomerCategories();

  const updateQuery = (patch: Partial<ShopQueryState>, resetPage = true) => {
    const next = {
      ...queryState,
      ...patch,
      page: resetPage ? 1 : (patch.page ?? queryState.page),
    };
    const serialized = serializeShopQuery(next);
    navigate({
      pathname: location.pathname,
      search: serialized ? `?${serialized}` : "",
    });
  };

  const toggleMulti = (key: MultiKey, value: string) => {
    const current = queryState[key];
    updateQuery({
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    } as Partial<ShopQueryState>);
  };

  const products = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.totalCount ?? products.length;
  const totalPages =
    productsQuery.data?.totalPages ??
    Math.max(1, Math.ceil(total / (productsQuery.data?.pageSize ?? 12)));

  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : [];

  const hasActiveFilters =
    queryState.colors.length > 0 ||
    queryState.sizes.length > 0 ||
    queryState.fabricMaterials.length > 0 ||
    queryState.bodyShapes.length > 0 ||
    queryState.fabricPatterns.length > 0 ||
    queryState.brands.length > 0 ||
    queryState.categoryId ||
    queryState.minPrice ||
    queryState.maxPrice;

  const clearAllFilters = () =>
    updateQuery({
      colors: [],
      sizes: [],
      fabricMaterials: [],
      bodyShapes: [],
      fabricPatterns: [],
      brands: [],
      categoryId: "",
      subcategoryId: "",
      minPrice: "",
      maxPrice: "",
    });

  /* ── Filter panel content (shared between sidebar + mobile drawer) ── */
  const filters = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={cn("text-[16px] font-semibold text-[#2F2925]", customerTheme.headingFont)}>
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[13px] font-medium text-[#954c2a] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#6F625B]">
          Category
        </p>
        <select
          className="h-10 w-full rounded-xl border border-[#e8ddd5] bg-white px-3 text-[14px] text-[#2F2925] outline-none focus:border-[#954c2a]"
          value={queryState.categoryId}
          onChange={(e) => updateQuery({ categoryId: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#6F625B]">
          Price
        </p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={queryState.minPrice}
            onChange={(e) => updateQuery({ minPrice: e.target.value })}
            className="h-10 rounded-xl border-[#e8ddd5] text-[14px] focus:border-[#954c2a]"
          />
          <Input
            type="number"
            placeholder="Max"
            value={queryState.maxPrice}
            onChange={(e) => updateQuery({ maxPrice: e.target.value })}
            className="h-10 rounded-xl border-[#e8ddd5] text-[14px] focus:border-[#954c2a]"
          />
        </div>
      </div>

      {/* Multi-select filter groups */}
      {filterGroups.map(([key, label, values]) => (
        <fieldset key={key} className="space-y-2">
          <legend className="text-[13px] font-semibold uppercase tracking-wide text-[#6F625B]">
            {label}
          </legend>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const active = queryState[key].includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleMulti(key, value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                    active
                      ? "border-[#9c6b54] bg-[#9c6b54] text-white"
                      : "border-[#e8ddd5] bg-white text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54]",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div>
        <p className="text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">
          Collection
        </p>
        <h1 className={cn("mt-1 text-[32px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
          Shop All
        </h1>
      </div>

      {/* ── Search + sort bar ── */}
      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          updateQuery({ search: draftSearch });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9c6b54]" />
          <input
            aria-label="Search products"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder="Search products, brands, fabrics…"
            className="h-11 w-full rounded-xl border border-[#e8ddd5] bg-white pl-10 pr-4 text-[14px] text-[#2F2925] outline-none transition-colors placeholder:text-[#c0a898] focus:border-[#954c2a]"
          />
        </div>
        <button
          type="submit"
          className={cn(
            "h-11 rounded-xl px-6 text-[14px] font-medium text-white transition-opacity hover:opacity-90",
            customerTheme.accentBg,
          )}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 items-center gap-2 rounded-xl border border-[#e8ddd5] bg-white px-4 text-[14px] text-[#9c6b54] transition-colors hover:border-[#9c6b54] lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </form>

      {/* ── Mobile filter drawer ── */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }}
        >
          <div className="ml-auto h-full w-[86vw] max-w-sm overflow-y-auto bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className={cn("text-[18px] font-semibold text-[#2F2925]", customerTheme.headingFont)}>
                Filters
              </h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-1 text-[#9c6b54] hover:bg-[#fef7f0]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filters}
          </div>
        </div>
      )}

      {/* ── Main layout: sidebar + grid ── */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">

        {/* Desktop sidebar */}
        <aside className="hidden rounded-2xl border border-[#e8ddd5] bg-white p-5 lg:block" style={{ alignSelf: "start" }}>
          {filters}
        </aside>

        {/* Product grid area */}
        <div className="space-y-5">

          {/* Results count + sort */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-[#6F625B]">
              {productsQuery.isLoading ? (
                <span className="animate-pulse">Loading…</span>
              ) : (
                <span>
                  <span className="font-semibold text-[#2F2925]">{total}</span>{" "}
                  result{total === 1 ? "" : "s"}
                </span>
              )}
            </p>
            <select
              aria-label="Sort products"
              className="h-10 rounded-xl border border-[#e8ddd5] bg-white px-3 text-[14px] text-[#2F2925] outline-none focus:border-[#954c2a]"
              value={queryState.sort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Compare bar */}
          {compareIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e8ddd5] bg-white px-4 py-3">
              <BarChart2 className="h-4 w-4 shrink-0 text-[#9c6b54]" aria-hidden="true" />
              <span className="text-[13px] font-medium text-[#2F2925]">
                {compareIds.length} of {COMPARE_MAX} selected for comparison
              </span>
              {compareIds.length >= COMPARE_MIN && (
                <Link
                  to={CUSTOMER_ROUTES.compare}
                  className="rounded-full bg-[#9c6b54] px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[#7d5643] transition-colors"
                >
                  Compare now
                </Link>
              )}
              <button
                type="button"
                onClick={clearCompare}
                className="ml-auto text-[13px] text-[#9c6b54] hover:text-[#954c2a]"
              >
                Clear
              </button>
            </div>
          )}

          {/* Products */}
          {productsQuery.isError ? (
            <ApiErrorState
              title="Catalog unavailable"
              message="We couldn't load products."
              onRetry={() => productsQuery.refetch()}
            />
          ) : (
            <ProductGrid
              products={products}
              isLoading={productsQuery.isLoading}
              onToggleCompare={handleToggleCompare}
              compareSelectedIds={compareIds}
              isCompareFull={isFull}
            />
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={queryState.page <= 1}
              onClick={() => updateQuery({ page: queryState.page - 1 }, false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8ddd5] bg-white text-[#9c6b54] transition-colors hover:border-[#9c6b54] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateQuery({ page: p }, false)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border text-[14px] font-medium transition-colors",
                    queryState.page === p
                      ? "border-[#9c6b54] bg-[#9c6b54] text-white"
                      : "border-[#e8ddd5] bg-white text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54]",
                  )}
                >
                  {p}
                </button>
              );
            })}

            {totalPages > 5 && (
              <span className="px-1 text-[#9c6b54]">…</span>
            )}

            <button
              type="button"
              disabled={queryState.page >= totalPages}
              onClick={() => updateQuery({ page: queryState.page + 1 }, false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8ddd5] bg-white text-[#9c6b54] transition-colors hover:border-[#9c6b54] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
