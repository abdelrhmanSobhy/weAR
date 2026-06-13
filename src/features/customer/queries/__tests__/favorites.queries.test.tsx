import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { favoritesApi } from "@/features/customer/api/favorites.api";
import { customerFavoriteKeys, useToggleCustomerFavorite } from "@/features/customer/queries/favorites.queries";
import { useAuthStore } from "@/features/auth/useAuthStore";
import type { CustomerProduct } from "@/features/customer/types/catalog";

vi.mock("@/features/customer/api/favorites.api", () => ({
  favoritesApi: {
    toggleFavorite: vi.fn(),
  },
}));

const mockedFavoritesApi = vi.mocked(favoritesApi);

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

describe("useToggleCustomerFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: "customer-1",
        fullName: "Customer User",
        email: "customer@example.com",
        brandName: "",
        businessType: "customer",
      },
      role: "customer",
      isAuthenticated: true,
      hasHydrated: true,
    });
  });

  it("optimistically updates favorites and rolls back on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const favoritesKey = customerFavoriteKeys.lists("customer-1");
    const favorites: CustomerProduct[] = [
      { id: "p1", name: "Jacket", price: 120, isFavorite: true },
    ];
    queryClient.setQueryData(favoritesKey, favorites);
    mockedFavoritesApi.toggleFavorite.mockRejectedValueOnce(new Error("Nope"));

    const { result } = renderHook(() => useToggleCustomerFavorite(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync("p1")).rejects.toThrow("Nope");

    await waitFor(() =>
      expect(queryClient.getQueryData(favoritesKey)).toEqual(favorites),
    );
    expect(mockedFavoritesApi.toggleFavorite).toHaveBeenCalledWith(
      "customer-1",
      { productId: "p1" },
    );
  });
});
