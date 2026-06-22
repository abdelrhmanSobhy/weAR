import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { OutfitSummary } from "@/features/customer/types/catalog";

interface LocalOutfitState {
  outfits: OutfitSummary[];
  addOutfit: (name: string | null, style: string | null, slotPreviews?: Record<string, string | null> | null) => OutfitSummary;
  removeOutfit: (id: string) => void;
}

export const useLocalOutfitStore = create<LocalOutfitState>()(
  persist(
    (set, get) => ({
      outfits: [],
      addOutfit: (name, style, slotPreviews) => {
        const outfit: OutfitSummary = {
          id: crypto.randomUUID(),
          name: name || null,
          style: style || null,
          itemCount: slotPreviews ? Object.values(slotPreviews).filter(Boolean).length : 0,
          slotPreviews: slotPreviews ?? null,
        };
        set({ outfits: [outfit, ...get().outfits] });
        return outfit;
      },
      removeOutfit: (id) => set({ outfits: get().outfits.filter((o) => o.id !== id) }),
    }),
    {
      name: "wear-local-outfits",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
