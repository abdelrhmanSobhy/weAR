import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import {
  useCreateCustomerOutfit,
  useCustomerOutfits,
  useDeleteCustomerOutfit,
  useAddToFavoritesThenRetry,
} from "@/features/customer/queries/outfits.queries";
import { useToggleCustomerFavorite } from "@/features/customer/queries/favorites.queries";
import { OutfitApiError } from "@/features/customer/api/outfits.api";
import type { OutfitSummary, OutfitItem } from "@/features/customer/types/catalog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Outfit detail modal
// ---------------------------------------------------------------------------

interface OutfitDetailModalProps {
  outfit: OutfitSummary;
  onClose: () => void;
}

function OutfitDetailModal({ outfit, onClose }: OutfitDetailModalProps) {
  const previews = outfit.slotPreviews ? Object.values(outfit.slotPreviews) : [];
  const images = previews.filter((url): url is string => !!url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={outfit.name ?? "Outfit details"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={cn(customerTheme.card, "w-full max-w-lg p-6")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-['Playfair_Display'] font-normal text-[#2F2925]">
              {outfit.name ?? "Untitled outfit"}
            </h2>
            {outfit.style && (
              <p className="mt-1 text-sm text-[#9c6b54]">{outfit.style}</p>
            )}
            <p className="mt-1 text-sm text-[#6F625B]">
              {outfit.itemCount} {outfit.itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={onClose}
            aria-label="Close outfit details"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {images.length > 0 ? (
          <div className={cn(
            "grid gap-3",
            images.length === 1 ? "grid-cols-1" :
            images.length === 2 ? "grid-cols-2" :
            "grid-cols-2 sm:grid-cols-3"
          )}>
            {images.map((url, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-[#fef7f0]">
                <img
                  src={url}
                  alt={`Outfit item ${i + 1}`}
                  className="aspect-3/4 w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-[#fef7f0]">
            <Layers className="h-12 w-12 text-[#C4A99A]" aria-hidden="true" />
            <p className="ml-3 text-sm text-[#6F625B]">No preview images available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outfit summary card
// ---------------------------------------------------------------------------

interface OutfitCardProps {
  outfit: OutfitSummary;
  onDelete: (id: string) => void;
  onView: (outfit: OutfitSummary) => void;
}

function OutfitCard({ outfit, onDelete, onView }: OutfitCardProps) {
  const previews = outfit.slotPreviews ? Object.values(outfit.slotPreviews) : [];
  const visiblePreviews = previews.filter((url): url is string => !!url).slice(0, 4);

  return (
    <article
      className={cn(customerTheme.card, "flex flex-col gap-4 p-5")}
      aria-label={outfit.name ?? "Untitled outfit"}
    >
      {visiblePreviews.length > 0 ? (
        <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
          {visiblePreviews.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-[#fef7f0]">
          <Layers className="h-10 w-10 text-[#C4A99A]" aria-hidden="true" />
        </div>
      )}

      <div className="flex-1">
        <h2 className="text-base font-semibold text-[#2F2925]">
          {outfit.name ?? "Untitled outfit"}
        </h2>
        {outfit.style && (
          <p className="mt-0.5 text-sm text-[#9c6b54]">{outfit.style}</p>
        )}
        <p className="mt-1 text-sm text-[#6F625B]">
          {outfit.itemCount} {outfit.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          className="w-full rounded-full bg-[#9c6b54] text-white hover:bg-[#7d5643]"
          onClick={() => onView(outfit)}
          aria-label={`View outfit ${outfit.name ?? "Untitled outfit"}`}
        >
          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
          View Outfit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-center rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => onDelete(outfit.id)}
          aria-label={`Delete outfit ${outfit.name ?? "Untitled outfit"}`}
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

interface CreateFormValues {
  name: string;
  styleCategory: string;
  productIds: string;
}

const INITIAL_FORM: CreateFormValues = {
  name: "",
  styleCategory: "",
  productIds: "",
};

interface CreateOutfitFormProps {
  onClose: () => void;
  onFavoritesNeeded: (productIds: string[]) => void;
  preservedValues?: CreateFormValues;
  onValuesChange?: (values: CreateFormValues) => void;
}

function CreateOutfitForm({
  onClose,
  onFavoritesNeeded,
  preservedValues,
  onValuesChange,
}: CreateOutfitFormProps) {
  const [form, setForm] = useState<CreateFormValues>(
    preservedValues ?? INITIAL_FORM,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const createMutation = useCreateCustomerOutfit();

  const handleChange = (field: keyof CreateFormValues, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onValuesChange?.(updated);
  };

  const buildItems = (raw: string): OutfitItem[] =>
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((productId, i) => ({
        productId,
        slotType: i,
        displayOrder: i,
      }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const items = form.productIds ? buildItems(form.productIds) : null;

    try {
      await createMutation.mutateAsync({
        name: form.name || null,
        styleCategory: form.styleCategory || null,
        items,
      });
      setFeedback({ type: "success", message: "Outfit created successfully." });
      setTimeout(onClose, 1200);
    } catch (err) {
      if (err instanceof OutfitApiError && err.code === "INVALID_OUTFIT_ITEMS") {
        const missingIds = items?.map((i) => i.productId) ?? [];
        onFavoritesNeeded(missingIds);
        return;
      }
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Outfit creation failed. Please try again.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create outfit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className={cn(customerTheme.card, "w-full max-w-md p-6")}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#2F2925]">Create Outfit</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
            aria-label="Close create outfit form"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="outfit-name"
              className="mb-1 block text-sm font-medium text-[#2F2925]"
            >
              Name (optional)
            </label>
            <Input
              id="outfit-name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Summer casual"
            />
          </div>

          <div>
            <label
              htmlFor="outfit-style"
              className="mb-1 block text-sm font-medium text-[#2F2925]"
            >
              Style category (optional)
            </label>
            <Input
              id="outfit-style"
              value={form.styleCategory}
              onChange={(e) => handleChange("styleCategory", e.target.value)}
              placeholder="e.g. Casual, Formal"
            />
          </div>

          <div>
            <label
              htmlFor="outfit-products"
              className="mb-1 block text-sm font-medium text-[#2F2925]"
            >
              Product IDs (comma-separated, optional)
            </label>
            <Input
              id="outfit-products"
              value={form.productIds}
              onChange={(e) => handleChange("productIds", e.target.value)}
              placeholder="product-id-1, product-id-2"
            />
            <p className="mt-1 text-xs text-[#6F625B]">
              All products must be in your Favorites first.
            </p>
          </div>

          {feedback && (
            <p
              role="alert"
              className={cn(
                "rounded-lg p-3 text-sm",
                feedback.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-700",
              )}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create Outfit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Favorites prerequisite panel
// ---------------------------------------------------------------------------

interface FavoritesPrerequisiteProps {
  productIds: string[];
  onRetry: () => void;
  onCancel: () => void;
}

function FavoritesPrerequisitePanel({
  productIds,
  onRetry,
  onCancel,
}: FavoritesPrerequisiteProps) {
  const toggleFavorite = useToggleCustomerFavorite();
  const { invalidateFavorites } = useAddToFavoritesThenRetry();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleAddAll = async () => {
    setError(null);
    try {
      for (const id of productIds) {
        if (!added.has(id)) {
          await toggleFavorite.mutateAsync(id);
          setAdded((prev) => new Set([...prev, id]));
        }
      }
      invalidateFavorites();
    } catch {
      setError("Could not add all products to Favorites. Please try again.");
    }
  };

  const allAdded = productIds.every((id) => added.has(id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Products must be in Favorites"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className={cn(customerTheme.card, "w-full max-w-md p-6")}>
        <div className="mb-4 flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-lg font-semibold text-[#2F2925]">
              Products must be in Favorites first
            </h2>
            <p className="mt-1 text-sm text-[#6F625B]">
              All products in an outfit must be saved to your Favorites before
              the outfit can be created. Add the missing products to Favorites,
              then retry.
            </p>
          </div>
        </div>

        {productIds.length > 0 && (
          <ul className="mb-4 space-y-1 rounded-lg bg-[#FAF7F5] p-3 text-sm text-[#4D433D]">
            {productIds.map((id) => (
              <li key={id} className="flex items-center gap-2">
                <Heart
                  className={cn(
                    "h-4 w-4",
                    added.has(id) ? "fill-[#9c6b54] text-[#9c6b54]" : "text-[#C4A99A]",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate font-mono text-xs">{id}</span>
                {added.has(id) && (
                  <span className="text-xs text-[#9c6b54]">added</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-2">
          {!allAdded && (
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={() => void handleAddAll()}
              disabled={toggleFavorite.isPending}
            >
              <Heart className="mr-2 h-4 w-4" aria-hidden="true" />
              {toggleFavorite.isPending
                ? "Adding to Favorites…"
                : "Add missing products to Favorites"}
            </Button>
          )}
          {allAdded && (
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={onRetry}
            >
              Retry outfit creation
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <p className="text-center text-xs text-[#6F625B]">
            Your selected products and form values are preserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
  outfit: OutfitSummary;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirmDialog({
  outfit,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm outfit deletion"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className={cn(customerTheme.card, "w-full max-w-sm p-6")}>
        <h2 className="text-lg font-semibold text-[#2F2925]">Delete outfit?</h2>
        <p className="mt-2 text-sm text-[#6F625B]">
          Are you sure you want to delete{" "}
          <strong>{outfit.name ?? "this outfit"}</strong>? This action cannot be
          undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 rounded-full"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CustomerOutfitsPage() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [preservedForm, setPreservedForm] = useState<CreateFormValues | undefined>();
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[] | null>(null);

  const [viewingOutfit, setViewingOutfit] = useState<OutfitSummary | null>(null);

  const [pendingDelete, setPendingDelete] = useState<OutfitSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const query = useCustomerOutfits(page, PAGE_SIZE);
  const deleteMutation = useDeleteCustomerOutfit();

  const outfits = query.data?.items ?? [];
  const totalPages = query.data?.totalPages ?? 0;
  const hasNext = query.data?.hasNextPage ?? false;
  const hasPrev = query.data?.hasPreviousPage ?? false;

  const handleDeleteClick = (id: string) => {
    const outfit = outfits.find((o) => o.id === id);
    if (outfit) {
      setDeleteError(null);
      setDeleteSuccess(null);
      setPendingDelete(outfit);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      setDeleteSuccess(`"${pendingDelete.name ?? "Outfit"}" deleted.`);
      setPendingDelete(null);
    } catch {
      setDeleteError("Could not delete the outfit. Please try again.");
      setPendingDelete(null);
    }
  };

  const handleFavoritesNeeded = (productIds: string[]) => {
    setPendingFavoriteIds(productIds);
    setShowCreateForm(false);
  };

  const handleFavoritesRetry = () => {
    setPendingFavoriteIds(null);
    setShowCreateForm(true);
  };

  // ---- loading ----
  if (query.isLoading) {
    return (
      <section
        className={cn(customerTheme.card, "p-8")}
        aria-busy="true"
        aria-label="Loading outfits"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">
          Outfits
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">
          Loading your saved outfits…
        </h1>
      </section>
    );
  }

  // ---- error ----
  if (query.isError) {
    return (
      <section className={cn(customerTheme.card, "p-8")} role="alert">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">
          Outfits
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2F2925]">
          Could not load outfits
        </h1>
        <p className="mt-3 max-w-2xl text-[#6F625B]">
          Your saved outfits are still safe. Refresh the page or try again
          later.
        </p>
        <Button
          type="button"
          className="mt-5 rounded-full"
          onClick={() => void query.refetch()}
        >
          Try Again
        </Button>
      </section>
    );
  }

  return (
    <>
      {/* Outfit detail modal */}
      {viewingOutfit && (
        <OutfitDetailModal
          outfit={viewingOutfit}
          onClose={() => setViewingOutfit(null)}
        />
      )}

      {/* Create form modal */}
      {showCreateForm && (
        <CreateOutfitForm
          onClose={() => setShowCreateForm(false)}
          onFavoritesNeeded={handleFavoritesNeeded}
          preservedValues={preservedForm}
          onValuesChange={setPreservedForm}
        />
      )}

      {/* Favorites prerequisite panel */}
      {pendingFavoriteIds !== null && (
        <FavoritesPrerequisitePanel
          productIds={pendingFavoriteIds}
          onRetry={handleFavoritesRetry}
          onCancel={() => setPendingFavoriteIds(null)}
        />
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <DeleteConfirmDialog
          outfit={pendingDelete}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setPendingDelete(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">
              Outfits
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#2F2925]">
              Saved Outfits
            </h1>
            {query.data && (
              <p className="mt-2 text-[#6F625B]">
                {query.data.totalCount}{" "}
                {query.data.totalCount === 1 ? "outfit" : "outfits"} saved
              </p>
            )}
          </div>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create Outfit
          </Button>
        </div>

        {/* Feedback */}
        {deleteSuccess && (
          <p
            role="status"
            className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
          >
            {deleteSuccess}
          </p>
        )}
        {deleteError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {/* Empty state */}
        {outfits.length === 0 ? (
          <div
            className={cn(customerTheme.card, "p-10 text-center")}
            role="status"
            aria-label="No saved outfits"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef7f0] text-[#9c6b54]">
              <Layers className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">
              Outfits
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#2F2925]">
              No outfits saved yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[#6F625B]">
              Curate outfits from your favorite products. All items must first
              be saved to your Favorites.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                className="rounded-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Create your first outfit
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to={CUSTOMER_ROUTES.favorites}>View Favorites</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Outfit grid */}
            <div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="Saved outfits"
            >
              {outfits.map((outfit) => (
                <div key={outfit.id} role="listitem">
                  <OutfitCard outfit={outfit} onDelete={handleDeleteClick} onView={setViewingOutfit} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Outfit list pagination"
                className="flex items-center justify-center gap-4"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span className="text-sm text-[#6F625B]">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
