import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  Product,
  GetProductsParams,
  PaginatedResponse,
} from "../types/product";

export const productsApi = {
  getProducts: async (retailerId: string, params?: GetProductsParams) => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Product>>
    >(`/api/retailers/${retailerId}/products`, {
      params: { pageNumber: 1, pageSize: 20, ...params },
    });
    return response.data;
  },

  getProductById: async (retailerId: string, productId: string) => {
    const response = await apiClient.get<ApiResponse<Product>>(
      `/api/retailers/${retailerId}/products/${productId}`,
    );
    return response.data;
  },

  createProduct: async (retailerId: string, data: FormData) => {
    const response = await apiClient.post<ApiResponse<Product>>(
      `/api/retailers/${retailerId}/products`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  updateProduct: async (
    retailerId: string,
    productId: string,
    data: {
      newName?: string;
      newDescription?: string;
      shouldUpdateDescription?: boolean;
      newPrice?: number;
      shouldUpdatePrice?: boolean;
      newBarcode?: string;
      shouldUpdateBarcode?: boolean;
      newCategoryId?: string;
      shouldUpdateCategory?: boolean;
      newSubCategoryId?: string;
      newStatus?: string;
    },
  ) => {
    // Note: The Swagger doc states PUT is application/json for metadata updates
    const response = await apiClient.put<ApiResponse<Product>>(
      `/api/retailers/${retailerId}/products/${productId}`,
      data,
    );
    return response.data;
  },

  deleteProduct: async (retailerId: string, productId: string) => {
    const response = await apiClient.delete(
      `/api/retailers/${retailerId}/products/${productId}`,
    );
    return response.data;
  },
};
