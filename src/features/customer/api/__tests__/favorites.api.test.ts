import { beforeEach, describe, expect, it, vi } from "vitest";
import { favoritesApi } from "@/features/customer/api/favorites.api";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const mockedApiClient = vi.mocked(apiClient);

describe("favoritesApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes paginated favorites responses", async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          items: [{ id: "p1", name: "Jacket", price: 120 }],
        },
      },
    });

    await expect(favoritesApi.getFavorites("c1")).resolves.toEqual([
      { id: "p1", name: "Jacket", price: 120 },
    ]);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/api/customers/c1/favorites");
  });
});
