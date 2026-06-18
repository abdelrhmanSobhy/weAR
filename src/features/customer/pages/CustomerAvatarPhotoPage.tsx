import type React from "react";
import axios from "axios";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AvatarMeasurementGrid, CustomerPageHeader, Field, InlineState } from "@/features/customer/components/account/AccountAvatarShared";
import { useExtractCustomerAvatarFromImage } from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { getSafeCustomerReturnRoute } from "@/features/customer/utils/customerReturnRoute";
import { TryOnViewerErrorBoundary } from "@/features/customer/try-on/components/TryOnViewerErrorBoundary";
import { toSafeModelUrl } from "@/features/customer/try-on/utils/modelUrl";
import { validateAvatarImageFile } from "@/features/customer/types/profileAvatar";
import type { CustomerAvatar } from "@/features/customer/types/profileAvatar";

const LazyTryOn3DViewer = lazy(() => import("@/features/customer/try-on/components/TryOn3DViewer"));

const extractErrorMessage = (error: unknown): { message: string; fieldErrors?: Record<string, string[]> } => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const code = data?.code;
    const fieldErrors = data?.errors && typeof data.errors === "object" && !Array.isArray(data.errors)
      ? data.errors as Record<string, string[]>
      : undefined;
    const msg = data?.message ?? data?.error?.message ?? (Array.isArray(data?.errors) ? data.errors[0] : null);
    if (code === "AI_EXTRACTION_FAILED" || code === "INVALID_FILE_TYPE") {
      return { message: msg ?? "The AI model could not process the uploaded images. Please upload clear full-body front and side-view photos with plain background and form-fitting clothes.", fieldErrors };
    }
    if (error.response?.status === 415) {
      return { message: "Avatar extraction must be sent as multipart/form-data. Please retry after refreshing the page." };
    }
    if (error.response?.status === 422 || error.response?.status === 400) {
      return { message: msg ?? "Validation failed. Check that both images are JPEG/PNG under 10 MB and height is valid.", fieldErrors };
    }
    if (!error.response) return { message: "Network error. Check your connection and try again." };
    return { message: msg ?? "Extraction failed. Try another photo pair or enter measurements manually.", fieldErrors };
  }
  return { message: "Extraction failed. Try another photo pair or enter measurements manually." };
};

const extractTraceId = (error: unknown): string | null => {
  if (axios.isAxiosError(error)) {
    const traceId = error.response?.data?.traceId;
    return typeof traceId === "string" && traceId.trim() ? traceId : null;
  }
  return null;
};

export function CustomerAvatarPhotoPage() {
  const navigate = useNavigate(); const location = useLocation();
  const returnTo = getSafeCustomerReturnRoute(new URLSearchParams(location.search).get("returnTo"), CUSTOMER_ROUTES.avatar);
  const returnsToTryOn = returnTo.includes("try-on");
  const extract = useExtractCustomerAvatarFromImage();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [sideFile, setSideFile] = useState<File | null>(null);
  const [heightCm, setHeightCm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [result, setResult] = useState<CustomerAvatar | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const extractionStages = ["Analyzing your images…", "Extracting measurements…", "Generating your 3D avatar…", "This can take up to 1–2 minutes while we extract measurements and generate your 3D avatar…"];
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (extract.isPending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the staged-message index when a new extraction begins
      setStageIndex(0);
      stageTimer.current = setInterval(() => setStageIndex((i) => Math.min(i + 1, extractionStages.length - 1)), 7000);
    } else {
      if (stageTimer.current) { clearInterval(stageTimer.current); stageTimer.current = null; }
    }
    return () => { if (stageTimer.current) clearInterval(stageTimer.current); };
  }, [extract.isPending, extractionStages.length]);
  const frontPreviewUrl = useMemo(() => frontFile ? URL.createObjectURL(frontFile) : null, [frontFile]);
  const sidePreviewUrl = useMemo(() => sideFile ? URL.createObjectURL(sideFile) : null, [sideFile]);
  useEffect(() => () => { if (frontPreviewUrl) URL.revokeObjectURL(frontPreviewUrl); }, [frontPreviewUrl]);
  useEffect(() => () => { if (sidePreviewUrl) URL.revokeObjectURL(sidePreviewUrl); }, [sidePreviewUrl]);
  const resetForm = () => { setFrontFile(null); setSideFile(null); setResult(null); setError(null); setFieldErrors(null); setTraceId(null); };
  const onFileChange = (setter: (file: File | null) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setResult(null); setError(null); setFieldErrors(null); setTraceId(null);
    if (!next) { setter(null); return; }
    try { validateAvatarImageFile(next); setter(next); }
    catch (err) { setter(null); setError(err instanceof Error ? err.message : "Invalid image file"); }
  };
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!frontFile) { setError("Choose a JPEG or PNG front-view full-body image."); return; }
    if (!sideFile) { setError("Choose a JPEG or PNG side-view full-body image."); return; }
    const parsedHeight = Number(heightCm);
    if (!Number.isFinite(parsedHeight) || parsedHeight < 1) { setError("Height in centimeters is required."); return; }
    extract.mutate({ frontImageFile: frontFile, sideImageFile: sideFile, heightCm: parsedHeight }, {
      onSuccess: (data) => { setResult(data); setError(null); setFieldErrors(null); setTraceId(null); },
      onError: (err) => { const parsed = extractErrorMessage(err); setError(parsed.message); setFieldErrors(parsed.fieldErrors ?? null); setTraceId(extractTraceId(err)); },
    });
  };
  const safeModelUrl = result ? toSafeModelUrl(result.avatar3dModelUrl) : null;
  const submitDisabled = extract.isPending || !frontFile || !sideFile || !(Number(heightCm) >= 1 && Number(heightCm) <= 300);
  return (
    <div className="space-y-6">
      <CustomerPageHeader title="Photo avatar extraction" description="Upload one front-view and one side-view full-body JPEG or PNG image (up to 10 MB each) and provide your height." />

      <Card className="border-[#E4DCD1] bg-[#FAF7F4]">
        <CardHeader>
          <CardTitle className="text-base">Photo guidelines — for best results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 text-sm text-[#4D433D] sm:grid-cols-2">
            <li>Stand straight with arms slightly away from your sides — FRONT VIEW</li>
            <li>Stand straight with arms slightly away from your sides — SIDE VIEW</li>
            <li>Wear form-fitting clothing for both photos (sportswear works well)</li>
            <li>Use a plain, light-coloured background for both</li>
            <li>Ensure even lighting with no strong shadows</li>
            <li>Your full body must be visible — head to feet in both photos</li>
          </ul>
        </CardContent>
      </Card>

      {error ? <div><InlineState tone="error" title={error} />{traceId ? <p className="mt-1 text-xs text-[#6F625B]">Reference: {traceId}</p> : null}</div> : null}
      {fieldErrors ? (
        <div className="rounded-2xl border border-[#E4DCD1] bg-[#FBF2F0] p-4 text-sm text-[#7A2E2E]" role="alert">
          <ul className="grid gap-1">
            {Object.entries(fieldErrors).map(([key, messages]) => (
              <li key={key}><span className="font-semibold">{key}:</span> {messages.join(" ")}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload photos</CardTitle>
            <CardDescription>The images are used for processing and are not stored after extraction.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <Field id="frontImageFile" label="Front full-body image">
                <Input id="frontImageFile" name="frontImageFile" type="file" accept="image/jpeg,image/png" onChange={onFileChange(setFrontFile)} aria-describedby="frontImageFile-hint" />
                <p id="frontImageFile-hint" className="text-xs text-[#6F625B]">Clear front-view photo. JPEG or PNG, maximum 10 MB.</p>
              </Field>
              {frontFile ? <p className="text-sm text-[#4D433D]">Selected front: {frontFile.name}</p> : null}
              {frontPreviewUrl ? <img src={frontPreviewUrl} alt="Selected front avatar source preview" className="max-h-64 rounded-2xl border object-contain" /> : null}
              <Field id="sideImageFile" label="Side full-body image">
                <Input id="sideImageFile" name="sideImageFile" type="file" accept="image/jpeg,image/png" onChange={onFileChange(setSideFile)} aria-describedby="sideImageFile-hint" />
                <p id="sideImageFile-hint" className="text-xs text-[#6F625B]">Clear side-view photo. JPEG or PNG, maximum 10 MB.</p>
              </Field>
              {sideFile ? <p className="text-sm text-[#4D433D]">Selected side: {sideFile.name}</p> : null}
              {sidePreviewUrl ? <img src={sidePreviewUrl} alt="Selected side avatar source preview" className="max-h-64 rounded-2xl border object-contain" /> : null}
              <Field id="heightCm" label="Height in centimeters">
                <Input id="heightCm" name="heightCm" type="number" min={1} max={300} required value={heightCm} onChange={(event) => setHeightCm(event.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitDisabled}>
                  {extract.isPending ? extractionStages[stageIndex] : "Extract measurements"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Replace images</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted measurement review</CardTitle>
            <CardDescription>
              {safeModelUrl
                ? "Your measurements and 3D avatar were generated successfully."
                : result
                  ? "Measurements were saved successfully, but no 3D avatar model was returned by the backend."
                  : "Results appear here after processing."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result
              ? <>
                  <AvatarMeasurementGrid measurements={result.measurements} />
                  {safeModelUrl
                    ? <div className="max-h-[480px] overflow-hidden">
                        <TryOnViewerErrorBoundary resetKey={safeModelUrl} fallback={<div className="rounded-3xl bg-[#F4EDE7] p-6 text-sm" role="alert"><p className="font-semibold">3D preview is unavailable.</p></div>}>
                          <Suspense fallback={<div className="rounded-3xl bg-[#F4EDE7] p-10 text-center text-sm" role="status">Loading 3D preview…</div>}>
                            <LazyTryOn3DViewer modelUrl={safeModelUrl} label="Your generated 3D avatar" />
                          </Suspense>
                        </TryOnViewerErrorBoundary>
                      </div>
                    : null}
                  <div className="flex flex-wrap gap-2">
                    {safeModelUrl
                      ? returnsToTryOn
                        ? <Button onClick={() => navigate(returnTo)}>Continue to try-on</Button>
                        : <Button onClick={() => navigate(returnTo)}>Done</Button>
                      : returnsToTryOn
                        ? <>
                            <Button onClick={resetForm}>Try another photo pair</Button>
                            <Button variant="outline" onClick={() => navigate(CUSTOMER_ROUTES.avatar)}>Go to avatar</Button>
                          </>
                        : <Button onClick={() => navigate(returnTo)}>Done</Button>}
                  </div>
                </>
              : <InlineState title="No extracted measurements yet" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
