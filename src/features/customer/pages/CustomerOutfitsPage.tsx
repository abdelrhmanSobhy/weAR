import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { useLocalOutfitStore } from "@/features/customer/fixtures/localOutfitStore";
import type { OutfitSummary } from "@/features/customer/types/catalog";
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
          <div
            className={cn(
              "grid gap-3",
              images.length === 1
                ? "grid-cols-1"
                : images.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3",
            )}
          >
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
          <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl bg-[#fef7f0]">
            <Layers className="h-12 w-12 text-[#C4A99A]" aria-hidden="true" />
            <p className="text-sm text-[#6F625B]">This outfit was saved from AI suggestions</p>
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
// Create outfit form (modal)
// ---------------------------------------------------------------------------

interface CreateOutfitFormProps {
  onClose: () => void;
  onCreate: (name: string | null, style: string | null) => void;
}

function CreateOutfitForm({ onClose, onCreate }: CreateOutfitFormProps) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState("");
  const [created, setCreated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(name.trim() || null, style.trim() || null);
    setCreated(true);
    setTimeout(onClose, 900);
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

        {created ? (
          <p className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-800">
            Outfit created successfully.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="outfit-name" className="mb-1 block text-sm font-medium text-[#2F2925]">
                Name (optional)
              </label>
              <Input
                id="outfit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer casual"
              />
            </div>

            <div>
              <label htmlFor="outfit-style" className="mb-1 block text-sm font-medium text-[#2F2925]">
                Style (optional)
              </label>
              <Input
                id="outfit-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="e.g. Casual, Formal, Boho"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-full">
                Create Outfit
              </Button>
            </div>
          </form>
        )}
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
}

function DeleteConfirmDialog({ outfit, onConfirm, onCancel }: DeleteConfirmProps) {
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
          <strong>{outfit.name ?? "this outfit"}</strong>? This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" className="flex-1 rounded-full" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;

export function CustomerOutfitsPage() {
  const outfits = useLocalOutfitStore((s) => s.outfits);
  const addOutfit = useLocalOutfitStore((s) => s.addOutfit);
  const removeOutfit = useLocalOutfitStore((s) => s.removeOutfit);

  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingOutfit, setViewingOutfit] = useState<OutfitSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OutfitSummary | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(outfits.length / PAGE_SIZE));
  const pageOutfits = outfits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const handleCreate = (name: string | null, style: string | null) => {
    addOutfit(name, style, null);
  };

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return;
    setDeleteSuccess(`"${pendingDelete.name ?? "Outfit"}" deleted.`);
    removeOutfit(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <>
      {viewingOutfit && (
        <OutfitDetailModal outfit={viewingOutfit} onClose={() => setViewingOutfit(null)} />
      )}

      {showCreateForm && (
        <CreateOutfitForm
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreate}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmDialog
          outfit={pendingDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">
              Outfits
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#2F2925]">
              Saved Outfits
            </h1>
            <p className="mt-2 text-[#6F625B]">
              {outfits.length} {outfits.length === 1 ? "outfit" : "outfits"} saved
            </p>
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

        {deleteSuccess && (
          <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {deleteSuccess}
          </p>
        )}

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
              Create outfits manually or save AI-generated suggestions directly to your collection.
            </p>
            <Button
              type="button"
              className="mt-6 rounded-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create your first outfit
            </Button>
          </div>
        ) : (
          <>
            <div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="Saved outfits"
            >
              {pageOutfits.map((outfit) => (
                <div key={outfit.id} role="listitem">
                  <OutfitCard
                    outfit={outfit}
                    onDelete={(id) => {
                      const o = outfits.find((x) => x.id === id);
                      if (o) { setDeleteSuccess(null); setPendingDelete(o); }
                    }}
                    onView={setViewingOutfit}
                  />
                </div>
              ))}
            </div>

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
