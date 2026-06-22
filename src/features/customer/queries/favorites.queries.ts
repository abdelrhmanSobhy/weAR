import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "@/features/customer/api/favorites.api";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { selectCustomerId } from "@/features/customer/utils/customerSelectors";
import { customerCatalogKeys } from "@/features/customer/queries/catalog.queries";
import type { CustomerProduct } from "@/features/customer/types/catalog";

export const customerFavoriteKeys = {
  all: ["customer", "favorites"] as const,
  lists: (customerId: string | null) =>
    [...customerFavoriteKeys.all, customerId, "list"] as const,
  checks: (customerId: string | null) =>
    [...customerFavoriteKeys.all, customerId, "checks"] as const,
  check: (customerId: string | null, productIds: string[]) =>
    [...customerFavoriteKeys.checks(customerId), productIds] as const,
};

export const useCustomerFavorites = () => {
  const customerId = useAuthStore(selectCustomerId);

  return useQuery({
    queryKey: customerFavoriteKeys.lists(customerId),
    queryFn: () => favoritesApi.getFavorites(customerId ?? ""),
    enabled: !!customerId,
  });
};

export const useCustomerFavoriteChecks = (productIds: string[]) => {
  const customerId = useAuthStore(selectCustomerId);

  return useQuery({
    queryKey: customerFavoriteKeys.check(customerId, productIds),
    queryFn: () => favoritesApi.checkFavorites(customerId ?? "", { productIds }),
    enabled: !!customerId && productIds.length > 0,
  });
};

export const useToggleCustomerFavorite = () => {
  const customerId = useAuthStore(selectCustomerId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => {
      if (!customerId) throw new Error("Customer session is required");
      return favoritesApi.toggleFavorite(customerId, { productId });
    },
    onMutate: async (productId) => {
      if (!customerId) return { previousFavorites: undefined };

      const favoritesKey = customerFavoriteKeys.lists(customerId);
      await queryClient.cancelQueries({ queryKey: favoritesKey });

      const previousFavorites =
        queryClient.getQueryData<CustomerProduct[]>(favoritesKey);
      const previousProductLists = queryClient.getQueriesData<{
        items: CustomerProduct[];
      }>({ queryKey: customerCatalogKeys.products() });
      const previousProductDetail = queryClient.getQueryData<CustomerProduct>(
        customerCatalogKeys.productDetail(productId),
      );

      // Find the product from any cached source so we can optimistically add it
      let productToAdd: CustomerProduct | undefined = previousProductDetail;
      if (!productToAdd) {
        for (const [, data] of previousProductLists) {
          const found = data?.items?.find((p) => p.id === productId);
          if (found) { productToAdd = found; break; }
        }
      }

      queryClient.setQueryData<CustomerProduct[]>(favoritesKey, (current) => {
        const list = current ?? [];
        const existing = list.find((product) => product.id === productId);
        if (existing) return list.filter((product) => product.id !== productId);
        if (!productToAdd) return list;
        return [...list, { ...productToAdd, isFavorite: true }];
      });

      queryClient.setQueriesData<{ items: CustomerProduct[] }>(
        { queryKey: customerCatalogKeys.products() },
        (current) => {
          if (!current?.items) return current;
          return {
            ...current,
            items: current.items.map((product) =>
              product.id === productId
                ? { ...product, isFavorite: !product.isFavorite }
                : product,
            ),
          };
        },
      );

      queryClient.setQueryData<CustomerProduct>(
        customerCatalogKeys.productDetail(productId),
        (current) =>
          current ? { ...current, isFavorite: !current.isFavorite } : current,
      );

      return { previousFavorites, previousProductLists, previousProductDetail };
    },
    onError: (_error, productId, context) => {
      if (!customerId || !context) return;
      queryClient.setQueryData(
        customerFavoriteKeys.lists(customerId),
        context.previousFavorites,
      );
      context.previousProductLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      queryClient.setQueryData(
        customerCatalogKeys.productDetail(productId),
        context.previousProductDetail,
      );
    },
    onSettled: (_data, _error, productId) => {
      if (!customerId) return;
      queryClient.invalidateQueries({
        queryKey: customerFavoriteKeys.lists(customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerCatalogKeys.products() });
      queryClient.invalidateQueries({
        queryKey: customerCatalogKeys.productDetail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: customerFavoriteKeys.checks(customerId),
      });
    },
  });
};
