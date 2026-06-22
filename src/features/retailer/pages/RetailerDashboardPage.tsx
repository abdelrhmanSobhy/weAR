import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { Download, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useDashboardActivity,
  useDashboardConversion,
  useDashboardEngagement,
  useDashboardKpis,
  useDashboardProfit,
  useDashboardReturnRate,
  useDashboardReturnReasons,
  useDashboardRevenue,
  useDashboardSessions,
  useDashboardSizeDistribution,
  useExportDashboardCsv,
} from "../queries/dashboard.queries";
import type { DashboardGroupBy } from "../types/dashboard";

// ==========================================
// 📊 Mock Data (Matches Figma Exactly)
// ==========================================
const fallbackRevenueData = [
  { month: "Jan", revenue: 40, expenses: 24 },
  { month: "Feb", revenue: 30, expenses: 13 },
  { month: "Mar", revenue: 50, expenses: 20 },
  { month: "Apr", revenue: 80, expenses: 39 },
  { month: "May", revenue: 125.2, expenses: 48 },
  { month: "Jun", revenue: 90, expenses: 38 },
  { month: "Jul", revenue: 110, expenses: 43 },
  { month: "Aug", revenue: 140, expenses: 55 },
  { month: "Sep", revenue: 190, expenses: 65 },
  { month: "Oct", revenue: 210, expenses: 70 },
  { month: "Nov", revenue: 240, expenses: 80 },
  { month: "Dec", revenue: 240.8, expenses: 144.6 },
];

const fallbackProfitData = [
  { name: "1", val1: 40, val2: 24 },
  { name: "2", val1: 30, val2: 13 },
  { name: "3", val1: 20, val2: 50 },
  { name: "4", val1: 27, val2: 39 },
  { name: "5", val1: 18, val2: 48 },
  { name: "6", val1: 23, val2: 38 },
  { name: "7", val1: 34, val2: 43 },
  { name: "8", val1: 44, val2: 55 },
  { name: "9", val1: 54, val2: 65 },
];

const fallbackSessionsData = [
  { day: "1", users: 20 },
  { day: "2", users: 35 },
  { day: "3", users: 25 },
  { day: "4", users: 60 },
  { day: "5", users: 30 },
  { day: "6", users: 40 },
  { day: "7", users: 20 },
];

const fallbackReturnAnalysisData = [
  { name: "Fit", value: 45, color: "#A3B19B" },
  { name: "Style", value: 25, color: "#D6C5B3" },
  { name: "Quality", value: 15, color: "#E8D8CC" },
  { name: "Other", value: 10, color: "#8C7765" },
  { name: "Damaged", value: 5, color: "#DDDDDD" },
];

const fallbackFitAccuracyData = [
  { size: "XS", perfect: 55, needs: 40 },
  { size: "S", perfect: 65, needs: 80 },
  { size: "M", perfect: 78, needs: 15 },
  { size: "L", perfect: 80, needs: 18 },
  { size: "XL", perfect: 70, needs: 65 },
];

const fallbackSizeDistributionData = [
  { size: "XS", value: 20 },
  { size: "S", value: 45 },
  { size: "M", value: 78 },
  { size: "L", value: 58 },
  { size: "XL", value: 15 },
];

const fallbackHighestReturnData = [
  { name: "Leather", val1: 55, val2: 20 },
  { name: "Blazer", val1: 65, val2: 10 },
  { name: "Summer", val1: 78, val2: 5 },
  { name: "Classic", val1: 80, val2: 5 },
  { name: "Silk", val1: 70, val2: 15 },
  { name: "Cotton", val1: 35, val2: 40 },
];

const fallbackConversionRateData = [
  { day: "1", rate: 2 },
  { day: "5", rate: 4 },
  { day: "10", rate: 6 },
  { day: "15", rate: 5 },
  { day: "20", rate: 4 },
  { day: "25", rate: 3 },
];

const fallbackKpis = {
  totalRevenue: 248600,
  totalOrders: 1342,
  totalTryOns: 8730,
  totalReturns: 214,
  totalProfit: 91200,
};

const fallbackConversionStats = {
  totalSessions: 24580,
  conversionRatePercentage: 5.46,
};

const fallbackTriedOnData = [
  { name: "Denim", try: 58, conv: 40 },
  { name: "Wide Leg", try: 70, conv: 50 },
  { name: "Silk", try: 38, conv: 80 },
  { name: "Skirt", try: 78, conv: 18 },
];

// Heatmap Mock Data (7 days x 4 time blocks)
const heatmapData = Array.from({ length: 4 }).map(() =>
  Array.from({ length: 7 }).map(() => Math.floor(Math.random() * 100)),
);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

const plainNumberFormatter = new Intl.NumberFormat("en-US");

const formatCurrencyCompact = (value?: number) =>
  currencyFormatter.format(value ?? 0);

const formatNumberCompact = (value?: number) =>
  numberFormatter.format(value ?? 0);

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const buildDefaultDateRange = () => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
};

const formatRelativeTime = (dateValue: string) => {
  const createdAt = new Date(dateValue).getTime();

  if (Number.isNaN(createdAt)) {
    return "Just now";
  }

  const diffInMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAt) / 60_000),
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hrs ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export function RetailerDashboardPage() {
  const { user, isNewRegistration } = useAuthStore();
  const retailerId = user?.id ?? "";
  const displayName = user?.fullName || user?.brandName || "Mohamed";

  const dateRange = useMemo(() => buildDefaultDateRange(), []);
  const chartParams = useMemo(
    () => ({ ...dateRange, groupBy: 2 as DashboardGroupBy }),
    [dateRange],
  );

  const kpisQuery = useDashboardKpis(retailerId, dateRange);
  const revenueQuery = useDashboardRevenue(retailerId, chartParams);
  const profitQuery = useDashboardProfit(retailerId, chartParams);
  const sessionsQuery = useDashboardSessions(retailerId, chartParams);
  const activityQuery = useDashboardActivity(retailerId);
  const returnReasonsQuery = useDashboardReturnReasons(retailerId, dateRange);
  const sizeDistributionQuery = useDashboardSizeDistribution(
    retailerId,
    dateRange,
  );
  const returnRateQuery = useDashboardReturnRate(retailerId, dateRange);
  const conversionQuery = useDashboardConversion(retailerId, dateRange);
  const engagementQuery = useDashboardEngagement(retailerId, chartParams);
  const exportDashboardCsv = useExportDashboardCsv(retailerId);

  const kpisRaw = kpisQuery.data?.data;
  const conversionRaw = conversionQuery.data?.data;

  const withFallback = !isNewRegistration;

  const kpis = {
    totalRevenue: (withFallback && !kpisRaw?.totalRevenue) ? fallbackKpis.totalRevenue : (kpisRaw?.totalRevenue ?? 0),
    totalOrders: (withFallback && !kpisRaw?.totalOrders) ? fallbackKpis.totalOrders : (kpisRaw?.totalOrders ?? 0),
    totalTryOns: (withFallback && !kpisRaw?.totalTryOns) ? fallbackKpis.totalTryOns : (kpisRaw?.totalTryOns ?? 0),
    totalReturns: (withFallback && !kpisRaw?.totalReturns) ? fallbackKpis.totalReturns : (kpisRaw?.totalReturns ?? 0),
    totalProfit: (withFallback && !kpisRaw?.totalProfit) ? fallbackKpis.totalProfit : (kpisRaw?.totalProfit ?? 0),
  };
  const conversion = {
    totalSessions: (withFallback && !conversionRaw?.totalSessions) ? fallbackConversionStats.totalSessions : (conversionRaw?.totalSessions ?? 0),
    conversionRatePercentage: (withFallback && !conversionRaw?.conversionRatePercentage) ? fallbackConversionStats.conversionRatePercentage : (conversionRaw?.conversionRatePercentage ?? 0),
  };

  const revenueData = useMemo(() => {
    const revenuePoints = revenueQuery.data?.data ?? [];
    const profitPoints = profitQuery.data?.data ?? [];

    if (!revenuePoints.length) return withFallback ? fallbackRevenueData : [];

    return revenuePoints.map((point, index) => {
      const profitValue = profitPoints[index]?.value ?? 0;
      return {
        month: point.label,
        revenue: point.value,
        expenses: Math.max(point.value - profitValue, 0),
      };
    });
  }, [profitQuery.data?.data, revenueQuery.data?.data, withFallback]);

  const profitData = useMemo(() => {
    const points = profitQuery.data?.data ?? [];

    if (!points.length) return withFallback ? fallbackProfitData : [];

    return points.map((point) => ({
      name: point.label,
      val1: point.value,
      val2: 0,
    }));
  }, [profitQuery.data?.data, withFallback]);

  const sessionsData = useMemo(() => {
    const points = sessionsQuery.data?.data ?? [];

    if (!points.length) return withFallback ? fallbackSessionsData : [];

    return points.map((point) => ({
      day: point.label,
      users: point.value,
    }));
  }, [sessionsQuery.data?.data, withFallback]);

  const activityData = useMemo(() => {
    const events = activityQuery.data?.data ?? [];

    if (!events.length) {
      if (!withFallback) return [];
      return [
        {
          t: "15 min ago",
          desc: 'User tried "Winter Coat" + 3 Accessories',
          bg: "bg-[#FDFCFB]",
        },
        {
          t: "32 min ago",
          desc: "Customer purchased after 5 virtual try-ons",
          bg: "bg-white",
        },
        {
          t: "47 min ago",
          desc: "User tried on 2 items",
          bg: "bg-[#FDFCFB]",
        },
        {
          t: "12 hrs ago",
          desc: "New collection saved 284 times",
          bg: "bg-white",
        },
      ];
    }

    return events.slice(0, 4).map((event, index) => ({
      t: formatRelativeTime(event.createdAt),
      desc: event.eventData || event.eventType,
      bg: index % 2 === 0 ? "bg-[#FDFCFB]" : "bg-white",
    }));
  }, [activityQuery.data?.data, withFallback]);

  const returnAnalysisData = useMemo(() => {
    const colors = ["#A3B19B", "#D6C5B3", "#E8D8CC", "#8C7765", "#DDDDDD"];
    const reasons = returnReasonsQuery.data?.data ?? [];

    if (!reasons.length) return withFallback ? fallbackReturnAnalysisData : [];

    return reasons.map((item, index) => ({
      name: item.reason,
      value: item.count,
      color: colors[index % colors.length],
    }));
  }, [returnReasonsQuery.data?.data, withFallback]);

  const sizeDistributionData = useMemo(() => {
    const sizes = sizeDistributionQuery.data?.data ?? [];

    if (!sizes.length) return withFallback ? fallbackSizeDistributionData : [];

    return sizes.map((item) => ({
      size: item.size,
      value: item.count,
    }));
  }, [sizeDistributionQuery.data?.data, withFallback]);

  const highestReturnData = useMemo(() => {
    const products = returnRateQuery.data?.data ?? [];

    if (!products.length) return withFallback ? fallbackHighestReturnData : [];

    return products.slice(0, 6).map((product) => ({
      name: product.productName,
      val1: product.returnRatePercentage,
      val2: Math.max(100 - product.returnRatePercentage, 0),
    }));
  }, [returnRateQuery.data?.data, withFallback]);

  const conversionRateData = useMemo(() => {
    if (!conversionRaw) return withFallback ? fallbackConversionRateData : [];

    return [
      {
        day: "Now",
        rate: conversion.conversionRatePercentage,
      },
    ];
  }, [conversion, conversionRaw]);

  const triedOnData = useMemo(() => {
    const points = engagementQuery.data?.data ?? [];

    if (!points.length) return withFallback ? fallbackTriedOnData : [];

    return points.slice(0, 4).map((point) => ({
      name: point.label,
      try: point.sessionCount,
      conv: Math.round(point.avgDurationSeconds),
    }));
  }, [engagementQuery.data?.data, withFallback]);

  const handleExportDashboard = () => {
    if (!retailerId || exportDashboardCsv.isPending) return;

    exportDashboardCsv.mutate(dateRange, {
      onSuccess: (blob) => {
        downloadBlob(blob, `dashboard-${dateRange.from}-${dateRange.to}.csv`);
      },
    });
  };

  return (
    <div className="flex flex-col gap-10 font-sans pb-10">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1
            className="text-[32px] font-bold text-[#B6A092]"
            style={{ fontFamily: '"PT Serif", serif', lineHeight: 1.2 }}
          >
            Welcome back, {displayName.split(" ")[0] || "Mohamed"}
          </h1>
          <p className="text-[15px] text-[#949E96] mt-1">
            Here is what's happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-[#E4DCD1] text-[#B6A092] rounded-[10px] h-10"
            onClick={handleExportDashboard}
            disabled={exportDashboardCsv.isPending}
          >
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button className="bg-[#B6A092] hover:bg-[#9F8062] text-white rounded-[10px] h-10">
            <Calendar className="mr-2 h-4 w-4" /> Custom
          </Button>
        </div>
      </div>

      {/* ================= TOP KPIS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <TopKpiCard
          title="Total Sales"
          value={formatCurrencyCompact(kpis?.totalRevenue)}
          badge="+12%"
          active
        />
        <TopKpiCard
          title="Total Orders"
          value={formatNumberCompact(kpis?.totalOrders)}
          badge="+8%"
          active
        />
        <TopKpiCard
          title="Active Views"
          value={formatNumberCompact(kpis?.totalTryOns)}
          badge="-2%"
          active
        />
        <TopKpiCard
          title="Returns"
          value={formatNumberCompact(kpis?.totalReturns)}
          badge="+1%"
          active
        />
        <TopKpiCard
          title="Visitors"
          value={formatNumberCompact(conversion?.totalSessions)}
          badge="+5%"
          active
        />
      </div>

      {/* ================= MAIN CHARTS ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-[#949E96]">
                Total revenue
              </h3>
              <p
                className="text-[32px] font-bold text-[#B6A092]"
                style={{ fontFamily: '"PT Serif", serif' }}
              >
                {formatCurrencyCompact(kpis?.totalRevenue)}{" "}
                <span className="text-[12px] text-green-500 font-sans ml-2 bg-green-50 px-2 py-1 rounded-full">
                  +12.5%
                </span>
              </p>
            </div>
            <div className="flex gap-4 text-[13px] text-[#949E96] items-center">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#B6A092]" /> Revenue
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#E4DCD1]" /> Expenses
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 ml-2 rounded-[8px] border-[#E4DCD1] text-[#949E96]"
              >
                Monthly <MoreHorizontal className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B6A092" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#B6A092" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F0EDEB"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#BFC7DE", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#BFC7DE", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B6A092"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#E4DCD1"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit & Sessions */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm flex-1">
            <h3 className="text-[14px] font-bold text-[#949E96]">
              Total profit
            </h3>
            <p
              className="text-[24px] font-bold text-[#B6A092] mb-4"
              style={{ fontFamily: '"PT Serif", serif' }}
            >
              {formatCurrencyCompact(kpis?.totalProfit)}{" "}
              <span className="text-[10px] text-green-500 font-sans bg-green-50 px-2 py-0.5 rounded-full">
                +5.2%
              </span>
            </p>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData}>
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar
                    dataKey="val1"
                    fill="#A3B19B"
                    barSize={6}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="val2"
                    fill="#B6A092"
                    barSize={6}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm flex-1">
            <h3 className="text-[14px] font-bold text-[#949E96]">
              Total sessions
            </h3>
            <p
              className="text-[24px] font-bold text-[#949E96] mb-4"
              style={{ fontFamily: '"PT Serif", serif' }}
            >
              {formatNumberCompact(kpis?.totalTryOns)}{" "}
              <span className="text-[12px] font-sans">/period</span>
            </p>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionsData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F0EDEB"
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#B6A092"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#B6A092" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION: KEY PERFORMANCE INDICATORS ================= */}
      <div>
        <h2
          className="text-[22px] font-bold text-[#949E96] mb-6"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Activity */}
          <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold text-[#B6A092]">
                Real-time activity
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-[8px] border-[#E4DCD1] text-[#949E96] bg-[#FDFCFB]"
              >
                Live Stream{" "}
                <span className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </Button>
            </div>
            <div className="flex flex-col gap-6">
              {activityData.map((act, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-[12px] ${act.bg} border border-[#F0EDEB]`}
                >
                  <div className="flex gap-4 items-center flex-1">
                    <span className="text-[13px] font-bold text-[#C9A390] whitespace-nowrap">
                      {act.t} :
                    </span>
                    <p className="text-[14px] text-[#949E96] font-medium">
                      {act.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return Analysis (Donut) */}
          <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-8 shadow-sm flex flex-col">
            <h3 className="text-[16px] font-bold text-[#949E96] mb-2">
              Return Analysis
            </h3>
            <div className="flex-1 relative flex justify-center items-center min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={returnAnalysisData}
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {returnAnalysisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className="text-[32px] font-bold text-[#949E96]"
                  style={{ fontFamily: '"PT Serif", serif' }}
                >
                  {plainNumberFormatter.format(kpis?.totalReturns ?? 0)}
                </span>
                <span className="text-[12px] text-[#BFC7DE]">
                  Total Returns
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-[12px] text-[#949E96] mt-4 flex-wrap">
              {returnAnalysisData.map((item) => (
                <span key={item.name} className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />{" "}
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION: BODY DATA INSIGHTS ================= */}
      <div>
        <h2
          className="text-[22px] font-bold text-[#949E96] mb-6"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Body Data Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            {/* Fit Accuracy */}
            <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm h-[300px] flex flex-col">
              <h3 className="text-[16px] font-bold text-[#949E96] mb-4">
                Fit Accuracy by Size
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fallbackFitAccuracyData}
                  margin={{ left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F0EDEB"
                  />
                  <XAxis
                    dataKey="size"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#949E96", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#BFC7DE", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#F5F1EF" }} />
                  <Bar
                    dataKey="perfect"
                    fill="#D5C0B3"
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                  />
                  <Bar
                    dataKey="needs"
                    fill="#A3B19B"
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-[12px] text-[#949E96] mt-2">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#D5C0B3] rounded-[2px]" /> Perfect
                  Fit
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#A3B19B] rounded-[2px]" /> Needs
                  Adjustment
                </span>
              </div>
            </div>

            {/* Customer Size Distribution */}
            <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm h-[300px] flex flex-col">
              <h3 className="text-[16px] font-bold text-[#949E96] mb-4">
                Customer Size Distribution
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sizeDistributionData}
                  margin={{ left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F0EDEB"
                  />
                  <XAxis
                    dataKey="size"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#949E96", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#BFC7DE", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#F5F1EF" }} />
                  <Bar
                    dataKey="value"
                    fill="#E8D8CC"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Highest Return Rate */}
            <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm h-[300px] flex flex-col">
              <h3 className="text-[16px] font-bold text-[#949E96] mb-4">
                Products with highest Return Rate
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={highestReturnData}
                  margin={{ left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F0EDEB"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#949E96", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#BFC7DE", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#F5F1EF" }} />
                  <Bar
                    dataKey="val1"
                    stackId="a"
                    fill="#D5C0B3"
                    radius={[0, 0, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="val2"
                    stackId="a"
                    fill="#F5F1EF"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion Rate */}
            <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm h-[300px] flex flex-col">
              <h3 className="text-[16px] font-bold text-[#949E96] mb-4">
                Conversion Rate
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={conversionRateData}
                  margin={{ left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F0EDEB"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#949E96", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#BFC7DE", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#B6A092"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION: VIRTUAL TRY-ON ENGAGEMENT ================= */}
      <div>
        <h2
          className="text-[22px] font-bold text-[#949E96] mb-6"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Virtual Try-On Engagement Metrics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Tried On Items */}
          <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm h-[320px] flex flex-col">
            <h3 className="text-[16px] font-bold text-[#949E96] mb-4">
              Most Tried-On Items
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={triedOnData} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F0EDEB"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#949E96", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#BFC7DE", fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: "#F5F1EF" }} />
                <Bar
                  dataKey="try"
                  fill="#D5C0B3"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="conv"
                  fill="#F0EAE1"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 text-[12px] text-[#949E96] mt-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#D5C0B3] rounded-[2px]" /> Try On
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#F0EAE1] rounded-[2px]" />{" "}
                Conversion
              </span>
            </div>
          </div>

          {/* Number of Virtual Try Ons (Heatmap Simulation) */}
          <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[14px] text-[#949E96]">
                  Number of Virtual Try Ons
                </h3>
                <p
                  className="text-[32px] font-bold text-[#949E96]"
                  style={{ fontFamily: '"PT Serif", serif' }}
                >
                  {plainNumberFormatter.format(kpis?.totalTryOns ?? 0)}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-[#949E96]">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <div className="flex gap-2 h-[150px]">
                {/* Y Axis Labels */}
                <div className="flex flex-col justify-between text-[11px] text-[#BFC7DE] py-2">
                  <span>Morning</span>
                  <span>Afternoon</span>
                  <span>Evening</span>
                  <span>Night</span>
                </div>
                {/* Heatmap Grid */}
                <div className="flex-1 grid grid-cols-7 gap-1.5">
                  {days.map((day, colIdx) => (
                    <div key={day} className="flex flex-col gap-1.5 h-full">
                      {heatmapData.map((row, rowIdx) => {
                        const val = row[colIdx];
                        // Calculate opacity based on value
                        let bgClass = "bg-[#F5F1EF]";
                        if (val > 80) bgClass = "bg-[#B6A092]";
                        else if (val > 50) bgClass = "bg-[#D5C0B3]";
                        else if (val > 20) bgClass = "bg-[#E8D8CC]";

                        return (
                          <div
                            key={rowIdx}
                            className={`flex-1 rounded-[4px] ${bgClass} transition-colors hover:opacity-80 cursor-pointer`}
                            title={`${val} try-ons`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* X Axis Labels */}
              <div className="flex pl-12 mt-2">
                {days.map((d) => (
                  <div
                    key={d}
                    className="flex-1 text-center text-[11px] text-[#BFC7DE]"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🃏 Top KPI Card Component
// ==========================================
function TopKpiCard({
  title,
  value,
  badge,
  active,
}: {
  title: string;
  value: string;
  badge: string;
  active?: boolean;
}) {
  const isPositive = badge.includes("+");
  return (
    <div
      className={`rounded-[16px] p-5 shadow-sm transition-transform hover:-translate-y-1 ${active ? "bg-[#B6A092] text-white" : "bg-white border border-[#E4DCD1] text-[#949E96]"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4
          className={`text-[13px] font-medium ${active ? "text-white/80" : "text-[#BFC7DE]"}`}
        >
          {title}
        </h4>
      </div>
      <div className="flex items-end gap-2">
        <span
          className="text-[26px] font-bold"
          style={{ fontFamily: '"PT Serif", serif', lineHeight: 1 }}
        >
          {value}
        </span>
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded-[4px] font-sans font-medium mb-1 ${
            active
              ? "bg-white/20 text-white"
              : isPositive
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-500"
          }`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}
