import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  Category,
  GetCategoriesParams,
  PaginatedResponse,
  SubCategory,
} from "../types/category";

export const categoriesApi = {
  getCategories: async (retailerId: string, params?: GetCategoriesParams) => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Category>>
    >(`/api/retailers/${retailerId}/categories`, {
      params: { pageNumber: 1, pageSize: 20, ...params },
    });
    return response.data;
  },

  getCategoryById: async (retailerId: string, categoryId: string) => {
    const response = await apiClient.get<ApiResponse<Category>>(
      `/api/retailers/${retailerId}/categories/${categoryId}`,
    );
    return response.data;
  },

  createCategory: async (retailerId: string, data: FormData) => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/categories`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  updateCategory: async (
    retailerId: string,
    categoryId: string,
    data: FormData,
  ) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/categories/${categoryId}`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  deleteCategory: async (retailerId: string, categoryId: string) => {
    const response = await apiClient.delete(
      `/api/retailers/${retailerId}/categories/${categoryId}`,
    );
    return response.data;
  },

  toggleCategoryStatus: async (retailerId: string, categoryId: string) => {
    const response = await apiClient.patch<ApiResponse<{ newStatus: string }>>(
      `/api/retailers/${retailerId}/categories/${categoryId}/toggle-status`,
    );
    return response.data;
  },

  getSubCategories: async (retailerId: string, categoryId: string) => {
    const response = await apiClient.get<ApiResponse<SubCategory[]>>(
      `/api/retailers/${retailerId}/categories/${categoryId}/sub-categories`,
    );
    return response.data;
  },

  createSubCategory: async (
    retailerId: string,
    categoryId: string,
    data: { name: string; status: string },
  ) => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/categories/${categoryId}/sub-categories`,
      data,
    );
    return response.data;
  },

  updateSubCategory: async (
    retailerId: string,
    categoryId: string,
    subCategoryId: string,
    data: { newName: string; status: string },
  ) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/categories/${categoryId}/sub-categories/${subCategoryId}`,
      data,
    );
    return response.data;
  },

  deleteSubCategory: async (
    retailerId: string,
    categoryId: string,
    subCategoryId: string,
  ) => {
    const response = await apiClient.delete(
      `/api/retailers/${retailerId}/categories/${categoryId}/sub-categories/${subCategoryId}`,
    );
    return response.data;
  },
};
