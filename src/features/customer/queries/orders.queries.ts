import { useMutation, useQuery } from "@tanstack/react-query";
import {
  customerOrdersApi,
  type CheckoutPayload,
} from "../api/customerOrders.api";

export const useCustomerOrders = (customerId: string, status = "All") =>
  useQuery({
    queryKey: ["customer", "orders", customerId, status],
    queryFn: () => customerOrdersApi.getOrders(customerId, status),
    enabled: !!customerId,
  });

export const useCheckout = (customerId: string) =>
  useMutation({
    mutationFn: (payload: CheckoutPayload) =>
      customerOrdersApi.checkout(customerId, payload),
  });

export const useCreatePaymentIntent = (customerId: string) =>
  useMutation({
    mutationFn: (orderId: string) =>
      customerOrdersApi.createPaymentIntent(customerId, orderId),
  });

export const useConfirmPayment = (customerId: string) =>
  useMutation({
    mutationFn: (orderId: string) =>
      customerOrdersApi.confirmPayment(customerId, orderId),
  });
