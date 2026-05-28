import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders.api";
import type { GetOrdersParams } from "../types/order";

export const orderKeys = {
  all: ["orders"] as const,
  lists: (retailerId: string) =>
    [...orderKeys.all, retailerId, "list"] as const,
  list: (retailerId: string, params: GetOrdersParams) =>
    [...orderKeys.lists(retailerId), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (retailerId: string, orderId: string) =>
    [...orderKeys.details(), retailerId, orderId] as const,
};

export const useOrders = (retailerId: string, params: GetOrdersParams = {}) => {
  return useQuery({
    queryKey: orderKeys.list(retailerId, params),
    queryFn: () => ordersApi.getOrders(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useOrderById = (retailerId: string, orderId: string) => {
  return useQuery({
    queryKey: orderKeys.detail(retailerId, orderId),
    queryFn: () => ordersApi.getOrderById(retailerId, orderId),
    enabled: !!retailerId && !!orderId,
  });
};

export const useUpdateOrderStatus = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      newStatus,
    }: {
      orderId: string;
      newStatus: string;
    }) => ordersApi.updateOrderStatus(retailerId, orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists(retailerId),
      });
      queryClient.invalidateQueries({
        queryKey: orderKeys.details(),
      });
    },
  });
};
