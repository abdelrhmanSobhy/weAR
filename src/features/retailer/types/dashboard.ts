export interface DashboardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
  timestamp: string;
  traceId: string;
}

export type DashboardGroupBy = 0 | 1 | 2;

export interface DashboardDateRangeParams {
  from: string;
  to: string;
}

export interface DashboardChartParams extends DashboardDateRangeParams {
  groupBy?: DashboardGroupBy;
}

export interface DashboardKpis {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalTryOns: number;
  activeProducts: number;
  lowStockCount: number;
  conversionRate: number;
  totalReturns: number;
  newOrders: number;
}

export interface DashboardChartPoint {
  label: string;
  value: number;
}

export interface DashboardActivityEvent {
  id: string;
  eventType: string;
  resourceId: string;
  eventData: string;
  createdAt: string;
}

export interface DashboardReturnReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface DashboardFitAccuracy {
  totalPredictions: number;
  accuratePredictions: number;
  accuracyPercentage: number;
}

export interface DashboardSizeDistributionItem {
  size: string;
  count: number;
  percentage: number;
}

export interface DashboardReturnRateProduct {
  productId: string;
  productName: string;
  totalOrders: number;
  totalReturns: number;
  returnRatePercentage: number;
}

export interface DashboardConversion {
  totalSessions: number;
  convertedSessions: number;
  conversionRatePercentage: number;
}

export interface DashboardEngagementPoint {
  label: string;
  sessionCount: number;
  avgDurationSeconds: number;
}

export interface DashboardReportRequest {
  from: string;
  to: string;
}

export interface DashboardReportCreated {
  reportId: string;
}

export interface DashboardReportStatus {
  reportId: string;
  status: string;
  reportUrl: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}
