import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offersApi } from "../api/offers.api";
import type { GetOffersParams } from "../types/offer";

export const offerKeys = {
  all: ["offers"] as const,
  lists: (retailerId: string) =>
    [...offerKeys.all, retailerId, "list"] as const,
  list: (retailerId: string, params: GetOffersParams) =>
    [...offerKeys.lists(retailerId), params] as const,
};

export const useOffers = (retailerId: string, params: GetOffersParams = {}) => {
  return useQuery({
    queryKey: offerKeys.list(retailerId, params),
    queryFn: () => offersApi.getOffers(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useCreateOffer = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => offersApi.createOffer(retailerId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offerKeys.lists(retailerId) }),
  });
};

export const useUpdateOffer = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: FormData }) =>
      offersApi.updateOffer(retailerId, offerId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offerKeys.lists(retailerId) }),
  });
};

export const useDeleteOffer = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => offersApi.deleteOffer(retailerId, offerId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offerKeys.lists(retailerId) }),
  });
};

export const useToggleOfferStatus = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) =>
      offersApi.toggleOfferStatus(retailerId, offerId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offerKeys.lists(retailerId) }),
  });
};
