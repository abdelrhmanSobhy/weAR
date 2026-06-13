import { apiClient } from "@/lib/axios";
import { unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import type {
  FavoriteCheckPayload,
  FavoriteCheckResult,
  FavoriteTogglePayload,
  CustomerProduct,
} from "@/features/customer/types/catalog";

export const favoritesApi = {
  getFavorites: async (customerId: string) => {
    const response = await apiClient.get(
      `/api/customers/${customerId}/favorites`,
    );
    return unwrapCustomerApiData<CustomerProduct[]>(response.data);
  },

  toggleFavorite: async (
    customerId: string,
    payload: FavoriteTogglePayload,
  ) => {
    const response = await apiClient.post(
      `/api/customers/${customerId}/favorites/toggle`,
      payload,
    );
    return unwrapCustomerApiData<CustomerProduct | FavoriteCheckResult>(
      response.data,
    );
  },

  checkFavorites: async (
    customerId: string,
    payload: FavoriteCheckPayload,
  ) => {
    const response = await apiClient.post(
      `/api/customers/${customerId}/favorites/check`,
      payload,
    );
    return unwrapCustomerApiData<FavoriteCheckResult[]>(response.data);
  },
};
