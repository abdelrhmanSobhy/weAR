import { apiClient } from "@/lib/axios";
import { unwrapCustomerApiData } from "@/features/customer/api/customerApiUtils";
import type { PaginatedCustomerResponse } from "@/features/customer/api/profileAvatar.api";
import type { CreateTryOnSessionPayload, TryOnSession } from "@/features/customer/try-on/types/tryOn";

type TryOnSessionResponse = Partial<TryOnSession> & {
  id: string;
  productId: string;
  confidenceScore?: number | null;
  durationSeconds?: number | null;
};

type TryOnResultResponse = {
  status?: string | null;
  resultType?: string | null;
  // 2D try-on result image URL.
  resultImageUrl?: string | null;
  // 3D try-on result model URL (populated by backend for Model3D sessions).
  resultModelUrl?: string | null;
  recommendedSize?: string | null;
  sizeRecommendation?: string | null;
  confidenceScore?: number | null;
  durationSeconds?: number | null;
  traceId?: string | null;
  // True when the result was served from AiGenerationCache without calling fal.ai.
  isCached?: boolean | null;
  // The persisted VirtualTryOnSession.Id from the backend.
  sessionId?: string | null;
};

type TryOnSessionsPage = Partial<PaginatedCustomerResponse<TryOnSessionResponse>>;

const normalizeTryOnSession = (session: TryOnSessionResponse): TryOnSession => ({
  ...session,
  id: session.id,
  customerId: session.customerId ?? undefined,
  productId: session.productId,
  retailerId: session.retailerId ?? null,
  avatarId: session.avatarId ?? null,
  sessionType: session.sessionType,
  status: session.status ?? null,
  resultImageUrl: session.resultImageUrl ?? null,
  resultModelUrl: session.resultModelUrl ?? null,
  recommendedSize: session.recommendedSize ?? session.sizeRecommendation ?? null,
  confidenceScore: session.confidenceScore ?? null,
  durationSeconds: session.durationSeconds ?? null,
  createdAt: session.createdAt ?? null,
});

const createClientSessionId = (productId: string) =>
  globalThis.crypto?.randomUUID?.() ?? `${productId}-${Date.now()}`;

const normalizeCreatedTryOn = (
  payload: CreateTryOnSessionPayload,
  result: TryOnResultResponse,
): TryOnSession => ({
  // Prefer the server-assigned session ID; fall back to a local ID only if the
  // backend did not return one (older deployments).
  id: result.sessionId ?? createClientSessionId(payload.productId),
  productId: payload.productId,
  avatarId: payload.avatarId ?? null,
  sessionType: payload.sessionType,
  status: result.status ?? null,
  resultType: result.resultType ?? null,
  resultImageUrl: result.resultImageUrl ?? null,
  resultModelUrl: result.resultModelUrl ?? null,
  isCached: result.isCached ?? null,
  recommendedSize: result.recommendedSize ?? result.sizeRecommendation ?? null,
  traceId: result.traceId ?? null,
  confidenceScore: result.confidenceScore ?? null,
  durationSeconds: result.durationSeconds ?? null,
  createdAt: new Date().toISOString(),
});

const normalizeTryOnPage = (payload: TryOnSessionResponse[] | TryOnSessionsPage) => {
  if (Array.isArray(payload)) return payload.map(normalizeTryOnSession);

  return {
    items: (payload.items ?? []).map(normalizeTryOnSession),
    pageNumber: payload.pageNumber,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
    totalPages: payload.totalPages,
    hasPreviousPage: payload.hasPreviousPage,
    hasNextPage: payload.hasNextPage,
  };
};

export const tryOnApi = {
  createSession: async (customerId: string, payload: CreateTryOnSessionPayload): Promise<TryOnSession> => {
    const response = await apiClient.post(`/api/customers/${customerId}/try-on`, payload);
    return normalizeCreatedTryOn(payload, unwrapCustomerApiData<TryOnResultResponse>(response.data));
  },
  listSessions: async (customerId: string, signal?: AbortSignal): Promise<TryOnSession[] | PaginatedCustomerResponse<TryOnSession>> => {
    const response = await apiClient.get(`/api/customers/${customerId}/try-on/sessions`, { signal });
    return normalizeTryOnPage(unwrapCustomerApiData<TryOnSessionResponse[] | TryOnSessionsPage>(response.data));
  },
  getSession: async (customerId: string, sessionId: string, signal?: AbortSignal): Promise<TryOnSession> => {
    const response = await apiClient.get(`/api/customers/${customerId}/try-on/sessions/${sessionId}`, { signal });
    return normalizeTryOnSession(unwrapCustomerApiData<TryOnSessionResponse>(response.data));
  },
  getProductSessions: async (customerId: string, productId: string, signal?: AbortSignal): Promise<TryOnSession[] | PaginatedCustomerResponse<TryOnSession>> => {
    const response = await apiClient.get(`/api/customers/${customerId}/products/${productId}/sessions`, { signal });
    return normalizeTryOnPage(unwrapCustomerApiData<TryOnSessionResponse[] | TryOnSessionsPage>(response.data));
  },
};
