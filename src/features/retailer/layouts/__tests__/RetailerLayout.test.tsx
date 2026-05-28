import { describe, it, expect } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RetailerLayout } from "@/features/retailer/layouts/RetailerLayout";
import "@testing-library/jest-dom";

describe("RetailerLayout", () => {
  it("renders sidebar links and outlet content", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/retailer",
          element: <RetailerLayout />,
          children: [{ index: true, element: <div>Outlet Works</div> }],
        },
      ],
      { initialEntries: ["/retailer"] },
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Cavo")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Outlet Works")).toBeInTheDocument();
  });
});
