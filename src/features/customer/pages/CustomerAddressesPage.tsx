import { useState } from "react";
import {
  AddressCard,
  AddressForm,
  CustomerPageHeader,
  InlineState,
} from "@/features/customer/components/account/AccountAvatarShared";
import {
  useCreateCustomerAddress,
  useCustomerAddresses,
  useDeleteCustomerAddress,
  useSetDefaultCustomerAddress,
  useUpdateCustomerAddress,
} from "@/features/customer/queries/profileAvatar.queries";
import type { CustomerAddress } from "@/features/customer/types/profileAvatar";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

export function CustomerAddressesPage() {
  const addresses = useCustomerAddresses();
  const createAddress = useCreateCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const setDefault = useSetDefaultCustomerAddress();
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const hasError =
    createAddress.isError || updateAddress.isError || deleteAddress.isError || setDefault.isError;

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Addresses"
        description="Create, edit, delete, and choose your default shipping address."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate((open) => !open)}
            className="h-11 rounded-xl bg-[#9c6b54] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {showCreate ? "Cancel" : "Add address"}
          </button>
        }
      />

      {addresses.isLoading && <InlineState title="Loading addresses" />}
      {addresses.isError && <InlineState tone="error" title="Could not load addresses" />}

      {/* Create form */}
      {showCreate && (
        <section className="rounded-2xl border border-[#e8ddd5] bg-white p-6 shadow-sm">
          <h2 className={cn("mb-5 text-base font-normal", customerTheme.headingFont, customerTheme.darkText)}>
            New address
          </h2>
          <AddressForm
            pending={createAddress.isPending}
            onSubmit={(payload) =>
              createAddress.mutate(payload, { onSuccess: () => setShowCreate(false) })
            }
          />
        </section>
      )}

      {/* Edit form */}
      {editing && (
        <section className="rounded-2xl border border-[#e8ddd5] bg-white p-6 shadow-sm">
          <h2 className={cn("mb-5 text-base font-normal", customerTheme.headingFont, customerTheme.darkText)}>
            Edit address
          </h2>
          <AddressForm
            initial={editing}
            pending={updateAddress.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(payload) =>
              updateAddress.mutate({ id: editing.id, payload }, { onSuccess: () => setEditing(null) })
            }
          />
        </section>
      )}

      {/* Empty state */}
      {addresses.data?.length === 0 && (
        <InlineState
          title="No addresses yet"
          description="Add a shipping address to speed up future checkout flows."
        />
      )}

      {/* Address grid */}
      {(addresses.data?.length ?? 0) > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.data?.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              busy={deleteAddress.isPending || setDefault.isPending}
              onEdit={() => setEditing(address)}
              onDelete={() => {
                if (window.confirm("Delete this address?")) deleteAddress.mutate(address.id);
              }}
              onDefault={() => setDefault.mutate(address.id)}
            />
          ))}
        </div>
      )}

      {hasError && <InlineState tone="error" title="Address action failed" />}
    </div>
  );
}
