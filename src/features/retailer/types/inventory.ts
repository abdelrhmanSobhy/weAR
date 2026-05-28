export interface StockAdjustment {
  id: string;
  adjustmentType: string;
  oldQuantity: number;
  newQuantity: number;
  reason: string;
  adjustedById: string;
  adjustedAt: string;
}

export interface InventoryRecord {
  id: string;
  retailerId: string;
  productId: string;
  productName: string;
  currentStock: number;
  soldQuantity: number;
  lowStockThreshold: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  stockAdjustments?: StockAdjustment[];
}

export interface GetInventoryParams {
  pageNumber?: number;
  pageSize?: number;
  productName?: string;
  sortBySoldQuantityDesc?: boolean;
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
