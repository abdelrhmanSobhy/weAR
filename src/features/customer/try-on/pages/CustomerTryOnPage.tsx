import axios from "axios";
import { ArrowLeft, RefreshCcw, Shirt, ShoppingBag, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { PriceDisplay, ProductCard } from "@/features/customer/components/product";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { useCustomerProduct } from "@/features/customer/queries/catalog.queries";
import { useCustomerAvatar } from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { TryOnViewerErrorBoundary } from "@/features/customer/try-on/components/TryOnViewerErrorBoundary";
import { useCreateTryOnSession } from "@/features/customer/try-on/hooks/tryOn.queries";
import { TRY_ON_SESSION_TYPES, initialTryOnFlowState, tryOnFlowReducer } from "@/features/customer/try-on/types/tryOn";
import { getSafeActiveAvatarModelUrl, toSafeModelUrl } from "@/features/customer/try-on/utils/modelUrl";
import { appendReturnToCustomerRoute } from "@/features/customer/utils/customerReturnRoute";
import { cn } from "@/lib/utils";

/* ── Helpers (unchanged) ── */
const safeReturnTo = (value: unknown, fallback: string) =>
  typeof value === "string" && value.startsWith("/customer") && !value.startsWith("//")
    ? value
    : fallback;

const imageFor = (product: {
  imageUrl?: string | null;
  images?: { url: string; isPrimary?: boolean }[];
}) =>
  product.imageUrl ??
  product.images?.find((i) => i.isPrimary)?.url ??
  product.images?.[0]?.url ??
  null;

const errorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage =
      error.response?.data?.message ?? error.response?.data?.error?.message;
    if (typeof backendMessage === "string" && backendMessage.trim()) return backendMessage;
    if (status === 401) return "Your session expired. Please sign in again to continue.";
    if (status === 403) return "This try-on is not available for the signed-in customer.";
    if (status === 404) return "The selected product or avatar could not be found.";
    if (status === 422) return "The try-on request could not be processed. Check the selected product and try again.";
    if (!error.response) return "Network timeout or connection failure. Retry when your connection is stable.";
  }
  return "Try-on failed. Your product and selections are preserved so you can retry.";
};

const stagedMessages = [
  "Preparing your 3D avatar",
  "Generating the garment model",
  "Aligning avatar and garment",
];

const LazyTryOn3DViewer = lazy(
  () => import("@/features/customer/try-on/components/TryOn3DViewer"),
);

type ResultView = "product" | "3d";
type ViewerStatus = "idle" | "loading" | "ready" | "error";

export function CustomerTryOnPage() {
  /* ── All existing state / hooks unchanged ── */
  const { productId: routeProductId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state ?? {}) as {
    productId?: string;
    selectedSize?: string;
    selectedColor?: string;
    returnTo?: string;
  };
  const initialProductId = routeProductId ?? locationState.productId ?? null;
  const returnTo = safeReturnTo(
    locationState.returnTo,
    initialProductId
      ? CUSTOMER_ROUTES.productDetails(initialProductId)
      : CUSTOMER_ROUTES.shop,
  );
  const tryOnReturnRoute = initialProductId
    ? CUSTOMER_ROUTES.tryOnProduct(initialProductId)
    : CUSTOMER_ROUTES.tryOn;
  const avatarPhotoRoute = appendReturnToCustomerRoute(
    CUSTOMER_ROUTES.avatarPhoto,
    tryOnReturnRoute,
  );
  const [state, dispatch] = useReducer(
    tryOnFlowReducer,
    initialTryOnFlowState(initialProductId, locationState),
  );
  const avatar = useCustomerAvatar();
  const product = useCustomerProduct(state.productId);
  const createSession = useCreateTryOnSession();
  const inFlight = useRef(false);
  const [stageIndex, setStageIndex] = useReducer(
    (value: number) => (value + 1) % stagedMessages.length,
    0,
  );
  const [resultView, setResultView] = useState<ResultView>("3d");
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>("idle");
  const [viewerRetryKey, setViewerRetryKey] = useState(0);
  const addToCart = useCartStore((store) => store.addItem);
  const [tryOnCartMessage, setTryOnCartMessage] = useState<string | null>(null);

  const safeAvatarModelUrl = getSafeActiveAvatarModelUrl(avatar.data);
  const resultModelUrl = toSafeModelUrl(state.session?.resultImageUrl);
  const selectedModelUrl = resultModelUrl ?? safeAvatarModelUrl;
  const hasTryOnModel = Boolean(resultModelUrl);

  useEffect(() => {
    if (state.status !== "processing") return;
    const id = window.setInterval(setStageIndex, 1600);
    return () => window.clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "checking-avatar") return;
    if (avatar.isLoading) return;
    if (avatar.isError) {
      dispatch({ type: "RETRYABLE_ERROR", message: errorMessage(avatar.error) });
      return;
    }
    if (!avatar.data || !safeAvatarModelUrl) {
      dispatch({
        type: "AVATAR_MISSING",
        message:
          "The current backend try-on pipeline needs a photo-generated 3D avatar before it can apply garments.",
      });
      navigate(avatarPhotoRoute);
      return;
    }
    dispatch({ type: "AVATAR_READY", productId: state.productId });
  }, [
    avatar.data,
    avatar.error,
    avatar.isError,
    avatar.isLoading,
    avatarPhotoRoute,
    navigate,
    safeAvatarModelUrl,
    state.productId,
    state.status,
  ]);

  const colors = product.data?.colors ?? [];
  const sizes = product.data?.sizes ?? [];
  const variantsValid =
    (!colors.length || !!state.selectedColor) &&
    (!sizes.length || !!state.selectedSize) &&
    !!state.productId &&
    !!safeAvatarModelUrl;
  const selectedImage = product.data ? imageFor(product.data) : null;

  const submit = () => {
    if (!state.productId || !variantsValid || inFlight.current) return;
    inFlight.current = true;
    dispatch({ type: "SUBMIT" });
    dispatch({ type: "PROCESSING" });
    createSession.mutate(
      {
        productId: state.productId,
        sessionType: TRY_ON_SESSION_TYPES.model3D,
        avatarId: avatar.data?.id ?? null,
      },
      {
        onSuccess: (session) => {
          inFlight.current = false;
          setResultView(toSafeModelUrl(session.resultImageUrl) ? "3d" : "product");
          setViewerStatus("idle");
          dispatch({ type: "COMPLETE_2D", session });
        },
        onError: (error) => {
          inFlight.current = false;
          dispatch({ type: "RETRYABLE_ERROR", message: errorMessage(error) });
        },
      },
    );
  };

  const selectedSummary = useMemo(
    () =>
      product.data
        ? `${product.data.name}${state.selectedSize ? ` · Size ${state.selectedSize}` : ""}${state.selectedColor ? ` · ${state.selectedColor}` : ""}`
        : "Select a product",
    [product.data, state.selectedColor, state.selectedSize],
  );

  const selectProductImage = () => setResultView("product");
  const select3d = () => {
    if (!selectedModelUrl) return;
    setResultView("3d");
    if (viewerStatus === "idle") setViewerStatus("loading");
  };
  const retryViewer = () => {
    setViewerStatus("loading");
    setViewerRetryKey((v) => v + 1);
  };

  /* ─────────────────────────────────────────────────────────────────────
     Entry state — redesigned with warm fitting-room aesthetic
  ───────────────────────────────────────────────────────────────────── */
  if (state.status === "entry" || state.status === "checking-avatar") {
    return (
      <section className="relative -mx-4 -my-8 flex min-h-[82vh] items-center justify-center overflow-hidden sm:-mx-6 lg:-mx-10">
        {/* Warm curtain-style background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #3d1f0f 0%, #6b3120 25%, #9c6b54 50%, #c9a07a 70%, #f5ede6 100%)",
          }}
        />
        {/* Decorative vertical curtain folds */}
        <div className="pointer-events-none absolute inset-0">
          {[10, 28, 46, 64, 82].map((left) => (
            <div
              key={left}
              className="absolute inset-y-0 w-px"
              style={{
                left: `${left}%`,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.15))",
              }}
            />
          ))}
        </div>
        {/* Warm light glow at center */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-[#f5ede6]/20 blur-3xl" />
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className={cn(
            "absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors",
            customerTheme.focusRing,
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Content */}
        <div className="relative z-10 max-w-lg px-6 text-center text-white">
          {/* Logo mark */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <svg width="40" height="40" viewBox="0 0 44 44" fill="none" aria-hidden="true">
              <g opacity="0.9">
                <path d="M22 4 L24 18 L22 22 L20 18 Z" fill="white" />
                <path d="M22 40 L24 26 L22 22 L20 26 Z" fill="white" />
                <path d="M4 22 L18 20 L22 22 L18 24 Z" fill="white" />
                <path d="M40 22 L26 20 L22 22 L26 24 Z" fill="white" />
                <path d="M8.69 8.69 L18.5 17.5 L22 22 L17.5 18.5 Z" fill="white" opacity="0.7" />
                <path d="M35.31 35.31 L25.5 26.5 L22 22 L26.5 25.5 Z" fill="white" opacity="0.7" />
                <path d="M35.31 8.69 L26.5 18.5 L22 22 L25.5 17.5 Z" fill="white" opacity="0.7" />
                <path d="M8.69 35.31 L17.5 25.5 L22 22 L18.5 26.5 Z" fill="white" opacity="0.7" />
                <circle cx="22" cy="22" r="3.5" fill="white" />
              </g>
            </svg>
          </div>

          <span className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-[13px] font-medium tracking-wide">
            Virtual Fitting Room
          </span>

          <h1
            className={cn(
              "mt-3 text-[44px] font-normal leading-tight sm:text-[56px]",
              customerTheme.headingFont,
            )}
          >
            Step Behind
            <br />
            <em>the Curtain</em>
          </h1>

          <p className="mt-5 text-[16px] leading-relaxed text-white/80">
            Enter your private 3D fitting experience. Try on any garment with
            your photo-generated avatar before you buy.
          </p>

          <button
            type="button"
            disabled={state.status === "checking-avatar" || avatar.isLoading}
            onClick={() => dispatch({ type: "ENTER_ROOM" })}
            className={cn(
              "mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[16px] font-semibold text-[#6b3120] transition-opacity hover:opacity-90 disabled:opacity-60",
              customerTheme.focusRing,
            )}
          >
            <Sparkles className="h-5 w-5" />
            {state.status === "checking-avatar" ? "Checking avatar…" : "Enter Room"}
          </button>
        </div>
      </section>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────
     Main try-on / result states
  ───────────────────────────────────────────────────────────────────── */
  return (
    <section className="space-y-6">

      {/* Cart confirmation toast */}
      {tryOnCartMessage && (
        <p
          className="rounded-xl border border-[#e8ddd5] bg-[#fef7f0] px-4 py-3 text-[14px] text-[#6F625B]"
          role="status"
          aria-live="polite"
        >
          {tryOnCartMessage}
        </p>
      )}

      {/* Top nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className={cn(
            "flex items-center gap-2 rounded-full border border-[#e8ddd5] bg-white px-4 py-2 text-[14px] text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54] transition-colors",
            customerTheme.focusRing,
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Link
          to={CUSTOMER_ROUTES.shop}
          className={cn(
            "text-[14px] font-medium text-[#9c6b54] hover:text-[#954c2a]",
            customerTheme.focusRing,
          )}
        >
          Change Product
        </Link>
      </div>

      {/* Fitting room panel */}
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #f5ede6 0%, #edddd0 50%, #e4cfc0 100%)",
        }}
      >
        <div
          className={cn(
            "grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_360px]",
            state.status === "processing" && "blur-sm brightness-90",
          )}
        >
          {/* Main viewer area */}
          <div
            className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl bg-white/40 backdrop-blur-sm"
            style={{ border: "1px solid rgba(156,107,84,0.15)" }}
          >
            <div className="text-center text-[#9c6b54]">
              <Shirt className="mx-auto h-20 w-20 opacity-40" />
              <p className={cn("mt-4 text-[20px] font-normal", customerTheme.headingFont)}>
                Your fitting room
              </p>
              <p className="mt-2 text-[14px] text-[#9c6b54]/70">
                3D scene renders after submission
              </p>
            </div>
          </div>

          {/* Product panel */}
          <aside
            className="space-y-5 rounded-2xl border border-[#e8ddd5] bg-white p-5"
            aria-label="Selected product panel"
          >
            {product.isLoading && (
              <p role="status" className="text-[14px] text-[#9c6b54]">
                Loading product…
              </p>
            )}
            {product.isError && (
              <div role="alert">
                <h2 className="font-semibold text-[#2F2925]">Product unavailable</h2>
                <p className="mt-1 text-[13px] text-[#6F625B]">
                  The product could not be loaded. Choose another product.
                </p>
              </div>
            )}

            {product.data ? (
              <>
                <ProductCard product={product.data} />
                <div className="text-[18px] font-medium">
                  <PriceDisplay
                    price={product.data.price}
                    discountedPrice={product.data.discountedPrice}
                    currency={product.data.currency}
                  />
                </div>

                {/* Color selector */}
                {colors.length > 0 && (
                  <fieldset className="space-y-2">
                    <legend className="text-[13px] font-semibold text-[#2F2925]">Color</legend>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => dispatch({ type: "SELECT_COLOR", color })}
                          aria-pressed={state.selectedColor === color}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                            state.selectedColor === color
                              ? "border-[#9c6b54] bg-[#9c6b54] text-white"
                              : "border-[#e8ddd5] text-[#2F2925] hover:border-[#9c6b54]",
                            customerTheme.focusRing,
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {/* Size selector */}
                {sizes.length > 0 && (
                  <fieldset className="space-y-2">
                    <legend className="text-[13px] font-semibold text-[#2F2925]">Size</legend>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => dispatch({ type: "SELECT_SIZE", size })}
                          aria-pressed={state.selectedSize === size}
                          className={cn(
                            "min-w-11 rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition-colors",
                            state.selectedSize === size
                              ? "border-[#9c6b54] bg-[#9c6b54] text-white"
                              : "border-[#e8ddd5] text-[#2F2925] hover:border-[#9c6b54]",
                            customerTheme.focusRing,
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {!safeAvatarModelUrl && (
                  <p className="rounded-xl bg-[#fef7f0] p-3 text-[13px] text-[#9c6b54]">
                    This backend requires a photo-generated 3D avatar for try-on. Use the photo
                    avatar flow first.
                  </p>
                )}

                <button
                  type="button"
                  disabled={!variantsValid || createSession.isPending || state.status === "processing"}
                  onClick={submit}
                  className={cn(
                    "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50",
                    customerTheme.accentBg,
                    customerTheme.focusRing,
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Try Product in 3D
                </button>
              </>
            ) : (
              <div>
                <h2 className={cn("font-semibold text-[#2F2925]", customerTheme.headingFont)}>
                  No product selected
                </h2>
                <p className="mt-1 text-[13px] text-[#6F625B]">
                  Open a product details page, then choose Try On.
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* Processing overlay */}
        {state.status === "processing" && (
          <div className="absolute inset-0 grid place-items-center bg-[#2F2925]/30 p-6 backdrop-blur-sm">
            <div
              className="w-full max-w-sm rounded-2xl border border-[#e8ddd5] bg-white p-8 text-center shadow-xl"
              role="status"
              aria-live="polite"
            >
              {/* Animated weAR logo */}
              <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#fef7f0]">
                <svg width="32" height="32" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                  <g opacity="0.9">
                    <path d="M22 4 L24 18 L22 22 L20 18 Z" fill="#9c6b54" />
                    <path d="M22 40 L24 26 L22 22 L20 26 Z" fill="#9c6b54" />
                    <path d="M4 22 L18 20 L22 22 L18 24 Z" fill="#9c6b54" />
                    <path d="M40 22 L26 20 L22 22 L26 24 Z" fill="#9c6b54" />
                    <circle cx="22" cy="22" r="3.5" fill="#9c6b54" />
                  </g>
                </svg>
              </div>
              <div className="mx-auto mb-4 h-1.5 w-40 overflow-hidden rounded-full bg-[#e8ddd5]">
                <div className="h-full w-1/2 animate-[slide_1.6s_ease-in-out_infinite] rounded-full bg-[#9c6b54]" />
              </div>
              <h2 className={cn("text-[18px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
                {stagedMessages[stageIndex]}
              </h2>
              <p className="mt-2 text-[13px] text-[#9c6b54]">{selectedSummary}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error states */}
      {state.status === "error-retryable" && (
        <div
          className="rounded-2xl border border-[#e8ddd5] bg-white p-5"
          role="alert"
        >
          <h2 className={cn("font-semibold text-[#2F2925]", customerTheme.headingFont)}>
            Try-on needs another attempt
          </h2>
          <p className="mt-1 text-[14px] text-[#6F625B]">{state.errorMessage}</p>
          <button
            type="button"
            onClick={submit}
            disabled={!variantsValid || createSession.isPending}
            className={cn(
              "mt-4 flex items-center gap-2 rounded-xl border border-[#9c6b54] px-5 py-2.5 text-[14px] font-medium text-[#9c6b54] hover:bg-[#9c6b54] hover:text-white transition-colors disabled:opacity-50",
              customerTheme.focusRing,
            )}
          >
            <RefreshCcw className="h-4 w-4" />
            Retry with saved selections
          </button>
        </div>
      )}

      {state.status === "error-avatar-required" && (
        <div className="rounded-2xl border border-[#e8ddd5] bg-white p-5" role="alert">
          <h2 className={cn("font-semibold text-[#2F2925]", customerTheme.headingFont)}>
            3D avatar required
          </h2>
          <p className="mt-1 text-[14px] text-[#6F625B]">
            Create or update your avatar from a full-body photo, then return to this fitting room.
          </p>
          <button
            type="button"
            onClick={() => navigate(avatarPhotoRoute)}
            className={cn(
              "mt-4 rounded-xl bg-[#9c6b54] px-5 py-2.5 text-[14px] font-medium text-white hover:opacity-90",
              customerTheme.focusRing,
            )}
          >
            Create photo avatar
          </button>
        </div>
      )}

      {/* Result */}
      {state.status === "completed-2d" && state.session && (
        <div className="grid gap-6 rounded-2xl border border-[#e8ddd5] bg-white p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Viewer */}
          <div className="space-y-4">
            {/* Tab bar */}
            <div
              role="tablist"
              aria-label="Try-on result views"
              className="inline-flex rounded-xl border border-[#e8ddd5] bg-[#fef7f0] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={resultView === "3d"}
                aria-controls="try-on-3d-panel"
                onClick={select3d}
                disabled={!selectedModelUrl}
                className={cn(
                  "rounded-lg px-4 py-2 text-[13px] font-medium transition-colors",
                  resultView === "3d"
                    ? "bg-white text-[#2F2925] shadow-sm"
                    : "text-[#9c6b54] hover:text-[#954c2a]",
                  customerTheme.focusRing,
                )}
              >
                3D Result
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={resultView === "product"}
                aria-controls="try-on-product-panel"
                onClick={selectProductImage}
                className={cn(
                  "rounded-lg px-4 py-2 text-[13px] font-medium transition-colors",
                  resultView === "product"
                    ? "bg-white text-[#2F2925] shadow-sm"
                    : "text-[#9c6b54] hover:text-[#954c2a]",
                  customerTheme.focusRing,
                )}
              >
                Product Image
              </button>
            </div>

            {/* 3D viewer */}
            {resultView === "3d" && selectedModelUrl ? (
              <div id="try-on-3d-panel" role="tabpanel" aria-label={hasTryOnModel ? "3D garment try-on result" : "Your 3D avatar"} className="space-y-3">
                <Suspense
                  fallback={
                    <div className="rounded-2xl bg-[#fef7f0] p-10 text-center" role="status" aria-live="polite">
                      <p className={cn("text-[16px] font-normal text-[#9c6b54]", customerTheme.headingFont)}>
                        Loading 3D view…
                      </p>
                    </div>
                  }
                >
                  <TryOnViewerErrorBoundary
                    resetKey={viewerRetryKey}
                    onError={() => setViewerStatus("error")}
                    fallback={
                      <div className="rounded-2xl bg-[#fef7f0] p-6" role="alert">
                        <p className="font-semibold text-[#2F2925]">3D view is unavailable.</p>
                        <button
                          type="button"
                          onClick={retryViewer}
                          className={cn("mt-3 rounded-xl border border-[#9c6b54] px-4 py-2 text-[13px] font-medium text-[#9c6b54]", customerTheme.focusRing)}
                        >
                          Retry 3D
                        </button>
                      </div>
                    }
                  >
                    <LazyTryOn3DViewer
                      key={`${viewerRetryKey}-${selectedModelUrl}`}
                      modelUrl={selectedModelUrl}
                      label={hasTryOnModel ? "3D garment try-on result" : "Your 3D avatar"}
                      onLoading={() => setViewerStatus("loading")}
                      onReady={() => setViewerStatus("ready")}
                      onError={() => setViewerStatus("error")}
                    />
                  </TryOnViewerErrorBoundary>
                </Suspense>
                {viewerStatus === "loading" && (
                  <p role="status" aria-live="polite" className="text-[13px] text-[#9c6b54]">
                    Loading 3D view…
                  </p>
                )}
                {viewerStatus === "error" && (
                  <div role="alert" className="rounded-xl bg-[#fef7f0] p-4 text-[13px]">
                    <p className="font-semibold text-[#2F2925]">3D view is unavailable.</p>
                    <button
                      type="button"
                      onClick={retryViewer}
                      className={cn("mt-2 rounded-lg border border-[#9c6b54] px-3 py-1.5 text-[#9c6b54]", customerTheme.focusRing)}
                    >
                      Retry 3D
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div id="try-on-product-panel" role="tabpanel" aria-label="Product image fallback">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.data?.name ?? "selected product"}
                    className="max-h-[640px] w-full rounded-2xl bg-[#f5ede6] object-contain"
                  />
                ) : (
                  <div className="rounded-2xl bg-[#fef7f0] p-10 text-center text-[#9c6b54]">
                    Product image unavailable.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result info sidebar */}
          <div className="space-y-5">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#9c6b54]">
                {hasTryOnModel ? "3D try-on complete" : "Session complete"}
              </p>
              <h2 className={cn("mt-1 text-[22px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
                {product.data?.name ?? "Selected product"}
              </h2>
              <p className="mt-1 text-[13px] text-[#9c6b54]">{selectedSummary}</p>
            </div>

            {!hasTryOnModel && (
              <p className="rounded-xl bg-[#fef7f0] p-3 text-[13px] text-[#9c6b54]">
                The backend did not return a 3D result URL for this session; the product image is shown
                as a fallback.
              </p>
            )}

            {(state.session.sizeRecommendation || state.session.recommendedSize) && (
              <p className="rounded-xl bg-[#fef7f0] px-4 py-3 text-[14px] font-semibold text-[#2F2925]">
                Recommended size:{" "}
                {state.session.sizeRecommendation ?? state.session.recommendedSize}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {product.data && (
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      productId: product.data.id,
                      productName: product.data.name,
                      productImage: imageFor(product.data),
                      brand: product.data.brand ?? null,
                      unitPrice: product.data.price,
                      discountedPrice: product.data.discountedPrice ?? null,
                      selectedSize: state.selectedSize ?? null,
                      selectedColor: state.selectedColor ?? null,
                      productRoute: CUSTOMER_ROUTES.productDetails(product.data.id),
                      tryOnResultImage: hasTryOnModel ? null : selectedImage,
                    });
                    setTryOnCartMessage(`Added to cart: ${product.data.name}.`);
                  }}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90",
                    customerTheme.accentBg,
                    customerTheme.focusRing,
                  )}
                  aria-label={`Add ${product.data.name} to cart`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart
                </button>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={createSession.isPending}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-xl border border-[#9c6b54] text-[14px] font-medium text-[#9c6b54] transition-colors hover:bg-[#9c6b54] hover:text-white disabled:opacity-50",
                  customerTheme.focusRing,
                )}
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </button>

              <button
                type="button"
                onClick={() => navigate(CUSTOMER_ROUTES.shop)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-xl border border-[#e8ddd5] text-[14px] font-medium text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54] transition-colors",
                  customerTheme.focusRing,
                )}
              >
                Change Product
              </button>

              {state.productId && (
                <button
                  type="button"
                  onClick={() => navigate(CUSTOMER_ROUTES.productDetails(state.productId ?? ""))}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl border border-[#e8ddd5] text-[14px] font-medium text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54] transition-colors",
                    customerTheme.focusRing,
                  )}
                >
                  Return to Product Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
