import type React from "react";
import axios from "axios";
import { lazy, Suspense, useState } from "react";
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
  useRepairAvatarSourceImage,
} from "@/features/customer/queries/profileAvatar.queries";
import { validateAvatarImageFile } from "@/features/customer/types/profileAvatar";
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

const extractRepairErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code ?? error.response?.data?.Code;
    if (code === "AvatarSourceImageAlreadyExists") return "This avatar already has a source image. No repair is needed.";
    if (code === "INVALID_FILE_TYPE") return "Please upload a JPEG or PNG image.";
    if (error.response?.status === 404) return "No avatar was found. Please create an avatar first.";
    const msg = error.response?.data?.message ?? error.response?.data?.error?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Repair failed. Please try again.";
};

export function CustomerAvatarPage() {
  const location = useLocation();
  const returnTo = getSafeCustomerReturnRoute(
    new URLSearchParams(location.search).get("returnTo"),
    CUSTOMER_ROUTES.avatar,
  );
  const avatar = useCustomerAvatar();
  // const history = useCustomerAvatarHistory(); // temporarily disabled
  const deleteAvatar = useDeleteCustomerAvatar();
  const repairSourceImage = useRepairAvatarSourceImage();
  const [repairFile, setRepairFile] = useState<File | null>(null);
  const [repairRetry3D, setRepairRetry3D] = useState(true);
  const [repairFileError, setRepairFileError] = useState<string | null>(null);
  const [repairApiError, setRepairApiError] = useState<string | null>(null);
  const [repairSuccessMsg, setRepairSuccessMsg] = useState<string | null>(null);

  const onRepairFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setRepairFileError(null);
    setRepairApiError(null);
    setRepairSuccessMsg(null);
    if (!file) { setRepairFile(null); return; }
    try { validateAvatarImageFile(file); setRepairFile(file); }
    catch (err) { setRepairFile(null); setRepairFileError(err instanceof Error ? err.message : "Invalid file"); }
  };

  const onRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairFile) { setRepairFileError("Please choose a front-view JPEG or PNG image."); return; }
    setRepairApiError(null);
    setRepairSuccessMsg(null);
    repairSourceImage.mutate(
      { frontImageFile: repairFile, retryGenerate3D: repairRetry3D },
      {
        onSuccess: (updated) => {
          setRepairFile(null);
          if (updated.has2DCapability && updated.has3DCapability) {
            setRepairSuccessMsg("2D try-on is now available. 3D try-on is now available too.");
          } else if (updated.has2DCapability) {
            setRepairSuccessMsg("2D try-on is now available. 3D is still unavailable, but you can use 2D now.");
          } else {
            setRepairSuccessMsg("Repair complete. Avatar updated.");
          }
        },
        onError: (err) => {
          const code = axios.isAxiosError(err) ? (err.response?.data?.code ?? err.response?.data?.Code) : null;
          if (code === "AvatarSourceImageAlreadyExists") {
            setRepairSuccessMsg("This avatar already has a source image. No repair is needed.");
            avatar.refetch();
          } else {
            setRepairApiError(extractRepairErrorMessage(err));
          }
        },
      },
    );
  };

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
            <div className="mb-4 flex flex-wrap gap-2">
              <span className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                active.has2DCapability ? "bg-green-50 text-green-700" : "bg-[#fef7f0] text-[#9c6b54]",
              )}>
                {active.has2DCapability ? "2D Ready" : "2D unavailable"}
              </span>
              <span className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                active.has3DCapability ? "bg-green-50 text-green-700" : "bg-[#fef7f0] text-[#9c6b54]",
              )}>
                {active.has3DCapability ? "3D Ready" : "3D unavailable"}
              </span>
            </div>

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
            {!active.has2DCapability && !active.sourceImageUrl && (
              <div className="mt-4 rounded-2xl border border-[#e8ddd5] bg-[#fef7f0] p-4">
                <p className="text-sm font-medium text-[#2F2925]">Your original photo is missing</p>
                <p className="mt-1 text-sm text-[#6F625B]">
                  Upload your front-view photo again to activate virtual try-on without losing your measurements.
                </p>
                <form onSubmit={onRepairSubmit} className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="repairFrontImage" className="mb-1 block text-xs font-medium text-[#2F2925]">
                      Front-view photo (JPEG or PNG, max 10 MB)
                    </label>
                    <input
                      id="repairFrontImage"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={onRepairFileChange}
                      className="block w-full text-sm text-[#6F625B] file:mr-3 file:rounded-lg file:border-0 file:bg-[#9c6b54] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                    />
                    {repairFile && <p className="mt-1 text-xs text-[#6F625B]">Selected: {repairFile.name}</p>}
                    {repairFileError && <p className="mt-1 text-xs text-red-600">{repairFileError}</p>}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#2F2925]">
                    <input
                      type="checkbox"
                      checked={repairRetry3D}
                      onChange={(e) => setRepairRetry3D(e.target.checked)}
                      className="rounded"
                    />
                    Try to regenerate 3D avatar too
                  </label>
                  <button
                    type="submit"
                    disabled={repairSourceImage.isPending || !repairFile}
                    className={cn(btnOutline, "text-[#9c6b54] border-[#9c6b54] hover:bg-[#9c6b54] hover:text-white disabled:opacity-50")}
                  >
                    {repairSourceImage.isPending ? "Repairing…" : "Repair avatar source image"}
                  </button>
                  {repairSuccessMsg && <p className="text-sm text-green-700">{repairSuccessMsg}</p>}
                  {repairApiError && <p className="text-sm text-red-600">{repairApiError}</p>}
                </form>
              </div>
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
