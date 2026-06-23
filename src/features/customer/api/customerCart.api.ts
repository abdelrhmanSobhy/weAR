import { apiClient } from "@/lib/axios";

export interface CartItemDto {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface CartDto {
  id: string;
  customerAccountId: string;
  items: CartItemDto[];
  totalAmount: number;
  currency: string;
}

const base = (customerId: string) =>
  `/api/customers/${customerId}/cart`;

export const customerCartApi = {
  getCart: async (customerId: string): Promise<CartDto> => {
    const res = await apiClient.get<{ data: CartDto }>(base(customerId));
    return res.data.data;
  },

  addItem: async (
    customerId: string,
    productId: string,
    quantity: number,
  ): Promise<boolean> => {
    const res = await apiClient.post<{ data: boolean }>(
      `${base(customerId)}/items`,
      { productId, quantity },
    );
    return res.data.data;
  },

  removeItem: async (customerId: string, productId: string): Promise<boolean> => {
    const res = await apiClient.delete<{ data: boolean }>(
      `${base(customerId)}/items/${productId}`,
    );
    return res.data.data;
  },

  updateQuantity: async (
    customerId: string,
    productId: string,
    newQuantity: number,
  ): Promise<boolean> => {
    const res = await apiClient.patch<{ data: boolean }>(
      `${base(customerId)}/items/${productId}`,
      newQuantity,
    );
    return res.data.data;
  },

  clearCart: async (customerId: string): Promise<boolean> => {
    const res = await apiClient.delete<{ data: boolean }>(base(customerId));
    return res.data.data;
  },
};
