import axios from "axios";
import { ArrowLeft, DoorOpen, RefreshCcw, Shirt, ShoppingBag, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

const safeReturnTo = (value: unknown, fallback: string) =>
  typeof value === "string" && value.startsWith("/customer") && !value.startsWith("//")
    ? value
    : fallback;

const imageFor = (product: { imageUrl?: string | null; images?: { url: string; isPrimary?: boolean }[] }) =>
  product.imageUrl ?? product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null;

const errorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.message ?? error.response?.data?.error?.message;
    if (typeof backendMessage === "string" && backendMessage.trim()) return backendMessage;
    if (status === 401) return "Your session expired. Please sign in again to continue.";
    if (status === 403) return "This try-on is not available for the signed-in customer.";
    if (status === 404) return "The selected product or avatar could not be found.";
    if (status === 422) return "The try-on request could not be processed. Check the selected product and try again.";
    if (!error.response) return "Network timeout or connection failure. Retry when your connection is stable.";
  }
  return "Try-on failed. Your product and selections are preserved so you can retry.";
};

const stagedMessages = ["Preparing your 3D avatar", "Generating the garment model", "Aligning avatar and garment"];
const LazyTryOn3DViewer = lazy(() => import("@/features/customer/try-on/components/TryOn3DViewer"));
type ResultView = "product" | "3d";
type ViewerStatus = "idle" | "loading" | "ready" | "error";

export function CustomerTryOnPage() {
  const { productId: routeProductId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state ?? {}) as { productId?: string; selectedSize?: string; selectedColor?: string; returnTo?: string };
  const initialProductId = routeProductId ?? locationState.productId ?? null;
  const returnTo = safeReturnTo(locationState.returnTo, initialProductId ? CUSTOMER_ROUTES.productDetails(initialProductId) : CUSTOMER_ROUTES.shop);
  const tryOnReturnRoute = initialProductId ? CUSTOMER_ROUTES.tryOnProduct(initialProductId) : CUSTOMER_ROUTES.tryOn;
  const avatarPhotoRoute = appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarPhoto, tryOnReturnRoute);
  const [state, dispatch] = useReducer(tryOnFlowReducer, initialTryOnFlowState(initialProductId, locationState));
  const avatar = useCustomerAvatar();
  const product = useCustomerProduct(state.productId);
  const createSession = useCreateTryOnSession();
  const inFlight = useRef(false);
  const [stageIndex, setStageIndex] = useReducer((value: number) => (value + 1) % stagedMessages.length, 0);
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
        message: "The current backend try-on pipeline needs a photo-generated 3D avatar before it can apply garments.",
      });
      navigate(avatarPhotoRoute);
      return;
    }
    dispatch({ type: "AVATAR_READY", productId: state.productId });
  }, [avatar.data, avatar.error, avatar.isError, avatar.isLoading, avatarPhotoRoute, navigate, safeAvatarModelUrl, state.productId, state.status]);

  const colors = product.data?.colors ?? [];
  const sizes = product.data?.sizes ?? [];
  const variantsValid = (!colors.length || !!state.selectedColor) && (!sizes.length || !!state.selectedSize) && !!state.productId && !!safeAvatarModelUrl;
  const selectedImage = product.data ? imageFor(product.data) : null;

  const submit = () => {
    if (!state.productId || !variantsValid || inFlight.current) return;
    inFlight.current = true;
    dispatch({ type: "SUBMIT" });
    dispatch({ type: "PROCESSING" });
    createSession.mutate(
      { productId: state.productId, sessionType: TRY_ON_SESSION_TYPES.model3D, avatarId: avatar.data?.id ?? null },
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
    () => product.data ? `${product.data.name}${state.selectedSize ? ` · Size ${state.selectedSize}` : ""}${state.selectedColor ? ` · ${state.selectedColor}` : ""}` : "Select a product",
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
    setViewerRetryKey((value) => value + 1);
  };

  if (state.status === "entry" || state.status === "checking-avatar") {
    return (
      <section className="relative -m-4 flex min-h-[78vh] items-center justify-center overflow-hidden rounded-3xl bg-[#2F1D1A] p-6 text-white sm:-m-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.20),transparent_28%),linear-gradient(90deg,#4A1518_0_18%,#7A2527_18%_28%,#3E1215_28%_40%,#8A3030_40%_58%,#3E1215_58%_70%,#7A2527_70%_82%,#4A1518_82%)]" />
        <Button type="button" variant="ghost" onClick={() => navigate(returnTo)} className={cn("absolute left-5 top-5 text-white hover:bg-white/10 hover:text-white", customerTheme.focusRing)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <div className="relative z-10 max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/15"><DoorOpen className="h-8 w-8" /></div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Private fitting room</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Step behind the curtain</h1>
          <p className="mt-4 text-base text-white/85 sm:text-lg">Enter a 3D fitting experience using your photo-generated avatar and selected garment.</p>
          <Button type="button" disabled={state.status === "checking-avatar" || avatar.isLoading} onClick={() => dispatch({ type: "ENTER_ROOM" })} className="mt-8 rounded-full bg-white px-8 text-[#7A2527] hover:bg-[#F4EDE7]">
            <Sparkles className="mr-2 h-4 w-4" />{state.status === "checking-avatar" ? "Checking avatar…" : "Enter Room"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {tryOnCartMessage && <p className="rounded-2xl bg-[#F4EDE7] px-4 py-3 text-sm text-[#4D433D]" role="status" aria-live="polite">{tryOnCartMessage}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate(returnTo)} className={cn("rounded-full", customerTheme.focusRing)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <Link to={CUSTOMER_ROUTES.shop} className={cn("text-sm font-semibold text-[#A37E6B]", customerTheme.focusRing)}>Change Product</Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[#E4DCD1] bg-gradient-to-b from-[#E9D8CB] to-[#FAF7F4] p-5 sm:p-8">
        <div className={cn("grid gap-6 lg:grid-cols-[1fr_380px]", state.status === "processing" && "blur-sm brightness-75")}>
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-[radial-gradient(circle,#fff_0_12%,#D8BCA9_13%_26%,#8F6E5D_27%_28%,transparent_29%)]">
            <div className="text-center">
              <Shirt className="mx-auto h-24 w-24 text-[#8F6E5D]" />
              <h1 className="mt-4 text-3xl font-semibold text-[#2F2925]">Customer Try-on</h1>
              <p className="mt-2 text-[#6F625B]">A 3D try-on scene will render after submission.</p>
            </div>
          </div>

          <aside className={`${customerTheme.card} space-y-5 p-5`} aria-label="Selected product panel">
            {product.isLoading ? <p role="status">Loading selected product…</p> : null}
            {product.isError ? <div role="alert"><h2 className="font-semibold">Product unavailable</h2><p className="text-sm text-[#6F625B]">The product could not be loaded. Choose another product.</p></div> : null}
            {product.data ? <>
              <ProductCard product={product.data} />
              <div className="text-lg"><PriceDisplay price={product.data.price} discountedPrice={product.data.discountedPrice} currency={product.data.currency} /></div>
              {colors.length > 0 && <fieldset><legend className="font-semibold">Color</legend><div className="mt-2 flex flex-wrap gap-2">{colors.map((color) => <button key={color} type="button" onClick={() => dispatch({ type: "SELECT_COLOR", color })} aria-pressed={state.selectedColor === color} className={cn("rounded-full border px-4 py-2 text-sm", state.selectedColor === color ? "border-[#A37E6B] bg-[#F4EDE7]" : "border-[#E4DCD1]", customerTheme.focusRing)}>{color}</button>)}</div></fieldset>}
              {sizes.length > 0 && <fieldset><legend className="font-semibold">Size</legend><div className="mt-2 flex flex-wrap gap-2">{sizes.map((size) => <button key={size} type="button" onClick={() => dispatch({ type: "SELECT_SIZE", size })} aria-pressed={state.selectedSize === size} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", state.selectedSize === size ? "border-[#A37E6B] bg-[#A37E6B] text-white" : "border-[#E4DCD1]", customerTheme.focusRing)}>{size}</button>)}</div></fieldset>}
              {!safeAvatarModelUrl && <p className="rounded-2xl bg-[#F4EDE7] p-3 text-sm text-[#6F625B]">This backend requires a photo-generated 3D avatar for try-on. Use the photo avatar flow first.</p>}
              <Button type="button" disabled={!variantsValid || createSession.isPending || state.status === "processing"} onClick={submit} className={cn("w-full rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)}>Try Product in 3D</Button>
            </> : <div><h2 className="font-semibold">No product selected</h2><p className="text-sm text-[#6F625B]">Open a product details page, then choose Try On.</p></div>}
          </aside>
        </div>

        {state.status === "processing" && <div className="absolute inset-0 grid place-items-center bg-[#2F2925]/35 p-6"><div className="max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl" role="status" aria-live="polite"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#E4DCD1] border-t-[#A37E6B]" /><h2 className="mt-4 text-xl font-semibold">{stagedMessages[stageIndex]}</h2><p className="mt-2 text-sm text-[#6F625B]">Rendering your fitting result. The selected product remains attached to this session.</p><p className="mt-4 text-sm font-medium text-[#2F2925]">{selectedSummary}</p></div></div>}
      </div>

      {state.status === "error-retryable" && <div className={`${customerTheme.softCard} p-5`} role="alert"><h2 className="font-semibold text-[#2F2925]">Try-on needs another attempt</h2><p className="mt-1 text-sm text-[#6F625B]">{state.errorMessage}</p><Button type="button" onClick={submit} disabled={!variantsValid || createSession.isPending} className="mt-4 rounded-full"><RefreshCcw className="mr-2 h-4 w-4" />Retry with saved selections</Button></div>}

      {state.status === "error-avatar-required" && <div className={`${customerTheme.softCard} p-5`} role="alert"><h2 className="font-semibold">3D avatar required</h2><p className="text-sm text-[#6F625B]">Create or update your avatar from a full-body photo, then return to this fitting room.</p><Button type="button" onClick={() => navigate(avatarPhotoRoute)} className="mt-4 rounded-full">Create photo avatar</Button></div>}

      {state.status === "completed-2d" && state.session && <div className={`${customerTheme.card} grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px]`}>
        <div className="space-y-4">
          <div role="tablist" aria-label="Try-on result views" className="inline-flex rounded-full border border-[#E4DCD1] bg-[#F4EDE7] p-1">
            <button type="button" role="tab" aria-selected={resultView === "3d"} aria-controls="try-on-3d-panel" onClick={select3d} disabled={!selectedModelUrl} className={cn("rounded-full px-4 py-2 text-sm font-semibold", resultView === "3d" ? "bg-white text-[#2F2925] shadow-sm" : "text-[#6F625B]", customerTheme.focusRing)}>3D Result</button>
            <button type="button" role="tab" aria-selected={resultView === "product"} aria-controls="try-on-product-panel" onClick={selectProductImage} className={cn("rounded-full px-4 py-2 text-sm font-semibold", resultView === "product" ? "bg-white text-[#2F2925] shadow-sm" : "text-[#6F625B]", customerTheme.focusRing)}>Product Image</button>
          </div>

          {resultView === "3d" && selectedModelUrl ? <div id="try-on-3d-panel" role="tabpanel" aria-label={hasTryOnModel ? "3D garment try-on result" : "Your 3D avatar"} className="space-y-3"><Suspense fallback={<div className="rounded-3xl bg-[#F4EDE7] p-10 text-center" role="status" aria-live="polite"><h3 className="text-lg font-semibold">Loading 3D view</h3><p className="mt-2 text-sm text-[#6F625B]">Preparing interactive model.</p></div>}><TryOnViewerErrorBoundary resetKey={viewerRetryKey} onError={() => setViewerStatus("error")} fallback={<div className="rounded-3xl bg-[#F4EDE7] p-6" role="alert"><p className="font-semibold">3D view is unavailable.</p><Button type="button" onClick={retryViewer} className="mt-4 rounded-full">Retry 3D</Button></div>}><LazyTryOn3DViewer key={`${viewerRetryKey}-${selectedModelUrl}`} modelUrl={selectedModelUrl} label={hasTryOnModel ? "3D garment try-on result" : "Your 3D avatar"} onLoading={() => setViewerStatus("loading")} onReady={() => setViewerStatus("ready")} onError={() => setViewerStatus("error")} /></TryOnViewerErrorBoundary></Suspense>{viewerStatus === "loading" && <p role="status" aria-live="polite" className="text-sm font-medium text-[#6F625B]">Loading 3D view. Preparing interactive model.</p>}{viewerStatus === "ready" && <p className="text-sm font-medium text-[#6F625B]">3D view ready.</p>}{viewerStatus === "error" && <div role="alert" className="rounded-2xl bg-[#F4EDE7] p-4 text-sm"><p className="font-semibold">3D view is unavailable.</p><Button type="button" variant="outline" onClick={retryViewer} className="mt-3 rounded-full">Retry 3D</Button></div>}</div> : <div id="try-on-product-panel" role="tabpanel" aria-label="Product image fallback">{selectedImage ? <img src={selectedImage} alt={product.data?.name ?? "selected product"} className="max-h-[640px] w-full rounded-3xl object-contain bg-[#F4EDE7]" /> : <div className="rounded-3xl bg-[#F4EDE7] p-10 text-center">Product image unavailable.</div>}</div>}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">{hasTryOnModel ? "3D try-on complete" : "Session complete"}</p>
          <h2 className="text-2xl font-semibold">{product.data?.name ?? "Selected product"}</h2>
          <p className="text-[#6F625B]">{selectedSummary}</p>
          {!hasTryOnModel && <p className="rounded-2xl bg-[#F4EDE7] p-3 text-sm text-[#6F625B]">The backend did not return a 3D result URL for this session, so the product image is shown as a fallback.</p>}
          {(state.session.sizeRecommendation || state.session.recommendedSize) && <p className="rounded-2xl bg-[#F4EDE7] p-3 font-semibold">Recommended size: {state.session.sizeRecommendation ?? state.session.recommendedSize}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={submit} disabled={createSession.isPending} className="rounded-full">Retry</Button>
            <Button type="button" variant="outline" onClick={() => navigate(CUSTOMER_ROUTES.shop)} className="rounded-full">Change Product</Button>
            {state.productId && <Button type="button" variant="outline" onClick={() => navigate(CUSTOMER_ROUTES.productDetails(state.productId ?? ""))} className="rounded-full">Return to Product Details</Button>}
            {product.data && <Button type="button" className={cn("rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)} onClick={() => { addToCart({ productId: product.data.id, productName: product.data.name, productImage: imageFor(product.data), brand: product.data.brand ?? null, unitPrice: product.data.price, discountedPrice: product.data.discountedPrice ?? null, selectedSize: state.selectedSize ?? null, selectedColor: state.selectedColor ?? null, productRoute: CUSTOMER_ROUTES.productDetails(product.data.id), tryOnResultImage: hasTryOnModel ? null : selectedImage }); setTryOnCartMessage(`Added to cart: ${product.data.name}.`); }} aria-label={`Add ${product.data.name} to cart`}><ShoppingBag className="mr-2 h-4 w-4" />Add to Cart</Button>}
          </div>
        </div>
      </div>}
    </section>
  );
}
