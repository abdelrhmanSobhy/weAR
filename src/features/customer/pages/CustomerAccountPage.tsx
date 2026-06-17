import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  AccountLinks,
  CustomerPageHeader,
  Field,
  InlineState,
} from "@/features/customer/components/account/AccountAvatarShared";
import {
  useChangeCustomerPassword,
  useCustomerProfile,
  useDeleteCustomerAccount,
  useUpdateCustomerProfile,
} from "@/features/customer/queries/profileAvatar.queries";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

const inputCls =
  "h-11 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[15px] text-[#2F2925] outline-none placeholder:text-[#c0a898] focus:border-[#954c2a]";

const selectCls =
  "h-11 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[15px] text-[#2F2925] outline-none focus:border-[#954c2a]";

function PasswordInput({
  name,
  placeholder,
  visible,
  onToggle,
}: {
  name: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        required
        className={cn(inputCls, "pr-12")}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c6b54] hover:text-[#954c2a]"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function CustomerAccountPage() {
  const navigate = useNavigate();
  const profile = useCustomerProfile();
  const update = useUpdateCustomerProfile();
  const changePassword = useChangeCustomerPassword();
  const deleteAccount = useDeleteCustomerAccount();
  const [message, setMessage] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const onProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("fullName") || "").trim();
    if (!fullName) { setMessage("Full name is required."); return; }
    update.mutate(
      {
        fullName,
        phoneNumber: String(data.get("phoneNumber") || "") || null,
        age: data.get("age") ? Number(data.get("age")) : null,
        gender: String(data.get("gender") || "") || null,
      },
      { onSuccess: () => setMessage("Profile updated successfully.") },
    );
  };

  const onPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      currentPassword: String(data.get("currentPassword") || ""),
      newPassword: String(data.get("newPassword") || ""),
      confirmPassword: String(data.get("confirmPassword") || ""),
    };
    if (payload.newPassword !== payload.confirmPassword) {
      setMessage("New passwords must match.");
      return;
    }
    changePassword.mutate(payload, { onSuccess: () => setMessage("Password changed successfully.") });
  };

  const onDeleteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!window.confirm("Delete your account? This cannot be undone.")) return;
    const data = new FormData(event.currentTarget);
    deleteAccount.mutate(
      { password: String(data.get("deletePassword") || ""), reason: String(data.get("reason") || "") || null },
      { onSuccess: () => navigate(CUSTOMER_ROUTES.login) },
    );
  };

  if (profile.isLoading) return <InlineState title="Loading profile" description="Fetching your profile." />;
  if (profile.isError) return <InlineState tone="error" title="Profile unavailable" description="We could not load your account." />;
  const customer = profile.data;
  if (!customer) return <InlineState tone="error" title="Profile unavailable" />;

  const isSuccess = message?.includes("success");

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Account"
        description="Manage your profile, password, addresses, and avatar."
        actions={<AccountLinks />}
      />

      {message && (
        <InlineState tone={isSuccess ? "success" : "error"} title={message} />
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">

        {/* ── Profile form ── */}
        <section className="rounded-2xl border border-[#e8ddd5] bg-white p-6 shadow-sm">
          <h2 className={cn("mb-1 text-lg font-normal", customerTheme.headingFont, customerTheme.darkText)}>
            Profile details
          </h2>
          <p className={cn("mb-5 text-sm", customerTheme.mutedText)}>
            Your email is shown for reference and cannot be edited here.
          </p>
          <form onSubmit={onProfileSubmit} className="grid gap-4 md:grid-cols-2">
            <Field id="fullName" label="Full name">
              <input id="fullName" name="fullName" required defaultValue={customer.fullName} className={inputCls} />
            </Field>
            <Field id="email" label="Email">
              <input id="email" value={customer.email} readOnly className={cn(inputCls, "cursor-not-allowed opacity-60")} />
            </Field>
            <Field id="phoneNumber" label="Phone number">
              <input id="phoneNumber" name="phoneNumber" defaultValue={customer.phoneNumber ?? ""} className={inputCls} />
            </Field>
            <Field id="age" label="Age">
              <input id="age" name="age" type="number" min={1} max={120} defaultValue={customer.age ?? ""} className={inputCls} />
            </Field>
            <Field id="gender" label="Gender">
              <select id="gender" name="gender" defaultValue={customer.gender ?? ""} className={selectCls}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <div className="flex items-end md:col-span-2">
              <button
                type="submit"
                disabled={update.isPending}
                className="h-11 rounded-xl bg-[#9c6b54] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {update.isPending ? "Saving..." : "Save profile"}
              </button>
            </div>
            {update.isError && (
              <div className="md:col-span-2">
                <InlineState tone="error" title="Could not update profile" />
              </div>
            )}
          </form>
        </section>

        {/* ── Right column ── */}
        <div className="space-y-6">

          {/* Profile summary */}
          <section className="rounded-2xl border border-[#e8ddd5] bg-white p-5 shadow-sm">
            <h2 className={cn("mb-4 text-base font-normal", customerTheme.headingFont, customerTheme.darkText)}>
              Profile summary
            </h2>
            <dl className="space-y-2 text-sm">
              {[
                ["Name", customer.fullName],
                ["Email", customer.email],
                ["Phone", customer.phoneNumber || "—"],
                ["Age", customer.age ?? "—"],
                ["Gender", customer.gender || "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex gap-2">
                  <dt className={cn("w-14 shrink-0 font-medium", customerTheme.accentText)}>{label}</dt>
                  <dd className={customerTheme.darkText}>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Change password */}
          <section className="rounded-2xl border border-[#e8ddd5] bg-white p-5 shadow-sm">
            <h2 className={cn("mb-4 text-base font-normal", customerTheme.headingFont, customerTheme.darkText)}>
              Change password
            </h2>
            <form onSubmit={onPasswordSubmit} className="space-y-3">
              <PasswordInput name="currentPassword" placeholder="Current password" visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
              <PasswordInput name="newPassword" placeholder="New password" visible={showNew} onToggle={() => setShowNew((v) => !v)} />
              <PasswordInput name="confirmPassword" placeholder="Confirm new password" visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              <button
                type="submit"
                disabled={changePassword.isPending}
                className="h-11 w-full rounded-xl bg-[#9c6b54] text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {changePassword.isPending ? "Changing..." : "Change password"}
              </button>
            </form>
          </section>

          {/* Delete account */}
          <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-base font-medium text-red-700">Delete account</h2>
            <p className={cn("mb-4 text-sm", customerTheme.mutedText)}>
              Confirm with your password. This cannot be undone.
            </p>
            <form onSubmit={onDeleteSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type={showDelete ? "text" : "password"}
                  name="deletePassword"
                  required
                  placeholder="Password"
                  className={cn(inputCls, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setShowDelete((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9c6b54]"
                  aria-label={showDelete ? "Hide password" : "Show password"}
                >
                  {showDelete ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input name="reason" placeholder="Reason (optional)" className={inputCls} />
              <button
                type="submit"
                disabled={deleteAccount.isPending}
                className="h-11 w-full rounded-xl bg-red-600 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {deleteAccount.isPending ? "Deleting..." : "Delete account"}
              </button>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
}
