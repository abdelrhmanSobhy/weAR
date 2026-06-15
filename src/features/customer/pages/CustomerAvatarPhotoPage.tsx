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

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const code = data?.code;
    const msg = data?.message ?? data?.error?.message ?? (Array.isArray(data?.errors) ? data.errors[0] : null);
    if (code === "AI_EXTRACTION_FAILED" || code === "INVALID_FILE_TYPE") {
      return msg ?? "The AI model could not process this image. Please upload a clear full-body front-view photo with plain background and form-fitting clothes.";
    }
    if (error.response?.status === 422) {
      return msg ?? "Validation failed. Check that the image is JPEG/PNG under 5 MB and height is valid.";
    }
    if (!error.response) return "Network error. Check your connection and try again.";
    return msg ?? "Extraction failed. Try another photo or enter measurements manually.";
  }
  return "Extraction failed. Try another photo or enter measurements manually.";
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
  const [file, setFile] = useState<File | null>(null); const [heightCm, setHeightCm] = useState(""); const [error, setError] = useState<string | null>(null); const [result, setResult] = useState<CustomerAvatar | null>(null); const [traceId, setTraceId] = useState<string | null>(null);
  const extractionStages = ["Analyzing your image…", "Extracting measurements…", "Generating your 3D avatar…", "This may take up to 30 seconds…"];
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
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const resetForm = () => { setFile(null); setResult(null); setError(null); setTraceId(null); };
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const next = event.target.files?.[0] ?? null; setResult(null); setError(null); setTraceId(null); if (!next) { setFile(null); return; } try { validateAvatarImageFile(next); setFile(next); } catch (err) { setFile(null); setError(err instanceof Error ? err.message : "Invalid image file"); } };
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) { setError("Choose one JPEG or PNG full-body image."); return; }
    const parsedHeight = Number(heightCm);
    if (!Number.isFinite(parsedHeight) || parsedHeight < 1) { setError("Height in centimeters is required."); return; }
    extract.mutate({ imageFile: file, heightCm: parsedHeight }, {
      onSuccess: (data) => { setResult(data); setError(null); setTraceId(null); },
      onError: (err) => { setError(extractErrorMessage(err)); setTraceId(extractTraceId(err)); },
    });
  };
  const safeModelUrl = result ? toSafeModelUrl(result.avatar3dModelUrl) : null;
  return (
    <div className="space-y-6">
      <CustomerPageHeader title="Photo avatar extraction" description="Upload one full-body JPEG or PNG image up to 5 MB and provide your height." />

      <Card className="border-[#E4DCD1] bg-[#FAF7F4]">
        <CardHeader>
          <CardTitle className="text-base">Photo guidelines — for best results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 text-sm text-[#4D433D] sm:grid-cols-2">
            <li>Stand straight with arms slightly away from your sides</li>
            <li>Wear form-fitting clothing (sportswear works well)</li>
            <li>Face the camera directly — front view only</li>
            <li>Use a plain, light-coloured background</li>
            <li>Ensure even lighting with no strong shadows</li>
            <li>Your full body must be visible — head to feet</li>
          </ul>
        </CardContent>
      </Card>

      {error ? <div><InlineState tone="error" title={error} />{traceId ? <p className="mt-1 text-xs text-[#6F625B]">Reference: {traceId}</p> : null}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload photo</CardTitle>
            <CardDescription>The image is used for processing and is not stored after extraction.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <Field id="imageFile" label="Full-body image">
                <Input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png" onChange={onFileChange} aria-describedby="imageFile-hint" />
                <p id="imageFile-hint" className="text-xs text-[#6F625B]">JPEG or PNG, maximum 5 MB.</p>
              </Field>
              {file ? <p className="text-sm text-[#4D433D]">Selected: {file.name}</p> : null}
              {previewUrl ? <img src={previewUrl} alt="Selected avatar source preview" className="max-h-64 rounded-2xl border object-contain" /> : null}
              <Field id="heightCm" label="Height in centimeters">
                <Input id="heightCm" name="heightCm" type="number" min={1} max={300} required value={heightCm} onChange={(event) => setHeightCm(event.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={extract.isPending}>
                  {extract.isPending ? extractionStages[stageIndex] : "Extract measurements"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Replace image</Button>
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
                  ? "Measurements saved. A 3D model was not generated, so 3D try-on will require another photo attempt."
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
                      : <>
                          <Button onClick={resetForm}>Try another photo</Button>
                          <Button variant="outline" onClick={() => navigate(CUSTOMER_ROUTES.avatar)}>Go to avatar</Button>
                        </>}
                  </div>
                </>
              : <InlineState title="No extracted measurements yet" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
