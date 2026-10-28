import { SignedOutContent } from "@/components/auth/signed-out-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signed out",
};

export default async function SignedOutPage({searchParams}:{searchParams:Promise<{reason?:string}>}) {
  const params=await searchParams;
  return <SignedOutContent forbidden={params.reason==='forbidden'} />;
}
