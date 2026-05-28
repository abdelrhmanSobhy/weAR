export interface ProductImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  name: string;
  categoryName: string;
  categoryId?: string;
  subCategoryName: string;
  subCategoryId?: string;
  barcode: string;
  status: string;
  price: number;
  currency: string;
  thumbnailUrl?: string;
  images?: ProductImage[];
  currentStock?: number;
  inventoryStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GetProductsParams {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: string;
  subCategoryId?: string;
  status?: string;
  searchTerm?: string;
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
