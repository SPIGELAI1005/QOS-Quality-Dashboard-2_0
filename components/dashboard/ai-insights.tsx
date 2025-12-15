"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { AggregatedKpiData } from "@/lib/domain/types";

interface AIInsightsProps {
  kpiData: AggregatedKpiData | null;
}

interface AIInsight {
  keyFindings: string[];
  topPerformers: Array<{
    site: string;
    metric: string;
    value: number;
    achievement: string;
  }>;
  bottomPerformers: Array<{
    site: string;
    metric: string;
    value: number;
    issue: string;
  }>;
  anomalies: Array<{
    type: string;
    site: string;
    month: string;
    metric: string;
    change: string;
    description: string;
  }>;
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    expectedImpact: string;
  }>;
}

export function AIInsights({ kpiData }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    if (!kpiData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/interpret-kpis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(kpiData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kpiData) {
      generateInsights();
    }
  }, [kpiData]);

  if (!kpiData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>Upload data to generate insights</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Insights
        </CardTitle>
        <CardDescription>AI-powered analysis of quality metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Generating insights...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {insights && !loading && (
          <div className="space-y-6">
            {insights.keyFindings && insights.keyFindings.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Key Findings</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {insights.keyFindings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.topPerformers && insights.topPerformers.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Top Performers</h4>
                <div className="space-y-2">
                  {insights.topPerformers.map((performer, index) => (
                    <div
                      key={index}
                      className="rounded-md border bg-success/5 p-3 text-sm"
                    >
                      <div className="font-medium">{performer.site}</div>
                      <div className="text-muted-foreground">
                        {performer.metric}: {performer.value} - {performer.achievement}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.bottomPerformers && insights.bottomPerformers.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Areas for Improvement</h4>
                <div className="space-y-2">
                  {insights.bottomPerformers.map((performer, index) => (
                    <div
                      key={index}
                      className="rounded-md border bg-destructive/5 p-3 text-sm"
                    >
                      <div className="font-medium">{performer.site}</div>
                      <div className="text-muted-foreground">
                        {performer.metric}: {performer.value} - {performer.issue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.anomalies && insights.anomalies.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Anomalies Detected</h4>
                <div className="space-y-2">
                  {insights.anomalies.map((anomaly, index) => (
                    <div
                      key={index}
                      className="rounded-md border bg-warning/5 p-3 text-sm"
                    >
                      <div className="font-medium">
                        {anomaly.type} in {anomaly.site} ({anomaly.month})
                      </div>
                      <div className="text-muted-foreground">{anomaly.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.recommendations && insights.recommendations.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Recommendations</h4>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="rounded-md border p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            rec.priority === "high"
                              ? "bg-destructive/10 text-destructive"
                              : rec.priority === "medium"
                              ? "bg-warning/10 text-warning"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="font-medium">{rec.title}</span>
                      </div>
                      <div className="mt-1 text-muted-foreground">{rec.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Expected impact: {rec.expectedImpact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!insights && !loading && !error && (
          <Button onClick={generateInsights} className="w-full">
            Generate Insights
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

