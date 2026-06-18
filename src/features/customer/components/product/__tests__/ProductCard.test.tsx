import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProductCard } from "@/features/customer/components/product/ProductCard";

import "@testing-library/jest-dom";

const product = {
  id: "p1",
  name: "Linen Jacket",
  brand: "weAR Studio",
  price: 100,
  discountedPrice: 75,
  currency: "USD",
  imageUrl: "https://example.com/jacket.jpg",
  isFavorite: false,
};

describe("ProductCard", () => {
  it("renders product details and navigates to product details", () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Linen Jacket")).toBeInTheDocument();
    expect(screen.getByText("weAR Studio")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Linen Jacket" })).toHaveAttribute(
      "href",
      "/customer/products/p1",
    );
    expect(screen.getByText("25% off")).toBeInTheDocument();
  });

  it("calls favorite interaction with the product id", () => {
    const onToggleFavorite = vi.fn();
    render(
      <MemoryRouter>
        <ProductCard product={product} onToggleFavorite={onToggleFavorite} />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Add Linen Jacket to favorites" }),
    );

    expect(onToggleFavorite).toHaveBeenCalledWith("p1");
  });
});
