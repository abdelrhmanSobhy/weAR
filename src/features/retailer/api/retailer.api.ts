import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/features/auth/useAuthStore";

// دالة مساعدة عشان نجيب الـ ID بتاع الـ Retailer اللي عامل Login حالياً
// الباك اند محتاج الـ ID ده في كل الروابط تقريباً
const getRetailerId = () => {
  const user = useAuthStore.getState().user;
  return user?.id || "";
};

export const retailerApi = {
  // --- Dashboard ---
  async getDashboard() {
    const id = getRetailerId();
    const res = await apiClient.get(`/api/retailers/${id}/dashboard/kpis`);
    return res.data?.data || {};
  },

  // --- Profile ---
  async getProfile() {
    const id = getRetailerId();
    const res = await apiClient.get(`/api/retailers/${id}/profile`);
    return res.data?.data || {};
  },

  async updateProfile(payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.put(`/api/retailers/${id}/profile`, payload);
    return res.data?.data || {};
  },

  // --- Products ---
  async getProducts() {
    const id = getRetailerId();
    const res = await apiClient.get(`/api/retailers/${id}/products`);
    // الباك اند بيرجع القوائم جوه items عشان الـ Pagination
    return res.data?.data?.items || [];
  },

  async createProduct(payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.post(`/api/retailers/${id}/products`, payload);
    return res.data?.data || {};
  },

  async updateProduct(productId: string, payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.put(
      `/api/retailers/${id}/products/${productId}`,
      payload,
    );
    return res.data?.data || {};
  },

  async deleteProduct(productId: string) {
    const id = getRetailerId();
    const res = await apiClient.delete(
      `/api/retailers/${id}/products/${productId}`,
    );
    return res.data;
  },

  // --- Categories ---
  async getCategories() {
    const id = getRetailerId();
    const res = await apiClient.get(`/api/retailers/${id}/categories`);
    return res.data?.data?.items || [];
  },

  async createCategory(payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.post(
      `/api/retailers/${id}/categories`,
      payload,
    );
    return res.data?.data || {};
  },

  async updateCategory(categoryId: string, payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.put(
      `/api/retailers/${id}/categories/${categoryId}`,
      payload,
    );
    return res.data?.data || {};
  },

  async deleteCategory(categoryId: string) {
    const id = getRetailerId();
    const res = await apiClient.delete(
      `/api/retailers/${id}/categories/${categoryId}`,
    );
    return res.data;
  },

  // --- Offers ---
  async getOffers() {
    const id = getRetailerId();
    const res = await apiClient.get(`/api/retailers/${id}/offers`);
    return res.data?.data?.items || [];
  },

  async createOffer(payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.post(`/api/retailers/${id}/offers`, payload);
    return res.data?.data || {};
  },

  async updateOffer(offerId: string, payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.put(
      `/api/retailers/${id}/offers/${offerId}`,
      payload,
    );
    return res.data?.data || {};
  },

  async deleteOffer(offerId: string) {
    const id = getRetailerId();
    const res = await apiClient.delete(
      `/api/retailers/${id}/offers/${offerId}`,
    );
    return res.data;
  },

  // --- Orders ---
  async getOrders() {
    const id = getRetailerId();
    const res = await apiClient.get(`/api/retailers/${id}/orders`);
    return res.data?.data?.items || [];
  },

  async updateOrderStatus(orderId: string, status: string) {
    const id = getRetailerId();
    const res = await apiClient.patch(
      `/api/retailers/${id}/orders/${orderId}/status`,
      { newStatus: status },
    );
    return res.data?.data || {};
  },

  // --- Inventory ---
  async getInventory() {
    const id = getRetailerId();
    const res = await apiClient.get(`/api/retailers/${id}/inventory`);
    return res.data?.data?.items || [];
  },

  async updateInventory(inventoryId: string, payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.patch(
      `/api/retailers/${id}/inventory/${inventoryId}/adjust`,
      payload,
    );
    return res.data?.data || {};
  },

  // --- Settings & Subscription ---
  async getSettings() {
    const id = getRetailerId();
    const res = await apiClient.get(
      `/api/retailers/${id}/settings/notifications`,
    );
    return res.data?.data || {};
  },

  async updateSettings(payload: unknown) {
    const id = getRetailerId();
    const res = await apiClient.patch(
      `/api/retailers/${id}/settings/notifications`,
      payload,
    );
    return res.data?.data || {};
  },

  async getPricing() {
    const res = await apiClient.get(`/api/subscription-plans`);
    return res.data?.data || [];
  },

  async getSubscription() {
    const id = getRetailerId();
    const res = await apiClient.get(
      `/api/retailers/${id}/subscription/current`,
    );
    return res.data?.data || {};
  },
};
