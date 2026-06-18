import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceDisplay } from "@/features/customer/components/product/PriceDisplay";

import "@testing-library/jest-dom";

describe("PriceDisplay", () => {
  it("renders discounted and regular prices when discounted", () => {
    render(<PriceDisplay price={100} discountedPrice={75} currency="USD" />);

    expect(screen.getByText("$75.00")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toHaveClass("line-through");
  });

  it("renders only regular price without a valid discount", () => {
    render(<PriceDisplay price={100} discountedPrice={120} currency="USD" />);

    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.queryByText("$120.00")).not.toBeInTheDocument();
  });
});
