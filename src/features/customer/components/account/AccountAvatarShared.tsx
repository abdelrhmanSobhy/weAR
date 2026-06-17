import type React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { cn } from "@/lib/utils";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { formatNullableMeasurement, measurementFieldConfigs } from "@/features/customer/types/profileAvatar";
import type { BodyMeasurements, CustomerAddress, CustomerAddressPayload } from "@/features/customer/types/profileAvatar";

// ─── Page header ─────────────────────────────────────────────────────────────

export function CustomerPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className={cn("text-sm font-semibold uppercase tracking-[0.2em]", customerTheme.accentText)}>
          Customer account
        </p>
        <h1 className={cn("mt-2 text-3xl font-normal md:text-4xl", customerTheme.headingFont, customerTheme.darkText)}>
          {title}
        </h1>
        <p className={cn("mt-3 max-w-2xl", customerTheme.mutedText)}>{description}</p>
      </div>
      {actions}
    </div>
  );
}

// ─── Inline state (info / success / error) ───────────────────────────────────

export function InlineState({
  title,
  description,
  tone = "info",
}: {
  title: string;
  description?: string;
  tone?: "info" | "error" | "success";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border p-4 text-sm",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : tone === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-[#e8ddd5] bg-[#fef7f0] text-[#6F625B]",
      )}
    >
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}

// ─── Form field wrapper ───────────────────────────────────────────────────────

export function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={cn("text-[14px] font-medium", customerTheme.accentText)}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// ─── Measurements grid ────────────────────────────────────────────────────────

export function AvatarMeasurementGrid({ measurements }: { measurements: Partial<BodyMeasurements> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {measurementFieldConfigs.map((field) => (
        <div
          key={field.key}
          className="rounded-2xl border border-[#e8ddd5] bg-white p-4"
        >
          <dt className={cn("text-sm", customerTheme.mutedText)}>{field.label}</dt>
          <dd className={cn("mt-1 text-lg font-semibold", customerTheme.darkText)}>
            {formatNullableMeasurement(measurements[field.key])}
            {measurements[field.key] == null ? "" : ` ${field.unit}`}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Address card ─────────────────────────────────────────────────────────────

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onDefault,
  busy,
}: {
  address: CustomerAddress;
  onEdit: () => void;
  onDelete: () => void;
  onDefault: () => void;
  busy?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e8ddd5] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <p className={cn("font-semibold", customerTheme.darkText)}>{address.fullName}</p>
        {address.isDefault && (
          <span className="rounded-full bg-[#fef7f0] px-2.5 py-0.5 text-xs font-medium text-[#9c6b54]">
            Default
          </span>
        )}
      </div>
      <p className={cn("mb-1 text-sm", customerTheme.mutedText)}>{address.phoneNumber}</p>
      <address className={cn("not-italic text-sm leading-relaxed", customerTheme.mutedText)}>
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
        <br />
        {address.city}
        {address.state ? `, ${address.state}` : ""} {address.postalCode}
        <br />
        {address.country}
      </address>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-[#e8ddd5] px-4 py-1.5 text-sm font-medium text-[#2F2925] transition-colors hover:bg-[#fef7f0]"
        >
          Edit address
        </button>
        <button
          type="button"
          onClick={onDefault}
          disabled={address.isDefault || busy}
          className="rounded-lg border border-[#e8ddd5] px-4 py-1.5 text-sm font-medium text-[#2F2925] transition-colors hover:bg-[#fef7f0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Set as default
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Address form ─────────────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full rounded-xl border border-[#e8ddd5] bg-white px-4 text-[15px] text-[#2F2925] outline-none placeholder:text-[#c0a898] focus:border-[#954c2a] focus:ring-0";

export function AddressForm({
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  initial?: Partial<CustomerAddress>;
  onSubmit: (payload: CustomerAddressPayload) => void;
  onCancel?: () => void;
  pending?: boolean;
}) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      fullName: String(data.get("fullName") || ""),
      phoneNumber: String(data.get("phoneNumber") || ""),
      line1: String(data.get("line1") || ""),
      line2: String(data.get("line2") || "") || null,
      city: String(data.get("city") || ""),
      state: String(data.get("state") || "") || null,
      postalCode: String(data.get("postalCode") || ""),
      country: String(data.get("country") || ""),
      type: "shipping",
      isDefault: data.get("isDefault") === "on",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <Field id="fullName" label="Full name">
        <Input id="fullName" name="fullName" required defaultValue={initial?.fullName ?? ""} className={inputCls} />
      </Field>
      <Field id="phoneNumber" label="Phone number">
        <Input id="phoneNumber" name="phoneNumber" required defaultValue={initial?.phoneNumber ?? ""} className={inputCls} />
      </Field>
      <Field id="line1" label="Address line 1">
        <Input id="line1" name="line1" required defaultValue={initial?.line1 ?? ""} className={inputCls} />
      </Field>
      <Field id="line2" label="Address line 2 (optional)">
        <Input id="line2" name="line2" defaultValue={initial?.line2 ?? ""} className={inputCls} />
      </Field>
      <Field id="city" label="City">
        <Input id="city" name="city" required defaultValue={initial?.city ?? ""} className={inputCls} />
      </Field>
      <Field id="state" label="State / region">
        <Input id="state" name="state" defaultValue={initial?.state ?? ""} className={inputCls} />
      </Field>
      <Field id="postalCode" label="Postal code">
        <Input id="postalCode" name="postalCode" required defaultValue={initial?.postalCode ?? ""} className={inputCls} />
      </Field>
      <Field id="country" label="Country">
        <Input id="country" name="country" required defaultValue={initial?.country ?? ""} className={inputCls} />
      </Field>
      <label className={cn("flex items-center gap-2 text-sm", customerTheme.mutedText)}>
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={initial?.isDefault}
          className="h-4 w-4 rounded accent-[#954c2a]"
        />
        Use as default address
      </label>
      <div className="flex gap-2 md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl bg-[#9c6b54] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save address"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-[#e8ddd5] px-6 text-sm font-medium text-[#2F2925] transition-colors hover:bg-[#fef7f0]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Account quick-links ──────────────────────────────────────────────────────

export const AccountLinks = () => (
  <div className="flex flex-wrap gap-3">
    <Button
      asChild
      className="rounded-xl border border-[#e8ddd5] bg-white text-[#2F2925] hover:bg-[#fef7f0]"
      variant="outline"
    >
      <Link to={CUSTOMER_ROUTES.addresses}>Manage addresses</Link>
    </Button>
    <Button
      asChild
      className="rounded-xl border border-[#e8ddd5] bg-white text-[#2F2925] hover:bg-[#fef7f0]"
      variant="outline"
    >
      <Link to={CUSTOMER_ROUTES.avatar}>Manage avatar</Link>
    </Button>
  </div>
);
