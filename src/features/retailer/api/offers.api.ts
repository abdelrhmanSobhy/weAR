import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  Offer,
  GetOffersParams,
  PaginatedResponse,
} from "../types/offer";

export const offersApi = {
  getOffers: async (retailerId: string, params?: GetOffersParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Offer>>>(
      `/api/retailers/${retailerId}/offers`,
      { params: { pageNumber: 1, pageSize: 20, ...params } },
    );
    return response.data;
  },

  getOfferById: async (retailerId: string, offerId: string) => {
    const response = await apiClient.get<ApiResponse<Offer>>(
      `/api/retailers/${retailerId}/offers/${offerId}`,
    );
    return response.data;
  },

  createOffer: async (retailerId: string, data: FormData) => {
    const response = await apiClient.post<ApiResponse<string>>(
      `/api/retailers/${retailerId}/offers`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  updateOffer: async (retailerId: string, offerId: string, data: FormData) => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/offers/${offerId}`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  deleteOffer: async (retailerId: string, offerId: string) => {
    const response = await apiClient.delete(
      `/api/retailers/${retailerId}/offers/${offerId}`,
    );
    return response.data;
  },

  toggleOfferStatus: async (retailerId: string, offerId: string) => {
    const response = await apiClient.patch<ApiResponse<boolean>>(
      `/api/retailers/${retailerId}/offers/${offerId}/toggle-status`,
    );
    return response.data;
  },
};
