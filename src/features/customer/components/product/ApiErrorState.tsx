import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

interface ApiErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ApiErrorState({
  title = "Something went wrong",
  message = "We couldn't load this customer content. Please try again.",
  onRetry,
}: ApiErrorStateProps) {
  return (
    <div className={`${customerTheme.softCard} flex flex-col items-center px-6 py-12 text-center`}>
      <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
      <h2 className={`mt-4 text-xl font-semibold ${customerTheme.darkText}`}>
        {title}
      </h2>
      <p className={`mt-2 max-w-md text-sm ${customerTheme.mutedText}`}>
        {message}
      </p>
      {onRetry && (
        <Button
          type="button"
          className={cn("mt-5 rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]", customerTheme.focusRing)}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
