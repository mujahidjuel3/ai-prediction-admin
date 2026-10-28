"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <ErrorState
        title="The administration app could not be loaded"
        description={
          error.digest
            ? `Try again. Reference ${error.digest}.`
            : "Check the local API connection and try again."
        }
        onRetry={reset}
      />
    </main>
  );
}
