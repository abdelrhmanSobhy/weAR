import { apiClient } from "@/lib/axios";
import type { PaymentMethod, AddPaymentMethodRequest } from "../types/payment";
import type { ApiResponse } from "@/features/auth/api/auth.api";

export const paymentApi = {
  getPaymentMethods: async (retailerId: string) => {
    const response = await apiClient.get<ApiResponse<PaymentMethod[]>>(
      `/api/retailers/${retailerId}/payment-methods`,
    );
    return response.data;
  },

  addPaymentMethod: async (retailerId: string, data: AddPaymentMethodRequest) => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/payment-methods`,
      data,
    );
    return response.data;
  },

  getPaymentMethod: async (retailerId: string, methodId: string) => {
    const response = await apiClient.get<ApiResponse<PaymentMethod>>(
      `/api/retailers/${retailerId}/payment-methods/${methodId}`,
    );
    return response.data;
  },

  deletePaymentMethod: async (retailerId: string, methodId: string) => {
    const response = await apiClient.delete(
      `/api/retailers/${retailerId}/payment-methods/${methodId}`,
    );
    return response.data; // Usually 204 No Content, so no data field, but return just in case.
  },

  setDefaultPaymentMethod: async (retailerId: string, methodId: string) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/payment-methods/${methodId}/default`,
    );
    return response.data;
  },
};
