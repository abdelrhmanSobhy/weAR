import { useState } from "react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import {
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import type {
  Category,
  PaginatedResponse,
  ApiResponse,
} from "../types/category";

interface FormDataState {
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  imagePreview: string;
  imageFile: File | null;
}

export function RetailerCategoriesPage() {
  const user = useAuthStore((state) => state.user);
  const retailerId = user?.id || "5255b296-a907-40ae-8aba-48522d5a850a";
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"view" | "create">("view");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: "",
    name: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<
    ApiResponse<PaginatedResponse<Category> | Category[]>
  >({
    queryKey: ["categories", retailerId, currentPage],
    queryFn: () =>
      categoriesApi.getCategories(retailerId, {
        pageNumber: currentPage,
        pageSize: 50,
      }) as unknown as Promise<
        ApiResponse<PaginatedResponse<Category> | Category[]>
      >,
    enabled: !!retailerId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(retailerId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      await refetch();
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) =>
      categoriesApi.createCategory(retailerId, formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      await refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      categoriesApi.updateCategory(retailerId, id, formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      await refetch();
    },
  });

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteModal.id);
      setDeleteModal({ isOpen: false, id: "", name: "" });
    } catch {
      alert("Failed to delete category.");
    }
  };

  const handleCreateOrUpdate = async (formDataObj: FormDataState) => {
    try {
      const fd = new FormData();

      if (editingCategory) {
        fd.append("NewName", formDataObj.name);
        fd.append(
          "Status",
          formDataObj.status === "ACTIVE" ? "Active" : "Inactive",
        );
        fd.append("NewDescription", formDataObj.description || "");
        fd.append("ShouldUpdateDescription", "true");

        if (formDataObj.imageFile) {
          fd.append("NewCoverImageFile", formDataObj.imageFile);
        }

        const res = await updateMutation.mutateAsync({
          id: editingCategory.id,
          formData: fd,
        });

        if (res && res.success === false) {
          throw new Error(res.message || "Failed to update category");
        }
      } else {
        if (!formDataObj.imageFile) {
          alert("Please select a cover image first.");
          return;
        }

        fd.append("Name", formDataObj.name);
        fd.append(
          "Status",
          formDataObj.status === "ACTIVE" ? "Active" : "Inactive",
        );
        fd.append("Description", formDataObj.description || "");
        fd.append("CoverImageFile", formDataObj.imageFile);

        const res = await createMutation.mutateAsync(fd);

        if (res && res.success === false) {
          throw new Error(res.message || "Failed to create category");
        }
      }

      setEditingCategory(null);
      setActiveTab("view");
      setCurrentPage(1);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { details?: string[]; errors?: string[] } };
        message?: string;
      };
      const backendErrors = err.response?.data?.details ||
        err.response?.data?.errors || [err.message || "Unknown error"];
      alert("Validation Error from Backend:\n\n" + backendErrors.join("\n"));
    }
  };

  const rawData = data?.data as
    | { items?: Category[]; totalPages?: number; pageNumber?: number }
    | Category[]
    | undefined;
  const categories: Category[] = Array.isArray(rawData)
    ? rawData
    : rawData?.items || [];
  const totalPages = Array.isArray(rawData) ? 1 : rawData?.totalPages || 1;
  const pageNumber = Array.isArray(rawData) ? 1 : rawData?.pageNumber || 1;

  return (
    <div className="relative flex flex-col gap-6 font-sans w-full max-w-full">
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] rounded-[24px] bg-white p-6 md:p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-[#F06161]">
              <Trash2 size={32} />
            </div>
            <h3 className="text-[20px] font-bold text-[#5C5550]">
              Delete Category
            </h3>
            <p className="mt-2 text-[14px] text-[#949E96]">
              Are you sure you want to delete the category <br />
              <span className="font-bold text-[#5C5550]">
                "{deleteModal.name}"
              </span>
              ? This action cannot be undone.
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
            setEditingCategory(null);
          }}
          className="flex-1 py-3 text-[16px] md:text-[18px] font-bold transition-all rounded-[12px]"
          style={{
            backgroundColor: activeTab === "view" ? "#C9A390" : "#FEF9F2",
            color: activeTab === "view" ? "white" : "#B6A092",
            border: activeTab === "view" ? "none" : "1px solid #E4DCD1",
          }}
        >
          View Categories
        </button>
        <button
          onClick={() => {
            setEditingCategory(null);
            setActiveTab("create");
          }}
          className="flex-1 py-3 text-[16px] md:text-[18px] font-bold transition-all rounded-[12px]"
          style={{
            backgroundColor: activeTab === "create" ? "#C9A390" : "#FEF9F2",
            color: activeTab === "create" ? "white" : "#B6A092",
            border: activeTab === "create" ? "none" : "1px solid #E4DCD1",
          }}
        >
          Create Category
        </button>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center justify-center gap-2 py-3 px-6 text-[16px] md:text-[18px] font-bold transition-all rounded-[12px] bg-[#FEF9F2] text-[#B6A092] border border-[#E4DCD1] hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={20} className={isRefetching ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {activeTab === "view" ? (
        <div className="rounded-[24px] border border-[#E4DCD1] bg-white p-4 md:p-8 shadow-sm overflow-hidden w-full">
          <h2
            className="mb-6 md:mb-8 text-[20px] md:text-[24px] font-medium text-[#C9A390]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            All Categories
          </h2>

          {(isLoading || isRefetching) && (
            <p className="mb-4 text-[14px] text-[#949E96]">
              Loading categories...
            </p>
          )}
          {isError && (
            <p className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-[13px] text-red-600">
              Failed to load categories.
            </p>
          )}

          {!isLoading && !isError && (
            <>
              <div className="w-full overflow-x-auto pb-4">
                <table className="w-full border-collapse min-w-200">
                  <thead>
                    <tr className="border-b border-[#F0EDEB] text-left text-[12px] font-bold text-[#C9A390] uppercase">
                      <th className="pb-4 pl-2 w-1/4">NAME</th>
                      <th className="pb-4 w-1/3">DESCRIPTION</th>
                      <th className="pb-4 w-1/6">CREATED</th>
                      <th className="pb-4 w-1/6">STATUS</th>
                      <th className="pb-4 pr-2 text-center w-auto">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EDEB]">
                    {categories.map((category: Category) => (
                      <tr
                        key={category.id}
                        className="group hover:bg-[#FDFCFB] transition-colors border-b border-[#F0EDEB] last:border-none"
                      >
                        <td className="py-4 md:py-5 pl-2">
                          <div className="flex items-center gap-3 md:gap-4">
                            {category.coverImageUrl ? (
                              <img
                                src={category.coverImageUrl}
                                className="h-10 w-10 md:h-12 md:w-12 rounded-[10px] object-cover border border-[#E4DCD1] shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 md:h-12 md:w-12 rounded-[10px] bg-gray-100 border border-[#E4DCD1] shrink-0 flex items-center justify-center text-xs text-gray-400">
                                No Img
                              </div>
                            )}
                            <span className="text-[13px] md:text-[14px] font-bold text-[#5C5550] whitespace-nowrap">
                              {category.name || "Unnamed"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 md:py-5 pr-4">
                          <p className="text-[11px] md:text-[12px] text-[#949E96] leading-tight line-clamp-2 max-w-[280px]">
                            {category.description || "-"}
                          </p>
                        </td>
                        <td className="py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-[#5C5550] whitespace-nowrap">
                          {category.createdAt
                            ? new Date(category.createdAt).toLocaleDateString(
                                "en-GB",
                              )
                            : "-"}
                        </td>
                        <td className="py-4 md:py-5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold whitespace-nowrap ${
                              category.status?.toUpperCase() === "ACTIVE"
                                ? "bg-[#E0F2E9] text-[#4CAF50]"
                                : "bg-[#FFE4E4] text-[#F06161]"
                            }`}
                          >
                            ●{" "}
                            {category.status
                              ? category.status.toUpperCase()
                              : "ACTIVE"}
                          </span>
                        </td>
                        <td className="py-4 md:py-5 text-center">
                          <div className="flex justify-center gap-2 md:gap-3 text-[#BFC7DE]">
                            <button
                              onClick={() => {
                                setEditingCategory(category);
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
                                  id: category.id,
                                  name: category.name || "Category",
                                })
                              }
                              className="hover:text-[#F06161] transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categories.length === 0 && (
                  <div className="text-center py-8 text-[#949E96]">
                    No categories found.
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between md:justify-end gap-2 overflow-x-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pageNumber === 1}
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
                        className={`h-9 w-9 md:h-10 md:w-10 rounded-[8px] text-[13px] md:text-[14px] font-bold border transition-all shrink-0 ${pageNumber === num ? "bg-[#C9A390] text-white border-[#C9A390]" : "text-[#949E96] border-[#E4DCD1] hover:bg-gray-50"}`}
                      >
                        {num}
                      </button>
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={pageNumber === totalPages || totalPages === 0}
                  className="flex shrink-0 h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-[8px] border border-[#E4DCD1] text-[#949E96] hover:bg-gray-50 disabled:opacity-50 transition-opacity"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <CreateCategoryForm
          initialData={editingCategory}
          onSave={handleCreateOrUpdate}
          onCancel={() => {
            setActiveTab("view");
            setEditingCategory(null);
          }}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateCategoryForm({
  initialData,
  onSave,
  onCancel,
  isPending,
}: {
  initialData: Category | null;
  onSave: (formData: FormDataState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<FormDataState>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    status:
      (initialData?.status?.toUpperCase() as "ACTIVE" | "INACTIVE") || "ACTIVE",
    imagePreview: initialData?.coverImageUrl || "",
    imageFile: null,
  });

  const inputStyle =
    "h-[45px] md:h-[50px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[13px] md:text-[14px] outline-none focus:border-[#C9A390]";
  const labelStyle =
    "mb-2 block text-[14px] md:text-[15px] font-medium text-[#949E96]";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
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
        {initialData ? "Edit Category" : "Create New Category"}
      </h2>

      <div>
        <label className={labelStyle}>Category Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputStyle}
          required
        />
      </div>

      <div>
        <label className={labelStyle}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className={`${inputStyle} h-[80px] md:h-[120px] py-3 resize-none`}
          placeholder="Write a description ..."
        />
      </div>

      <div>
        <label className={labelStyle}>Cover Image *</label>
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const validTypes = ["image/jpeg", "image/png"];
                    if (!validTypes.includes(file.type)) {
                      alert(
                        "Please select a valid image format (JPEG or PNG only).",
                      );
                      e.target.value = "";
                      return;
                    }

                    setFormData({
                      ...formData,
                      imageFile: file,
                      imagePreview: URL.createObjectURL(file),
                    });
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2">
        <label className={labelStyle}>Status *</label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value as "ACTIVE" | "INACTIVE",
            })
          }
          className={`${inputStyle} w-full md:w-auto md:min-w-37.5 font-bold ${formData.status === "ACTIVE" ? "bg-[#E0F2E9] text-[#4CAF50]" : "bg-[#FFE4E4] text-[#F06161]"}`}
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
              ? "Update Category"
              : "Create Category"}
        </button>
      </div>
    </form>
  );
}
