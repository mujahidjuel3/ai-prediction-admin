import type { ReactNode } from "react";

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">{children}</div>;
}
