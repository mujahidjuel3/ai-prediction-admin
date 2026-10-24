import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading administration data" }: LoadingStateProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
