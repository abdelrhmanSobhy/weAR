import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BookmarkPlus,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { catalogApi } from "@/features/customer/api/catalog.api";
import type { AiSuggestion, AiSuggestionProduct } from "@/features/customer/types/catalog";
import type { CustomerProduct } from "@/features/customer/types/catalog";
import { useLocalOutfitStore } from "@/features/customer/fixtures/localOutfitStore";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Product classification
// ---------------------------------------------------------------------------

type ProductSlot = "dress" | "top" | "bottom" | "shoes" | "outerwear";

function classifyProduct(product: CustomerProduct): ProductSlot | null {
  const text = [product.name, product.categoryName, product.subcategoryName, product.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(dress|gown|jumpsuit|romper|playsuit|maxi|midi|mini)\b/.test(text)) return "dress";
  if (/\b(jacket|blazer|coat|cardigan|hoodie|outerwear)\b/.test(text)) return "outerwear";
  if (/\b(top|blouse|shirt|tee|t-shirt|sweater|pullover|crop|cami|tank)\b/.test(text)) return "top";
  if (/\b(pant|jean|trouser|skirt|shorts|legging|culotte)\b/.test(text)) return "bottom";
  if (/\b(shoe|sneaker|heel|sandal|boot|loafer|flat|pump|stiletto|mule|wedge)\b/.test(text)) return "shoes";
  return null;
}

function toAiProduct(
  product: CustomerProduct,
  slot: string,
  slotType: number,
): AiSuggestionProduct {
  return {
    id: product.id,
    productId: product.id,
    modelId: product.modelId ?? null,
    slotType,
    slot,
    displayOrder: slotType,
    reasoning: null,
    description: product.description ?? null,
    name: product.name,
    price: product.discountedPrice ?? product.price,
    primaryImageUrl: product.primaryImageUrl ?? null,
    stockStatus: product.stockStatus ?? null,
    resolvedProduct: null,
  };
}

// ---------------------------------------------------------------------------
// Outfit templates — filled with real products at runtime
// ---------------------------------------------------------------------------

const TEMPLATES = [
  {
    name: "Casual Chic",
    styleCategory: "Casual",
    occasion: "Day Out",
    styleNotes: "Relaxed yet put-together — effortless feminine style.",
    matchPercentage: 94,
    styleTags: ["Casual", "Feminine", "Effortless"],
    slots: [
      { label: "Top",    slotType: 0, from: "top" as ProductSlot },
      { label: "Bottom", slotType: 1, from: "bottom" as ProductSlot },
      { label: "Shoes",  slotType: 2, from: "shoes" as ProductSlot },
    ],
  },
  {
    name: "Evening Elegance",
    styleCategory: "Elegant",
    occasion: "Dinner / Date Night",
    styleNotes: "Sophisticated and chic — the perfect evening look.",
    matchPercentage: 96,
    styleTags: ["Elegant", "Chic", "Feminine"],
    slots: [
      { label: "Dress", slotType: 0, from: "dress" as ProductSlot },
      { label: "Shoes", slotType: 1, from: "shoes" as ProductSlot },
    ],
  },
  {
    name: "Smart Casual",
    styleCategory: "Smart Casual",
    occasion: "Office / Work",
    styleNotes: "Polished and professional without sacrificing style.",
    matchPercentage: 91,
    styleTags: ["Smart", "Polished", "Versatile"],
    slots: [
      { label: "Top",       slotType: 0, from: "top" as ProductSlot },
      { label: "Bottom",    slotType: 1, from: "bottom" as ProductSlot },
      { label: "Outerwear", slotType: 2, from: "outerwear" as ProductSlot },
    ],
  },
  {
    name: "Weekend Brunch",
    styleCategory: "Relaxed Chic",
    occasion: "Brunch / Weekend",
    styleNotes: "Breezy and stylish — dressed up without the effort.",
    matchPercentage: 88,
    styleTags: ["Brunch", "Relaxed", "Chic"],
    slots: [
      { label: "Top",    slotType: 0, from: "top" as ProductSlot },
      { label: "Bottom", slotType: 1, from: "bottom" as ProductSlot },
      { label: "Shoes",  slotType: 2, from: "shoes" as ProductSlot },
    ],
  },
  {
    name: "Street Style",
    styleCategory: "Urban Casual",
    occasion: "Hangout / Shopping",
    styleNotes: "Cool and on-trend — the modern wardrobe staple.",
    matchPercentage: 89,
    styleTags: ["Streetwear", "Urban", "Trendy"],
    slots: [
      { label: "Top",    slotType: 0, from: "top" as ProductSlot },
      { label: "Bottom", slotType: 1, from: "bottom" as ProductSlot },
      { label: "Shoes",  slotType: 2, from: "shoes" as ProductSlot },
    ],
  },
];

function buildSuggestions(products: CustomerProduct[]): AiSuggestion[] {
  // Group by slot type, shuffle each group for variety
  const groups: Record<ProductSlot, CustomerProduct[]> = {
    dress: [], top: [], bottom: [], shoes: [], outerwear: [],
  };

  for (const p of products) {
    const slot = classifyProduct(p);
    if (slot) groups[slot].push(p);
  }

  // Shuffle each group
  for (const key of Object.keys(groups) as ProductSlot[]) {
    for (let i = groups[key].length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [groups[key][i], groups[key][j]] = [groups[key][j], groups[key][i]];
    }
  }

  // Track how many from each group we've used
  const used: Record<ProductSlot, number> = { dress: 0, top: 0, bottom: 0, shoes: 0, outerwear: 0 };
  const suggestions: AiSuggestion[] = [];

  for (const tmpl of TEMPLATES) {
    // Check every required slot has a product available
    const canFill = tmpl.slots.every(
      ({ from }) => used[from] < groups[from].length,
    );
    if (!canFill) continue;

    const aiProducts: AiSuggestionProduct[] = tmpl.slots.map(({ label, slotType, from }) => {
      const product = groups[from][used[from]++];
      return toAiProduct(product, label, slotType);
    });

    suggestions.push({
      suggestionId: `demo-${tmpl.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: tmpl.name,
      styleCategory: tmpl.styleCategory,
      occasion: tmpl.occasion,
      styleNotes: tmpl.styleNotes,
      matchPercentage: tmpl.matchPercentage,
      styleTags: tmpl.styleTags,
      products: aiProducts,
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Product chip
// ---------------------------------------------------------------------------

function ProductChip({ product }: { product: AiSuggestionProduct }) {
  const [imgError, setImgError] = useState(false);
  const name = product.name ?? "Product";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8ddd5] bg-[#FAF7F5] px-3 py-2">
      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[#fef7f0]">
        {product.primaryImageUrl && !imgError ? (
          <img
            src={product.primaryImageUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#C4A99A]">
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#2F2925]">{name}</span>
        {product.slot && <span className="text-xs text-[#9c6b54]">{product.slot}</span>}
      </div>
      {product.price !== null && product.price !== undefined && (
        <span className="ml-auto shrink-0 text-xs font-semibold text-[#6F625B]">
          ${product.price.toFixed(2)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggestion card
// ---------------------------------------------------------------------------

interface SuggestionCardProps {
  suggestion: AiSuggestion;
  index: number;
  onSave: (suggestion: AiSuggestion) => void;
}

function SuggestionCard({ suggestion, index, onSave }: SuggestionCardProps) {
  const [saved, setSaved] = useState(false);

  return (
    <article
      className={cn(customerTheme.card, "flex flex-col gap-4 p-5")}
      aria-label={suggestion.name ?? `AI suggestion ${index + 1}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">
          Suggestion {index + 1}
        </p>
        {suggestion.name && (
          <h2 className="mt-1 text-base font-semibold text-[#2F2925]">{suggestion.name}</h2>
        )}
        {suggestion.styleCategory && (
          <p className="text-sm text-[#6F625B]">{suggestion.styleCategory}</p>
        )}
        {suggestion.occasion && (
          <p className="mt-0.5 text-xs text-[#9c6b54]">{suggestion.occasion}</p>
        )}
        {suggestion.styleNotes && (
          <p className="mt-1 text-xs italic text-[#6F625B]">{suggestion.styleNotes}</p>
        )}
        {suggestion.matchPercentage !== null && suggestion.matchPercentage !== undefined && (
          <p className="mt-1 text-xs font-semibold text-[#9c6b54]">
            {suggestion.matchPercentage}% match
          </p>
        )}
        {suggestion.styleTags && suggestion.styleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestion.styleTags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#fef7f0] px-2 py-0.5 text-xs text-[#6F625B]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <ul className="space-y-2" aria-label="Suggested products">
        {suggestion.products.map((prod, i) => (
          <li key={prod.productId ?? i}>
            <ProductChip product={prod} />
          </li>
        ))}
      </ul>

      {saved ? (
        <div role="status" className="rounded-lg bg-green-50 p-3 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
            <p className="font-medium text-green-800">Saved to your outfits.</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-1 rounded-full text-[#9c6b54]">
            <Link to={CUSTOMER_ROUTES.outfits}>
              <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
              View Outfits
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="w-full rounded-full bg-[#9c6b54] text-white hover:bg-[#7d5643]"
          onClick={() => { onSave(suggestion); setSaved(true); }}
          aria-label={`Save suggestion ${index + 1} to outfits`}
        >
          <BookmarkPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Save to Outfits
        </Button>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Generate form
// ---------------------------------------------------------------------------

interface GenerateFormValues {
  weatherCondition: string;
  occasion: string;
  stylePreferences: string;
}

const INITIAL_FORM: GenerateFormValues = { weatherCondition: "", occasion: "", stylePreferences: "" };

function GenerateForm({
  onGenerate,
  isPending,
}: {
  onGenerate: (v: GenerateFormValues) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<GenerateFormValues>(INITIAL_FORM);
  const empty = !form.weatherCondition.trim();

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!empty) onGenerate(form); }}
      className={cn(customerTheme.card, "space-y-4 p-6")}
      aria-label="Generate AI outfit suggestions"
    >
      <div>
        <label htmlFor="suggestion-weather" className="mb-1 block text-sm font-medium text-[#2F2925]">
          Weather condition <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <Input
          id="suggestion-weather"
          value={form.weatherCondition}
          onChange={(e) => setForm((p) => ({ ...p, weatherCondition: e.target.value }))}
          placeholder="e.g. Sunny, Rainy, Cold, Hot"
          required
        />
      </div>
      <div>
        <label htmlFor="suggestion-occasion" className="mb-1 block text-sm font-medium text-[#2F2925]">
          Occasion (optional)
        </label>
        <Input
          id="suggestion-occasion"
          value={form.occasion}
          onChange={(e) => setForm((p) => ({ ...p, occasion: e.target.value }))}
          placeholder="e.g. Casual Friday, Wedding, Date night"
        />
      </div>
      <div>
        <label htmlFor="suggestion-styles" className="mb-1 block text-sm font-medium text-[#2F2925]">
          Style preferences (optional)
        </label>
        <Input
          id="suggestion-styles"
          value={form.stylePreferences}
          onChange={(e) => setForm((p) => ({ ...p, stylePreferences: e.target.value }))}
          placeholder="e.g. Minimalist, Boho, Classic"
        />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending || empty}>
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Generating suggestions…</>
        ) : (
          <><Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />Get AI Suggestions</>
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CustomerAiSuggestionsPage() {
  const addOutfit = useLocalOutfitStore((s) => s.addOutfit);
  const [suggestions, setSuggestions] = useState<AiSuggestion[] | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (_values: GenerateFormValues) => {
    setSuggestions(null);
    setError(null);
    setIsPending(true);

    try {
      const result = await catalogApi.getProducts({ pageSize: 50 });
      const built = buildSuggestions(result.items);

      if (built.length === 0) {
        setError("Not enough product variety in the catalog to build outfit suggestions. Make sure the shop has tops, bottoms, dresses, and shoes.");
        return;
      }

      setSuggestions(built);
    } catch {
      setError("Could not load products from the catalog. Make sure the backend is running and try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleSave = (suggestion: AiSuggestion) => {
    const slotPreviews: Record<string, string | null> = {};
    suggestion.products.forEach((prod) => {
      slotPreviews[String(prod.slotType ?? prod.displayOrder ?? 0)] = prod.primaryImageUrl ?? null;
    });
    addOutfit(suggestion.name ?? null, suggestion.styleCategory ?? null, slotPreviews);
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">AI Styling</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#2F2925]">AI Outfit Suggestions</h1>
        <p className="mt-2 max-w-2xl text-[#6F625B]">
          Describe your occasion and style preferences, and our AI will curate
          outfit combinations from your shop catalog.
        </p>
      </div>

      <GenerateForm onGenerate={(v) => void handleGenerate(v)} isPending={isPending} />

      {error && (
        <div role="alert" className={cn(customerTheme.card, "flex items-start gap-3 p-5")}>
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
          <div>
            <p className="font-medium text-[#2F2925]">Could not generate suggestions</p>
            <p className="mt-1 text-sm text-[#6F625B]">{error}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {isPending && (
        <div className={cn(customerTheme.card, "p-8 text-center")} aria-busy="true">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#9c6b54]" aria-hidden="true" />
          <p className="mt-4 text-[#6F625B]">Our AI is selecting outfits from your catalog…</p>
        </div>
      )}

      {suggestions !== null && suggestions.length > 0 && !isPending && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-[#6F625B]">
            {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"} generated from your catalog
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion, i) => (
              <SuggestionCard
                key={suggestion.suggestionId ?? `suggestion-${i}`}
                suggestion={suggestion}
                index={i}
                onSave={handleSave}
              />
            ))}
          </div>
        </div>
      )}

      {suggestions !== null && suggestions.length === 0 && !isPending && (
        <div className={cn(customerTheme.card, "p-10 text-center")} role="status">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fef7f0] text-[#9c6b54]">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[#2F2925]">No suggestions found</h2>
          <p className="mx-auto mt-3 max-w-md text-[#6F625B]">
            Add more products (tops, bottoms, dresses, shoes) to the catalog to enable outfit suggestions.
          </p>
        </div>
      )}
    </section>
  );
}
