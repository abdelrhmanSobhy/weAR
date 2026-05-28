export interface Offer {
  id: string;
  title: string;
  description: string;
  offerType: string;
  productId?: string | null;
  productName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  status: string;
  isExpired: boolean;
  isActiveNow: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetOffersParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  offerType?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
  timestamp: string;
  traceId: string;
}
