import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { Search } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "../queries/orders.queries";
import { ordersApi } from "../api/orders.api";
import type { Order } from "../types/order";

export function RetailerOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const retailerId = user?.id || "5255b296-a907-40ae-8aba-48522d5a850a";

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userFilter, setUserFilter] = useState("All Users");
  const [sortOrder, setSortOrder] = useState("Newest First");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError } = useOrders(retailerId, {
    pageNumber: currentPage,
    pageSize: 20,
    searchTerm: debouncedSearch || undefined,
  });

  const statusMutation = useUpdateOrderStatus(retailerId);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "NotProcessed":
        return "bg-[#F5F5F5] text-[#5C5550]";
      case "Cancelled":
        return "bg-[#FFE4E4] text-[#F06161]";
      case "Processing":
        return "bg-[#FFF4E5] text-[#F2994A]";
      case "Shipped":
        return "bg-[#E5F0FF] text-[#2F80ED]";
      case "Delivered":
        return "bg-[#E0F2E9] text-[#4CAF50]";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await statusMutation.mutateAsync({ orderId, newStatus });
    } catch {
      alert(
        "Failed to update order status. Please check valid status transitions.",
      );
    }
  };

  const handleExportCSV = async () => {
    try {
      const blobData = await ordersApi.exportCsv(retailerId);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "orders_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export CSV.");
    }
  };

  let processedOrders = data?.data?.items || [];

  if (userFilter !== "All Users") {
    const type = userFilter === "Registered Users" ? "Registered" : "Guest";
    processedOrders = processedOrders.filter((order: Order) => {
      const uType = order.customerId ? "Registered" : "Guest";
      return uType === type;
    });
  }

  processedOrders = [...processedOrders].sort((a: Order, b: Order) => {
    if (sortOrder === "Highest Total") {
      return b.totalAmount - a.totalAmount;
    } else {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return sortOrder === "Newest First" ? dateB - dateA : dateA - dateB;
    }
  });

  const totalPages = data?.data?.totalPages || 1;
  const hasNextPage = data?.data?.hasNextPage || false;
  const hasPreviousPage = data?.data?.hasPreviousPage || false;

  return (
    <div className="flex flex-col gap-6 font-sans w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1
          className="text-[24px] md:text-[28px] font-bold text-[#B6A092]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          All Orders
        </h1>
        <button
          onClick={handleExportCSV}
          className="bg-[#C9A390] hover:bg-[#B6A092] text-white rounded-[10px] h-[42px] px-8 text-[14px] font-bold transition-colors w-full sm:w-auto"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-4 md:p-8 shadow-sm overflow-hidden w-full">
        {isLoading && (
          <p className="mb-4 text-[14px] text-[#949E96]">Loading orders...</p>
        )}
        {isError && (
          <p className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-[13px] text-red-600">
            Failed to load orders data.
          </p>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Order ID or Customer Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-[48px] w-full rounded-[10px] border border-[#E4DCD1] px-4 pl-12 text-[14px] outline-none focus:border-[#C9A390] placeholder:text-[#BFC7DE]"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFC7DE]"
              size={18}
            />
          </div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-[48px] w-full md:w-[220px] rounded-[10px] border border-[#E4DCD1] px-4 text-[14px] text-[#949E96] bg-white outline-none focus:border-[#C9A390]"
          >
            <option value="All Users">All Users</option>
            <option value="Registered Users">Registered Users</option>
            <option value="Guests">Guests</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-[48px] w-full md:w-[220px] rounded-[10px] border border-[#E4DCD1] px-4 text-[14px] text-[#949E96] bg-white outline-none focus:border-[#C9A390]"
          >
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Highest Total">Highest Total</option>
          </select>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#FEF9F2]/50 border-y border-[#F0EDEB] text-left text-[12px] font-bold uppercase tracking-wider text-[#B6A092]">
                <th className="py-4 pl-4 w-[15%]">ORDER ID</th>
                <th className="py-4 w-[15%]">CUSTOMER</th>
                <th className="py-4 w-[25%]">PRODUCTS</th>
                <th className="py-4 w-[10%]">DATE</th>
                <th className="py-4 w-[10%]">TOTAL</th>
                <th className="py-4 w-[12%]">STATUS</th>
                <th className="py-4 pr-4 w-[13%]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDEB]">
              {!isLoading && processedOrders.length > 0
                ? processedOrders.map((order: Order) => (
                    <tr
                      key={order.orderId}
                      className="group hover:bg-[#FDFCFB] transition-colors"
                    >
                      <td className="py-6 pl-4 text-[13px] font-bold text-[#5C5550]">
                        {order.orderId.slice(0, 8)}...
                      </td>
                      <td className="py-6 text-[13px] font-medium text-[#C9A390]">
                        {order.customerName}
                      </td>
                      <td className="py-6 pr-4">
                        <p className="text-[13px] font-bold text-[#5C5550] whitespace-pre-line leading-relaxed">
                          {order.items?.map((i) => i.productName).join(" + ") ||
                            "-"}
                        </p>
                      </td>
                      <td className="py-6 text-[13px] font-medium text-[#949E96]">
                        {new Date(order.orderDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-6 text-[13px] font-medium text-[#949E96]">
                        {order.totalAmount} {order.currency}
                      </td>
                      <td className="py-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap ${getStatusStyle(
                            order.status,
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                          {order.status === "NotProcessed"
                            ? "Not Processed"
                            : order.status}
                        </span>
                      </td>
                      <td className="py-6 pr-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.orderId, e.target.value)
                          }
                          disabled={
                            statusMutation.isPending ||
                            order.status === "Cancelled" ||
                            order.status === "Delivered"
                          }
                          className="h-[36px] w-full rounded-[8px] border border-[#E4DCD1] bg-white px-3 text-[12px] font-medium text-[#949E96] outline-none focus:border-[#C9A390] transition-colors cursor-pointer appearance-none disabled:opacity-50"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23949E96' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 10px center",
                            backgroundSize: "14px",
                          }}
                        >
                          <option value="NotProcessed">Not Processed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                : !isLoading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-[#949E96]"
                      >
                        No orders found matching your filters.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 mt-6 overflow-x-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={!hasPreviousPage}
            className="flex shrink-0 px-4 h-9 md:h-10 items-center justify-center rounded-[8px] border border-[#E4DCD1] text-[#949E96] font-bold hover:bg-gray-50 disabled:opacity-50 transition-opacity"
          >
            Previous
          </button>
          <span className="text-[13px] font-medium text-[#949E96] px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={!hasNextPage}
            className="flex shrink-0 px-4 h-9 md:h-10 items-center justify-center rounded-[8px] border border-[#E4DCD1] text-[#949E96] font-bold hover:bg-gray-50 disabled:opacity-50 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
