import { apiClient } from "@/lib/axios";
import { stripEmptyParams, unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import type {
  CompareProductsPayload,
  CustomerCatalogParams,
  CustomerCategory,
  CustomerOffer,
  CustomerPaginatedResult,
  CustomerProduct,
  ProductsByModelIdsPayload,
} from "@/features/customer/types/catalog";

export const catalogApi = {
  getProducts: async (params: CustomerCatalogParams = {}) => {
    const response = await apiClient.get("/api/catalog/products", {
      params: stripEmptyParams({ pageNumber: 1, pageSize: 20, ...params }),
    });
    return unwrapCustomerApiData<CustomerPaginatedResult<CustomerProduct>>(
      response.data,
    );
  },

  getProduct: async (productId: string) => {
    const response = await apiClient.get(`/api/catalog/products/${productId}`);
    return unwrapCustomerApiData<CustomerProduct>(response.data);
  },

  getSimilarProducts: async (productId: string) => {
    const response = await apiClient.get(
      `/api/catalog/products/${productId}/similar`,
    );
    return unwrapCustomerApiData<CustomerProduct[]>(response.data);
  },

  compareProducts: async (payload: CompareProductsPayload) => {
    const response = await apiClient.post(
      "/api/catalog/products/compare",
      payload,
    );
    return unwrapCustomerApiData<CustomerProduct[]>(response.data);
  },

  getProductsByModelIds: async (payload: ProductsByModelIdsPayload) => {
    const response = await apiClient.post(
      "/api/catalog/products/by-model-ids",
      payload,
    );
    return unwrapCustomerApiData<CustomerProduct[]>(response.data);
  },

  getCategories: async () => {
    const response = await apiClient.get("/api/catalog/categories");
    return unwrapCustomerApiData<CustomerCategory[]>(response.data);
  },

  getOffers: async () => {
    const response = await apiClient.get("/api/catalog/offers");
    return unwrapCustomerApiData<CustomerOffer[]>(response.data);
  },
};
