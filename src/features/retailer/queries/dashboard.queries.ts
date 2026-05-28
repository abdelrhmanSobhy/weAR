import { useMutation, useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
import type {
  DashboardChartParams,
  DashboardDateRangeParams,
  DashboardReportRequest,
} from "../types/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  retailer: (retailerId: string) => [...dashboardKeys.all, retailerId] as const,
  kpis: (retailerId: string, params: DashboardDateRangeParams) =>
    [...dashboardKeys.retailer(retailerId), "kpis", params] as const,
  revenue: (retailerId: string, params: DashboardChartParams) =>
    [...dashboardKeys.retailer(retailerId), "revenue", params] as const,
  profit: (retailerId: string, params: DashboardChartParams) =>
    [...dashboardKeys.retailer(retailerId), "profit", params] as const,
  sessions: (retailerId: string, params: DashboardChartParams) =>
    [...dashboardKeys.retailer(retailerId), "sessions", params] as const,
  activity: (retailerId: string) =>
    [...dashboardKeys.retailer(retailerId), "activity"] as const,
  returnReasons: (retailerId: string, params: DashboardDateRangeParams) =>
    [...dashboardKeys.retailer(retailerId), "return-reasons", params] as const,
  fitAccuracy: (retailerId: string, params: DashboardDateRangeParams) =>
    [...dashboardKeys.retailer(retailerId), "fit-accuracy", params] as const,
  sizeDistribution: (retailerId: string, params: DashboardDateRangeParams) =>
    [...dashboardKeys.retailer(retailerId), "size-distribution", params] as const,
  returnRate: (retailerId: string, params: DashboardDateRangeParams) =>
    [...dashboardKeys.retailer(retailerId), "return-rate", params] as const,
  conversion: (retailerId: string, params: DashboardDateRangeParams) =>
    [...dashboardKeys.retailer(retailerId), "conversion", params] as const,
  engagement: (retailerId: string, params: DashboardChartParams) =>
    [...dashboardKeys.retailer(retailerId), "engagement", params] as const,
  report: (retailerId: string, reportId: string) =>
    [...dashboardKeys.retailer(retailerId), "reports", reportId] as const,
};

export const useDashboardKpis = (
  retailerId: string,
  params: DashboardDateRangeParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.kpis(retailerId, params),
    queryFn: () => dashboardApi.getKpis(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardRevenue = (
  retailerId: string,
  params: DashboardChartParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.revenue(retailerId, params),
    queryFn: () => dashboardApi.getRevenue(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardProfit = (
  retailerId: string,
  params: DashboardChartParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.profit(retailerId, params),
    queryFn: () => dashboardApi.getProfit(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardSessions = (
  retailerId: string,
  params: DashboardChartParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.sessions(retailerId, params),
    queryFn: () => dashboardApi.getSessions(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardActivity = (retailerId: string) => {
  return useQuery({
    queryKey: dashboardKeys.activity(retailerId),
    queryFn: () => dashboardApi.getActivity(retailerId),
    enabled: !!retailerId,
    refetchInterval: 60_000,
  });
};

export const useDashboardReturnReasons = (
  retailerId: string,
  params: DashboardDateRangeParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.returnReasons(retailerId, params),
    queryFn: () => dashboardApi.getReturnReasons(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardFitAccuracy = (
  retailerId: string,
  params: DashboardDateRangeParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.fitAccuracy(retailerId, params),
    queryFn: () => dashboardApi.getFitAccuracy(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardSizeDistribution = (
  retailerId: string,
  params: DashboardDateRangeParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.sizeDistribution(retailerId, params),
    queryFn: () => dashboardApi.getSizeDistribution(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardReturnRate = (
  retailerId: string,
  params: DashboardDateRangeParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.returnRate(retailerId, params),
    queryFn: () => dashboardApi.getReturnRate(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardConversion = (
  retailerId: string,
  params: DashboardDateRangeParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.conversion(retailerId, params),
    queryFn: () => dashboardApi.getConversion(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useDashboardEngagement = (
  retailerId: string,
  params: DashboardChartParams,
) => {
  return useQuery({
    queryKey: dashboardKeys.engagement(retailerId, params),
    queryFn: () => dashboardApi.getEngagement(retailerId, params),
    enabled: !!retailerId,
  });
};

export const useExportDashboardCsv = (retailerId: string) => {
  return useMutation({
    mutationFn: (params: DashboardDateRangeParams) =>
      dashboardApi.exportCsv(retailerId, params),
  });
};

export const useRequestDashboardReport = (retailerId: string) => {
  return useMutation({
    mutationFn: (data: DashboardReportRequest) =>
      dashboardApi.requestReport(retailerId, data),
  });
};

export const useDashboardReportStatus = (
  retailerId: string,
  reportId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: dashboardKeys.report(retailerId, reportId),
    queryFn: () => dashboardApi.getReportStatus(retailerId, reportId),
    enabled: !!retailerId && !!reportId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.data.status;
      return status === "Pending" || status === "Processing" ? 5_000 : false;
    },
  });
};
