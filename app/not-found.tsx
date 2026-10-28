import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            The administration route you requested does not exist.
          </p>
          <Link href="/dashboard" className={`${buttonClassName("primary", "md")} mt-5`}>
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
