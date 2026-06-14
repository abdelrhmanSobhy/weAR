import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AvatarMeasurementGrid, CustomerPageHeader, Field, InlineState } from "@/features/customer/components/account/AccountAvatarShared";
import { useExtractCustomerAvatarFromImage } from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { getSafeCustomerReturnRoute } from "@/features/customer/utils/customerReturnRoute";
import { validateAvatarImageFile } from "@/features/customer/types/profileAvatar";
import type { CustomerAvatar } from "@/features/customer/types/profileAvatar";

export function CustomerAvatarPhotoPage() {
  const navigate = useNavigate(); const location = useLocation();
  const returnTo = getSafeCustomerReturnRoute(new URLSearchParams(location.search).get("returnTo"), CUSTOMER_ROUTES.avatar);
  const extract = useExtractCustomerAvatarFromImage();
  const [file, setFile] = useState<File | null>(null); const [heightCm, setHeightCm] = useState(""); const [error, setError] = useState<string | null>(null); const [result, setResult] = useState<CustomerAvatar | null>(null);
  const extractionStages = ["Analyzing your image…", "Extracting measurements…", "Generating your 3D avatar…", "This may take up to 30 seconds…"];
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (extract.isPending) {
      setStageIndex(0);
      stageTimer.current = setInterval(() => setStageIndex((i) => Math.min(i + 1, extractionStages.length - 1)), 7000);
    } else {
      if (stageTimer.current) { clearInterval(stageTimer.current); stageTimer.current = null; }
    }
    return () => { if (stageTimer.current) clearInterval(stageTimer.current); };
  }, [extract.isPending, extractionStages.length]);
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const next = event.target.files?.[0] ?? null; setResult(null); setError(null); if (!next) { setFile(null); return; } try { validateAvatarImageFile(next); setFile(next); } catch (err) { setFile(null); setError(err instanceof Error ? err.message : "Invalid image file"); } };
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!file) { setError("Choose one JPEG or PNG full-body image."); return; } const parsedHeight = Number(heightCm); if (!Number.isFinite(parsedHeight) || parsedHeight < 1) { setError("Height in centimeters is required."); return; } extract.mutate({ imageFile: file, heightCm: parsedHeight }, { onSuccess: (data) => { setResult(data); setError(null); } }); };
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

      {error ? <div><InlineState tone="error" title={error} /></div> : null}

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
                <Button type="button" variant="outline" onClick={() => { setFile(null); setResult(null); setError(null); }}>Replace image</Button>
              </div>
            </form>
            {extract.isError ? <div className="mt-4"><InlineState tone="error" title="Extraction failed" description="Try another photo following the guidelines above, or enter measurements manually." /></div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted measurement review</CardTitle>
            <CardDescription>
              {result?.avatar3dModelUrl
                ? "Measurements and 3D model returned successfully."
                : result
                  ? "Measurements saved. A 3D model was not generated — you can still use size recommendations."
                  : "Results appear here after processing."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result
              ? <>
                  <AvatarMeasurementGrid measurements={result.measurements} />
                  <div className="flex gap-2">
                    <Button onClick={() => navigate(returnTo)}>Done</Button>
                    <Button variant="outline" onClick={() => setResult(null)}>Retry</Button>
                  </div>
                </>
              : <InlineState title="No extracted measurements yet" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
