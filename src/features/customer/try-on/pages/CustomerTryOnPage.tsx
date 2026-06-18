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
import { TRY_ON_SESSION_TYPES, canUse2DTryOn, canUse3DTryOn, initialTryOnFlowState, tryOnFlowReducer } from "@/features/customer/try-on/types/tryOn";
import { useRepairAvatarSourceImage } from "@/features/customer/queries/profileAvatar.queries";
import { getSafeActiveAvatarModelUrl, toSafeModelUrl } from "@/features/customer/try-on/utils/modelUrl";
import { appendReturnToCustomerRoute } from "@/features/customer/utils/customerReturnRoute";
import { cn } from "@/lib/utils";

type TryOnMode = "3d" | "2d";
type ViewerStatus = "idle" | "loading" | "ready" | "error";

/* ── Helpers ── */
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

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage =
      error.response?.data?.message ?? error.response?.data?.error?.message;
    if (typeof backendMessage === "string" && backendMessage.trim()) return backendMessage;
    if (status === 401) return "Your session expired. Please sign in again to continue.";
    if (status === 403) return "This try-on is not available for the signed-in customer.";
    if (status === 404) return "The selected product or avatar could not be found.";
    if (status === 422) return "The try-on request could not be processed. Check the selected product and try again.";
    if (status === 503 || status === 400) return "The backend does not currently support this try-on mode. Please try again later.";
    if (!error.response) return "Network timeout or connection failure. Retry when your connection is stable.";
  }
  return "Try-on failed. Your product and selections are preserved so you can retry.";
};

const extractTraceId = (error: unknown): string | null => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.traceId ?? error.response?.data?.TraceId ?? null;
  }
  return null;
};

const stagedMessages3d = [
  "Preparing your 3D avatar",
  "Generating the garment model",
  "Aligning avatar and garment",
];

const stagedMessages2d = [
  "Preparing your image",
  "Overlaying the garment",
  "Finalising 2D result",
];

const LazyTryOn3DViewer = lazy(
  () => import("@/features/customer/try-on/components/TryOn3DViewer"),
);

export function CustomerTryOnPage() {
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

  const [tryOnMode, setTryOnMode] = useState<TryOnMode>("3d");
  const [state, dispatch] = useReducer(
    tryOnFlowReducer,
    initialTryOnFlowState(initialProductId, locationState),
  );
  const avatar = useCustomerAvatar();
  const product = useCustomerProduct(state.productId);
  const createSession = useCreateTryOnSession();
  const repairSourceImage = useRepairAvatarSourceImage();
  const inFlight = useRef(false);
  const [stageIndex, setStageIndex] = useReducer(
    (value: number) => (value + 1) % stagedMessages3d.length,
    0,
  );
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>("idle");
  const [viewerRetryKey, setViewerRetryKey] = useState(0);
  const [errorTraceId, setErrorTraceId] = useState<string | null>(null);
  const addToCart = useCartStore((store) => store.addItem);
  const [tryOnCartMessage, setTryOnCartMessage] = useState<string | null>(null);

  const safeAvatarModelUrl = getSafeActiveAvatarModelUrl(avatar.data);

  /* prefer resultModelUrl, fall back to resultImageUrl for backwards compat */
  const resultModelUrl =
    toSafeModelUrl(state.session?.resultModelUrl) ??
    toSafeModelUrl(state.session?.resultImageUrl);

  /* In 3D mode: show result if available, else base avatar */
  const selected3dModelUrl =
    state.status === "completed-2d" && tryOnMode === "3d"
      ? resultModelUrl ?? safeAvatarModelUrl
      : safeAvatarModelUrl;

  const hasTryOnModel = Boolean(resultModelUrl) && tryOnMode === "3d";

  /* 2D preview: backend may supply these fields */
  const avatar2dPreviewUrl =
    avatar.data?.avatar2dImageUrl ?? avatar.data?.avatarFrontImageUrl ?? null;

  /* Result for 2D mode */
  const result2dImageUrl =
    tryOnMode === "2d" && state.status === "completed-2d"
      ? state.session?.resultImageUrl ?? null
      : null;

  const result2dModelUrl =
    tryOnMode === "2d" && state.status === "completed-2d" &&
    (state.session?.resultType === "Model3D" || (!state.session?.resultImageUrl && state.session?.resultModelUrl))
      ? state.session?.resultModelUrl ?? null
      : null;

  const selectedImage = product.data ? imageFor(product.data) : null;

  useEffect(() => {
    if (state.status !== "processing") return;
    const id = window.setInterval(setStageIndex, 1600);
    return () => window.clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "checking-avatar") return;
    if (avatar.isLoading) return;
    if (avatar.isError) {
      dispatch({ type: "RETRYABLE_ERROR", message: extractErrorMessage(avatar.error) });
      return;
    }

    if (tryOnMode === "3d") {
      if (!canUse3DTryOn(avatar.data) || !safeAvatarModelUrl) {
        if (canUse2DTryOn(avatar.data)) {
          /* 3D unavailable but 2D is ready — enter room anyway; UI will guide user to switch */
          dispatch({ type: "AVATAR_READY", productId: state.productId });
          return;
        }
        if (!avatar.data) {
          dispatch({
            type: "AVATAR_MISSING",
            message: "Create a photo-based avatar before trying on products.",
          });
          navigate(avatarPhotoRoute);
          return;
        }
        dispatch({
          type: "AVATAR_MISSING",
          message:
            "The current backend try-on pipeline needs a photo-generated 3D avatar before it can apply garments.",
        });
        navigate(avatarPhotoRoute);
        return;
      }
    } else {
      /* 2D mode: requires 2D capability (sourceImageUrl or avatar image) */
      if (!avatar.data) {
        dispatch({
          type: "AVATAR_MISSING",
          message: "A customer avatar record is required before trying on products.",
        });
        navigate(avatarPhotoRoute);
        return;
      }
      if (!canUse2DTryOn(avatar.data)) {
        dispatch({
          type: "AVATAR_MISSING",
          message: "Your avatar does not have a source image for 2D try-on. Use the repair option on the Avatar page or recreate your avatar from a photo.",
        });
        navigate(avatarPhotoRoute);
        return;
      }
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
    tryOnMode,
  ]);

  const colors = product.data?.colors ?? [];
  const sizes = product.data?.sizes ?? [];

  const variantsValid =
    (!colors.length || !!state.selectedColor) &&
    (!sizes.length || !!state.selectedSize) &&
    !!state.productId &&
    (tryOnMode === "2d" ? canUse2DTryOn(avatar.data) : canUse3DTryOn(avatar.data) && !!safeAvatarModelUrl);

  const submit = () => {
    if (!state.productId || !variantsValid || inFlight.current) return;
    inFlight.current = true;
    setErrorTraceId(null);
    dispatch({ type: "SUBMIT" });
    dispatch({ type: "PROCESSING" });
    createSession.mutate(
      {
        productId: state.productId,
        sessionType:
          tryOnMode === "2d"
            ? TRY_ON_SESSION_TYPES.overlay2D
            : TRY_ON_SESSION_TYPES.model3D,
        avatarId: avatar.data?.id ?? null,
      },
      {
        onSuccess: (session) => {
          inFlight.current = false;
          setViewerStatus("idle");
          dispatch({ type: "COMPLETE_2D", session });
        },
        onError: (error) => {
          inFlight.current = false;
          setErrorTraceId(extractTraceId(error));
          dispatch({ type: "RETRYABLE_ERROR", message: extractErrorMessage(error) });
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

  const retryViewer = () => {
    setViewerStatus("loading");
    setViewerRetryKey((v) => v + 1);
  };

  const stagedMessages = tryOnMode === "2d" ? stagedMessages2d : stagedMessages3d;

  /* ─────────────────────────────────────────────────────────────────────
     Entry state — fitting-room curtain aesthetic
  ───────────────────────────────────────────────────────────────────── */
  if (state.status === "entry" || state.status === "checking-avatar") {
    return (
      <section className="relative -mx-4 -my-8 flex min-h-[82vh] items-center justify-center overflow-hidden sm:-mx-6 lg:-mx-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #3d1f0f 0%, #6b3120 25%, #9c6b54 50%, #c9a07a 70%, #f5ede6 100%)",
          }}
        />
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-[#f5ede6]/20 blur-3xl" />
        </div>

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

        <div className="relative z-10 max-w-lg px-6 text-center text-white">
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
            Enter your private fitting experience. Try on any garment with
            your avatar before you buy.
          </p>

          {/* Mode selector */}
          <div className="mt-6 flex justify-center">
            <div
              role="group"
              aria-label="Try-on mode"
              className="inline-flex rounded-full bg-white/10 p-1 backdrop-blur-sm"
            >
              <button
                type="button"
                aria-pressed={tryOnMode === "3d"}
                onClick={() => setTryOnMode("3d")}
                className={cn(
                  "rounded-full px-5 py-2 text-[13px] font-semibold transition-colors",
                  tryOnMode === "3d"
                    ? "bg-white text-[#6b3120]"
                    : "text-white/80 hover:text-white",
                  customerTheme.focusRing,
                )}
              >
                3D Avatar Try-On
              </button>
              <button
                type="button"
                aria-pressed={tryOnMode === "2d"}
                onClick={() => setTryOnMode("2d")}
                className={cn(
                  "rounded-full px-5 py-2 text-[13px] font-semibold transition-colors",
                  tryOnMode === "2d"
                    ? "bg-white text-[#6b3120]"
                    : "text-white/80 hover:text-white",
                  customerTheme.focusRing,
                )}
              >
                2D Image Try-On
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={state.status === "checking-avatar" || avatar.isLoading}
            onClick={() => dispatch({ type: "ENTER_ROOM" })}
            className={cn(
              "mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[16px] font-semibold text-[#6b3120] transition-opacity hover:opacity-90 disabled:opacity-60",
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

  const isCompleted = state.status === "completed-2d" && !!state.session;
  const isProcessing = state.status === "processing";

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

        {/* Mode selector (in-room) */}
        <div
          role="group"
          aria-label="Try-on mode"
          className="inline-flex rounded-full border border-[#e8ddd5] bg-white p-1"
        >
          <button
            type="button"
            aria-pressed={tryOnMode === "3d"}
            onClick={() => {
              if (tryOnMode !== "3d") {
                setTryOnMode("3d");
                dispatch({ type: "RESET_ENTRY" });
              }
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
              tryOnMode === "3d"
                ? "bg-[#9c6b54] text-white"
                : "text-[#6F625B] hover:text-[#9c6b54]",
              customerTheme.focusRing,
            )}
          >
            3D Avatar
          </button>
          <button
            type="button"
            aria-pressed={tryOnMode === "2d"}
            onClick={() => {
              if (tryOnMode !== "2d") {
                setTryOnMode("2d");
                dispatch({ type: "RESET_ENTRY" });
              }
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
              tryOnMode === "2d"
                ? "bg-[#9c6b54] text-white"
                : "text-[#6F625B] hover:text-[#9c6b54]",
              customerTheme.focusRing,
            )}
          >
            2D Image
          </button>
        </div>

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
            isProcessing && "blur-sm brightness-90",
          )}
        >
          {/* Main viewer area */}
          <div
            className="flex min-h-[420px] items-stretch overflow-hidden rounded-2xl bg-white/40 backdrop-blur-sm"
            style={{ border: "1px solid rgba(156,107,84,0.15)" }}
          >
            {tryOnMode === "3d" ? (
              selected3dModelUrl ? (
                <div className="flex w-full flex-col">
                  <p className="px-4 pt-3 text-[12px] font-semibold uppercase tracking-widest text-[#9c6b54]">
                    {hasTryOnModel ? "3D garment try-on result" : "Your 3D avatar"}
                  </p>
                  <div className="flex-1">
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center p-10 text-center" role="status" aria-live="polite">
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
                          <div className="p-6" role="alert">
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
                          key={`${viewerRetryKey}-${selected3dModelUrl}`}
                          modelUrl={selected3dModelUrl}
                          label={hasTryOnModel ? "3D garment try-on result" : "Your 3D avatar"}
                          onLoading={() => setViewerStatus("loading")}
                          onReady={() => setViewerStatus("ready")}
                          onError={() => setViewerStatus("error")}
                        />
                      </TryOnViewerErrorBoundary>
                    </Suspense>
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
                </div>
              ) : (
                <div className="flex w-full items-center justify-center p-8 text-center text-[#9c6b54]">
                  <div>
                    <Shirt className="mx-auto h-20 w-20 opacity-40" />
                    <p className={cn("mt-4 text-[20px] font-normal", customerTheme.headingFont)}>
                      Your fitting room
                    </p>
                    <p className="mt-2 text-[14px] text-[#9c6b54]/70">
                      Create a photo avatar to see your 3D preview here
                    </p>
                  </div>
                </div>
              )
            ) : (
              /* 2D mode viewer */
              <div className="flex w-full flex-col">
                <p className="px-4 pt-3 text-[12px] font-semibold uppercase tracking-widest text-[#9c6b54]">
                  {isCompleted ? "2D try-on result" : "2D preview"}
                </p>
                <div className="flex flex-1 items-center justify-center p-4">
                  {isCompleted && result2dModelUrl ? (
                    <div className="rounded-2xl bg-white/60 p-8 text-center text-[#9c6b54]">
                      <p className="font-medium text-[15px]">3D model result available.</p>
                      <a
                        href={result2dModelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("mt-3 inline-block text-[14px] underline hover:opacity-80", customerTheme.focusRing)}
                      >
                        Open 3D model
                      </a>
                    </div>
                  ) : isCompleted && result2dImageUrl ? (
                    <img
                      src={result2dImageUrl}
                      alt="2D try-on result"
                      className="max-h-[560px] w-full rounded-xl object-contain"
                    />
                  ) : avatar2dPreviewUrl ? (
                    <img
                      src={avatar2dPreviewUrl}
                      alt="Your 2D avatar preview"
                      className="max-h-[560px] w-full rounded-xl object-contain"
                    />
                  ) : (
                    <div className="rounded-2xl bg-white/60 p-8 text-center text-[#9c6b54]">
                      <Shirt className="mx-auto h-16 w-16 opacity-40" />
                      <p className="mt-4 text-[15px] font-medium">
                        2D preview will appear after generation.
                      </p>
                      <p className="mt-2 text-[13px] text-[#9c6b54]/70">
                        The backend must support 2D try-on.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product panel */}
          <aside
            className="space-y-5 rounded-2xl border border-[#e8ddd5] bg-white p-5"
            aria-label="Selected product panel"
          >
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#9c6b54]">
                Fitting Room
              </p>
              {avatar.data && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    avatar.data.has2DCapability
                      ? "bg-green-50 text-green-700"
                      : "bg-[#fef7f0] text-[#9c6b54]",
                  )}>
                    {avatar.data.has2DCapability ? "2D Ready" : "2D unavailable"}
                  </span>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    avatar.data.has3DCapability
                      ? "bg-green-50 text-green-700"
                      : "bg-[#fef7f0] text-[#9c6b54]",
                  )}>
                    {avatar.data.has3DCapability ? "3D Ready" : "3D unavailable"}
                  </span>
                </div>
              )}
              {avatar.data && !avatar.data.sourceImageUrl && !avatar.data.has2DCapability && (
                <button
                  type="button"
                  disabled={repairSourceImage.isPending}
                  onClick={() => repairSourceImage.mutate()}
                  className={cn(
                    "mt-2 rounded-lg border border-[#9c6b54] px-3 py-1 text-[12px] font-medium text-[#9c6b54] hover:bg-[#9c6b54] hover:text-white transition-colors disabled:opacity-50",
                    customerTheme.focusRing,
                  )}
                >
                  {repairSourceImage.isPending ? "Repairing…" : "Repair avatar source image"}
                </button>
              )}
            </div>

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

                {tryOnMode === "3d" && !safeAvatarModelUrl && (
                  <p className="rounded-xl bg-[#fef7f0] p-3 text-[13px] text-[#9c6b54]">
                    This backend requires a photo-generated 3D avatar for try-on. Use the photo
                    avatar flow first.
                  </p>
                )}

                <button
                  type="button"
                  disabled={!variantsValid || createSession.isPending || isProcessing}
                  onClick={submit}
                  className={cn(
                    "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50",
                    customerTheme.accentBg,
                    customerTheme.focusRing,
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  {tryOnMode === "2d" ? "Try Product in 2D" : "Try Product in 3D"}
                </button>

                {isCompleted && (
                  <div className="space-y-2 border-t border-[#e8ddd5] pt-4">
                    <p className="text-[13px] text-[#9c6b54]">{selectedSummary}</p>
                    {(state.session?.sizeRecommendation || state.session?.recommendedSize) && (
                      <p className="rounded-xl bg-[#fef7f0] px-4 py-3 text-[14px] font-semibold text-[#2F2925]">
                        Recommended size:{" "}
                        {state.session.sizeRecommendation ?? state.session.recommendedSize}
                      </p>
                    )}
                    {tryOnMode === "3d" && !hasTryOnModel && (
                      <p className="rounded-xl bg-[#fef7f0] p-3 text-[13px] text-[#9c6b54]">
                        The backend did not return a 3D result URL for this session; showing base avatar.
                      </p>
                    )}
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
                        "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-white transition-opacity hover:opacity-90",
                        customerTheme.accentBg,
                        customerTheme.focusRing,
                      )}
                      aria-label={`Add ${product.data.name} to cart`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={createSession.isPending}
                      className={cn(
                        "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#9c6b54] text-[14px] font-medium text-[#9c6b54] transition-colors hover:bg-[#9c6b54] hover:text-white disabled:opacity-50",
                        customerTheme.focusRing,
                      )}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Try Again
                    </button>
                    {state.productId && (
                      <button
                        type="button"
                        onClick={() => navigate(CUSTOMER_ROUTES.productDetails(state.productId ?? ""))}
                        className={cn(
                          "flex h-11 w-full items-center justify-center rounded-xl border border-[#e8ddd5] text-[14px] font-medium text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54] transition-colors",
                          customerTheme.focusRing,
                        )}
                      >
                        Return to Product Details
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(CUSTOMER_ROUTES.shop)}
                      className={cn(
                        "flex h-11 w-full items-center justify-center rounded-xl border border-[#e8ddd5] text-[14px] font-medium text-[#6F625B] hover:border-[#9c6b54] hover:text-[#9c6b54] transition-colors",
                        customerTheme.focusRing,
                      )}
                    >
                      Change Product
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h2 className={cn("font-semibold text-[#2F2925]", customerTheme.headingFont)}>
                  No product selected
                </h2>
                <p className="mt-1 text-[13px] text-[#6F625B]">
                  Open a product details page, then choose Try On.
                </p>
                <Link
                  to={CUSTOMER_ROUTES.shop}
                  className={cn(
                    "mt-3 inline-block text-[14px] font-medium text-[#9c6b54] hover:text-[#954c2a]",
                    customerTheme.focusRing,
                  )}
                >
                  Browse products →
                </Link>
              </div>
            )}
          </aside>
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 grid place-items-center bg-[#2F2925]/30 p-6 backdrop-blur-sm">
            <div
              className="w-full max-w-sm rounded-2xl border border-[#e8ddd5] bg-white p-8 text-center shadow-xl"
              role="status"
              aria-live="polite"
            >
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
          {errorTraceId && (
            <p className="mt-1 font-mono text-[12px] text-[#9c6b54]">
              Reference: <span data-testid="error-trace-id">{errorTraceId}</span>
            </p>
          )}
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
            {tryOnMode === "3d" ? "3D avatar required" : "Avatar required"}
          </h2>
          <p className="mt-1 text-[14px] text-[#6F625B]">
            {tryOnMode === "3d"
              ? "Create or update your avatar from a full-body photo, then return to this fitting room."
              : "Create a customer avatar, then return to this fitting room."}
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
    </section>
  );
}
