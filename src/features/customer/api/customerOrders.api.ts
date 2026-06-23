import { apiClient } from "@/lib/axios";

export interface CheckoutOrderItem {
  productId: string;
  quantity: number;
}

export interface CheckoutPayload {
  items: CheckoutOrderItem[];
  shippingAddress: string;
  paymentMethod: string;
}

export interface CustomerOrderDto {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

const base = (customerId: string) =>
  `/api/customers/${customerId}/orders`;

export const customerOrdersApi = {
  checkout: async (
    customerId: string,
    payload: CheckoutPayload,
  ): Promise<string> => {
    const res = await apiClient.post<{ orderId: string }>(
      `${base(customerId)}/checkout`,
      payload,
    );
    return res.data.orderId;
  },

  createPaymentIntent: async (
    customerId: string,
    orderId: string,
  ): Promise<string> => {
    const res = await apiClient.post<{ clientSecret: string }>(
      `${base(customerId)}/${orderId}/payment-intent`,
    );
    return res.data.clientSecret;
  },

  confirmPayment: async (
    customerId: string,
    orderId: string,
  ): Promise<void> => {
    await apiClient.post(`${base(customerId)}/${orderId}/confirm`);
  },

  getOrders: async (
    customerId: string,
    status = "All",
  ): Promise<CustomerOrderDto[]> => {
    const res = await apiClient.get<{ data: CustomerOrderDto[] }>(
      base(customerId),
      { params: { status } },
    );
    return res.data.data;
  },
};
