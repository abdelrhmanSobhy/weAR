import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  InventoryRecord,
  GetInventoryParams,
  PaginatedResponse,
} from "../types/inventory";

export const inventoryApi = {
  getInventories: async (retailerId: string, params?: GetInventoryParams) => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<InventoryRecord>>
    >(`/api/retailers/${retailerId}/inventory`, {
      params: { pageNumber: 1, pageSize: 20, ...params },
    });
    return response.data;
  },

  getInventoryByProductId: async (retailerId: string, productId: string) => {
    const response = await apiClient.get<ApiResponse<InventoryRecord>>(
      `/api/retailers/${retailerId}/inventory/product/${productId}`,
    );
    return response.data;
  },

  adjustStock: async (
    retailerId: string,
    inventoryRecordId: string,
    data: { newQuantity: number; type: string; reason?: string },
  ) => {
    const response = await apiClient.patch(
      `/api/retailers/${retailerId}/inventory/${inventoryRecordId}/adjust`,
      data,
    );
    return response.data;
  },

  updateThreshold: async (
    retailerId: string,
    inventoryRecordId: string,
    newThreshold: number,
  ) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/inventory/${inventoryRecordId}/threshold`,
      { newThreshold },
    );
    return response.data;
  },

  deleteInventoryRecord: async (
    retailerId: string,
    inventoryRecordId: string,
  ) => {
    const response = await apiClient.delete(
      `/api/retailers/${retailerId}/inventory/${inventoryRecordId}`,
    );
    return response.data;
  },

  exportCsv: async (retailerId: string) => {
    const response = await apiClient.get(
      `/api/retailers/${retailerId}/inventory/export/csv`,
      { responseType: "blob" },
    );
    return response.data;
  },
};
