export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  resourceId: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  unreadCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GetNotificationsParams {
  isRead?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
