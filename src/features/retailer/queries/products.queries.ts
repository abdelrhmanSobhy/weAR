import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/products.api";
import type { GetProductsParams } from "../types/product";

export const productKeys = {
  all: ["products"] as const,
  lists: (retailerId: string) =>
    [...productKeys.all, retailerId, "list"] as const,
  list: (retailerId: string, params: GetProductsParams) =>
    [...productKeys.lists(retailerId), params] as const,
};

export const useProducts = (
  retailerId: string,
  params: GetProductsParams = {},
) => {
  return useQuery({
    queryKey: productKeys.list(retailerId, params),
    queryFn: () => productsApi.getProducts(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useCreateProduct = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => productsApi.createProduct(retailerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(retailerId),
      });
    },
  });
};

export const useUpdateProduct = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: Parameters<typeof productsApi.updateProduct>[2];
    }) => productsApi.updateProduct(retailerId, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(retailerId),
      });
    },
  });
};

export const useDeleteProduct = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      productsApi.deleteProduct(retailerId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(retailerId),
      });
    },
  });
};
