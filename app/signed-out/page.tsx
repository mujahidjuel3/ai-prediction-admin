import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Signed out",
};

export default function SignedOutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardContent className="py-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">You left {APP_NAME}</h1>
          <p className="mt-2 text-sm text-slate-600">
            This demonstration does not sign in to an account, and logging out does not end a
            server session. Authentication and role checks have to be enforced by the future backend.
          </p>
          <Link href="/dashboard" className={`${buttonClassName("primary", "md")} mt-6`}>
            Return to the demonstration
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
