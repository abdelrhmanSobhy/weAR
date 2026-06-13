import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { CustomerFavoritesPage } from "@/features/customer/pages/CustomerFavoritesPage";
import { useCustomerFavorites } from "@/features/customer/queries/favorites.queries";

vi.mock("@/features/customer/queries/favorites.queries", () => ({
  useCustomerFavorites: vi.fn(),
}));

const renderFavorites = () =>
  render(
    <MemoryRouter>
      <CustomerFavoritesPage />
    </MemoryRouter>,
  );

describe("CustomerFavoritesPage", () => {
  beforeEach(() => {
    vi.mocked(useCustomerFavorites).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCustomerFavorites>);
  });

  it("renders an empty wishlist state instead of a placeholder page", () => {
    renderFavorites();

    expect(screen.getByRole("heading", { name: /Your wishlist is empty/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Browse Products/i })).toHaveAttribute("href", "/customer/shop");
  });

  it("renders saved favorite products", () => {
    vi.mocked(useCustomerFavorites).mockReturnValue({
      data: [
        {
          id: "product-1",
          name: "Linen Jacket",
          brand: "weAR",
          price: 120,
          currency: "USD",
          isFavorite: true,
        },
      ],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCustomerFavorites>);

    renderFavorites();

    expect(screen.getByRole("heading", { name: /Saved products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Linen Jacket" })).toHaveAttribute("href", "/customer/products/product-1");
  });
});
