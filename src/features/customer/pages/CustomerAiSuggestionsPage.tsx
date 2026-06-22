import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookmarkPlus,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import type { AiSuggestion, AiSuggestionProduct } from "@/features/customer/types/catalog";
import { useLocalOutfitStore } from "@/features/customer/fixtures/localOutfitStore";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock suggestion data (demo — no backend needed)
// ---------------------------------------------------------------------------

function buildMockProduct(
  id: string,
  slot: string,
  slotType: number,
  name: string,
  price: number,
): AiSuggestionProduct {
  return {
    id,
    productId: id,
    modelId: null,
    slotType,
    slot,
    displayOrder: slotType,
    reasoning: null,
    description: null,
    name,
    price,
    primaryImageUrl: null,
    stockStatus: "In Stock",
    resolvedProduct: null,
  };
}

const MOCK_SUGGESTIONS: AiSuggestion[] = [
  {
    suggestionId: "demo-s1",
    name: "Casual Day Out",
    styleCategory: "Casual",
    occasion: "Everyday",
    styleNotes: "Light and effortless — comfortable from morning to evening.",
    matchPercentage: 94,
    styleTags: ["Casual", "Comfortable", "Minimal"],
    products: [
      buildMockProduct("demo-s1-top", "Top", 0, "Linen Button-Up Shirt", 45.00),
      buildMockProduct("demo-s1-bot", "Bottom", 1, "Slim Fit Chinos", 55.00),
      buildMockProduct("demo-s1-sho", "Shoes", 2, "White Canvas Sneakers", 62.00),
    ],
  },
  {
    suggestionId: "demo-s2",
    name: "Smart Casual",
    styleCategory: "Smart Casual",
    occasion: "Office / Work",
    styleNotes: "Polished yet relaxed — great for a business-casual environment.",
    matchPercentage: 88,
    styleTags: ["Smart", "Polished", "Business Casual"],
    products: [
      buildMockProduct("demo-s2-top", "Top", 0, "Classic Polo Shirt", 42.00),
      buildMockProduct("demo-s2-bot", "Bottom", 1, "Tailored Trousers", 69.00),
      buildMockProduct("demo-s2-out", "Outerwear", 2, "Lightweight Blazer", 89.00),
    ],
  },
  {
    suggestionId: "demo-s3",
    name: "Evening Elegance",
    styleCategory: "Formal",
    occasion: "Dinner / Evening",
    styleNotes: "Sophisticated and chic — effortlessly transitions from day to night.",
    matchPercentage: 91,
    styleTags: ["Elegant", "Evening", "Chic"],
    products: [
      buildMockProduct("demo-s3-drs", "Dress", 0, "Floral Midi Dress", 79.00),
      buildMockProduct("demo-s3-sho", "Shoes", 1, "Strappy Heeled Sandals", 95.00),
      buildMockProduct("demo-s3-bag", "Accessory", 2, "Structured Clutch Bag", 55.00),
    ],
  },
];

// ---------------------------------------------------------------------------
// Product chip within a suggestion
// ---------------------------------------------------------------------------

function ProductChip({ product }: { product: AiSuggestionProduct }) {
  const name = product.name ?? product.productId ?? "Product";
  const price = product.price;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#e8ddd5] bg-[#FAF7F5] px-3 py-2">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#fef7f0] text-[#C4A99A]"
        aria-hidden="true"
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#2F2925]">{name}</span>
        {product.slot && (
          <span className="text-xs text-[#9c6b54]">{product.slot}</span>
        )}
      </div>
      {price !== null && price !== undefined && (
        <span className="ml-auto shrink-0 text-xs font-semibold text-[#6F625B]">
          ${price.toFixed(2)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single suggestion card
// ---------------------------------------------------------------------------

interface SuggestionCardProps {
  suggestion: AiSuggestion;
  index: number;
  onSave: (suggestion: AiSuggestion) => void;
}

function SuggestionCard({ suggestion, index, onSave }: SuggestionCardProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(suggestion);
    setSaved(true);
  };

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
          <h2 className="mt-1 text-base font-semibold text-[#2F2925]">
            {suggestion.name}
          </h2>
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
              <span
                key={tag}
                className="rounded-full bg-[#fef7f0] px-2 py-0.5 text-xs text-[#6F625B]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <ul className="space-y-2" aria-label="Suggested products">
        {suggestion.products.map((p, i) => (
          <li key={p.productId ?? i}>
            <ProductChip product={p} />
          </li>
        ))}
      </ul>

      {saved ? (
        <div role="status" className="rounded-lg bg-green-50 p-3 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
            <p className="text-green-800 font-medium">Saved to your outfits.</p>
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
          onClick={handleSave}
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

const INITIAL_FORM: GenerateFormValues = {
  weatherCondition: "",
  occasion: "",
  stylePreferences: "",
};

interface GenerateFormProps {
  onGenerate: (values: GenerateFormValues) => void;
  isPending: boolean;
}

function GenerateForm({ onGenerate, isPending }: GenerateFormProps) {
  const [form, setForm] = useState<GenerateFormValues>(INITIAL_FORM);

  const handleChange = (field: keyof GenerateFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.weatherCondition.trim()) return;
    onGenerate(form);
  };

  const empty = !form.weatherCondition.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(customerTheme.card, "space-y-4 p-6")}
      aria-label="Generate AI outfit suggestions"
    >
      <div>
        <label
          htmlFor="suggestion-weather"
          className="mb-1 block text-sm font-medium text-[#2F2925]"
        >
          Weather condition <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <Input
          id="suggestion-weather"
          value={form.weatherCondition}
          onChange={(e) => handleChange("weatherCondition", e.target.value)}
          placeholder="e.g. Sunny, Rainy, Cold, Hot"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label
          htmlFor="suggestion-occasion"
          className="mb-1 block text-sm font-medium text-[#2F2925]"
        >
          Occasion (optional)
        </label>
        <Input
          id="suggestion-occasion"
          value={form.occasion}
          onChange={(e) => handleChange("occasion", e.target.value)}
          placeholder="e.g. Casual Friday, Wedding, Date night"
        />
      </div>

      <div>
        <label
          htmlFor="suggestion-styles"
          className="mb-1 block text-sm font-medium text-[#2F2925]"
        >
          Style preferences (optional)
        </label>
        <Input
          id="suggestion-styles"
          value={form.stylePreferences}
          onChange={(e) => handleChange("stylePreferences", e.target.value)}
          placeholder="e.g. Minimalist, Boho, Classic"
        />
      </div>

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isPending || empty}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Generating suggestions…
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Get AI Suggestions
          </>
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

  const handleGenerate = (_values: GenerateFormValues) => {
    setSuggestions(null);
    setIsPending(true);
    // Simulate a short AI thinking delay for realism
    setTimeout(() => {
      setSuggestions(MOCK_SUGGESTIONS);
      setIsPending(false);
    }, 1800);
  };

  const handleSave = (suggestion: AiSuggestion) => {
    addOutfit(suggestion.name ?? null, suggestion.styleCategory ?? null, null);
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9c6b54]">
          AI Styling
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-[#2F2925]">
          AI Outfit Suggestions
        </h1>
        <p className="mt-2 max-w-2xl text-[#6F625B]">
          Describe your occasion and style preferences, and our AI will curate
          outfit combinations for you. Save any suggestion directly to your Outfits.
        </p>
      </div>

      <GenerateForm onGenerate={handleGenerate} isPending={isPending} />

      {isPending && (
        <div
          className={cn(customerTheme.card, "p-8 text-center")}
          aria-busy="true"
          aria-label="Generating AI outfit suggestions"
        >
          <Loader2
            className="mx-auto h-10 w-10 animate-spin text-[#9c6b54]"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#6F625B]">Our AI is crafting outfit suggestions for you…</p>
        </div>
      )}

      {suggestions !== null && suggestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-[#6F625B]">
            {suggestions.length} suggestions generated
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
    </section>
  );
}
