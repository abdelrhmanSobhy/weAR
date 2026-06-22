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
// Image URLs — Unsplash CDN, w=300 h=400 for card previews
// ---------------------------------------------------------------------------

const IMG = {
  linenShirt:    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=400&fit=crop&auto=format",
  poloShirt:     "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=300&h=400&fit=crop&auto=format",
  dressShirt:    "https://images.unsplash.com/photo-1602810318-87e37f0358f6?w=300&h=400&fit=crop&auto=format",
  graphicTee:    "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=300&h=400&fit=crop&auto=format",
  floralBlouse:  "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=300&h=400&fit=crop&auto=format",
  knitSweater:   "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop&auto=format",
  chinos:        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=400&fit=crop&auto=format",
  jeans:         "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop&auto=format",
  trousers:      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300&h=400&fit=crop&auto=format",
  wideLegPants:  "https://images.unsplash.com/photo-1594938298603-c8148c4b4f40?w=300&h=400&fit=crop&auto=format",
  whiteSneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=400&fit=crop&auto=format",
  loafers:       "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=400&fit=crop&auto=format",
  oxfords:       "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=400&fit=crop&auto=format",
  heels:         "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop&auto=format",
  sandals:       "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&h=400&fit=crop&auto=format",
  blazer:        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=400&fit=crop&auto=format",
  midDress:      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop&auto=format",
  floralDress:   "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop&auto=format",
};

// ---------------------------------------------------------------------------
// Mock suggestion data — 6 varied outfits, no accessories
// ---------------------------------------------------------------------------

function p(
  id: string,
  slot: string,
  slotType: number,
  name: string,
  price: number,
  img: string,
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
    primaryImageUrl: img,
    stockStatus: "In Stock",
    resolvedProduct: null,
  };
}

const MOCK_SUGGESTIONS: AiSuggestion[] = [
  {
    suggestionId: "demo-s1",
    name: "Summer Breeze",
    styleCategory: "Casual",
    occasion: "Beach / Outdoor",
    styleNotes: "Light and effortless — breathable fabrics for warm days.",
    matchPercentage: 94,
    styleTags: ["Summer", "Casual", "Minimal"],
    products: [
      p("s1-top", "Top",    0, "Linen Button-Up Shirt",  45.00, IMG.linenShirt),
      p("s1-bot", "Bottom", 1, "White Slim Shorts",       38.00, IMG.chinos),
      p("s1-sho", "Shoes",  2, "White Canvas Sneakers",   62.00, IMG.whiteSneakers),
    ],
  },
  {
    suggestionId: "demo-s2",
    name: "Smart Casual",
    styleCategory: "Smart Casual",
    occasion: "Office / Work",
    styleNotes: "Polished yet relaxed — effortless from desk to dinner.",
    matchPercentage: 91,
    styleTags: ["Smart", "Polished", "Versatile"],
    products: [
      p("s2-top", "Top",    0, "Classic Polo Shirt",     42.00, IMG.poloShirt),
      p("s2-bot", "Bottom", 1, "Slim Fit Chinos",        55.00, IMG.chinos),
      p("s2-sho", "Shoes",  2, "Leather Loafers",        79.00, IMG.loafers),
    ],
  },
  {
    suggestionId: "demo-s3",
    name: "Business Ready",
    styleCategory: "Business Formal",
    occasion: "Meeting / Presentation",
    styleNotes: "Sharp and confident — dress for the job you want.",
    matchPercentage: 88,
    styleTags: ["Formal", "Professional", "Classic"],
    products: [
      p("s3-top", "Top",    0, "Oxford Dress Shirt",     55.00, IMG.dressShirt),
      p("s3-bot", "Bottom", 1, "Tailored Trousers",      69.00, IMG.trousers),
      p("s3-out", "Blazer", 2, "Slim Fit Blazer",        99.00, IMG.blazer),
    ],
  },
  {
    suggestionId: "demo-s4",
    name: "Street Style",
    styleCategory: "Urban Casual",
    occasion: "Weekend / Hangout",
    styleNotes: "Cool and laid-back — the modern urban wardrobe staple.",
    matchPercentage: 89,
    styleTags: ["Streetwear", "Urban", "Trendy"],
    products: [
      p("s4-top", "Top",    0, "Graphic Oversized Tee",  35.00, IMG.graphicTee),
      p("s4-bot", "Bottom", 1, "Blue Slim Jeans",        65.00, IMG.jeans),
      p("s4-sho", "Shoes",  2, "White Chunky Sneakers",  85.00, IMG.whiteSneakers),
    ],
  },
  {
    suggestionId: "demo-s5",
    name: "Evening Glam",
    styleCategory: "Elegant",
    occasion: "Dinner / Date Night",
    styleNotes: "Sophisticated and feminine — effortlessly turns heads.",
    matchPercentage: 96,
    styleTags: ["Elegant", "Evening", "Chic"],
    products: [
      p("s5-drs", "Dress", 0, "Floral Midi Dress",       79.00, IMG.floralDress),
      p("s5-sho", "Shoes", 1, "Strappy Heeled Sandals",  95.00, IMG.heels),
    ],
  },
  {
    suggestionId: "demo-s6",
    name: "Weekend Chic",
    styleCategory: "Relaxed Chic",
    occasion: "Brunch / Weekend",
    styleNotes: "Effortlessly put-together without trying too hard.",
    matchPercentage: 87,
    styleTags: ["Chic", "Relaxed", "Weekend"],
    products: [
      p("s6-top", "Top",    0, "Floral Wrap Blouse",     48.00, IMG.floralBlouse),
      p("s6-bot", "Bottom", 1, "Wide-Leg Linen Pants",   58.00, IMG.wideLegPants),
      p("s6-sho", "Shoes",  2, "Strappy Flat Sandals",   45.00, IMG.sandals),
    ],
  },
];

// ---------------------------------------------------------------------------
// Product chip
// ---------------------------------------------------------------------------

function ProductChip({ product }: { product: AiSuggestionProduct }) {
  const [imgError, setImgError] = useState(false);
  const name = product.name ?? "Product";
  const price = product.price;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8ddd5] bg-[#FAF7F5] px-3 py-2">
      {product.primaryImageUrl && !imgError ? (
        <img
          src={product.primaryImageUrl}
          alt={name}
          className="h-14 w-10 shrink-0 rounded-lg object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fef7f0] text-[#C4A99A]">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
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
// Suggestion card
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

const INITIAL_FORM: GenerateFormValues = { weatherCondition: "", occasion: "", stylePreferences: "" };

function GenerateForm({ onGenerate, isPending }: { onGenerate: (v: GenerateFormValues) => void; isPending: boolean }) {
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

  const handleGenerate = (_values: GenerateFormValues) => {
    setSuggestions(null);
    setIsPending(true);
    setTimeout(() => {
      setSuggestions(MOCK_SUGGESTIONS);
      setIsPending(false);
    }, 1800);
  };

  const handleSave = (suggestion: AiSuggestion) => {
    // Build slotPreviews from product images so the outfit modal shows photos
    const slotPreviews: Record<string, string | null> = {};
    suggestion.products.forEach((prod) => {
      const key = String(prod.slotType ?? prod.displayOrder ?? 0);
      slotPreviews[key] = prod.primaryImageUrl ?? null;
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
          outfit combinations for you. Save any suggestion directly to your Outfits.
        </p>
      </div>

      <GenerateForm onGenerate={handleGenerate} isPending={isPending} />

      {isPending && (
        <div className={cn(customerTheme.card, "p-8 text-center")} aria-busy="true">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#9c6b54]" aria-hidden="true" />
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
