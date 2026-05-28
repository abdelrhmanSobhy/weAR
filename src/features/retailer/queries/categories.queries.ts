import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import type { GetCategoriesParams } from "../types/category";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: (retailerId: string) =>
    [...categoryKeys.all, retailerId, "list"] as const,
  list: (retailerId: string, params: GetCategoriesParams) =>
    [...categoryKeys.lists(retailerId), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (retailerId: string, id: string) =>
    [...categoryKeys.details(), retailerId, id] as const,
  subCategories: (retailerId: string, categoryId: string) =>
    [...categoryKeys.detail(retailerId, categoryId), "sub-categories"] as const,
};

export const useCategories = (
  retailerId: string,
  params: GetCategoriesParams = {},
) => {
  return useQuery({
    queryKey: categoryKeys.list(retailerId, params),
    queryFn: () => categoriesApi.getCategories(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useSubCategories = (retailerId: string, categoryId: string) => {
  return useQuery({
    queryKey: categoryKeys.subCategories(retailerId, categoryId),
    queryFn: () => categoriesApi.getSubCategories(retailerId, categoryId),
    enabled: !!retailerId && !!categoryId,
  });
};

export const useCreateCategory = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      categoriesApi.createCategory(retailerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(retailerId),
      });
    },
  });
};

export const useDeleteCategory = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.deleteCategory(retailerId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(retailerId),
      });
    },
  });
};

export const useToggleCategoryStatus = (retailerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.toggleCategoryStatus(retailerId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(retailerId),
      });
    },
  });
};
