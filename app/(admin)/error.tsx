"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="This section could not be loaded"
      description={
        error.digest
          ? `The page failed to render. Reference ${error.digest}.`
          : "The page failed to render. Mock administration data should load without a backend."
      }
      onRetry={reset}
    />
  );
}
