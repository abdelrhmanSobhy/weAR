import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "../api/payment.api";
import type { AddPaymentMethodRequest } from "../types/payment";

export const paymentKeys = {
  all: ["payment"] as const,
  retailer: (retailerId: string) => [...paymentKeys.all, retailerId] as const,
  methods: (retailerId: string) => [...paymentKeys.retailer(retailerId), "methods"] as const,
  method: (retailerId: string, methodId: string) => [...paymentKeys.methods(retailerId), methodId] as const,
};

export const usePaymentMethods = (retailerId: string) => {
  return useQuery({
    queryKey: paymentKeys.methods(retailerId),
    queryFn: () => paymentApi.getPaymentMethods(retailerId),
    enabled: !!retailerId,
  });
};

export const usePaymentMethod = (retailerId: string, methodId: string) => {
  return useQuery({
    queryKey: paymentKeys.method(retailerId, methodId),
    queryFn: () => paymentApi.getPaymentMethod(retailerId, methodId),
    enabled: !!retailerId && !!methodId,
  });
};

export const useAddPaymentMethod = (retailerId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AddPaymentMethodRequest) => paymentApi.addPaymentMethod(retailerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods(retailerId) });
    },
  });
};

export const useDeletePaymentMethod = (retailerId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (methodId: string) => paymentApi.deletePaymentMethod(retailerId, methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods(retailerId) });
    },
  });
};

export const useSetDefaultPaymentMethod = (retailerId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (methodId: string) => paymentApi.setDefaultPaymentMethod(retailerId, methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods(retailerId) });
    },
  });
};
