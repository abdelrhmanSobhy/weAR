import type { ApiEnvelope } from "@/features/customer/types/customer";

export type CustomerApiListEnvelope<T> =
  | ApiEnvelope<T>
  | ApiEnvelope<ApiEnvelope<T>>
  | T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const unwrapCustomerApiData = <T>(payload: CustomerApiListEnvelope<T>): T => {
  if (!isRecord(payload) || !("data" in payload)) return payload as T;

  const data = payload.data;
  if (isRecord(data) && "data" in data) return data.data as T;

  return data as T;
};

export const stripEmptyParams = <T extends Record<string, unknown>>(params: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as Partial<T>;
