export interface Category {
  id: string;
  retailerId: string;
  name: string;
  description: string;
  coverImageUrl: string;
  status: string;
  subCategoryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  retailerId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

export interface GetCategoriesParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
}
