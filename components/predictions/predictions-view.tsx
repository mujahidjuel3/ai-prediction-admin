"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet, apiPost } from "@/lib/api";
import { useApiList } from "@/lib/use-api-list";
import { useCallback, useEffect, useState } from "react";

interface Prediction {
  id: string;
  riskLevel: string;
  probability: string | null;
  generatedAt: string;
  explanation?: { label?: string; isSynthetic?: boolean; contributingIndicators?: Record<string, number> } | null;
  featureSnapshot?: { isSynthetic?: boolean; demoLabel?: string } | null;
  student: { id: string; name: string; studentNumber: string };
  term: { label: string; code: string };
  modelVersion: { version: string; targetDefinition: string; metrics?: { isSynthetic?: boolean } | null };
  reviews: { id: string; outcome: string; rationale: string | null; createdAt: string; reviewer: { name: string; role: string } }[];
}

interface MlStatus {
  demoPredictionEnabled: boolean;
  mlIntegrationEnabled: boolean;
  universityPolicyApproved: boolean;
  predictionPersistenceEnabled: boolean;
  generationEnabled: boolean;
  disclaimer: string;
  mlService: { reachable: boolean; modelAvailable?: boolean; isSynthetic?: boolean; operatingMode?: string; error?: string };
}

interface DemoSummary {
  disclaimer: string;
  isSynthetic: boolean;
  demoData: boolean;
  totalStudents: number;
  demoRiskCounts: { LOW: number; MEDIUM: number; HIGH: number };
}

function isSyntheticPrediction(row: Prediction): boolean {
  return Boolean(
    row.explanation?.isSynthetic
    || row.featureSnapshot?.isSynthetic
    || row.modelVersion.metrics?.isSynthetic
    || row.explanation?.label?.includes("SYNTHETIC")
    || row.featureSnapshot?.demoLabel?.includes("SYNTHETIC"),
  );
}

export function PredictionsView() {
  const { items, loading, error, reload } = useApiList<Prediction>("/predictions?page=1&pageSize=100");
  const [mlStatus, setMlStatus] = useState<MlStatus | null>(null);
  const [demoSummary, setDemoSummary] = useState<DemoSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");

  const loadMeta = useCallback(async () => {
    try {
      const [status, summary] = await Promise.all([
        apiGet<MlStatus>("/ml/status"),
        apiGet<DemoSummary>("/predictions/demo/summary"),
      ]);
      setMlStatus(status.data);
      setDemoSummary(summary.data);
    } catch {
      /* status panels are best-effort */
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadMeta(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMeta]);

  async function review(id: string) {
    const outcome = window.prompt("Review outcome: CONFIRMED, FALSE_POSITIVE, or OVERRIDDEN");
    if (!outcome || !["CONFIRMED", "FALSE_POSITIVE", "OVERRIDDEN"].includes(outcome)) return;
    const rationale = window.prompt("Optional review rationale") ?? undefined;
    try {
      await apiPost(`/predictions/${id}/reviews`, { outcome, rationale });
      await reload();
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : "Unable to save review.");
    }
  }

  async function runDemo() {
    if (busy) return;
    setBusy(true);
    setActionError("");
    setFeedback("");
    try {
      const result = await apiPost<{
        createdCount: number;
        errorCount: number;
        disclaimer: string;
        isSynthetic: boolean;
      }>("/predictions/demo/generate", {});
      setFeedback(
        `Created ${result.data.createdCount} DEMO / SYNTHETIC predictions (${result.data.errorCount} errors). ${result.data.disclaimer}`,
      );
      await Promise.all([reload(), loadMeta()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Demo prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prediction history"
        description="Stored model outputs and human reviews. Production generation stays gated. Demo actions label every result DEMO / SYNTHETIC."
      />

      <Card>
        <CardHeader>
          <CardTitle>ML / demo status</CardTitle>
          <CardDescription>
            {mlStatus?.disclaimer ?? "Synthetic ML outputs are never actual student risk assessments."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          {mlStatus ? (
            <ul className="space-y-1">
              <li>ML integration: {mlStatus.mlIntegrationEnabled ? "enabled" : "disabled"}</li>
              <li>Demo workflow: {mlStatus.demoPredictionEnabled ? "enabled" : "disabled"}</li>
              <li>University policy approved: {mlStatus.universityPolicyApproved ? "yes" : "no"}</li>
              <li>Production persistence: {mlStatus.predictionPersistenceEnabled ? "yes" : "no"}</li>
              <li>
                ML service:{" "}
                {mlStatus.mlService.reachable
                  ? `${mlStatus.mlService.operatingMode ?? "unknown"} · model ${mlStatus.mlService.modelAvailable ? "available" : "missing"} · synthetic ${mlStatus.mlService.isSynthetic ? "yes" : "no"}`
                  : mlStatus.mlService.error ?? "unreachable"}
              </li>
            </ul>
          ) : (
            <p>Status unavailable.</p>
          )}
          {demoSummary ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              DEMO DATA · students {demoSummary.totalStudents} · low {demoSummary.demoRiskCounts.LOW} · medium{" "}
              {demoSummary.demoRiskCounts.MEDIUM} · high {demoSummary.demoRiskCounts.HIGH}
            </p>
          ) : null}
          <Button
            disabled={busy || !mlStatus?.demoPredictionEnabled || !mlStatus?.mlIntegrationEnabled}
            onClick={() => void runDemo()}
          >
            {busy ? "Running demo…" : "Run DEMO / SYNTHETIC predictions"}
          </Button>
          {feedback ? <p role="status" className="text-sm text-slate-700">{feedback}</p> : null}
          {actionError ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading stored predictions" />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void reload()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="Predictions unavailable"
            description="There are no stored model predictions. Use the demo action when DEMO_PREDICTION_ENABLED is set, or wait for an approved production model."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((row) => {
            const synthetic = isSyntheticPrediction(row);
            const indicators = row.explanation?.contributingIndicators;
            return (
              <Card key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {synthetic ? (
                    <p className="mb-2 inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                      DEMO / SYNTHETIC
                    </p>
                  ) : null}
                  <p className="font-medium text-slate-900">
                    {row.student.name} · {row.student.studentNumber}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {row.term.label} · {row.riskLevel}
                    {row.probability ? ` · score ${row.probability}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Model {row.modelVersion.version} · {row.modelVersion.targetDefinition} ·{" "}
                    {new Date(row.generatedAt).toLocaleString()}
                  </p>
                  {indicators ? (
                    <p className="mt-2 text-xs text-slate-600">
                      Indicators: attendance {indicators.attendance ?? "—"} · quiz {indicators.quiz_avg ?? "—"} · midterm{" "}
                      {indicators.midterm ?? "—"} · assignment {indicators.assignment_avg ?? "—"} · CGPA{" "}
                      {indicators.prior_gpa ?? "—"}
                    </p>
                  ) : null}
                  {row.reviews.length ? (
                    <div className="mt-3 border-t pt-2 text-xs text-slate-600">
                      {row.reviews.map((reviewRow) => (
                        <p key={reviewRow.id}>
                          {reviewRow.outcome} · {reviewRow.reviewer.name} · {new Date(reviewRow.createdAt).toLocaleString()}
                          {reviewRow.rationale ? ` · ${reviewRow.rationale}` : ""}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">No reviews recorded.</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => void review(row.id)}>
                  Record review
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
