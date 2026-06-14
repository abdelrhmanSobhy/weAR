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
let mockedProduct: Record<string, unknown> | null = { id: "p1", name: "Linen Jacket", price: 120, currency: "USD", imageUrl: "https://cdn.example.test/product.png", colors: ["Taupe"], sizes: ["M"] };

vi.mock("@/features/customer/try-on/components/TryOn3DViewer", () => ({
  default: function MockTryOn3DViewer({ onLoading, onReady, onError }: { onLoading?: () => void; onReady?: () => void; onError?: () => void }) {
    useEffect(() => {
      viewerLoad();
      onLoading?.();
      if ((globalThis as { failViewer?: boolean }).failViewer) onError?.();
      else onReady?.();
    }, [onError, onLoading, onReady]);
    return <div data-testid="mock-3d-viewer">Mock 3D viewer</div>;
  },
}));

vi.mock("@/features/customer/queries/profileAvatar.queries", () => ({
  useCustomerAvatar: () => ({ isLoading: false, isError: false, data: { id: "a1", avatar3dModelUrl: (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl ?? null, measurements: { heightCm: 170 } } }),
}));

vi.mock("@/features/customer/queries/catalog.queries", () => ({
  useCustomerProduct: (productId: string | null) => ({ isLoading: false, isError: false, data: productId ? mockedProduct : null }),
}));

vi.mock("@/features/customer/try-on/hooks/tryOn.queries", () => ({
  useCreateTryOnSession: () => ({ isPending: false, mutate }),
}));

const renderCompletedPage = async (resultModelUrl: unknown) => {
  (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = "https://cdn.example.test/avatar.glb";
  session = { id: "s1", productId: "p1", sessionType: TRY_ON_SESSION_TYPES.model3D, resultImageUrl: resultModelUrl, recommendedSize: "M" };
  mutate.mockImplementation((_payload, opts) => opts.onSuccess(session));
  render(<MemoryRouter initialEntries={["/customer/try-on/p1"]}><Routes><Route path="/customer/try-on/:productId" element={<CustomerTryOnPage />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
  await screen.findByRole("button", { name: "M" });
  fireEvent.click(screen.getByRole("button", { name: "M" }));
  fireEvent.click(screen.getByRole("button", { name: "Taupe" }));
  fireEvent.click(screen.getByRole("button", { name: /try product/i }));
  await screen.findByText(/3D try-on complete|Session complete/i);
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
  mockedProduct = { id: "p1", name: "Linen Jacket", price: 120, currency: "USD", imageUrl: "https://cdn.example.test/product.png", colors: ["Taupe"], sizes: ["M"] };
  useCartStore.setState({ items: [] });
  (globalThis as { failViewer?: boolean }).failViewer = false;
  (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = null;
});

describe("CustomerTryOnPage 3D backend result", () => {
  it("redirects to photo avatar flow when no safe 3D avatar model is available", async () => {
    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    expect(await screen.findByText(/Photo avatar route/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("redirects to photo avatar flow for unsafe avatar URLs", async () => {
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = "javascript:alert(1)";
    renderTryOnPage("/customer/try-on/p1");
    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));
    expect(await screen.findByText(/Photo avatar route/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("renders valid HTTPS 3D result immediately from backend resultImageUrl", async () => {
    await renderCompletedPage("https://cdn.example.test/result.glb");
    expect(screen.getByRole("tab", { name: /3D Result/i })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByTestId("mock-3d-viewer")).toBeInTheDocument();
    await waitFor(() => expect(viewerLoad).toHaveBeenCalledTimes(1));
  });

  it("allows valid HTTP result URLs according to model URL policy", async () => {
    await renderCompletedPage("http://cdn.example.test/result.glb");
    expect(screen.getByRole("tab", { name: /3D Result/i })).toBeInTheDocument();
  });

  it("falls back to product image when backend does not return a safe 3D result URL", async () => {
    await renderCompletedPage(null);
    expect(screen.getByRole("tabpanel", { name: /Product image fallback/i })).toBeInTheDocument();
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
    (globalThis as { activeAvatarModelUrl?: string | null }).activeAvatarModelUrl = "https://cdn.example.test/avatar.glb";
    renderTryOnPage();

    fireEvent.click(screen.getByRole("button", { name: /enter room/i }));

    expect(await screen.findByText(/No product selected/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Change Product/i })).toHaveAttribute("href", "/customer/shop");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("preserves product-specific try-on route state for selected variants", async () => {
    await renderCompletedPage("https://cdn.example.test/result.glb");

    expect(mutate).toHaveBeenCalledWith(
      { productId: "p1", sessionType: TRY_ON_SESSION_TYPES.model3D, avatarId: "a1" },
      expect.any(Object),
    );
    expect(screen.getByText(/Linen Jacket · Size M · Taupe/i)).toBeInTheDocument();
  });

  it("keeps Add to Cart available beside 3D controls without breaking the viewer", async () => {
    await renderCompletedPage("https://cdn.example.test/result.glb");

    expect(screen.getByRole("tab", { name: /3D Result/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add Linen Jacket to cart/i }));

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        productId: "p1",
        selectedSize: "M",
        selectedColor: "Taupe",
      }),
    ]);
    expect(screen.getByRole("status")).toHaveTextContent(/Added to cart: Linen Jacket/i);
    expect(await screen.findByTestId("mock-3d-viewer")).toBeInTheDocument();
  });
});
