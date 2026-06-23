import { apiClient } from "@/lib/axios";

const base = (customerId: string) => `/api/customers/${customerId}/cart`;

export const customerCartApi = {
  clearCart: (customerId: string) =>
    apiClient.delete(base(customerId)),

  addItem: (customerId: string, productId: string, quantity: number) =>
    apiClient.post(`${base(customerId)}/items`, { productId, quantity }),
};
