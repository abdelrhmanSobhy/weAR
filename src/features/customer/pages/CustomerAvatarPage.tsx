import { lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AvatarMeasurementGrid,
  CustomerPageHeader,
  InlineState,
} from "@/features/customer/components/account/AccountAvatarShared";
import {
  useCustomerAvatar,
  // useCustomerAvatarHistory, // temporarily disabled
  useDeleteCustomerAvatar,
} from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { TryOnViewerErrorBoundary } from "@/features/customer/try-on/components/TryOnViewerErrorBoundary";
import { getSafeActiveAvatarModelUrl } from "@/features/customer/try-on/utils/modelUrl";
import { appendReturnToCustomerRoute, getSafeCustomerReturnRoute } from "@/features/customer/utils/customerReturnRoute";
import { cn } from "@/lib/utils";

const LazyTryOn3DViewer = lazy(() => import("@/features/customer/try-on/components/TryOn3DViewer"));

const btnPrimary =
  "inline-flex h-11 items-center rounded-xl bg-[#9c6b54] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60";
const btnOutline =
  "inline-flex h-11 items-center rounded-xl border border-[#e8ddd5] px-5 text-sm font-medium text-[#2F2925] transition-colors hover:bg-[#fef7f0] disabled:opacity-60";

export function CustomerAvatarPage() {
  const location = useLocation();
  const returnTo = getSafeCustomerReturnRoute(
    new URLSearchParams(location.search).get("returnTo"),
    CUSTOMER_ROUTES.avatar,
  );
  const avatar = useCustomerAvatar();
  // const history = useCustomerAvatarHistory(); // temporarily disabled
  const deleteAvatar = useDeleteCustomerAvatar();

  if (avatar.isLoading) return <InlineState title="Loading avatar" />;
  if (avatar.isError) return <InlineState tone="error" title="Could not load avatar" />;

  const active = avatar.data;
  const safeModelUrl = getSafeActiveAvatarModelUrl(active);
  // const historyItems = Array.isArray(history.data) ? history.data : history.data?.items;

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Avatar"
        description="Review your avatar measurements, model status, and measurement history."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarManual, returnTo)} className={btnPrimary}>
              Manual measurements
            </Link>
            <Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarPhoto, returnTo)} className={btnOutline}>
              Extract from photo
            </Link>
          </div>
        }
      />

      {!active ? (
        <section className="rounded-2xl border border-[#e8ddd5] bg-white p-6 shadow-sm">
          <h2 className={cn("mb-1 text-lg font-normal", customerTheme.headingFont, customerTheme.darkText)}>
            No avatar yet
          </h2>
          <p className={cn("mb-5 text-sm", customerTheme.mutedText)}>
            Create one manually or extract measurements from a full-body photo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarManual, returnTo)} className={btnPrimary}>
              Create manually
            </Link>
            <Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarPhoto, returnTo)} className={btnOutline}>
              Use photo
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-6">

          {/* Active avatar */}
          <section className="rounded-2xl border border-[#e8ddd5] bg-white p-6 shadow-sm">
            <h2 className={cn("mb-1 text-lg font-normal", customerTheme.headingFont, customerTheme.darkText)}>
              Active avatar
            </h2>
            <p className={cn("mb-5 text-sm", customerTheme.mutedText)}>
              {safeModelUrl
                ? "3D model is available."
                : "Measurements are saved. A 3D model is not yet available — size recommendations still work."}
            </p>

            <AvatarMeasurementGrid measurements={active.measurements} />

            {safeModelUrl && (
              <div className="mt-5 max-h-120 overflow-hidden rounded-2xl">
                <TryOnViewerErrorBoundary
                  resetKey={safeModelUrl}
                  fallback={
                    <div className="rounded-2xl bg-[#fef7f0] p-6 text-sm text-[#6F625B]" role="alert">
                      3D preview is unavailable.
                    </div>
                  }
                >
                  <Suspense
                    fallback={
                      <div className="rounded-2xl bg-[#fef7f0] p-10 text-center text-sm text-[#6F625B]" role="status">
                        Loading 3D preview…
                      </div>
                    }
                  >
                    <LazyTryOn3DViewer modelUrl={safeModelUrl} label="Your 3D avatar" />
                  </Suspense>
                </TryOnViewerErrorBoundary>
              </div>
            )}

            {!safeModelUrl && (
              <p className="mt-4 rounded-2xl bg-[#fef7f0] p-3 text-sm text-[#6F625B]">
                For 3D try-on, recreate your avatar using a full-body photo.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarManual, returnTo)} className={btnPrimary}>
                Edit measurements
              </Link>
              <Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarPhoto, returnTo)} className={btnOutline}>
                Replace via photo
              </Link>
              <button
                type="button"
                disabled={deleteAvatar.isPending}
                onClick={() => { if (window.confirm("Delete your avatar?")) deleteAvatar.mutate(); }}
                className="inline-flex h-11 items-center rounded-xl border border-red-200 px-5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                Delete avatar
              </button>
            </div>
          </section>

          {/* Measurement history — temporarily disabled
          <section className="rounded-2xl border border-[#e8ddd5] bg-white p-6 shadow-sm">
            <h2 className={cn("mb-5 text-lg font-normal", customerTheme.headingFont, customerTheme.darkText)}>
              Measurement history
            </h2>
            {history.isLoading && <InlineState title="Loading history" />}
            {historyItems?.length === 0 && <InlineState title="No measurement history yet" />}
            <div className="space-y-3">
              {historyItems?.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-[#e8ddd5] p-4">
                  <p className={cn("mb-3 font-medium text-sm", customerTheme.darkText)}>
                    {entry.source} · {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                  <AvatarMeasurementGrid measurements={entry.measurements} />
                </div>
              ))}
            </div>
          </section>
          */}

        </div>
      )}

      {deleteAvatar.isError && (
        <InlineState tone="error" title="Could not delete avatar" />
      )}
    </div>
  );
}
