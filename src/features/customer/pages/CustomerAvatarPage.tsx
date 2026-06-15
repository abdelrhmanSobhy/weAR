import { lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarMeasurementGrid, CustomerPageHeader, InlineState } from "@/features/customer/components/account/AccountAvatarShared";
import { useCustomerAvatar, useCustomerAvatarHistory, useDeleteCustomerAvatar } from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { TryOnViewerErrorBoundary } from "@/features/customer/try-on/components/TryOnViewerErrorBoundary";
import { getSafeActiveAvatarModelUrl } from "@/features/customer/try-on/utils/modelUrl";
import { appendReturnToCustomerRoute, getSafeCustomerReturnRoute } from "@/features/customer/utils/customerReturnRoute";

const LazyTryOn3DViewer = lazy(() => import("@/features/customer/try-on/components/TryOn3DViewer"));

export function CustomerAvatarPage() {
  const location = useLocation();
  const returnTo = getSafeCustomerReturnRoute(new URLSearchParams(location.search).get("returnTo"), CUSTOMER_ROUTES.avatar);
  const avatar = useCustomerAvatar();
  const history = useCustomerAvatarHistory();
  const deleteAvatar = useDeleteCustomerAvatar();
  if (avatar.isLoading) return <InlineState title="Loading avatar" />;
  if (avatar.isError) return <InlineState tone="error" title="Could not load avatar" />;
  const active = avatar.data;
  const safeModelUrl = getSafeActiveAvatarModelUrl(active);
  const historyItems = Array.isArray(history.data) ? history.data : history.data?.items;
  return (
    <div>
      <CustomerPageHeader
        title="Avatar"
        description="Review your avatar measurements, model status, and measurement history."
        actions={<div className="flex flex-wrap gap-2"><Button asChild><Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarManual, returnTo)}>Manual measurements</Link></Button><Button asChild variant="outline"><Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarPhoto, returnTo)}>Extract from photo</Link></Button></div>}
      />
      {!active ? (
        <Card>
          <CardHeader><CardTitle>No avatar yet</CardTitle><CardDescription>Create one manually or extract measurements from a full-body photo.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2"><Button asChild><Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarManual, returnTo)}>Create manually</Link></Button><Button asChild variant="outline"><Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarPhoto, returnTo)}>Use photo</Link></Button></CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>Active avatar summary</CardTitle><CardDescription>{safeModelUrl ? "3D model is available." : "Measurements are saved. A 3D model is not available yet, and that is okay."}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <AvatarMeasurementGrid measurements={active.measurements} />
              {safeModelUrl ? (
                <div className="max-h-[480px] overflow-hidden">
                  <TryOnViewerErrorBoundary resetKey={safeModelUrl} fallback={<div className="rounded-3xl bg-[#F4EDE7] p-6 text-sm" role="alert"><p className="font-semibold">3D preview is unavailable.</p></div>}>
                    <Suspense fallback={<div className="rounded-3xl bg-[#F4EDE7] p-10 text-center text-sm" role="status">Loading 3D preview…</div>}>
                      <LazyTryOn3DViewer modelUrl={safeModelUrl} label="Your 3D avatar" />
                    </Suspense>
                  </TryOnViewerErrorBoundary>
                </div>
              ) : (
                <p className="rounded-2xl bg-[#F4EDE7] p-3 text-sm text-[#6F625B]">3D model is not available. Size recommendations still work. For 3D try-on, use photo avatar.</p>
              )}
              <div className="flex flex-wrap gap-2"><Button asChild><Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarManual, returnTo)}>Edit measurements</Link></Button><Button asChild variant="outline"><Link to={appendReturnToCustomerRoute(CUSTOMER_ROUTES.avatarPhoto, returnTo)}>Replace via photo</Link></Button><Button type="button" variant="destructive" disabled={deleteAvatar.isPending} onClick={() => { if (window.confirm("Delete your avatar?")) deleteAvatar.mutate(); }}>Delete avatar</Button></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Measurement history</CardTitle></CardHeader>
            <CardContent>
              {history.isLoading ? <InlineState title="Loading history" /> : null}
              {historyItems?.length === 0 ? <InlineState title="No measurement history yet" /> : null}
              <div className="grid gap-3">{historyItems?.map((entry) => <div key={entry.id} className="rounded-2xl border border-[#E4DCD1] p-4"><p className="font-medium text-[#2F2925]">{entry.source} · {new Date(entry.createdAt).toLocaleDateString()}</p><div className="mt-3"><AvatarMeasurementGrid measurements={entry.measurements} /></div></div>)}</div>
            </CardContent>
          </Card>
        </div>
      )}
      {deleteAvatar.isError ? <div className="mt-4"><InlineState tone="error" title="Could not delete avatar" /></div> : null}
    </div>
  );
}
