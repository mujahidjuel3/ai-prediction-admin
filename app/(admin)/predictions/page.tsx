import { PredictionsView } from "@/components/predictions/predictions-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Predictions" };

export default function PredictionsPage() {
  return <PredictionsView />;
}
