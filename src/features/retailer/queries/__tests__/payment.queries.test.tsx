import { describe, expect, it } from "vitest";
import { paymentKeys } from "../payment.queries";

describe("payment query keys", () => {
  it("creates stable query keys for payment methods", () => {
    expect(paymentKeys.methods("retailer-1")).toEqual([
      "payment",
      "retailer-1",
      "methods",
    ]);
    expect(paymentKeys.method("retailer-1", "pm-1")).toEqual([
      "payment",
      "retailer-1",
      "methods",
      "pm-1",
    ]);
  });
});
