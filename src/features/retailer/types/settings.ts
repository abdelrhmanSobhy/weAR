export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp?: string;
  traceId?: string;
}

export interface RetailerProfileSettings {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  brandName: string;
  businessType: string;
  has3DModels?: boolean;
  avatarUrl?: string | null;
  brandLogoUrl?: string | null;
  isEmailVerified?: boolean;
  accountStatus?: string;
  subscriptionId?: string | null;
  availableBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateRetailerProfilePayload {
  fullName?: string;
  phoneNumber?: string;
  brandName?: string;
  businessType?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface NotificationPreferences {
  lowStockAlerts: boolean;
  orderStatusAlerts: boolean;
  subscriptionAlerts: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export type UpdateNotificationPreferencesPayload = Partial<NotificationPreferences>;
