import { type FormEvent, useState } from "react";
import {
  User,
  CreditCard,
  Settings as SettingsIcon,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/useAuthStore";
import {
  useChangeRetailerPassword,
  useDeleteRetailerAccount,
  useNotificationPreferences,
  useRetailerProfileSettings,
  useUpdateNotificationPreferences,
  useUpdateRetailerProfileSettings,
} from "../queries/settings.queries";
import {
  useAddPaymentMethod,
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "../queries/payment.queries";
import {
  useCurrentSubscription,
  useToggleRecurringBilling,
} from "../queries/subscription.queries";
import type { RetailerProfileSettings } from "../types/settings";

export function RetailerSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "payment" | "account">(
    "profile",
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1328px] mx-auto font-sans">
      <h1
        className="text-[24px] md:text-[28px] font-bold text-[#B6A092]"
        style={{ fontFamily: '"PT Serif", serif' }}
      >
        Settings
      </h1>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-6 py-4 rounded-[16px] text-[15px] font-bold transition-all ${
              activeTab === "profile"
                ? "bg-[#C9A390] text-white shadow-md"
                : "bg-white text-[#949E96] border border-[#E4DCD1] hover:bg-[#FEF9F2] hover:text-[#C9A390]"
            }`}
          >
            <User size={20} />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`flex items-center gap-3 px-6 py-4 rounded-[16px] text-[15px] font-bold transition-all ${
              activeTab === "payment"
                ? "bg-[#C9A390] text-white shadow-md"
                : "bg-white text-[#949E96] border border-[#E4DCD1] hover:bg-[#FEF9F2] hover:text-[#C9A390]"
            }`}
          >
            <CreditCard size={20} />
            Payment Method
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-3 px-6 py-4 rounded-[16px] text-[15px] font-bold transition-all ${
              activeTab === "account"
                ? "bg-[#C9A390] text-white shadow-md"
                : "bg-white text-[#949E96] border border-[#E4DCD1] hover:bg-[#FEF9F2] hover:text-[#C9A390]"
            }`}
          >
            <SettingsIcon size={20} />
            Account Settings
          </button>
        </div>

        <div className="flex-1 w-full rounded-[24px] border border-[#E4DCD1] bg-white p-6 md:p-10 shadow-sm">
          {activeTab === "profile" && <ProfileInformation />}
          {activeTab === "payment" && <PaymentMethod />}
          {activeTab === "account" && <AccountSettings />}
        </div>
      </div>
    </div>
  );
}

const fallbackProfile: RetailerProfileSettings = {
  id: "",
  fullName: "Mohamed Ahmed",
  email: "mohamedahmed@gmail.com",
  phoneNumber: "+201229086941",
  brandName: "Cavo",
  businessType: "Online Store",
  brandLogoUrl: null,
  accountStatus: "Admin",
  createdAt: "2025-12-01T00:00:00.000Z",
};

const formatDate = (value?: string) => {
  if (!value) return "Dec 1st, 2025";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Dec 1st, 2025";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

function getFieldError(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; details?: string[] } } })
      .response;
    return response?.data?.details?.[0] || response?.data?.message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

function ProfileInformation() {
  const [viewState, setViewState] = useState<"view" | "edit" | "password">(
    "view",
  );
  const [form, setForm] = useState({
    fullName: fallbackProfile.fullName,
    phoneNumber: fallbackProfile.phoneNumber ?? "",
    brandName: fallbackProfile.brandName,
    businessType: fallbackProfile.businessType,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, updateUser, logout } = useAuthStore();
  const retailerId = user?.id ?? "";
  const profileQuery = useRetailerProfileSettings(retailerId);
  const updateProfileMutation = useUpdateRetailerProfileSettings(retailerId);
  const changePasswordMutation = useChangeRetailerPassword(retailerId);

  const profile = profileQuery.data?.data ?? user ?? fallbackProfile;

  const inputStyle =
    "h-[50px] w-full rounded-[10px] border border-[#E4DCD1] px-4 text-[14px] outline-none focus:border-[#C9A390] text-[#5C5550]";
  const labelStyle = "mb-2 block text-[13px] font-bold text-[#949E96]";

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    try {
      await updateProfileMutation.mutateAsync({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        brandName: form.brandName,
        businessType: form.businessType,
      });
      updateUser(form);
      setMessage("Profile updated successfully.");
      setViewState("view");
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to update profile."));
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    try {
      await changePasswordMutation.mutateAsync(passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      logout();
      window.location.href = "/login/retailer";
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to change password."));
    }
  };

  if (viewState === "edit") {
    return (
      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8 w-full max-w-[800px]">
        <h2
          className="text-[22px] font-bold text-[#C9A390]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Edit Profile
        </h2>
        {errorMessage && <p className="text-[13px] font-bold text-[#F06161]">{errorMessage}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Account Type</label>
            <input
              type="text"
              value={profile.accountStatus || "Admin"}
              disabled
              className={`${inputStyle} bg-gray-50`}
            />
          </div>
          <div>
            <label className={labelStyle}>Email Address</label>
            <input
              type="email"
              value={profile.email || ""}
              disabled
              className={`${inputStyle} bg-gray-50`}
            />
          </div>
          <div>
            <label className={labelStyle}>Brand Name</label>
            <input
              type="text"
              value={form.brandName}
              onChange={(event) =>
                setForm((current) => ({ ...current, brandName: event.target.value }))
              }
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Phone Number</label>
            <input
              type="text"
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, phoneNumber: event.target.value }))
              }
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Business Type</label>
            <input
              type="text"
              value={form.businessType}
              onChange={(event) =>
                setForm((current) => ({ ...current, businessType: event.target.value }))
              }
              className={inputStyle}
            />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="px-10 py-3 rounded-[12px] bg-[#C9A390] text-white text-[14px] font-bold hover:opacity-90 disabled:opacity-60"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setViewState("view")}
            className="px-10 py-3 rounded-[12px] border border-[#E4DCD1] text-[#949E96] text-[14px] font-bold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (viewState === "password") {
    return (
      <form onSubmit={handleChangePassword} className="flex flex-col gap-8 w-full max-w-[500px]">
        <h2
          className="text-[22px] font-bold text-[#C9A390]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Change Password
        </h2>
        {errorMessage && <p className="text-[13px] font-bold text-[#F06161]">{errorMessage}</p>}
        <div className="flex flex-col gap-6">
          <div>
            <label className={labelStyle}>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
              className={inputStyle}
            />
          </div>
          <div>
            <label className={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmNewPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmNewPassword: event.target.value,
                }))
              }
              className={inputStyle}
            />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="px-10 py-3 rounded-[12px] bg-[#C9A390] text-white text-[14px] font-bold hover:opacity-90 disabled:opacity-60"
          >
            {changePasswordMutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setViewState("view")}
            className="px-10 py-3 rounded-[12px] border border-[#E4DCD1] text-[#949E96] text-[14px] font-bold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  const brandLogoText = (profile.brandName || "Cavo").slice(0, 4).toUpperCase();

  return (
    <div className="flex flex-col gap-8">
      <h2
        className="text-[22px] font-bold text-[#C9A390]"
        style={{ fontFamily: '"PT Serif", serif' }}
      >
        Profile Information
      </h2>
      {message && <p className="text-[13px] font-bold text-[#4CAF50]">{message}</p>}
      {profileQuery.isError && (
        <p className="text-[13px] font-bold text-[#F06161]">
          Could not load profile. Showing saved account data.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
        <div>
          <p className={labelStyle}>Full Name</p>
          <p className="text-[15px] font-bold text-[#5C5550]">{profile.fullName || "Mohamed Ahmed"}</p>
        </div>
        <div>
          <p className={labelStyle}>Account Type</p>
          <p className="text-[15px] font-bold text-[#5C5550]">{profile.accountStatus || "Admin"}</p>
        </div>
        <div>
          <p className={labelStyle}>Email Address</p>
          <p className="text-[15px] font-bold text-[#5C5550]">
            {profile.email || "mohamedahmed@gmail.com"}
          </p>
        </div>
        <div>
          <p className={labelStyle}>Brand Name</p>
          <p className="text-[15px] font-bold text-[#5C5550]">{profile.brandName || "Cavo"}</p>
        </div>
        <div>
          <p className={labelStyle}>Member Since</p>
          <p className="text-[15px] font-bold text-[#5C5550]">{formatDate(profile.createdAt)}</p>
        </div>
        <div>
          <p className={labelStyle}>Business Type</p>
          <p className="text-[15px] font-bold text-[#5C5550]">{profile.businessType || "Online Store"}</p>
        </div>
        <div>
          <p className={labelStyle}>Phone Number</p>
          <p className="text-[15px] font-bold text-[#5C5550]">{profile.phoneNumber || "+201229086941"}</p>
        </div>
        <div>
          <p className={labelStyle}>Brand Logo</p>
          {profile.brandLogoUrl ? (
            <img
              src={profile.brandLogoUrl}
              alt="Brand Logo"
              className="w-16 h-16 object-cover border border-[#E4DCD1] rounded-[10px]"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 bg-[#FEF9F2] border border-[#E4DCD1] rounded-[10px] text-[#C9A390] font-bold text-[12px]">
              {brandLogoText}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 pt-6 border-t border-[#F0EDEB] mt-4">
        <button
          onClick={() => {
            setForm({
              fullName: profile.fullName || "",
              phoneNumber: profile.phoneNumber || "",
              brandName: profile.brandName || "",
              businessType: profile.businessType || "",
            });
            setMessage(null);
            setErrorMessage(null);
            setViewState("edit");
          }}
          className="px-8 py-3 rounded-[12px] bg-[#C9A390] text-white text-[14px] font-bold hover:opacity-90"
        >
          Edit Profile
        </button>
        <button
          onClick={() => {
            setMessage(null);
            setErrorMessage(null);
            setPasswordForm({
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            });
            setViewState("password");
          }}
          className="px-8 py-3 rounded-[12px] border border-[#C9A390] text-[#C9A390] text-[14px] font-bold hover:bg-[#FEF9F2]"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}

function PaymentMethod() {
  const retailerId = useAuthStore((state) => state.user?.id || "");
  const paymentMethodsQuery = usePaymentMethods(retailerId);
  const addPaymentMethod = useAddPaymentMethod(retailerId);
  const deletePaymentMethod = useDeletePaymentMethod(retailerId);
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod(retailerId);
  const currentSubscription = useCurrentSubscription(retailerId);
  const toggleRecurring = useToggleRecurringBilling(retailerId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    providerType: "Visa",
    stripePaymentMethodId: "pm_card_visa",
    setAsDefault: true,
  });

  const paymentMethods = paymentMethodsQuery.data?.data ?? [];
  const defaultMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0];
  const recurring = currentSubscription.data?.data?.isRecurringEnabled ?? true;

  const handleAddPaymentMethod = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    try {
      const cleanCardNumber = form.cardNumber.replace(/\s/g, "");
      if (!/^\d{12,19}$/.test(cleanCardNumber)) {
        throw new Error("Card number must contain 12 to 19 digits.");
      }
      if (!form.cardholderName.trim()) {
        throw new Error("Cardholder name is required.");
      }

      await addPaymentMethod.mutateAsync({
        providerType: form.providerType,
        cardholderName: form.cardholderName.trim(),
        cardNumberLast4: cleanCardNumber.slice(-4),
        expiryDate: form.expiryDate,
        stripePaymentMethodId: form.stripePaymentMethodId || "pm_card_visa",
        isSaved: true,
        setAsDefault: form.setAsDefault,
      });
      setForm({
        cardholderName: "",
        cardNumber: "",
        expiryDate: "",
        providerType: "Visa",
        stripePaymentMethodId: "pm_card_visa",
        setAsDefault: true,
      });
      setShowAddForm(false);
      setMessage("Payment method added successfully.");
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to add payment method."));
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    setMessage(null);
    setErrorMessage(null);
    try {
      await deletePaymentMethod.mutateAsync(methodId);
      setMessage("Payment method removed successfully.");
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to remove payment method."));
    }
  };

  const handleSetDefault = async (methodId: string) => {
    setMessage(null);
    setErrorMessage(null);
    try {
      await setDefaultPaymentMethod.mutateAsync(methodId);
      setMessage("Default payment method updated successfully.");
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to set default payment method."));
    }
  };

  const handleToggleRecurring = async () => {
    setMessage(null);
    setErrorMessage(null);
    try {
      await toggleRecurring.mutateAsync();
      setMessage("Recurring billing updated successfully.");
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to update recurring billing."));
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {(message || errorMessage) && (
        <p className={`text-[13px] font-semibold ${errorMessage ? "text-red-500" : "text-[#4CAF50]"}`}>
          {errorMessage || message}
        </p>
      )}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between max-w-[600px]">
          <h2
            className="text-[22px] font-bold text-[#C9A390]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Payment Method
          </h2>
          <button
            onClick={() => setShowAddForm((value) => !value)}
            className="px-6 py-2 rounded-[10px] border border-[#E4DCD1] text-[#949E96] text-[13px] font-bold hover:bg-gray-50"
          >
            {showAddForm ? "Cancel" : "Add Card"}
          </button>
        </div>

        {paymentMethodsQuery.isLoading && (
          <p className="text-[13px] text-[#949E96]">Loading payment methods...</p>
        )}

        {!paymentMethodsQuery.isLoading && !paymentMethods.length && (
          <div className="p-6 rounded-[20px] border border-[#E4DCD1] bg-[#FEF9F2]/30 max-w-[600px]">
            <h3 className="text-[16px] font-bold text-[#5C5550]">No saved payment method</h3>
            <p className="text-[13px] text-[#949E96] mt-1">
              Add a card before selecting or upgrading to a paid subscription plan.
            </p>
          </div>
        )}

        {defaultMethod && (
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-[20px] border border-[#E4DCD1] bg-[#FEF9F2]/30 max-w-[600px]">
            <div className="w-[80px] h-[50px] bg-[#1434CB] rounded-[8px] flex items-center justify-center text-white font-bold text-[20px] italic">
              {defaultMethod.providerType?.slice(0, 4).toUpperCase() || "CARD"}
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <h3 className="text-[16px] font-bold text-[#5C5550]">
                {defaultMethod.providerType || "Card"} **** {defaultMethod.cardNumberLast4}
              </h3>
              <p className="text-[13px] text-[#949E96] mt-1">
                {defaultMethod.isDefault ? "Your recurring payment method" : "Saved payment method"}
                {defaultMethod.isExpired ? " · expired" : ""}
              </p>
            </div>
          </div>
        )}

        {paymentMethods.length > 1 && (
          <div className="flex flex-col gap-3 max-w-[600px]">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[14px] border border-[#F0EDEB] px-4 py-3">
                <div>
                  <p className="text-[14px] font-bold text-[#5C5550]">
                    {method.providerType || "Card"} **** {method.cardNumberLast4}
                  </p>
                  <p className="text-[12px] text-[#949E96]">Expires {method.expiryDate}</p>
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button onClick={() => handleSetDefault(method.id)} className="px-3 py-2 rounded-[8px] border border-[#E4DCD1] text-[#949E96] text-[12px] font-bold hover:bg-[#FEF9F2]">
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleDeletePaymentMethod(method.id)} className="px-3 py-2 rounded-[8px] border border-[#E4DCD1] text-red-400 text-[12px] font-bold hover:bg-red-50">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleAddPaymentMethod} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[600px] rounded-[20px] border border-[#E4DCD1] p-6">
            <input
              value={form.cardholderName}
              onChange={(event) => setForm((prev) => ({ ...prev, cardholderName: event.target.value }))}
              placeholder="Cardholder name"
              className="h-[45px] rounded-[12px] border border-[#E4DCD1] px-4 text-[#949E96] outline-none focus:border-[#B6A092]"
            />
            <input
              value={form.cardNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, cardNumber: event.target.value }))}
              placeholder="Card number"
              className="h-[45px] rounded-[12px] border border-[#E4DCD1] px-4 text-[#949E96] outline-none focus:border-[#B6A092]"
            />
            <input
              value={form.expiryDate}
              onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
              placeholder="MM/YY"
              className="h-[45px] rounded-[12px] border border-[#E4DCD1] px-4 text-[#949E96] outline-none focus:border-[#B6A092]"
            />
            <input
              value={form.providerType}
              onChange={(event) => setForm((prev) => ({ ...prev, providerType: event.target.value }))}
              placeholder="Provider type"
              className="h-[45px] rounded-[12px] border border-[#E4DCD1] px-4 text-[#949E96] outline-none focus:border-[#B6A092]"
            />
            <label className="md:col-span-2 flex items-center gap-2 text-[13px] text-[#949E96]">
              <input
                type="checkbox"
                checked={form.setAsDefault}
                onChange={(event) => setForm((prev) => ({ ...prev, setAsDefault: event.target.checked }))}
              />
              Set as default recurring card
            </label>
            <button
              type="submit"
              disabled={addPaymentMethod.isPending}
              className="md:col-span-2 px-8 py-3 rounded-[12px] bg-[#C9A390] text-white text-[14px] font-bold hover:opacity-90 disabled:opacity-60"
            >
              Save Card
            </button>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-6 border-t border-[#F0EDEB] pt-8">
        <h2
          className="text-[22px] font-bold text-[#C9A390]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Account Settings
        </h2>
        <div className="flex items-center justify-between p-6 rounded-[20px] border border-[#E4DCD1] max-w-[600px]">
          <div>
            <h3 className="text-[15px] font-bold text-[#5C5550]">
              Enable recurring payments
            </h3>
            <p className="text-[13px] text-[#949E96] mt-1">
              Never miss a payment by enabling automatic renewals.
            </p>
          </div>
          <button
            onClick={handleToggleRecurring}
            disabled={!currentSubscription.data?.data?.isActive || toggleRecurring.isPending}
            className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-60 ${recurring ? "bg-[#C9A390]" : "bg-gray-300"}`}
          >
            <div
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${recurring ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  const { user, logout } = useAuthStore();
  const retailerId = user?.id ?? "";
  const notificationsQuery = useNotificationPreferences(retailerId);
  const updateNotificationsMutation = useUpdateNotificationPreferences(retailerId);
  const deleteAccountMutation = useDeleteRetailerAccount(retailerId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const notificationPrefs = notificationsQuery.data?.data;
  const emailNotif = notificationPrefs?.emailNotifications ?? true;
  const smsNotif = notificationPrefs?.inAppNotifications ?? false;

  const handleToggleNotification = async (
    payload: Parameters<typeof updateNotificationsMutation.mutateAsync>[0],
  ) => {
    setErrorMessage(null);
    try {
      await updateNotificationsMutation.mutateAsync(payload);
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to update notifications."));
    }
  };

  const handleDeleteAccount = async () => {
    setErrorMessage(null);
    try {
      await deleteAccountMutation.mutateAsync();
      setIsModalOpen(false);
      logout();
      navigate("/login/retailer");
    } catch (error) {
      setErrorMessage(getFieldError(error, "Failed to delete account."));
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] rounded-[24px] bg-white p-8 text-center shadow-2xl flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFE4E4] text-[#F06161]">
              <AlertTriangle size={36} />
            </div>
            <h3 className="text-[24px] font-bold text-[#5C5550]">Warning!</h3>
            <p className="mt-4 text-[14px] text-[#949E96] leading-relaxed px-4">
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers. Are you
              absolutely sure you want to delete your account?
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="flex-1 rounded-[12px] bg-[#F06161] py-3.5 font-bold text-white hover:bg-red-700 transition-colors text-[14px] disabled:opacity-60"
              >
                {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-[12px] border border-[#E4DCD1] py-3.5 font-bold text-[#949E96] hover:bg-gray-50 transition-colors text-[14px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="mb-2">
          <h2
            className="text-[22px] font-bold text-[#C9A390]"
            style={{ fontFamily: '"PT Serif", serif' }}
          >
            Notifications
          </h2>
          <p className="text-[14px] text-[#949E96] mt-1">
            Manage your notification preferences
          </p>
        </div>
        {errorMessage && <p className="text-[13px] font-bold text-[#F06161]">{errorMessage}</p>}
        <div className="flex flex-col gap-4 max-w-[600px]">
          <div className="flex items-center justify-between p-5 rounded-[16px] border border-[#E4DCD1]">
            <span className="text-[14px] font-bold text-[#5C5550]">
              Email Notifications
            </span>
            <button
              disabled={updateNotificationsMutation.isPending || notificationsQuery.isLoading}
              onClick={() => handleToggleNotification({ emailNotifications: !emailNotif })}
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${emailNotif ? "bg-[#4CAF50]" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${emailNotif ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-5 rounded-[16px] border border-[#E4DCD1]">
            <span className="text-[14px] font-bold text-[#5C5550]">
              SMS Notifications
            </span>
            <button
              disabled={updateNotificationsMutation.isPending || notificationsQuery.isLoading}
              onClick={() => handleToggleNotification({ inAppNotifications: !smsNotif })}
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${smsNotif ? "bg-[#4CAF50]" : "bg-gray-300"}`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${smsNotif ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-[#F0EDEB] pt-8">
        <h2
          className="text-[22px] font-bold text-[#F06161]"
          style={{ fontFamily: '"PT Serif", serif' }}
        >
          Danger Zone
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-[20px] border border-[#FFE4E4] bg-[#FFE4E4]/30 max-w-[600px] gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-[15px] font-bold text-[#5C5550]">
              Delete Account
            </h3>
            <p className="text-[13px] text-[#949E96] mt-1">
              Once you deleted your account, there is no going back. Please be
              certain.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-[12px] bg-[#F06161] text-white text-[13px] font-bold hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
