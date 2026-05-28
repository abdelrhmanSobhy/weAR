import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  Order,
  GetOrdersParams,
  PaginatedResponse,
} from "../types/order";

export const ordersApi = {
  getOrders: async (retailerId: string, params?: GetOrdersParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Order>>>(
      `/api/retailers/${retailerId}/orders`,
      {
        params: { pageNumber: 1, pageSize: 20, ...params },
      },
    );
    return response.data;
  },

  getOrderById: async (retailerId: string, orderId: string) => {
    const response = await apiClient.get<ApiResponse<Order>>(
      `/api/retailers/${retailerId}/orders/${orderId}`,
    );
    return response.data;
  },

  updateOrderStatus: async (
    retailerId: string,
    orderId: string,
    newStatus: string,
  ) => {
    const response = await apiClient.patch<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/orders/${orderId}/status`,
      { newStatus },
    );
    return response.data;
  },

  exportCsv: async (retailerId: string) => {
    const response = await apiClient.get(
      `/api/retailers/${retailerId}/orders/export/csv`,
      { responseType: "blob" },
    );
    return response.data;
  },
};
