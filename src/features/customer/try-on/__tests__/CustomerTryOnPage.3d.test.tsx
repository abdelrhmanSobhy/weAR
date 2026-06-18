import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerTryOnPage } from "@/features/customer/try-on/pages/CustomerTryOnPage";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { TRY_ON_SESSION_TYPES } from "@/features/customer/try-on/types/tryOn";

const viewerLoad = vi.fn();
const mutate = vi.fn();
let session: Record<string, unknown>;
let mockedProduct: Record<string, unknown> | null = {
  id: "p1",
  name: "Linen Jacket",
  price: 120,
  currency: "USD",
  imageUrl: "https://cdn.example.test/product.png",
  colors: ["Taupe"],
  sizes: ["M"],
};

vi.mock("@/features/customer/try-on/components/TryOn3DViewer", () => ({
  default: function MockTryOn3DViewer({
    onLoading,
    onReady,
    onError,
  }: {
    onLoading?: () => void;
    onReady?: () => void;
    onError?: () => void;
  }) {
    useEffect(() => {
      viewerLoad();
      onLoading?.();
      if ((globalThis as { failViewer?: boolean }).failViewer) onError?.();
      else onReady?.();
    }, [onError, onLoading, onReady]);
    return <div data-testid="mock-3d-viewer">Mock 3D viewer</div>;
  },
}));

const repairMutate = vi.fn();
vi.mock("@/features/customer/queries/profileAvatar.queries", () => ({
  useCustomerAvatar: () => ({
    isLoading: false,
    isError: false,
    data: {
      id: "a1",
      avatar3dModelUrl:
        (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl ?? null,
      has3DCapability: Boolean(
        (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl,
      ),
      has2DCapability:
        (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability ?? false,
      measurements: { heightCm: 170 },
    },
  }),
  useRepairAvatarSourceImage: () => ({ isPending: false, mutate: repairMutate, isSuccess: false, isError: false }),
}));

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerProduct: (productId: string | null) => ({
    isLoading: false,
    isError: false,
    data: productId ? mockedProduct : null,
  }),
}));

vi.mock("@/features/customer/try-on/hooks/tryOn.queries", () => ({
  useCreateTryOnSession: () => ({ isPending: false, mutate }),
}));

const renderCompletedPage = async (resultModelUrl: unknown) => {
  (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
    "https://cdn.example.test/avatar.glb";
  session = {
    id: "s1",
    productId: "p1",
    sessionType: TRY_ON_SESSION_TYPES.model3D,
    resultImageUrl: resultModelUrl,
    recommendedSize: "M",
  };
  mutate.mockImplementation((_payload, opts) => opts.onSuccess(session));
  render(
    <MemoryRouter initialEntries={["/customer/try-on/p1"]}>
      <Routes>
        <Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
  await screen.findByRole("button", { name: "M" });
  fireEvent.click(screen.getByRole("button", { name: "M" }));
  fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
  fireEvent.click(screen.getByRole("button", { name: /try product/i }));
  /* Wait for the "Try Again" button which only appears in the completed sidebar */
  await screen.findByRole("button", { name: /Try Again/i });
};

const renderTryOnPage = (entry = "/customer/try-on") => {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/customer/try-on" element={<CustomerTryOnPage />} />
        <Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} />
        <Route path="/customer/avatar/photo" element={<div>Photo avatar route</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  mutate.mockReset();
  viewerLoad.mockClear();
  mockedProduct = {
    id: "p1",
    name: "Linen Jacket",
    price: 120,
    currency: "USD",
    imageUrl: "https://cdn.example.test/product.png",
    colors: ["Taupe"],
    sizes: ["M"],
  };
  useCartStore.setState({ items: [] });
  (globalThis as { failViewer?: boolean }).failViewer = false;
  (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = null;
  (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = false;
});

describe("CustomerTryOnPage 3D backend result", () => {
  it("default mode is 3D — mode selector shows 3D Avatar as selected on entry screen", () => {
    renderTryOnPage("/customer/try-on/p1");
    const btn3d = screen.getByRole("button", { name: /3D Avatar Try-On/i });
    expect(btn3d).toHaveAttribute("aria-pressed", "true");
    const btn2d = screen.getByRole("button", { name: /2D Image Try-On/i });
    expect(btn2d).toHaveAttribute("aria-pressed", "false");
  });

  it("redirects to photo avatar flow when no safe 3D avatar model is available in 3D mode", async () => {
    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    expect(await screen.findByText(/Photo avatar route/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("redirects to photo avatar flow for unsafe avatar URLs", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "javascript:alert(1)";
    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    expect(await screen.findByText(/Photo avatar route/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows base avatar (3D viewer) immediately after entering fitting room before try-on", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";
    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });
    expect(await screen.findByTestId("mock-3d-viewer")).toBeInTheDocument();
    expect(screen.getByText(/Your 3D avatar/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("renders valid HTTPS 3D result immediately from backend resultImageUrl", async () => {
    await renderCompletedPage("https://cdn.example.test/result.glb");
    expect(await screen.findByTestId("mock-3d-viewer")).toBeInTheDocument();
    expect(screen.getByText(/3D garment try-on result/i)).toBeInTheDocument();
    await waitFor(() => expect(viewerLoad).toHaveBeenCalled());
  });

  it("allows valid HTTP result URLs according to model URL policy", async () => {
    await renderCompletedPage("http://cdn.example.test/result.glb");
    expect(screen.getByTestId("mock-3d-viewer")).toBeInTheDocument();
  });

  it("falls back to base avatar viewer when backend does not return a safe 3D result URL", async () => {
    await renderCompletedPage(null);
    expect(screen.getByTestId("mock-3d-viewer")).toBeInTheDocument();
    expect(screen.getByText(/Your 3D avatar/i)).toBeInTheDocument();
    expect(screen.getByText(/backend did not return a 3D result URL/i)).toBeInTheDocument();
  });

  it("viewer failure preserves the completed session and retry does not create a new session", async () => {
    (globalThis as { failViewer?: boolean }).failViewer = true;
    await renderCompletedPage("https://cdn.example.test/result.glb");
    expect(await screen.findByText(/3D view is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Linen Jacket · Size M · Taupe/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Retry 3D/i }));
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("keeps /customer/try-on without a product as a valid no-product state when a 3D avatar exists", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";
    renderTryOnPage();

    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));

    expect(await screen.findByText(/No product selected/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Change Product/i })).toHaveAttribute(
      "href",
      "/customer/shop",
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it("3D submit sends sessionType model3D and preserves selected variants", async () => {
    await renderCompletedPage("https://cdn.example.test/result.glb");

    expect(mutate).toHaveBeenCalledWith(
      { productId: "p1", sessionType: TRY_ON_SESSION_TYPES.model3D, avatarId: "a1" },
      expect.any(Object),
    );
    expect(screen.getByText(/Linen Jacket · Size M · Taupe/i)).toBeInTheDocument();
  });

  it("keeps Add to Cart available after 3D try-on", async () => {
    await renderCompletedPage("https://cdn.example.test/result.glb");

    fireEvent.click(screen.getByRole("button", { name: /Add Linen Jacket to cart/i }));

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        productId: "p1",
        selectedSize: "M",
        selectedColor: "Taupe",
      }),
    ]);
    expect(screen.getByRole("status")).toHaveTextContent(/Added to cart: Linen Jacket/i);
  });

  it("2D submit sends sessionType overlay2D only when user selects 2D mode", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";
    (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = true;
    session = {
      id: "s1",
      productId: "p1",
      sessionType: TRY_ON_SESSION_TYPES.overlay2D,
      resultImageUrl: "https://cdn.example.test/2d-result.png",
    };
    mutate.mockImplementation((_payload, opts) => opts.onSuccess(session));

    render(
      <MemoryRouter initialEntries={["/customer/try-on/p1"]}>
        <Routes>
          <Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /2D Image Try-On/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
    fireEvent.click(screen.getByRole("button", { name: /try product in 2d/i }));

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { productId: "p1", sessionType: TRY_ON_SESSION_TYPES.overlay2D, avatarId: "a1" },
        expect.any(Object),
      ),
    );
  });

  it("2D mode does not require avatar3dModelUrl but still requires avatar record", async () => {
    /* avatar exists but has no 3D model URL; 2D capability is present (e.g. from sourceImageUrl) */
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = null;
    (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = true;

    render(
      <MemoryRouter initialEntries={["/customer/try-on/p1"]}>
        <Routes>
          <Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} />
          <Route path="/customer/avatar/photo" element={<div>Photo avatar route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /2D Image Try-On/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));

    /* avatar.data exists (mocked with id "a1" even when no 3dModelUrl) so we should NOT redirect */
    await screen.findByRole("button", { name: "M" });
    expect(screen.queryByText(/Photo avatar route/i)).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("2D result renders as an img element, not a 3D viewer", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";
    (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = true;
    session = {
      id: "s1",
      productId: "p1",
      sessionType: TRY_ON_SESSION_TYPES.overlay2D,
      resultImageUrl: "https://cdn.example.test/2d-result.png",
    };
    mutate.mockImplementation((_payload, opts) => opts.onSuccess(session));

    render(
      <MemoryRouter initialEntries={["/customer/try-on/p1"]}>
        <Routes>
          <Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /2D Image Try-On/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
    fireEvent.click(screen.getByRole("button", { name: /try product in 2d/i }));

    const result2dImg = await screen.findByAltText(/2D try-on result/i);
    expect(result2dImg).toBeInTheDocument();
    expect(result2dImg.tagName).toBe("IMG");
    expect(result2dImg).toHaveAttribute("src", "https://cdn.example.test/2d-result.png");
    expect(screen.queryByTestId("mock-3d-viewer")).not.toBeInTheDocument();
  });

  it("3D mode still requires avatar3dModelUrl and redirects if missing", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = null;
    renderTryOnPage("/customer/try-on/p1");
    /* default mode is 3D */
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    expect(await screen.findByText(/Photo avatar route/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("backend traceId appears in the error panel on try-on failure", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";

    const axiosError = Object.assign(new Error("Server Error"), {
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          message: "Internal processing failure",
          traceId: "trace-abc-123",
        },
      },
    });
    mutate.mockImplementation((_payload, opts) => opts.onError(axiosError));

    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
    fireEvent.click(screen.getByRole("button", { name: /try product in 3d/i }));

    expect(await screen.findByText(/Internal processing failure/i)).toBeInTheDocument();
    expect(screen.getByTestId("error-trace-id")).toHaveTextContent("trace-abc-123");
  });

  it("enters fitting room without redirecting when 3D is unavailable but 2D is available", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = null;
    (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = true;

    renderTryOnPage("/customer/try-on/p1");
    /* default mode is 3D, but 3D is unavailable and 2D capability exists — should NOT redirect */
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));

    await screen.findByRole("button", { name: "M" });
    expect(screen.queryByText(/Photo avatar route/i)).not.toBeInTheDocument();
  });

  it("shows 2D Ready and 3D unavailable capability badges when only 2D is available", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = null;
    (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = true;

    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });

    expect(screen.getByText("2D Ready")).toBeInTheDocument();
    expect(screen.getByText("3D unavailable")).toBeInTheDocument();
  });

  it("shows repair avatar source image button when avatar has no 2D capability or sourceImageUrl", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";
    /* has3DCapability true, has2DCapability false, no sourceImageUrl */

    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });

    expect(screen.getByRole("button", { name: /Repair avatar source image/i })).toBeInTheDocument();
  });

  it("sessionType sent as string 'Overlay2D' for 2D and 'Model3D' for 3D", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl =
      "https://cdn.example.test/avatar.glb";
    (globalThis as { activeHas2DCapability?: boolean }).activeHas2DCapability = true;
    session = { id: "s1", productId: "p1", sessionType: "Overlay2D", resultImageUrl: "https://cdn.example.test/2d.png" };
    mutate.mockImplementation((_payload, opts) => opts.onSuccess(session));

    render(
      <MemoryRouter initialEntries={["/customer/try-on/p1"]}>
        <Routes>
          <Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /2D Image Try-On/i }));
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    await screen.findByRole("button", { name: "M" });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
    fireEvent.click(screen.getByRole("button", { name: /try product in 2d/i }));

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { productId: "p1", sessionType: "Overlay2D", avatarId: "a1" },
        expect.any(Object),
      ),
    );
  });
});
