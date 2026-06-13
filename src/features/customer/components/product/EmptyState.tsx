import { PackageOpen } from "lucide-react";
import { customerTheme } from "@/features/customer/styles/customerTheme";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className={`${customerTheme.softCard} flex flex-col items-center px-6 py-12 text-center`}>
      <PackageOpen className="h-10 w-10 text-[#A37E6B]" aria-hidden="true" />
      <h2 className={`mt-4 text-xl font-semibold ${customerTheme.darkText}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-2 max-w-md text-sm ${customerTheme.mutedText}`}>
          {description}
        </p>
      )}
    </div>
  );
}
