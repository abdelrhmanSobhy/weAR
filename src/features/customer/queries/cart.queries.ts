import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerCartApi } from "../api/customerCart.api";

const cartKeys = {
  cart: (id: string) => ["customer", "cart", id] as const,
};

export const useCustomerCart = (customerId: string) =>
  useQuery({
    queryKey: cartKeys.cart(customerId),
    queryFn: () => customerCartApi.getCart(customerId),
    enabled: !!customerId,
  });

export const useRemoveCartItem = (customerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      customerCartApi.removeItem(customerId, productId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: cartKeys.cart(customerId) }),
  });
};

export const useUpdateCartItem = (customerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      newQuantity,
    }: {
      productId: string;
      newQuantity: number;
    }) => customerCartApi.updateQuantity(customerId, productId, newQuantity),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: cartKeys.cart(customerId) }),
  });
};
