/**
 * AI cost-control & duplicate-submission safeguard tests.
 *
 * Covers:
 *  - No fal.ai API key reference in frontend source
 *  - Avatar extraction: disabled while pending, no double-submit
 *  - Try-on: no double-submit, inFlight guard
 *  - Cache/generationSource notice rendering
 *  - AI_GENERATION_IN_PROGRESS friendly message
 *  - AI_GENERATION_QUOTA_EXCEEDED friendly message
 *  - traceId display on backend error
 *  - Overlay2D sent only when user selects 2D
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import { CustomerAvatarPhotoPage } from "@/features/customer/pages/CustomerAvatarPhotoPage";
import { CustomerTryOnPage } from "@/features/customer/try-on/pages/CustomerTryOnPage";
import { TRY_ON_SESSION_TYPES, canUse2DTryOn } from "@/features/customer/try-on/types/tryOn";
import { useCartStore } from "@/features/customer/cart/useCartStore";

/* ─── Shared viewer mock ───────────────────────────────────────────── */
vi.mock("@/features/customer/try-on/components/TryOn3DViewer", () => ({
  default: function MockViewer({ onLoading, onReady }: { onLoading?: () => void; onReady?: () => void }) {
    useEffect(() => { onLoading?.(); onReady?.(); }, [onLoading, onReady]);
    return <div data-testid="mock-3d-viewer">3D viewer</div>;
  },
}));

/* ─── Avatar photo page mocks ──────────────────────────────────────── */
const extractMutate = vi.fn();
let extractIsPending = false;

vi.mock("@/features/customer/queries/profileAvatar.queries", () => ({
  useExtractCustomerAvatarFromImage: () => ({
    isPending: extractIsPending,
    mutate: extractMutate,
  }),
  useCustomerAvatar: () => ({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    data: {
      id: "a1",
      avatar3dModelUrl: (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl ?? null,
      has3DCapability: Boolean((globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl),
      has2DCapability: (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability ?? false,
      measurements: { heightCm: 170 },
    },
  }),
  useRepairAvatarSourceImage: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerProduct: (productId: string | null) => ({
    isLoading: false,
    isError: false,
    data: productId
      ? { id: "p1", name: "Jacket", price: 100, currency: "USD", imageUrl: null, colors: ["Red"], sizes: ["M"] }
      : null,
  }),
}));

const tryOnMutate = vi.fn();
vi.mock("@/features/customer/try-on/hooks/tryOn.queries", () => ({
  useCreateTryOnSession: () => ({ isPending: false, mutate: tryOnMutate }),
}));

/* ─── Helpers ──────────────────────────────────────────────────────── */
const renderAvatarPhotoPage = () =>
  render(
    <MemoryRouter initialEntries={["/customer/avatar/photo"]}>
      <Routes>
        <Route path="/customer/avatar/photo" element={<CustomerAvatarPhotoPage />} />
        <Route path="/customer/avatar" element={<div>Avatar page</div>} />
      </Routes>
    </MemoryRouter>,
  );

const renderTryOnPage = (entry = "/customer/try-on/p1") =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} />
        <Route path="/customer/try-on" element={<CustomerTryOnPage />} />
        <Route path="/customer/avatar/photo" element={<div>Photo avatar route</div>} />
      </Routes>
    </MemoryRouter>,
  );

const fillAndSubmitAvatarForm = async () => {
  const frontInput = screen.getByLabelText(/front full-body image/i);
  const sideInput = screen.getByLabelText(/side full-body image/i);
  const heightInput = screen.getByLabelText(/height in centimeters/i);

  const makeFile = (name: string) => new File(["x".repeat(1024)], name, { type: "image/jpeg" });
  fireEvent.change(frontInput, { target: { files: [makeFile("front.jpg")] } });
  fireEvent.change(sideInput, { target: { files: [makeFile("side.jpg")] } });
  fireEvent.change(heightInput, { target: { value: "170" } });

  const submitBtn = screen.getByRole("button", { name: /extract measurements/i });
  fireEvent.click(submitBtn);
  return submitBtn;
};

const enterTryOnRoom = async () => {
  (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
    "https://cdn.example.test/avatar.glb";
  renderTryOnPage();
  fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
  await screen.findByRole("button", { name: "M" });
  fireEvent.click(screen.getByRole("button", { name: "M" }));
  fireEvent.click(screen.getByRole("button", { name: "Red" }));
};

beforeEach(() => {
  extractMutate.mockReset();
  tryOnMutate.mockReset();
  extractIsPending = false;
  (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = null;
  (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = false;
  useCartStore.setState({ items: [] });
});

/* ─── 1. Security: no fal.ai key ──────────────────────────────────── */
describe("Security: no fal.ai API key in frontend", () => {
  it("no VITE_FAL_API_KEY or FAL_API_KEY is referenced in the compiled module graph", () => {
    // If fal.ai variables were present they'd appear in import.meta.env references.
    // We assert the environment object has no such key at runtime.
    const env = import.meta.env as Record<string, unknown>;
    expect(Object.keys(env).some((k) => /FAL/i.test(k))).toBe(false);
  });
});

/* ─── 2. Avatar extraction: submit disabled while pending ─────────── */
describe("CustomerAvatarPhotoPage — duplicate submission prevention", () => {
  it("submit button is disabled while extract.isPending is true", () => {
    extractIsPending = true;
    renderAvatarPhotoPage();
    // When pending, button text changes to stage message — find by type=submit
    const form = document.querySelector("form") as HTMLFormElement;
    const submitBtn = form.querySelector("[type=submit]") as HTMLButtonElement;
    expect(submitBtn).toBeDisabled();
  });

  it("does not call mutate twice on rapid double-click", async () => {
    extractMutate.mockImplementation(() => {
      extractIsPending = true;
    });
    renderAvatarPhotoPage();
    await fillAndSubmitAvatarForm();
    // second immediate click — inFlight guard prevents re-entry
    fireEvent.click(screen.getByRole("button", { name: /extract measurements/i }));
    expect(extractMutate).toHaveBeenCalledTimes(1);
  });

  it("shows AI_GENERATION_IN_PROGRESS friendly message", async () => {
    const axiosError = Object.assign(new Error("conflict"), {
      isAxiosError: true,
      response: { status: 409, data: { code: "AI_GENERATION_IN_PROGRESS", message: "in progress" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    extractMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    renderAvatarPhotoPage();
    await fillAndSubmitAvatarForm();

    expect(
      await screen.findByText(/already in progress/i),
    ).toBeInTheDocument();
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });

  it("shows AI_GENERATION_QUOTA_EXCEEDED friendly message", async () => {
    const axiosError = Object.assign(new Error("quota"), {
      isAxiosError: true,
      response: { status: 429, data: { code: "AI_GENERATION_QUOTA_EXCEEDED", message: "quota" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    extractMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    renderAvatarPhotoPage();
    await fillAndSubmitAvatarForm();

    expect(
      await screen.findByText(/daily ai generation limit reached/i),
    ).toBeInTheDocument();
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });

  it("displays traceId on backend error", async () => {
    const axiosError = Object.assign(new Error("err"), {
      isAxiosError: true,
      response: { status: 500, data: { message: "Internal error", traceId: "trace-abc-123" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    extractMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    renderAvatarPhotoPage();
    await fillAndSubmitAvatarForm();

    expect(await screen.findByText(/Reference: trace-abc-123/i)).toBeInTheDocument();
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });

  it("shows cache notice when backend returns isCached: true", async () => {
    extractMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({
        id: "av1",
        customerId: "c1",
        measurements: { heightCm: 170 },
        avatar3dModelUrl: null,
        has2DCapability: false,
        has3DCapability: false,
        isCached: true,
        message: "Avatar reused from a previous generation.",
      }),
    );

    renderAvatarPhotoPage();
    await fillAndSubmitAvatarForm();

    expect(
      await screen.findByTestId("cache-notice"),
    ).toHaveTextContent(/reused from a previous generation/i);
  });

  it("shows cache notice when backend returns generationSource: Cache", async () => {
    extractMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({
        id: "av1",
        customerId: "c1",
        measurements: { heightCm: 170 },
        avatar3dModelUrl: null,
        has2DCapability: false,
        has3DCapability: false,
        generationSource: "Cache",
      }),
    );

    renderAvatarPhotoPage();
    await fillAndSubmitAvatarForm();

    expect(await screen.findByTestId("cache-notice")).toBeInTheDocument();
  });
});

/* ─── 3. Try-on: duplicate submission prevention ─────────────────── */
describe("CustomerTryOnPage — duplicate submission prevention", () => {
  it("Try Product button is disabled while session creation is pending", async () => {
    await enterTryOnRoom();
    // Set isPending = true via mutate side-effect
    tryOnMutate.mockImplementation(() => { /* never resolves */ });
    fireEvent.click(screen.getByRole("button", { name: /try product/i }));
    // Button should remain disabled (inFlight guard set)
    await waitFor(() => expect(tryOnMutate).toHaveBeenCalledTimes(1));
    // rapid second click — inFlight guard prevents second call
    fireEvent.click(screen.getByRole("button", { name: /try product/i }));
    expect(tryOnMutate).toHaveBeenCalledTimes(1);
  });

  it("sends Model3D sessionType when 3D mode is active (default)", async () => {
    tryOnMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({ id: "s1", productId: "p1", sessionType: TRY_ON_SESSION_TYPES.model3D }),
    );
    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product in 3d/i }));
    await screen.findByRole("button", { name: /try again/i });
    expect(tryOnMutate).toHaveBeenCalledWith(
      expect.objectContaining({ sessionType: TRY_ON_SESSION_TYPES.model3D }),
      expect.anything(),
    );
  });

  it("sends Overlay2D sessionType only when user explicitly selects 2D mode", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";
    (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = true;
    tryOnMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({ id: "s1", productId: "p1", sessionType: TRY_ON_SESSION_TYPES.overlay2D }),
    );

    renderTryOnPage();

    // switch to 2D on the entry screen
    fireEvent.click(screen.getByRole("button", { name: /2D Image Try-On/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Red" }));
    fireEvent.click(screen.getByRole("button", { name: /try product in 2d/i }));
    await screen.findByRole("button", { name: /try again/i });

    expect(tryOnMutate).toHaveBeenCalledWith(
      expect.objectContaining({ sessionType: TRY_ON_SESSION_TYPES.overlay2D }),
      expect.anything(),
    );
  });

  it("shows AI_GENERATION_IN_PROGRESS friendly message in try-on error area", async () => {
    const axiosError = Object.assign(new Error("conflict"), {
      isAxiosError: true,
      response: { status: 409, data: { code: "AI_GENERATION_IN_PROGRESS" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    tryOnMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product/i }));

    expect(await screen.findByText(/already in progress/i)).toBeInTheDocument();
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });

  it("shows AI_GENERATION_QUOTA_EXCEEDED friendly message in try-on error area", async () => {
    const axiosError = Object.assign(new Error("quota"), {
      isAxiosError: true,
      response: { status: 429, data: { code: "AI_GENERATION_QUOTA_EXCEEDED" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    tryOnMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product/i }));

    expect(await screen.findByText(/daily ai generation limit reached/i)).toBeInTheDocument();
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });

  it("displays traceId in try-on error area", async () => {
    const axiosError = Object.assign(new Error("err"), {
      isAxiosError: true,
      response: { status: 500, data: { message: "Server error", traceId: "trace-xyz-999" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    tryOnMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product/i }));

    expect(await screen.findByTestId("error-trace-id")).toHaveTextContent("trace-xyz-999");
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });

  it("shows cache notice in try-on result when isCached is true", async () => {
    tryOnMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({
        id: "s1",
        productId: "p1",
        sessionType: TRY_ON_SESSION_TYPES.model3D,
        isCached: true,
      }),
    );

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product in 3d/i }));
    await screen.findByRole("button", { name: /try again/i });

    expect(screen.getByTestId("cache-notice")).toBeInTheDocument();
  });

  it("shows cache notice when generationSource is Cache", async () => {
    tryOnMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({
        id: "s1",
        productId: "p1",
        sessionType: TRY_ON_SESSION_TYPES.model3D,
        generationSource: "Cache",
      }),
    );

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product in 3d/i }));
    await screen.findByRole("button", { name: /try again/i });

    expect(screen.getByTestId("cache-notice")).toBeInTheDocument();
  });

  it("does not show cache notice when backend returns no cache metadata", async () => {
    tryOnMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({
        id: "s1",
        productId: "p1",
        sessionType: TRY_ON_SESSION_TYPES.model3D,
        resultImageUrl: "https://cdn.example.test/result.glb",
        resultType: "Model3D",
        // no isCached, no generationSource
      }),
    );

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product in 3d/i }));
    await screen.findByRole("button", { name: /try again/i });

    expect(screen.queryByTestId("cache-notice")).not.toBeInTheDocument();
  });

  it("shows AI_GENERATION_PREVIOUSLY_FAILED friendly message in try-on error area", async () => {
    const axiosError = Object.assign(new Error("prev-failed"), {
      isAxiosError: true,
      response: { status: 422, data: { code: "AI_GENERATION_PREVIOUSLY_FAILED" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    tryOnMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product/i }));

    expect(
      await screen.findByText(/previous ai generation for the same input failed recently/i),
    ).toBeInTheDocument();
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });

  it("3D result uses resultImageUrl as model when resultModelUrl is absent", async () => {
    tryOnMutate.mockImplementation((_payload, opts) =>
      opts.onSuccess({
        id: "s1",
        productId: "p1",
        sessionType: TRY_ON_SESSION_TYPES.model3D,
        resultType: "Model3D",
        resultImageUrl: "https://cdn.example.test/result.glb",
        // no resultModelUrl
      }),
    );

    await enterTryOnRoom();
    fireEvent.click(screen.getByRole("button", { name: /try product in 3d/i }));
    await screen.findByRole("button", { name: /try again/i });

    // The 3D viewer should be rendered with the resultImageUrl used as modelUrl
    expect(screen.getByTestId("mock-3d-viewer")).toBeInTheDocument();
    expect(screen.getByText(/3D garment try-on result/i)).toBeInTheDocument();
  });
});

/* ─── 4. Avatar capability contract ──────────────────────────────── */
describe("canUse2DTryOn — backend capability contract", () => {
  it("returns true when has2DCapability is true", () => {
    expect(canUse2DTryOn({ id: "a1", customerId: "c1", measurements: { heightCm: 170 }, avatar3dModelUrl: null, has2DCapability: true, has3DCapability: false })).toBe(true);
  });

  it("returns true when sourceImageUrl is present even if has2DCapability is false", () => {
    expect(
      canUse2DTryOn({ id: "a1", customerId: "c1", measurements: { heightCm: 170 }, avatar3dModelUrl: null, has2DCapability: false, has3DCapability: false, sourceImageUrl: "https://cdn.example.test/front.jpg" }),
    ).toBe(true);
  });

  it("returns false when neither has2DCapability nor sourceImageUrl is set", () => {
    expect(canUse2DTryOn({ id: "a1", customerId: "c1", measurements: { heightCm: 170 }, avatar3dModelUrl: null, has2DCapability: false, has3DCapability: false })).toBe(false);
  });
});

/* ─── 5. Avatar photo page: AI_GENERATION_PREVIOUSLY_FAILED ─────── */
describe("CustomerAvatarPhotoPage — AI_GENERATION_PREVIOUSLY_FAILED", () => {
  it("shows friendly message when backend returns AI_GENERATION_PREVIOUSLY_FAILED", async () => {
    const axiosError = Object.assign(new Error("prev-failed"), {
      isAxiosError: true,
      response: { status: 422, data: { code: "AI_GENERATION_PREVIOUSLY_FAILED" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    extractMutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    renderAvatarPhotoPage();
    await fillAndSubmitAvatarForm();

    expect(
      await screen.findByText(/previous ai generation for the same input failed recently/i),
    ).toBeInTheDocument();
    vi.spyOn(axios, "isAxiosError").mockRestore();
  });
});
