export interface OrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Order {
  orderId: string;
  retailerId: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface GetOrdersParams {
  pageNumber?: number;
  pageSize?: number;
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
