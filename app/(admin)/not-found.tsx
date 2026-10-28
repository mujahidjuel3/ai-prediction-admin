import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export default function AdminNotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The administration record or route you requested was not found."
      action={
        <Link href="/dashboard" className={buttonClassName("primary", "sm")}>
          Back to dashboard
        </Link>
      }
    />
  );
}
