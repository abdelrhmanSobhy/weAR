import { apiClient } from "@/lib/axios";
import {
  unwrapCustomerApiData,
  unwrapCustomerApiList,
} from "@/features/customer/api/customerApiUtils";
import type {
  FavoriteCheckPayload,
  FavoriteCheckResult,
  FavoriteTogglePayload,
  CustomerProduct,
} from "@/features/customer/types/catalog";

type ToggleFavoriteResponse = { isFavorite: boolean };

export const favoritesApi = {
  getFavorites: async (customerId: string) => {
    const response = await apiClient.get(
      `/api/customers/${customerId}/favorites`,
    );
    return unwrapCustomerApiList<CustomerProduct>(response.data);
  },

  toggleFavorite: async (
    customerId: string,
    payload: FavoriteTogglePayload,
  ): Promise<ToggleFavoriteResponse> => {
    const response = await apiClient.post(
      `/api/customers/${customerId}/favorites/toggle`,
      payload,
    );
    return unwrapCustomerApiData<ToggleFavoriteResponse>(response.data);
  },

  checkFavorites: async (
    customerId: string,
    payload: FavoriteCheckPayload,
  ): Promise<FavoriteCheckResult[]> => {
    const response = await apiClient.post(
      `/api/customers/${customerId}/favorites/check`,
      payload,
    );
    const raw = unwrapCustomerApiData<Record<string, boolean>>(response.data);
    return Object.entries(raw).map(([productId, isFavorite]): FavoriteCheckResult => ({
      productId,
      isFavorite,
    }));
  },
};
