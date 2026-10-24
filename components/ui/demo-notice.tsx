import type { ReactNode } from "react";

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      {children}
    </p>
  );
}
