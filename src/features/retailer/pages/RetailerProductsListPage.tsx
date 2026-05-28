import { useState } from "react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import {
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../queries/products.queries";
import { categoriesApi } from "../api/categories.api";
import type { Product } from "../types/product";

interface ProductFormData {
  name: string;
  categoryId: string;
  barcode: string;
  price: number;
  status: string;
  imagePreview: string;
  imageFile: File | null;
}

interface BackendCategory {
  id: string;
  name: string;
}

const BarcodeDisplay = ({ value }: { value: string }) => (
  <div className="flex flex-col items-center w-[90px]">
    <div className="flex w-full h-[22px] justify-between">
      <div className="w-[3px] bg-[#5C5550] h-full"></div>
      <div className="w-[1px] bg-[#5C5550] h-full"></div>
      <div className="w-[4px] bg-[#5C5550] h-full"></div>
      <div className="w-[2px] bg-[#5C5550] h-full"></div>
      <div className="w-[3px] bg-[#5C5550] h-full"></div>
      <div className="w-[1px] bg-[#5C5550] h-full"></div>
      <div className="w-[4px] bg-[#5C5550] h-full"></div>
      <div className="w-[2px] bg-[#5C5550] h-full"></div>
      <div className="w-[1px] bg-[#5C5550] h-full"></div>
      <div className="w-[3px] bg-[#5C5550] h-full"></div>
      <div className="w-[2px] bg-[#5C5550] h-full"></div>
      <div className="w-[1px] bg-[#5C5550] h-full"></div>
      <div className="w-[4px] bg-[#5C5550] h-full"></div>
    </div>
    <span className="text-[8px] text-[#5C5550] tracking-[0.2em] mt-1">
      {value || "NO BARCODE"}
    </span>
  </div>
);

export function RetailerProductsListPage() {
  const user = useAuthStore((state) => state.user);
  const retailerId = user?.id || "5255b296-a907-40ae-8aba-48522d5a850a";

  const [activeTab, setActiveTab] = useState<"view" | "create">("view");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: "",
    name: "",
  });

  const { data, isLoading, isError } = useProducts(retailerId, {
    pageNumber: currentPage,
    pageSize: 10,
  });

  const deleteMutation = useDeleteProduct(retailerId);
  const createMutation = useCreateProduct(retailerId);
  const updateMutation = useUpdateProduct(retailerId);

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteModal.id);
      setDeleteModal({ isOpen: false, id: "", name: "" });
    } catch {
      alert("Failed to delete product.");
    }
  };

  const handleCreateOrUpdate = async (formDataObj: ProductFormData) => {
    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          productId: editingProduct.id,
          data: {
            newName: formDataObj.name,
            newPrice: formDataObj.price,
            shouldUpdatePrice: true,
            newBarcode: formDataObj.barcode,
            shouldUpdateBarcode: true,
            newCategoryId: formDataObj.categoryId,
            shouldUpdateCategory: true,
            newStatus: formDataObj.status === "ACTIVE" ? "Active" : "Inactive",
          },
        });
      } else {
        if (!formDataObj.imageFile) {
          alert("Please upload a product image.");
          return;
        }

        const fd = new FormData();
        fd.append("Name", formDataObj.name);
        fd.append("Description", "Product Description");
        fd.append("CategoryId", formDataObj.categoryId);
        fd.append("Price", String(formDataObj.price));
        fd.append("Currency", "EGP");
        fd.append("Barcode", formDataObj.barcode);
        fd.append("InitialQuantity", "0");
        fd.append(
          "Status",
          formDataObj.status === "ACTIVE" ? "Active" : "Inactive",
        );
        fd.append("Images", formDataObj.imageFile);

        await createMutation.mutateAsync(fd);
      }

      setEditingProduct(null);
      setActiveTab("view");
      setCurrentPage(1);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { details?: string[]; errors?: string[] } };
      };
      const backendErrors = err.response?.data?.details ||
        err.response?.data?.errors || ["An unexpected error occurred."];
      alert("Validation Error:\n\n" + backendErrors.join("\n"));
    }
  };

  const products = data?.data?.items || [];
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
              Delete Product
            </h3>
            <p className="mt-2 text-[14px] text-[#949E96]">
              Are you sure you want to delete <br />
              <span className="font-bold text-[#5C5550]">
                "{deleteModal.name}"
              </span>
              ?
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-[12px] bg-[#F06161] py-3 font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
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

      <div className="flex flex-col sm:flex-row w-full gap-3 md:gap-4 p-2 bg-transparent">
        <button
          onClick={() => {
            setActiveTab("view");
            setEditingProduct(null);
            setCurrentPage(1);
          }}
          className="flex-1 py-3 text-[16px] md:text-[18px] font-bold transition-all rounded-[12px]"
          style={{
            backgroundColor: activeTab === "view" ? "#C9A390" : "#FEF9F2",
            color: activeTab === "view" ? "white" : "#B6A092",
            border: activeTab === "view" ? "none" : "1px solid #E4DCD1",
          }}
        >
          View Products
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className="flex-1 py-3 text-[16px] md:text-[18px] font-bold transition-all rounded-[12px]"
          style={{
            backgroundColor: activeTab === "create" ? "#C9A390" : "#FEF9F2",
            color: activeTab === "create" ? "white" : "#B6A092",
            border: activeTab === "create" ? "none" : "1px solid #E4DCD1",
          }}
        >
          {editingProduct ? "Edit Product" : "Create Product"}
        </button>
      </div>

      {activeTab === "view" ? (
        <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-4 md:p-8 shadow-sm overflow-hidden w-full">
          <h2
            className="mb-6 md:mb-8 text-[20px] md:text-[24px] font-medium text-[#C9A390]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            All Products
          </h2>

          {isLoading && (
            <p className="mb-4 text-[14px] text-[#949E96]">
              Loading products...
            </p>
          )}
          {isError && (
            <p className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-[13px] text-red-600">
              Failed to load products.
            </p>
          )}

          <div className="w-full overflow-x-auto pb-4">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[#F0EDEB] text-left text-[12px] font-bold text-[#C9A390] uppercase">
                  <th className="pb-4 pl-2 w-[25%]">NAME</th>
                  <th className="pb-4 w-[20%]">CATEGORY</th>
                  <th className="pb-4 w-[20%]">BARCODE</th>
                  <th className="pb-4 w-[15%]">STATUS</th>
                  <th className="pb-4 w-[10%]">PRICE</th>
                  <th className="pb-4 pr-2 text-center w-[10%]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDEB]">
                {products.length > 0
                  ? products.map((product: Product) => (
                      <tr
                        key={product.id}
                        className="group hover:bg-[#FDFCFB] transition-colors border-b border-[#F0EDEB] last:border-none"
                      >
                        <td className="py-4 md:py-5 pl-2">
                          <div className="flex items-center gap-3 md:gap-4">
                            {product.thumbnailUrl ? (
                              <img
                                src={product.thumbnailUrl}
                                className="h-10 w-10 md:h-12 md:w-12 rounded-[10px] object-cover border border-[#E4DCD1] shrink-0"
                                alt={product.name}
                              />
                            ) : (
                              <div className="h-10 w-10 md:h-12 md:w-12 rounded-[10px] bg-gray-100 border border-[#E4DCD1] shrink-0 flex items-center justify-center text-xs text-gray-400">
                                No Img
                              </div>
                            )}
                            <span className="text-[13px] md:text-[14px] font-bold text-[#5C5550] whitespace-nowrap">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 md:py-5">
                          <div className="flex flex-col text-[12px] md:text-[13px] font-medium text-[#949E96] whitespace-nowrap">
                            <span>{product.categoryName}</span>
                          </div>
                        </td>
                        <td className="py-4 md:py-5">
                          <BarcodeDisplay value={product.barcode} />
                        </td>
                        <td className="py-4 md:py-5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold whitespace-nowrap ${product.status === "Active" ? "bg-[#E0F2E9] text-[#4CAF50]" : "bg-[#FFE4E4] text-[#F06161]"}`}
                          >
                            ● {product.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-[#949E96] whitespace-nowrap">
                          {product.price} {product.currency}
                        </td>
                        <td className="py-4 md:py-5 text-center">
                          <div className="flex justify-center gap-2 md:gap-3 text-[#BFC7DE]">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setActiveTab("create");
                              }}
                              className="hover:text-[#B6A092] transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  id: product.id,
                                  name: product.name,
                                })
                              }
                              className="hover:text-[#F06161] transition-colors"
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
                          colSpan={6}
                          className="py-12 text-center text-[#949E96]"
                        >
                          No products found.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex items-center justify-between md:justify-end gap-2 overflow-x-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!hasPreviousPage}
              className="flex shrink-0 h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-[8px] border border-[#E4DCD1] text-[#949E96] hover:bg-gray-50 disabled:opacity-50 transition-opacity"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`h-9 w-9 md:h-10 md:w-10 rounded-[8px] text-[13px] md:text-[14px] font-bold border transition-all shrink-0 ${currentPage === num ? "bg-[#C9A390] text-white border-[#C9A390]" : "text-[#949E96] border-[#E4DCD1] hover:bg-gray-50"}`}
                  >
                    {num}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={!hasNextPage}
              className="flex shrink-0 h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-[8px] border border-[#E4DCD1] text-[#949E96] hover:bg-gray-50 disabled:opacity-50 transition-opacity"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <CreateProductForm
          retailerId={retailerId}
          initialData={editingProduct}
          onSave={handleCreateOrUpdate}
          onCancel={() => {
            setActiveTab("view");
            setEditingProduct(null);
          }}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateProductForm({
  retailerId,
  initialData,
  onSave,
  onCancel,
  isPending,
}: {
  retailerId: string;
  initialData: Product | null;
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    categoryId: initialData?.categoryId || "",
    barcode: initialData?.barcode || "",
    price: initialData?.price || 0,
    status: initialData?.status?.toUpperCase() || "ACTIVE",
    imagePreview: initialData?.thumbnailUrl || "",
    imageFile: null,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-lookup", retailerId],
    queryFn: () =>
      categoriesApi.getCategories(retailerId, { pageNumber: 1, pageSize: 50 }),
    enabled: !!retailerId,
  });

  const categoriesList: BackendCategory[] = categoriesData?.data?.items || [];

  const inputStyle =
    "h-[45px] md:h-[50px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[13px] md:text-[14px] outline-none bg-white focus:border-[#C9A390]";
  const labelStyle =
    "mb-2 block text-[14px] md:text-[15px] font-medium text-[#949E96]";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a Category.");
      return;
    }
    onSave(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image format (JPEG or PNG only).");
        e.target.value = "";
        return;
      }
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-[#E4DCD1] bg-white p-6 md:p-10 shadow-sm flex flex-col gap-5 md:gap-6 w-full"
    >
      <h2
        className="text-[20px] md:text-[24px] font-medium text-[#C9A390]"
        style={{ fontFamily: '"PT Serif", serif' }}
      >
        {initialData ? "Edit Product" : "Create New Product"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div>
          <label className={labelStyle}>Product Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputStyle}
            required
          />
        </div>
        <div>
          <label className={labelStyle}>Category *</label>
          <select
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            className={inputStyle}
            required
          >
            <option value="">Select Category</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div>
          <label className={labelStyle}>Barcode *</label>
          <input
            type="text"
            value={formData.barcode}
            onChange={(e) =>
              setFormData({ ...formData, barcode: e.target.value })
            }
            className={inputStyle}
            required
          />
        </div>
        <div>
          <label className={labelStyle}>Price (EGP) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.valueAsNumber })
            }
            className={inputStyle}
            required
          />
        </div>
      </div>

      {!initialData && (
        <div className="grid grid-cols-1 gap-5 md:gap-6">
          <div>
            <label className={labelStyle}>Product Image *</label>
            <div className="rounded-[20px] border border-[#E4DCD1] p-4 md:p-6 bg-[#FEF9F2]/30">
              <div className="flex gap-4">
                {formData.imagePreview && (
                  <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0">
                    <img
                      src={formData.imagePreview}
                      className="h-full w-full rounded-[15px] object-cover border border-[#E4DCD1]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          imagePreview: "",
                          imageFile: null,
                        })
                      }
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#C9A390] text-white shadow-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <label className="flex h-20 w-20 md:h-24 md:w-24 shrink-0 cursor-pointer items-center justify-center rounded-[15px] border-2 border-dashed border-[#E4DCD1] text-[#E4DCD1] hover:bg-gray-50">
                  <Plus size={32} />
                  <input
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-[#949E96] mt-2">
                * Note: Modifying images after creation is managed via the
                standalone Images API.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start gap-2">
        <label className={labelStyle}>Status *</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className={`${inputStyle} w-full md:w-auto md:min-w-[150px] font-bold ${formData.status === "ACTIVE" ? "bg-[#E0F2E9] text-[#4CAF50]" : "bg-[#FFE4E4] text-[#F06161]"}`}
        >
          <option value="ACTIVE">● ACTIVE</option>
          <option value="INACTIVE">● INACTIVE</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-4 md:pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="h-[45px] md:h-[50px] w-full sm:w-auto px-10 md:px-12 rounded-[12px] border border-[#E4DCD1] text-[#949E96] font-bold hover:bg-gray-50 order-2 sm:order-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-[45px] md:h-[50px] w-full sm:w-auto px-10 md:px-12 rounded-[12px] bg-[#C9A390] text-white font-bold hover:opacity-90 order-1 sm:order-2 disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : initialData
              ? "Update Product"
              : "Create Product"}
        </button>
      </div>
    </form>
  );
}
