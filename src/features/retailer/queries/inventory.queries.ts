import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory.api";
import type { GetInventoryParams } from "../types/inventory";

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: (retailerId: string) =>
    [...inventoryKeys.all, retailerId, "list"] as const,
  list: (retailerId: string, params: GetInventoryParams) =>
    [...inventoryKeys.lists(retailerId), params] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (retailerId: string, productId: string) =>
    [...inventoryKeys.details(), retailerId, productId] as const,
};

export const useInventories = (
  retailerId: string,
  params: GetInventoryParams = {},
) => {
  return useQuery({
    queryKey: inventoryKeys.list(retailerId, params),
    queryFn: () => inventoryApi.getInventories(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useInventoryByProductId = (
  retailerId: string,
  productId: string,
) => {
  return useQuery({
    queryKey: inventoryKeys.detail(retailerId, productId),
    queryFn: () => inventoryApi.getInventoryByProductId(retailerId, productId),
    enabled: !!retailerId && !!productId,
  });
};

export const useAdjustStock = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inventoryRecordId,
      data,
    }: {
      inventoryRecordId: string;
      data: { newQuantity: number; type: string; reason?: string };
    }) => inventoryApi.adjustStock(retailerId, inventoryRecordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(retailerId),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.details(),
      });
    },
  });
};

export const useUpdateThreshold = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inventoryRecordId,
      newThreshold,
    }: {
      inventoryRecordId: string;
      newThreshold: number;
    }) =>
      inventoryApi.updateThreshold(retailerId, inventoryRecordId, newThreshold),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(retailerId),
      });
    },
  });
};

export const useDeleteInventory = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inventoryRecordId: string) =>
      inventoryApi.deleteInventoryRecord(retailerId, inventoryRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(retailerId),
      });
    },
  });
};
