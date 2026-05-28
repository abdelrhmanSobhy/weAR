import { apiClient } from "@/lib/axios";
import type {
  DashboardActivityEvent,
  DashboardApiResponse,
  DashboardChartParams,
  DashboardChartPoint,
  DashboardConversion,
  DashboardDateRangeParams,
  DashboardEngagementPoint,
  DashboardFitAccuracy,
  DashboardKpis,
  DashboardReportCreated,
  DashboardReportRequest,
  DashboardReportStatus,
  DashboardReturnRateProduct,
  DashboardReturnReason,
  DashboardSizeDistributionItem,
} from "../types/dashboard";

export const dashboardApi = {
  getKpis: async (retailerId: string, params: DashboardDateRangeParams) => {
    const response = await apiClient.get<DashboardApiResponse<DashboardKpis>>(
      `/api/retailers/${retailerId}/dashboard/kpis`,
      { params },
    );
    return response.data;
  },

  getRevenue: async (retailerId: string, params: DashboardChartParams) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardChartPoint[]>
    >(`/api/retailers/${retailerId}/dashboard/revenue`, { params });
    return response.data;
  },

  getProfit: async (retailerId: string, params: DashboardChartParams) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardChartPoint[]>
    >(`/api/retailers/${retailerId}/dashboard/profit`, { params });
    return response.data;
  },

  getSessions: async (retailerId: string, params: DashboardChartParams) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardChartPoint[]>
    >(`/api/retailers/${retailerId}/dashboard/sessions`, { params });
    return response.data;
  },

  getActivity: async (retailerId: string) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardActivityEvent[]>
    >(`/api/retailers/${retailerId}/dashboard/activity`);
    return response.data;
  },

  getReturnReasons: async (
    retailerId: string,
    params: DashboardDateRangeParams,
  ) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardReturnReason[]>
    >(`/api/retailers/${retailerId}/dashboard/return-reasons`, { params });
    return response.data;
  },

  getFitAccuracy: async (
    retailerId: string,
    params: DashboardDateRangeParams,
  ) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardFitAccuracy>
    >(`/api/retailers/${retailerId}/dashboard/fit-accuracy`, { params });
    return response.data;
  },

  getSizeDistribution: async (
    retailerId: string,
    params: DashboardDateRangeParams,
  ) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardSizeDistributionItem[]>
    >(`/api/retailers/${retailerId}/dashboard/size-distribution`, { params });
    return response.data;
  },

  getReturnRate: async (
    retailerId: string,
    params: DashboardDateRangeParams,
  ) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardReturnRateProduct[]>
    >(`/api/retailers/${retailerId}/dashboard/return-rate`, { params });
    return response.data;
  },

  getConversion: async (retailerId: string, params: DashboardDateRangeParams) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardConversion>
    >(`/api/retailers/${retailerId}/dashboard/conversion`, { params });
    return response.data;
  },

  getEngagement: async (retailerId: string, params: DashboardChartParams) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardEngagementPoint[]>
    >(`/api/retailers/${retailerId}/dashboard/engagement`, { params });
    return response.data;
  },

  exportCsv: async (retailerId: string, params: DashboardDateRangeParams) => {
    const response = await apiClient.get<Blob>(
      `/api/retailers/${retailerId}/dashboard/export`,
      { params, responseType: "blob" },
    );
    return response.data;
  },

  requestReport: async (retailerId: string, data: DashboardReportRequest) => {
    const response = await apiClient.post<
      DashboardApiResponse<DashboardReportCreated>
    >(`/api/retailers/${retailerId}/dashboard/reports`, data);
    return response.data;
  },

  getReportStatus: async (retailerId: string, reportId: string) => {
    const response = await apiClient.get<
      DashboardApiResponse<DashboardReportStatus>
    >(`/api/retailers/${retailerId}/dashboard/reports/${reportId}`);
    return response.data;
  },
};
