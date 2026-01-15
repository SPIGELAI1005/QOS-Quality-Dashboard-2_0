"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";
import { useGlobalFilters } from "@/lib/hooks/useGlobalFilters";
import { IAmQButton } from "@/components/iamq/iamq-button";
import { IAmQChatPanel } from "@/components/iamq/iamq-chat-panel";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { getPlantColorHex, getNotificationTypeColor, getBarAnimation } from "@/lib/utils/chartColors";
import { ExternalLink, FileSpreadsheet, Info, Package, RefreshCw } from "lucide-react";

interface PlantData {
  code: string;
  name: string;
  erp?: string;
  city?: string;
  abbreviation?: string;
  abbreviationCity?: string;
  abbreviationCountry?: string;
  country?: string;
  location?: string;
}

interface AISummaryResponse {
  summary?: string;
  error?: string;
  errorType?: string;
  errorDetails?: { message?: string; code?: string; statusCode?: number };
}

function isSimplePlantCode(value: string): boolean {
  return /^\d{3}$/.test(value.trim());
}

function normalizeToPlantCode(siteCodeRaw: string, allowedPlantCodes: Set<string>): string | null {
  const siteCode = String(siteCodeRaw || "").trim();
  if (!siteCode) return null;

  // If we have an official plant list, only allow values that map to that list.
  if (allowedPlantCodes.size > 0) {
    if (allowedPlantCodes.has(siteCode)) return siteCode;

    const leading3 = siteCode.match(/^(\d{3})/)?.[1];
    if (leading3 && allowedPlantCodes.has(leading3)) return leading3;

    return null;
  }

  // Fallback (before plants load): only accept clean 3-digit codes to avoid huge legends
  return isSimplePlantCode(siteCode) ? siteCode : null;
}

function formatGermanNumber(value: number, fractionDigits: number = 0): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function parseMonthKeyToDateStart(monthKey: string): Date | null {
  // monthKey: "YYYY-MM"
  const [y, m] = monthKey.split("-");
  const year = Number(y);
  const month = Number(m);
  if (!year || !month) return null;
  return new Date(year, month - 1, 1);
}

function isWithinDateRange(monthKey: string, from: Date | null, to: Date | null): boolean {
  if (!from && !to) return true;
  const monthStart = parseMonthKeyToDateStart(monthKey);
  if (!monthStart) return true;
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  if (from && monthEnd < from) return false;
  if (to && monthStart > to) return false;
  return true;
}

function PlantLegend({
  sites,
  plantsData,
  selectedPlant,
  onSelectPlant,
}: {
  sites: string[];
  plantsData: PlantData[];
  selectedPlant: string | null;
  onSelectPlant: (plantCode: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2 pt-2">
      {sites.map((siteCode) => {
        const plant = plantsData.find((p) => p.code === siteCode);
        // Prioritize combined abbreviation (city, country), then fallback to other labels
        const abbrevParts: string[] = [];
        if (plant?.abbreviationCity) abbrevParts.push(plant.abbreviationCity);
        if (plant?.abbreviationCountry) abbrevParts.push(plant.abbreviationCountry);
        const combinedAbbrev = abbrevParts.length > 0 ? abbrevParts.join(', ') : (plant?.abbreviation || '');
        const label = combinedAbbrev || plant?.location || plant?.city || plant?.country || plant?.name || siteCode;
        const isSelected = selectedPlant === siteCode;
        return (
          <button
            key={siteCode}
            type="button"
            onClick={() => onSelectPlant(siteCode)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1 transition-colors",
              isSelected ? "bg-accent/50" : "bg-muted/30 hover:bg-accent/30"
            )}
            title={`Filter chart to plant ${siteCode}`}
          >
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-semibold text-white"
              style={{ backgroundColor: getPlantColorHex(siteCode) }}
            >
              {siteCode}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </button>
        );
      })}
    </div>
  );
}

export function CostPoorQualityClient() {
  const [kpis, setKpis] = useState<MonthlySiteKpi[]>([]);
  const [plantsData, setPlantsData] = useState<PlantData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  // Use global filter hook for persistent filters across pages
  const [filters, setFilters] = useGlobalFilters();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chartContext, setChartContext] = useState<{
    title?: string;
    description?: string;
    chartType?: string;
    dataType?: string;
    hasData?: boolean;
    dataCount?: number;
  } | undefined>(undefined);
  
  // Set default complaint and notification types for this page if not already set
  useEffect(() => {
    if (filters.selectedComplaintTypes.length === 0) {
      setFilters(prev => ({ ...prev, selectedComplaintTypes: ["Internal"] }));
    }
    if (filters.selectedNotificationTypes.length === 0) {
      setFilters(prev => ({ ...prev, selectedNotificationTypes: ["Q3"] }));
    }
  }, [filters.selectedComplaintTypes.length, filters.selectedNotificationTypes.length, setFilters]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiErrorType, setAiErrorType] = useState<string | null>(null);
  const [aiErrorDetails, setAiErrorDetails] = useState<AISummaryResponse["errorDetails"] | null>(null);

  const internalNotificationsChartRef = useRef<HTMLDivElement>(null);
  const [selectedPlantForInternalChart, setSelectedPlantForInternalChart] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedKpis = localStorage.getItem("qos-et-kpis");
    if (!storedKpis) return;
    try {
      const parsed = JSON.parse(storedKpis) as MonthlySiteKpi[];
      setKpis(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("[Poor Quality Costs] Failed to parse stored KPIs:", e);
    }
  }, []);

  const monthNames = useMemo(
    () => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    []
  );

  const availableMonthsYears = useMemo(() => {
    const monthYearSet = new Set<string>();
    kpis.forEach((k) => monthYearSet.add(k.month));
    const sorted = Array.from(monthYearSet).sort();
    const months = new Set<number>();
    const years = new Set<number>();
    sorted.forEach((monthStr) => {
      const [y, m] = monthStr.split("-").map(Number);
      if (y && m) {
        months.add(m);
        years.add(y);
      }
    });
    // Always include 2025 and 2026 in the years list
    years.add(2025);
    years.add(2026);
    
    return {
      months: Array.from(months).sort((a, b) => a - b),
      years: Array.from(years).sort((a, b) => b - a),
      lastMonthYear: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    };
  }, [kpis]);

  useEffect(() => {
    if (selectedMonth !== null && selectedYear !== null) return;
    // Default to December 2025
    setSelectedYear(2025);
    setSelectedMonth(12);
  }, [selectedMonth, selectedYear]);

  const lookbackPeriod = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      const start = new Date(end);
      start.setMonth(start.getMonth() - 11);
      return { start, end, startMonthStr: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, endMonthStr: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}` };
    }
    const end = new Date(selectedYear, selectedMonth - 1, 1);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 11);
    return { start, end, startMonthStr: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, endMonthStr: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}` };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (Array.isArray(data?.plants)) setPlantsData(data.plants);
      })
      .catch((e) => console.error("[Poor Quality Costs] Failed to load plants:", e));
  }, []);

  const allowedPlantCodes = useMemo(() => new Set(plantsData.map((p) => p.code)), [plantsData]);

  const filteredKpis = useMemo(() => {
    const plantSet = new Set(filters.selectedPlants);
    return kpis.filter((kpi) => {
      const plantCode = normalizeToPlantCode(kpi.siteCode, allowedPlantCodes);
      if (!plantCode) return false;

      const plantOk = plantSet.size === 0 || plantSet.has(plantCode);
      const lookbackOk = isWithinDateRange(kpi.month, lookbackPeriod.start, lookbackPeriod.end);
      const dateOk = isWithinDateRange(kpi.month, filters.dateFrom, filters.dateTo);
      return plantOk && lookbackOk && dateOk;
    });
  }, [kpis, filters.dateFrom, filters.dateTo, filters.selectedPlants, allowedPlantCodes, lookbackPeriod.start, lookbackPeriod.end]);

  const internalComplaintsTotal = useMemo(() => {
    return filteredKpis.reduce((sum, kpi) => sum + (kpi.internalComplaintsQ3 || 0), 0);
  }, [filteredKpis]);

  const internalDefectsTotal = useMemo(() => {
    return filteredKpis.reduce((sum, kpi) => sum + (kpi.internalDefectiveParts || 0), 0);
  }, [filteredKpis]);

  const internalByMonthPlant = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    for (const kpi of filteredKpis) {
      const plantCode = normalizeToPlantCode(kpi.siteCode, allowedPlantCodes);
      if (!plantCode) continue;
      if (!byMonth.has(kpi.month)) byMonth.set(kpi.month, {});
      const monthRow = byMonth.get(kpi.month)!;
      monthRow[plantCode] = (monthRow[plantCode] || 0) + (kpi.internalComplaintsQ3 || 0);
    }
    const months = Array.from(byMonth.keys()).sort();
    return months.map((month) => ({ month, ...byMonth.get(month)! }));
  }, [filteredKpis, allowedPlantCodes]);

  const internalPlantsWithComplaints = useMemo(() => {
    // Only show plants that have actual internal complaints in the current (global) filter.
    const set = new Set<string>();
    for (const kpi of filteredKpis) {
      if (!kpi.internalComplaintsQ3) continue;
      const plantCode = normalizeToPlantCode(kpi.siteCode, allowedPlantCodes);
      if (plantCode) set.add(plantCode);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filteredKpis, allowedPlantCodes]);

  const internalChartPlants = useMemo(() => {
    if (selectedPlantForInternalChart) return [selectedPlantForInternalChart];
    return internalPlantsWithComplaints;
  }, [internalPlantsWithComplaints, selectedPlantForInternalChart]);

  const internalByMonthPlantForChart = useMemo(() => {
    if (!selectedPlantForInternalChart) return internalByMonthPlant;
    // Filter each row down to the selected plant only (local chart filter)
    return internalByMonthPlant.map((row) => ({
      month: row.month,
      [selectedPlantForInternalChart]: Number((row as any)[selectedPlantForInternalChart]) || 0,
    }));
  }, [internalByMonthPlant, selectedPlantForInternalChart]);

  const internalByMonthPlantForChartWithTotal = useMemo(() => {
    return internalByMonthPlantForChart.map((row) => {
      const total = internalChartPlants.reduce((acc, plantCode) => acc + (Number((row as any)[plantCode]) || 0), 0);
      return { ...row, __total: total };
    });
  }, [internalByMonthPlantForChart, internalChartPlants]);

  const internalDefectsByMonthPlant = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    for (const kpi of filteredKpis) {
      const plantCode = normalizeToPlantCode(kpi.siteCode, allowedPlantCodes);
      if (!plantCode) continue;
      if (!byMonth.has(kpi.month)) byMonth.set(kpi.month, {});
      const monthRow = byMonth.get(kpi.month)!;
      monthRow[plantCode] = (monthRow[plantCode] || 0) + (kpi.internalDefectiveParts || 0);
    }
    const months = Array.from(byMonth.keys()).sort();
    return months.map((month) => ({ month, ...byMonth.get(month)! }));
  }, [filteredKpis, allowedPlantCodes]);

  const internalDefectsByMonthPlantWithTotal = useMemo(() => {
    const scopeCodes = (filters.selectedPlants.length > 0 ? filters.selectedPlants : Array.from(allowedPlantCodes)).filter(
      (c) => isSimplePlantCode(c)
    );
    return internalDefectsByMonthPlant.map((row) => {
      const total = scopeCodes.reduce((acc, plantCode) => acc + (Number((row as any)[plantCode]) || 0), 0);
      return { ...row, __total: total };
    });
  }, [internalDefectsByMonthPlant, filters.selectedPlants, allowedPlantCodes]);

  const sitesInScope = useMemo(() => {
    // Mirror the dashboard behavior: the chart "plants" are the same as the global plant filter.
    // Only keep official 3-digit plant codes.
    const codes = (filters.selectedPlants.length > 0 ? filters.selectedPlants : Array.from(allowedPlantCodes))
      .filter((c) => isSimplePlantCode(c));
    return codes.sort((a, b) => a.localeCompare(b));
  }, [filters.selectedPlants, allowedPlantCodes]);

  const maxYAxisInternal = useMemo(() => {
    let max = 0;
    for (const row of internalByMonthPlant) {
      // Keep scale stable based on plants with complaints (not on local selection)
      const sum = internalPlantsWithComplaints.reduce((acc, site) => acc + (Number((row as any)[site]) || 0), 0);
      max = Math.max(max, sum);
    }
    return Math.max(5, Math.ceil(max * 1.1));
  }, [internalByMonthPlant, internalPlantsWithComplaints]);

  const maxYAxisInternalDefects = useMemo(() => {
    let max = 0;
    for (const row of internalDefectsByMonthPlant) {
      const sum = sitesInScope.reduce((acc, site) => acc + (Number((row as any)[site]) || 0), 0);
      max = Math.max(max, sum);
    }
    return Math.max(5, Math.ceil(max * 1.1));
  }, [internalDefectsByMonthPlant, sitesInScope]);

  async function generateAISummary() {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiErrorType(null);
    setAiErrorDetails(null);
    try {
      if (filteredKpis.length === 0) {
        setAiSummary(null);
        setAiError("No filtered KPIs available to analyze.");
        return;
      }
      const res = await fetch("/api/ai/interpret-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpis: filteredKpis,
          context: {
            focus: "Poor Quality Costs page. Focus ONLY on internal complaints (Q3) and internal defects (Q3).",
          },
        }),
      });
      const data = (await res.json()) as AISummaryResponse;

      if (data?.error && !data?.summary) {
        setAiErrorType(data.errorType || "unknown");
        setAiErrorDetails(data.errorDetails || null);
        throw new Error(data.error);
      }
      setAiSummary(data.summary || null);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Failed to generate AI summary";
      setAiError(msg);
      console.error("[Poor Quality Costs] AI summary error:", e);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">Poor Quality Costs YTD //</h1>
            {selectedMonth !== null && selectedYear !== null && (
              <div className="flex items-center gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="min-w-[180px] w-auto h-auto py-1 px-2 text-3xl font-bold tracking-tight border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-transparent">
                    <SelectValue className="text-3xl font-bold tracking-tight" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={name} value={(idx + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="min-w-[120px] w-auto h-auto py-1 px-2 text-3xl font-bold tracking-tight border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-transparent">
                    <SelectValue className="text-3xl font-bold tracking-tight" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonthsYears.years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2">Cost Performance • Poor Quality Costs</p>
          {selectedMonth !== null && selectedYear !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing 12-month lookback from {monthNames[selectedMonth - 1]} {selectedYear}
              {lookbackPeriod.startMonthStr !== lookbackPeriod.endMonthStr && (
                <> ({lookbackPeriod.startMonthStr} to {lookbackPeriod.endMonthStr})</>
              )}
            </p>
          )}
        </div>

        {/* Metrics + AI card */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">YTD Cost Metrics</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-stretch">
            <div className="space-y-6">
              <div className="grid gap-4 auto-rows-fr md:grid-cols-3" style={{ gridAutoRows: "1fr" }}>
                <Card className="glass-card-glow" style={{ borderColor: "#3b82f6", borderWidth: "2px" }}>
                  <CardContent className="p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internal complaints</p>
                        <div className="text-2xl font-bold mt-1">{formatGermanNumber(internalComplaintsTotal, 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Q3 notifications</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => internalNotificationsChartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="h-8"
                      >
                        View
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-auto">Filtered by plants/date (Q3 fixed)</p>
                  </CardContent>
                </Card>

                {[
                  "Quality Failure Costs",
                  "Quality Net Costs",
                  "Scrap Costs",
                  "Overhead Costs",
                  "Warranty Costs",
                ].map((title) => (
                  <Card key={title} className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                    <CardContent className="p-6 flex flex-col">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
                      <div className="text-2xl font-bold mt-1">—</div>
                      <p className="text-xs text-muted-foreground mt-1">No data source connected yet</p>
                      <p className="text-xs text-muted-foreground mt-auto">Will mirror dashboard-style KPIs</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div className="flex flex-col" style={{ height: "100%" }}>
              <Card className="glass-card-glow min-h-0 overflow-hidden" style={{ borderColor: "#9E9E9E", borderWidth: "2px", height: "100%" }}>
                <CardContent className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-3 flex-shrink-0">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Summary</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on selected plants/date (Internal Q3)</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={generateAISummary}
                        disabled={aiLoading}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                        title="Refresh AI Summary"
                        aria-label="Refresh AI Summary"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", aiLoading && "animate-spin")} style={{ color: "#9E9E9E" }} />
                      </button>
                      <IAmQButton
                        onClick={() => {
                          setChartContext({
                            title: "AI Summary - Poor Quality Costs",
                            description: "AI-generated summary of internal complaints (Q3) and poor quality costs",
                            chartType: "metric",
                            dataType: "costs",
                            hasData: filteredKpis.length > 0,
                            dataCount: filteredKpis.length,
                          });
                          setIsChatOpen(true);
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden">
                    {aiError ? (
                      <div className="text-xs text-muted-foreground">
                        <p className="text-red-400 font-semibold mb-2">Unable to generate summary</p>
                        <p className="break-words">{aiError}</p>
                        {aiErrorType && (
                          <p className="mt-2 text-[11px] text-muted-foreground/80">
                            Error type: {aiErrorType}
                            {aiErrorDetails?.statusCode ? ` • HTTP ${aiErrorDetails.statusCode}` : ""}
                          </p>
                        )}
                      </div>
                    ) : aiSummary ? (
                      <p className="text-xs leading-relaxed text-foreground/90 line-clamp-[14]">{aiSummary}</p>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Click refresh to generate an internal (Q3) summary.
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-3 space-y-1.5 flex-shrink-0 border-t border-border/50">
                    <Button
                      onClick={() => (window.location.href = "/ai-summary")}
                      variant="outline"
                      size="sm"
                      className="w-full justify-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      AI Management Summary
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Based on Selected Sites</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Internal charts */}
        <Card ref={internalNotificationsChartRef} className="glass-card-glow chart-container">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>YTD Total Number of Internal Notifications by Month and Plant</CardTitle>
                <CardDescription>Internal complaints (Q3) by month and plant (fixed filter)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedPlantForInternalChart && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPlantForInternalChart(null)}
                    title="Reset to show all plants"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset Filter
                  </Button>
                )}
                <IAmQButton
                  onClick={() => {
                    setChartContext({
                      title: "YTD Total Number of Internal Notifications by Month and Plant",
                      description: "Internal complaints (Q3) by month and plant (fixed filter)",
                      chartType: "bar",
                      dataType: "notifications",
                      hasData: internalByMonthPlantForChart.length > 0,
                      dataCount: internalByMonthPlantForChart.length,
                    });
                    setIsChatOpen(true);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredKpis.length > 0 && internalByMonthPlantForChart.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={internalByMonthPlantForChartWithTotal} margin={{ top: 22, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                    <YAxis
                      stroke="rgba(255, 255, 255, 0.5)"
                      tickFormatter={(v) => formatGermanNumber(Number(v), 0)}
                      domain={[0, maxYAxisInternal]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [formatGermanNumber(value, 0), name]}
                    />
                    {internalChartPlants.map((siteCode, idx) => (
                      <Bar
                        key={siteCode}
                        dataKey={siteCode}
                        stackId="internal"
                        fill={getPlantColorHex(siteCode)}
                        name={siteCode}
                        {...getBarAnimation(idx)}
                      >
                        {/* Show the TOTAL label once per stack, anchored to the top segment (dashboard-style) */}
                        {idx === internalChartPlants.length - 1 && (
                          <LabelList
                            dataKey="__total"
                            position="top"
                            offset={6}
                            fill="rgba(255, 255, 255, 0.9)"
                            fontSize={12}
                            fontWeight={600}
                            formatter={(value: number) => (value && value > 0 ? formatGermanNumber(value, 0) : "")}
                          />
                        )}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                {internalPlantsWithComplaints.length > 0 && (
                  <PlantLegend
                    sites={internalPlantsWithComplaints}
                    plantsData={plantsData}
                    selectedPlant={selectedPlantForInternalChart}
                    onSelectPlant={(plantCode) => setSelectedPlantForInternalChart(plantCode)}
                  />
                )}
              </>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 mr-3 opacity-60" />
                No data available. Upload Excel files first.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card-glow chart-container">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>YTD Total Number of Internal Defects by Month and Plant</CardTitle>
                <CardDescription>Defective parts from internal complaints (Q3) by month and plant</CardDescription>
              </div>
              <IAmQButton
                onClick={() => {
                  setChartContext({
                    title: "YTD Total Number of Internal Defects by Month and Plant",
                    description: "Defective parts from internal complaints (Q3) by month and plant",
                    chartType: "bar",
                    dataType: "defects",
                    hasData: internalDefectsByMonthPlant.length > 0,
                    dataCount: internalDefectsByMonthPlant.length,
                  });
                  setIsChatOpen(true);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredKpis.length > 0 && internalDefectsByMonthPlant.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={internalDefectsByMonthPlantWithTotal} margin={{ top: 22, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                    <YAxis
                      stroke="rgba(255, 255, 255, 0.5)"
                      tickFormatter={(v) => formatGermanNumber(Number(v), 0)}
                      domain={[0, maxYAxisInternalDefects]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [formatGermanNumber(value, 0), name]}
                    />
                    {sitesInScope.map((siteCode, idx) => (
                      <Bar
                        key={siteCode}
                        dataKey={siteCode}
                        stackId="internalDefects"
                        fill={getPlantColorHex(siteCode)}
                        name={siteCode}
                        {...getBarAnimation(idx)}
                      >
                        {idx === sitesInScope.length - 1 && (
                          <LabelList
                            dataKey="__total"
                            position="top"
                            offset={6}
                            fill="rgba(255, 255, 255, 0.9)"
                            fontSize={12}
                            fontWeight={600}
                            formatter={(value: number) => (value && value > 0 ? formatGermanNumber(value, 0) : "")}
                          />
                        )}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                <PlantLegend
                  sites={sitesInScope}
                  plantsData={plantsData}
                  selectedPlant={null}
                  onSelectPlant={() => {}}
                />
              </>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 mr-3 opacity-60" />
                No data available. Upload Excel files first.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card-glow chart-container">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>YTD Number of Internal Notifications by Month and Notification Type</CardTitle>
                <CardDescription>Fixed to Internal Complaints (Q3)</CardDescription>
              </div>
              <IAmQButton
                onClick={() => {
                  setChartContext({
                    title: "YTD Number of Internal Notifications by Month and Notification Type",
                    description: "Fixed to Internal Complaints (Q3)",
                    chartType: "bar",
                    dataType: "notifications",
                    hasData: internalByMonthPlant.length > 0,
                    dataCount: internalByMonthPlant.length,
                  });
                  setIsChatOpen(true);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={internalByMonthPlant.map((row) => ({
                  month: row.month,
                  Q3: sitesInScope.reduce((acc, site) => acc + (Number((row as any)[site]) || 0), 0),
                }))}
                margin={{ top: 22, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                <YAxis stroke="rgba(255, 255, 255, 0.5)" tickFormatter={(v) => formatGermanNumber(Number(v), 0)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatGermanNumber(value, 0), "Internal Complaints (Q3)"]}
                />
                <Bar dataKey="Q3" fill={getNotificationTypeColor("Q3")} name="Q3" {...getBarAnimation(0)}>
                  <LabelList
                    dataKey="Q3"
                    position="top"
                    offset={6}
                    fill="rgba(255, 255, 255, 0.9)"
                    fontSize={12}
                    fontWeight={600}
                    formatter={(value: number) => (value && value > 0 ? formatGermanNumber(value, 0) : "")}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost charts sections (placeholders) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Cost Charts</h2>
          <div className="space-y-6">
            {[
              "Quality Failure Costs",
              "Quality Net Costs",
              "Scrap Costs",
              "Overhead Costs",
              "Warranty Costs",
            ].map((title) => (
              <Card key={title} className="glass-card-glow chart-container">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{`YTD ${title} by Month and Plant`}</CardTitle>
                      <CardDescription>No data connected yet</CardDescription>
                    </div>
                    <IAmQButton
                      onClick={() => {
                        setChartContext({
                          title: `YTD ${title} by Month and Plant`,
                          description: "No data connected yet",
                          chartType: "bar",
                          dataType: "costs",
                          hasData: false,
                          dataCount: 0,
                        });
                        setIsChatOpen(true);
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px] flex items-center justify-center">
                    <div className="flex items-center gap-3 text-orange-400 font-semibold">
                      <FileSpreadsheet className="h-10 w-10 opacity-80" />
                      Data Source Missing (Under Construction)
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Data Source Reference */}
        <Card className="glass-card-glow chart-container">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Data Source Reference</CardTitle>
            </div>
            <CardDescription className="mt-2">
              All metrics on this page are calculated from the following data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Complaints Data */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Complaints Data</h4>
                  <p className="text-sm text-muted-foreground mb-2">Q Cockpit QOS ET_Complaints_Parts_PPM_PS4.XLSX</p>
                  <p className="text-sm mb-3">Quality notifications and defective parts data (Internal = Q3)</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Column B - Site
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Column C - Notification
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Column AF - Return delivery qty
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Delivery Data */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Delivery Data</h4>
                  <p className="text-sm text-muted-foreground mb-2">Outbound / Inbound Files (per site)</p>
                  <p className="text-sm mb-3">Total parts delivered (used for PPM on other pages)</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Column E - Quantity
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Plant Information */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Plant Information</h4>
                  <p className="text-sm text-muted-foreground mb-2">Webasto ET Plants .xlsx</p>
                  <p className="text-sm mb-3">Manufacturing site details</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Column A - Code
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Column B - City
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Column C - Country
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t pt-6 mt-6">
                <p className="text-sm font-medium">
                  PPM Formula: (Total Defective Parts / Total Deliveries) × 1,000,000
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Panel - Right Sidebar */}
      <div className="flex-shrink-0">
        <FilterPanel
          monthlySiteKpis={kpis}
          filters={filters}
          onFiltersChange={(next) => {
            // Lock this page to Internal/Q3; only allow plants/date
            setFilters({
              ...next,
              selectedComplaintTypes: ["Internal"],
              selectedNotificationTypes: ["Q3"],
            });
          }}
          showComplaintTypes={false}
          showNotificationTypes={false}
        />
      </div>
      <IAmQChatPanel
        open={isChatOpen}
        onOpenChange={(open) => {
          setIsChatOpen(open);
          if (!open) {
            setChartContext(undefined);
          }
        }}
        chartContext={chartContext}
        filters={filters}
        monthlySiteKpis={filteredKpis}
        selectedSites={filters.selectedPlants.length > 0 ? filters.selectedPlants : Array.from(new Set(filteredKpis.map((k) => k.siteCode))).sort()}
        selectedMonths={Array.from(new Set(filteredKpis.map(k => k.month))).sort()}
      />
    </div>
  );
}

