import { customerTheme } from "@/features/customer/styles/customerTheme";

export function ProductCardSkeleton() {
  return (
    <div className={`${customerTheme.card} overflow-hidden`} aria-label="Loading product">
      <div className="aspect-[4/5] animate-pulse bg-[#E4DCD1]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#E4DCD1]" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-[#E4DCD1]" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#E4DCD1]" />
      </div>
    </div>
  );
}
