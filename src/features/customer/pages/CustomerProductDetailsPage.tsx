import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, ImageIcon, Ruler, Scale, Shirt, ShoppingBag } from "lucide-react";
import { ApiErrorState, EmptyState, PriceDisplay, ProductRail } from "@/features/customer/components/product";
import { useCustomerProduct, useSimilarCustomerProducts } from "@/features/customer/queries/catalog.queries";
import { useToggleCustomerFavorite } from "@/features/customer/queries/favorites.queries";
import { useComplementaryCustomerProducts, useCustomerSizeRecommendation } from "@/features/customer/queries/recommendations.queries";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { useCompareStore, COMPARE_MAX, COMPARE_MIN } from "@/features/customer/compare/useCompareStore";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import type { CustomerProduct, CustomerProductImage } from "@/features/customer/types/catalog";
import { cn } from "@/lib/utils";

const asList = (value?: string | string[] | null) =>
  Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

const productImages = (product: CustomerProduct): CustomerProductImage[] => {
  const images = [...(product.images ?? [])];
  if (product.imageUrl && !images.some((img) => img.url === product.imageUrl)) {
    images.unshift({ url: product.imageUrl, altText: product.name, isPrimary: true });
  }
  return images.filter((img) => img.url);
};

const isMissingAvatarError = (error: unknown) => {
  const status =
    (error as { response?: { status?: number }; status?: number })?.response?.status ??
    (error as { status?: number })?.status;
  return status === 404;
};

export function CustomerProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const productQuery = useCustomerProduct(productId);
  const similarQuery = useSimilarCustomerProducts(productId);
  const complementaryQuery = useComplementaryCustomerProducts(productId);
  const sizeRecommendationQuery = useCustomerSizeRecommendation(productId);
  const toggleFavorite = useToggleCustomerFavorite();
  const [localState, setLocalState] = useState<{
    productId: string | null;
    selectedImage: number;
    selectedColor: string | null;
    selectedSize: string | null;
    cartMessage: string | null;
    compareMessage: string | null;
  }>({
    productId: null,
    selectedImage: 0,
    selectedColor: null,
    selectedSize: null,
    cartMessage: null,
    compareMessage: null,
  });

  const addToCart = useCartStore((s) => s.addItem);
  const addToCartCooldown = useRef(false);
  const compareIds = useCompareStore((s) => s.productIds);
  const addToCompare = useCompareStore((s) => s.add);
  const removeFromCompare = useCompareStore((s) => s.remove);
  const isCompareSelected = !!productId && compareIds.includes(productId);
  const isCompareFull = compareIds.length >= COMPARE_MAX;

  const product = productQuery.data;
  const images = useMemo(() => (product ? productImages(product) : []), [product]);
  const colors = useMemo(() => product?.colors ?? [], [product?.colors]);
  const sizes = useMemo(() => product?.sizes ?? [], [product?.sizes]);
  const isCurrentProductState = localState.productId === (productId ?? null);
  const selectedImage = isCurrentProductState ? localState.selectedImage : 0;
  const selectedColor = isCurrentProductState
    ? localState.selectedColor
    : colors.length === 1
      ? colors[0]
      : null;
  const selectedSize = isCurrentProductState
    ? localState.selectedSize
    : sizes.length === 1
      ? sizes[0]
      : null;
  const cartMessage = isCurrentProductState ? localState.cartMessage : null;
  const compareMessage = isCurrentProductState ? localState.compareMessage : null;

  const updateLocalState = (patch: Partial<typeof localState>) =>
    setLocalState((cur) => ({
      productId: productId ?? null,
      selectedImage: isCurrentProductState ? cur.selectedImage : 0,
      selectedColor: isCurrentProductState
        ? cur.selectedColor
        : colors.length === 1
          ? colors[0]
          : null,
      selectedSize: isCurrentProductState
        ? cur.selectedSize
        : sizes.length === 1
          ? sizes[0]
          : null,
      cartMessage: null,
      compareMessage: null,
      ...patch,
    }));

  const requiresColor = colors.length > 0;
  const requiresSize = sizes.length > 0;
  const variantsReady =
    (!requiresColor || !!selectedColor) && (!requiresSize || !!selectedSize);

  /* ── Loading / Error / Empty states ── */
  if (productQuery.isLoading) {
    return (
      <div
        className="min-h-130 animate-pulse rounded-2xl bg-[#f0e4d8]"
        aria-label="Loading product details"
      />
    );
  }
  if (productQuery.isError) {
    if (isMissingAvatarError(productQuery.error))
      return <EmptyState title="Product not found" description="This product is no longer available." />;
    return (
      <ApiErrorState
        title="Unable to load product"
        message="We couldn't load this product right now."
        onRetry={() => productQuery.refetch()}
      />
    );
  }
  if (!product)
    return <EmptyState title="Product not found" description="This product is no longer available." />;

  const activeImage = images[selectedImage];
  const disabledReason = !variantsReady
    ? `Select ${requiresColor && !selectedColor ? "a color" : ""}${requiresColor && !selectedColor && requiresSize && !selectedSize ? " and " : ""}${requiresSize && !selectedSize ? "a size" : ""} to continue.`
    : null;

  const featureRows = [
    ["Category", [product.categoryName, product.subcategoryName].filter(Boolean).join(" / ")],
    ["Material", product.fabricMaterial ?? product.material],
    ["Pattern", product.pattern],
    ["Body shape", product.bodyShape],
    ["Stock", product.stockStatus ?? (typeof product.stockQuantity === "number" ? `${product.stockQuantity} available` : null)],
  ].filter(([, v]) => v);

  const care = asList(product.careInstructions);
  const recommendation = sizeRecommendationQuery.data;
  const recommendedSize = recommendation?.recommendedSize ?? recommendation?.size;
  const recommendationExplanation = recommendation?.explanation ?? recommendation?.reason;
  const complementaryProducts = complementaryQuery.data ?? [];
  const showComplementary = complementaryQuery.isSuccess && complementaryProducts.length > 0;
  const similarProducts = similarQuery.data ?? [];

  return (
    <div className="space-y-12">

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-[#9c6b54]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={cn("flex items-center gap-1 hover:text-[#954c2a]", customerTheme.focusRing)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <span aria-hidden="true" className="text-[#e8ddd5]">/</span>
        <Link to={CUSTOMER_ROUTES.shop} className={cn("hover:text-[#954c2a]", customerTheme.focusRing)}>
          Shop
        </Link>
        <span aria-hidden="true" className="text-[#e8ddd5]">/</span>
        <span className="font-medium text-[#2F2925]">{product.name}</span>
      </nav>

      {/* ── Main product section ── */}
      <section
        className="grid gap-8 lg:grid-cols-[1fr_480px]"
        aria-labelledby="product-title"
      >
        {/* Image column */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex flex-row gap-2 sm:flex-col" aria-label="Product images">
              {images.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => updateLocalState({ selectedImage: i })}
                  className={cn(
                    "h-18 w-14.5 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f5ede6] transition-colors",
                    i === selectedImage
                      ? "border-[#9c6b54]"
                      : "border-transparent hover:border-[#e8ddd5]",
                    customerTheme.focusRing,
                  )}
                  aria-label={`Show product image ${i + 1}`}
                  aria-pressed={i === selectedImage}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div className="flex-1 overflow-hidden rounded-2xl bg-[#f5ede6]" style={{ aspectRatio: "4/5" }}>
            {activeImage ? (
              <img
                src={activeImage.url}
                alt={activeImage.altText ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-[#9c6b54]">
                <ImageIcon className="h-12 w-12" aria-hidden="true" />
                <span className="text-[14px]">Image coming soon</span>
              </div>
            )}
          </div>
        </div>

        {/* Info column */}
        <div className="space-y-6">
          {product.brand && (
            <p className="text-[13px] font-semibold uppercase tracking-widest text-[#9c6b54]">
              {product.brand}
            </p>
          )}

          <div>
            <h1
              id="product-title"
              className={cn("text-[32px] font-normal leading-tight text-[#2F2925]", customerTheme.headingFont)}
            >
              {product.name}
            </h1>
            {typeof product.views === "number" && (
              <p className="mt-1 text-[13px] text-[#9c6b54]">
                {product.views.toLocaleString()} views
              </p>
            )}
          </div>

          <div className="text-[24px] font-medium">
            <PriceDisplay
              price={product.price}
              discountedPrice={product.discountedPrice}
              currency={product.currency}
            />
          </div>

          {product.description && (
            <p className="text-[15px] leading-relaxed text-[#6F625B]">
              {product.description}
            </p>
          )}

          {/* Color selector */}
          {colors.length > 0 && (
            <fieldset className="space-y-3">
              <legend className="text-[14px] font-semibold text-[#2F2925]">
                Color{selectedColor && <span className="ml-2 font-normal text-[#9c6b54]">{selectedColor}</span>}
              </legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => updateLocalState({ selectedColor: color })}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors",
                      selectedColor === color
                        ? "border-[#9c6b54] bg-[#9c6b54] text-white"
                        : "border-[#e8ddd5] text-[#2F2925] hover:border-[#9c6b54]",
                      customerTheme.focusRing,
                    )}
                    aria-pressed={selectedColor === color}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <fieldset className="space-y-3">
              <legend className="text-[14px] font-semibold text-[#2F2925]">Size</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => updateLocalState({ selectedSize: size })}
                    className={cn(
                      "min-w-11 rounded-xl border px-4 py-2 text-[13px] font-semibold transition-colors",
                      selectedSize === size
                        ? "border-[#9c6b54] bg-[#9c6b54] text-white"
                        : "border-[#e8ddd5] text-[#2F2925] hover:border-[#9c6b54]",
                      customerTheme.focusRing,
                    )}
                    aria-pressed={selectedSize === size}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {disabledReason && (
            <p className="text-[13px] text-[#9c6b54]" role="status">{disabledReason}</p>
          )}

          {/* Action buttons */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!variantsReady}
              onClick={() => {
                if (addToCartCooldown.current) return;
                addToCartCooldown.current = true;
                addToCart({
                  productId: product.id,
                  productName: product.name,
                  productImage: images[0]?.url ?? product.imageUrl ?? null,
                  brand: product.brand ?? null,
                  unitPrice: product.price,
                  discountedPrice: product.discountedPrice ?? null,
                  selectedSize: selectedSize ?? null,
                  selectedColor: selectedColor ?? null,
                  productRoute: CUSTOMER_ROUTES.productDetails(product.id),
                });
                updateLocalState({
                  cartMessage: `Saved locally — ${product.name}${selectedSize ? `, size ${selectedSize}` : ""}${selectedColor ? `, ${selectedColor}` : ""} added to cart.`,
                });
                setTimeout(() => { addToCartCooldown.current = false; }, 1200);
              }}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50",
                customerTheme.accentBg,
                customerTheme.focusRing,
              )}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>

            <button
              type="button"
              disabled={!variantsReady}
              onClick={() =>
                navigate(`/customer/try-on/${product.id}`, {
                  state: { productId: product.id, selectedSize, selectedColor },
                })
              }
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-xl border border-[#9c6b54] text-[15px] font-medium text-[#9c6b54] transition-colors hover:bg-[#9c6b54] hover:text-white disabled:opacity-50",
                customerTheme.focusRing,
              )}
              aria-label={`Try on ${product.name}`}
            >
              <Shirt className="h-4 w-4" />
              Try On
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite.mutate(product.id)}
              disabled={toggleFavorite.isPending}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-xl border text-[15px] font-medium transition-colors",
                product.isFavorite
                  ? "border-[#9c6b54] bg-[#fef7f0] text-[#9c6b54]"
                  : "border-[#e8ddd5] text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54]",
                customerTheme.focusRing,
              )}
              aria-label={product.isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
            >
              <Heart className={cn("h-4 w-4", product.isFavorite && "fill-current")} />
              {product.isFavorite ? "Favorited" : "Favorite"}
            </button>

            <button
              type="button"
              disabled={!isCompareSelected && isCompareFull}
              aria-pressed={isCompareSelected}
              onClick={() => {
                if (isCompareSelected) {
                  removeFromCompare(product.id);
                  updateLocalState({ compareMessage: `${product.name} removed from comparison.` });
                } else {
                  addToCompare(product.id);
                  const count = compareIds.length + 1;
                  updateLocalState({
                    compareMessage:
                      count >= COMPARE_MIN
                        ? `${product.name} added. View comparison.`
                        : `${product.name} added. Select ${COMPARE_MIN - count} more to compare.`,
                  });
                }
              }}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-xl border text-[15px] font-medium transition-colors",
                isCompareSelected
                  ? "border-[#9c6b54] bg-[#fef7f0] text-[#9c6b54]"
                  : "border-[#e8ddd5] text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54]",
                customerTheme.focusRing,
              )}
              aria-label={
                isCompareSelected
                  ? `Remove ${product.name} from comparison`
                  : isCompareFull
                    ? "Comparison is full"
                    : `Add ${product.name} to comparison`
              }
            >
              <Scale className="h-4 w-4" />
              {isCompareSelected ? "Remove" : isCompareFull ? "Full" : "Compare"}
            </button>
          </div>

          {compareIds.length >= COMPARE_MIN && (
            <Link
              to={CUSTOMER_ROUTES.compare}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-xl border border-[#9c6b54] text-[14px] font-medium text-[#9c6b54] transition-colors hover:bg-[#9c6b54] hover:text-white",
                customerTheme.focusRing,
              )}
            >
              <Scale className="h-4 w-4" />
              View comparison ({compareIds.length})
            </Link>
          )}

          {cartMessage && (
            <p className="text-[13px] text-[#6F625B]" role="status">{cartMessage}</p>
          )}
          {compareMessage && (
            <p className="text-[13px] text-[#6F625B]" role="status">{compareMessage}</p>
          )}
        </div>
      </section>

      {/* ── Info panels ── */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Product information">
        <InfoPanel title="Description">
          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p className="text-[#9c6b54]">No extended product description is available.</p>
          )}
        </InfoPanel>

        {(product.features?.length || featureRows.length) ? (
          <InfoPanel title="Features">
            <dl className="space-y-2">
              {featureRows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-[#9c6b54]">{label}</dt>
                  <dd className="text-right font-medium text-[#2F2925]">{value}</dd>
                </div>
              ))}
            </dl>
            {product.features?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {product.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            ) : null}
          </InfoPanel>
        ) : null}

        {care.length > 0 && (
          <InfoPanel title="Care / Washing">
            <ul className="list-disc space-y-1 pl-5">
              {care.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </InfoPanel>
        )}

        <InfoPanel title="Size recommendation">
          <Ruler className="mb-2 h-5 w-5 text-[#9c6b54]" />
          {sizeRecommendationQuery.isLoading ? (
            <p>Checking your avatar measurements…</p>
          ) : recommendedSize ? (
            <p>
              <strong>Recommended size: {recommendedSize}</strong>
              {recommendation?.confidence ? ` · Confidence ${recommendation.confidence}` : ""}
              {recommendationExplanation && (
                <span className="mt-2 block text-[#9c6b54]">{recommendationExplanation}</span>
              )}
            </p>
          ) : sizeRecommendationQuery.isError && isMissingAvatarError(sizeRecommendationQuery.error) ? (
            <p>
              No avatar found.{" "}
              <Link className="font-semibold text-[#9c6b54] hover:underline" to="/customer/avatar">
                Set up your avatar
              </Link>{" "}
              for a size recommendation.
            </p>
          ) : sizeRecommendationQuery.isError ? (
            <p>Size recommendation is unavailable right now.</p>
          ) : (
            <p>Sign in with a customer avatar to receive size guidance.</p>
          )}
        </InfoPanel>
      </section>

      {/* ── Complementary / Similar ── */}
      {showComplementary && (
        <ProductRail
          title="Complete the Look"
          products={complementaryProducts}
          onToggleFavorite={(id) => toggleFavorite.mutate(id)}
        />
      )}
      {!similarQuery.isError && similarProducts.length > 0 && (
        <ProductRail
          title="Similar products"
          products={similarProducts}
          isLoading={similarQuery.isLoading}
          onToggleFavorite={(id) => toggleFavorite.mutate(id)}
        />
      )}
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e8ddd5] bg-white p-5">
      <h2 className={cn("mb-3 text-[15px] font-semibold text-[#2F2925]", customerTheme.headingFont)}>
        {title}
      </h2>
      <div className="text-[14px] leading-6 text-[#6F625B]">{children}</div>
    </section>
  );
}
