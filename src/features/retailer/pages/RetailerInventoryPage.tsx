import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { Search, Trash2, Edit2, ArrowUpDown, X } from "lucide-react";
import {
  useInventories,
  useDeleteInventory,
  useAdjustStock,
  useUpdateThreshold,
} from "../queries/inventory.queries";
import { inventoryApi } from "../api/inventory.api";
import type { InventoryRecord } from "../types/inventory";

export function RetailerInventoryPage() {
  const user = useAuthStore((state) => state.user);
  const retailerId = user?.id || "5255b296-a907-40ae-8aba-48522d5a850a";

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [filterType, setFilterType] = useState("All Products");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: "",
    name: "",
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    record: InventoryRecord | null;
  }>({
    isOpen: false,
    record: null,
  });
  const [editForm, setEditForm] = useState({
    newQuantity: 0,
    reason: "Manual Adjustment",
    threshold: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isSortBySoldDesc = sortOrder === "Most Sold";

  const { data, isLoading, isError } = useInventories(retailerId, {
    pageNumber: currentPage,
    pageSize: 20,
    productName: debouncedSearch || undefined,
    sortBySoldQuantityDesc: isSortBySoldDesc,
  });

  const deleteMutation = useDeleteInventory(retailerId);
  const adjustStockMutation = useAdjustStock(retailerId);
  const thresholdMutation = useUpdateThreshold(retailerId);

  const confirmDelete = async () => {
    await deleteMutation.mutateAsync(deleteModal.id);
    setDeleteModal({ isOpen: false, id: "", name: "" });
  };

  const handleEditSave = async () => {
    if (!editModal.record) return;
    try {
      const oldStock = editModal.record.currentStock;
      const newStock = Number(editForm.newQuantity);

      if (oldStock !== newStock) {
        const type = newStock > oldStock ? "ManualIncrease" : "ManualDecrease";
        await adjustStockMutation.mutateAsync({
          inventoryRecordId: editModal.record.id,
          data: { newQuantity: newStock, type, reason: editForm.reason },
        });
      }

      if (editModal.record.lowStockThreshold !== Number(editForm.threshold)) {
        await thresholdMutation.mutateAsync({
          inventoryRecordId: editModal.record.id,
          newThreshold: Number(editForm.threshold),
        });
      }

      setEditModal({ isOpen: false, record: null });
    } catch {
      alert("Failed to update inventory.");
    }
  };

  const handleExportCSV = async () => {
    try {
      const blobData = await inventoryApi.exportCsv(retailerId);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "inventory_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export CSV.");
    }
  };

  let processedInventory = data?.data?.items || [];
  if (filterType !== "All Products") {
    processedInventory = processedInventory.filter(
      (item: InventoryRecord) =>
        item.status.toLowerCase() === filterType.toLowerCase(),
    );
  }

  const totalPages = data?.data?.totalPages || 1;
  const hasNextPage = data?.data?.hasNextPage || false;
  const hasPreviousPage = data?.data?.hasPreviousPage || false;

  return (
    <div className="relative flex flex-col gap-6 font-sans w-full max-w-full">
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] rounded-[24px] bg-white p-6 md:p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE4E4] text-[#F06161]">
              <Trash2 size={32} />
            </div>
            <h3 className="text-[20px] font-bold text-[#5C5550]">
              Delete Stock
            </h3>
            <p className="mt-2 text-[14px] text-[#949E96]">
              Are you sure you want to delete the Product <br /> Stock "
              <span className="font-bold text-[#5C5550]">
                {deleteModal.name}
              </span>
              "? This action cannot be undone.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-[12px] bg-[#E53935] py-3 font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, id: "", name: "" })
                }
                className="flex-1 rounded-[12px] border border-[#E4DCD1] py-3 font-bold text-[#949E96] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] rounded-[24px] bg-white p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-[#5C5550]">
                Adjust Stock
              </h3>
              <button
                onClick={() => setEditModal({ isOpen: false, record: null })}
                className="text-[#949E96] hover:text-[#5C5550]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[13px] font-bold text-[#5C5550] mb-1">
                  New Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.newQuantity}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      newQuantity: e.target.valueAsNumber,
                    })
                  }
                  className="h-[45px] w-full rounded-[10px] border border-[#E4DCD1] px-4 outline-none focus:border-[#C9A390]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#5C5550] mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={editForm.threshold}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      threshold: e.target.valueAsNumber,
                    })
                  }
                  className="h-[45px] w-full rounded-[10px] border border-[#E4DCD1] px-4 outline-none focus:border-[#C9A390]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#5C5550] mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
                  }
                  className="h-[45px] w-full rounded-[10px] border border-[#E4DCD1] px-4 outline-none focus:border-[#C9A390]"
                />
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleEditSave}
                disabled={
                  adjustStockMutation.isPending || thresholdMutation.isPending
                }
                className="flex-1 rounded-[12px] bg-[#C9A390] py-3 font-bold text-white hover:bg-[#B6A092] transition-colors disabled:opacity-50"
              >
                {adjustStockMutation.isPending || thresholdMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1
          className="text-[24px] md:text-[28px] font-bold text-[#B6A092]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Inventory
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
          <p className="mb-4 text-[14px] text-[#949E96]">
            Loading inventory...
          </p>
        )}
        {isError && (
          <p className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-[13px] text-red-600">
            Failed to load inventory data.
          </p>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Product Name"
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-[48px] w-full md:w-[220px] rounded-[10px] border border-[#E4DCD1] px-4 text-[14px] text-[#949E96] bg-white outline-none focus:border-[#C9A390]"
          >
            <option value="All Products">All Products</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setCurrentPage(1);
            }}
            className="h-[48px] w-full md:w-[220px] rounded-[10px] border border-[#E4DCD1] px-4 text-[14px] text-[#949E96] bg-white outline-none focus:border-[#C9A390]"
          >
            <option value="Newest First">Newest First</option>
            <option value="Most Sold">Most Sold</option>
          </select>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#FEF9F2]/50 border-y border-[#F0EDEB] text-left text-[12px] font-bold uppercase tracking-wider text-[#B6A092]">
                <th className="py-4 pl-4 w-[25%]">PRODUCTS</th>
                <th className="py-4 w-[15%]">PRODUCT ID</th>
                <th className="py-4 w-[15%]">CREATION DATE</th>
                <th className="py-4 w-[10%] text-center">STOCK</th>
                <th className="py-4 w-[10%] text-center cursor-pointer hover:text-[#C9A390] transition-colors group">
                  <div
                    className="flex items-center justify-center gap-1"
                    onClick={() => {
                      setSortOrder(
                        sortOrder === "Most Sold"
                          ? "Newest First"
                          : "Most Sold",
                      );
                      setCurrentPage(1);
                    }}
                  >
                    SOLD <ArrowUpDown size={14} className="text-[#D3C1B6]" />
                  </div>
                </th>
                <th className="py-4 w-[12%] text-center">STATUS</th>
                <th className="py-4 pr-4 w-[13%] text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDEB]">
              {!isLoading && processedInventory.length > 0
                ? processedInventory.map((item: InventoryRecord) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-[#FDFCFB] transition-colors"
                    >
                      <td className="py-6 pl-4 text-[13px] font-bold text-[#5C5550]">
                        {item.productName}
                      </td>
                      <td className="py-6 text-[13px] font-bold text-[#5C5550]">
                        {item.productId.slice(0, 10)}...
                      </td>
                      <td className="py-6 text-[13px] font-medium text-[#949E96]">
                        {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-6 text-[13px] font-medium text-[#949E96] text-center">
                        {item.currentStock}
                      </td>
                      <td className="py-6 text-[13px] font-medium text-[#949E96] text-center">
                        {item.soldQuantity}
                      </td>
                      <td className="py-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold whitespace-nowrap ${item.status === "Active" ? "bg-[#E0F2E9] text-[#4CAF50]" : "bg-[#FFE4E4] text-[#F06161]"}`}
                        >
                          ● {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-6 pr-4 text-center">
                        <div className="flex justify-center gap-3 text-[#BFC7DE]">
                          <button
                            onClick={() => {
                              setEditForm({
                                newQuantity: item.currentStock,
                                threshold: item.lowStockThreshold,
                                reason: "Manual Adjustment",
                              });
                              setEditModal({ isOpen: true, record: item });
                            }}
                            className="hover:text-[#B6A092] transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                id: item.id,
                                name: item.productName,
                              })
                            }
                            className="hover:text-[#E53935] transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : !isLoading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-[#949E96]"
                      >
                        No inventory found matching your criteria.
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
