"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";
import { useGlobalFilters } from "@/lib/hooks/useGlobalFilters";
import { IAmQButton } from "@/components/iamq/iamq-button";
import { IAmQChatPanel } from "@/components/iamq/iamq-chat-panel";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ExternalLink, FileSpreadsheet, Info, Loader2, RefreshCw, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { getBarAnimation, getPlantColorHex } from "@/lib/utils/chartColors";

interface PPAPApiItem {
  notificationNumber: string;
  notificationType: "P1" | "P2" | "P3";
  plant: string;
  siteCode: string;
  siteName?: string;
  createdOn: string | Date;
  status?: "In Progress" | "Completed" | "Pending";
  notificationStatusText?: string;
  partNumber?: string;
}

interface PlantData {
  code: string;
  name: string;
  city?: string;
  location?: string;
  abbreviation?: string;
  abbreviationCity?: string;
  abbreviationCountry?: string;
  country?: string;
}

interface AISummaryResponse {
  summary?: string;
  error?: string;
  errorType?: "api_key" | "rate_limit" | "network" | "unknown";
  errorDetails?: { message?: string; code?: string; statusCode?: number };
}

function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function PPAPsClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [monthlySiteKpis, setMonthlySiteKpis] = useState<MonthlySiteKpi[]>([]);
  const [ppaps, setPpaps] = useState<PPAPApiItem[]>([]);
  const [plantsData, setPlantsData] = useState<PlantData[]>([]);
  const [selectedPlantForStatusChart, setSelectedPlantForStatusChart] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // AI Summary state (same behavior as Dashboard AI Summary)
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [aiSummaryErrorType, setAiSummaryErrorType] = useState<
    "api_key" | "rate_limit" | "network" | "unknown" | null
  >(null);
  const [aiSummaryErrorDetails, setAiSummaryErrorDetails] = useState<{ message?: string; code?: string; statusCode?: number } | null>(null);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKpis = localStorage.getItem('qos-et-kpis');
      if (storedKpis) {
        try {
          const parsed = JSON.parse(storedKpis);
          setMonthlySiteKpis(parsed);
        } catch (e) {
          console.error('Failed to parse stored KPIs:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/ppaps")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (Array.isArray(data?.ppaps)) setPpaps(data.ppaps);
      })
      .catch((e) => console.error("[PPAPs] Failed to load PPAPs from API:", e));
  }, []);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (Array.isArray(data?.plants)) setPlantsData(data.plants);
      })
      .catch((e) => console.error("[PPAPs] Failed to load plants from API:", e));
  }, []);

  const formatPlantLabel = useCallback((siteCode: string): string => {
    const plant = plantsData.find((p) => p.code === siteCode);
    // Prioritize combined abbreviation (city, country)
    const abbrevParts: string[] = [];
    if (plant?.abbreviationCity) abbrevParts.push(plant.abbreviationCity);
    if (plant?.abbreviationCountry) abbrevParts.push(plant.abbreviationCountry);
    const combinedAbbrev = abbrevParts.length > 0 ? abbrevParts.join(', ') : (plant?.abbreviation || '');
    
    if (combinedAbbrev) {
      return `${siteCode} ${combinedAbbrev}`;
    }
    // Fallback to other labels
    const label = plant?.location || plant?.city || plant?.country || plant?.name;
    return label ? `${siteCode} (${label})` : siteCode;
  }, [plantsData]);

  const monthNames = useMemo(
    () => t.common.months,
    [t]
  );

  const availableMonthsYears = useMemo(() => {
    const monthYearSet = new Set<string>();
    for (const p of ppaps) {
      const created = p.createdOn instanceof Date ? p.createdOn : new Date(p.createdOn);
      if (Number.isNaN(created.getTime())) continue;
      monthYearSet.add(toMonthKey(created));
    }
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
      allMonthYears: sorted,
      lastMonthYear: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    };
  }, [ppaps]);

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
      const startMonthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      const endMonthStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`;
      return { start, end, startMonthStr, endMonthStr };
    }

    const end = new Date(selectedYear, selectedMonth - 1, 1);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 11);
    const startMonthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    const endMonthStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`;
    return { start, end, startMonthStr, endMonthStr };
  }, [selectedMonth, selectedYear]);

  const filteredPpaps = useMemo(() => {
    const plantSet = new Set(filters.selectedPlants);
    return ppaps.filter((p) => {
      const site = String(p.siteCode || p.plant || "").trim();
      const plantOk = plantSet.size === 0 || plantSet.has(site);

      const created = p.createdOn instanceof Date ? p.createdOn : new Date(p.createdOn);
      // Apply 12-month lookback based on selected Month/Year (similar to dashboard)
      const lookbackStart = new Date(lookbackPeriod.start.getFullYear(), lookbackPeriod.start.getMonth(), 1);
      const lookbackEnd = new Date(lookbackPeriod.end.getFullYear(), lookbackPeriod.end.getMonth() + 1, 0, 23, 59, 59, 999);
      if (created < lookbackStart || created > lookbackEnd) return false;
      if (filters.dateFrom && created < filters.dateFrom) return false;
      if (filters.dateTo && created > filters.dateTo) return false;

      return plantOk;
    });
  }, [ppaps, filters.selectedPlants, filters.dateFrom, filters.dateTo, lookbackPeriod.start, lookbackPeriod.end]);

  const totalPNotifications = filteredPpaps.length;
  const inProgress = filteredPpaps.filter((p) => p.status === "In Progress" || p.status === "Pending").length;
  const closed = filteredPpaps.filter((p) => p.status === "Completed").length;

  const ppapMonthlySiteKpisForAi = useMemo<MonthlySiteKpi[]>(() => {
    const byKey = new Map<string, MonthlySiteKpi>();

    for (const p of filteredPpaps) {
      const site = String(p.siteCode || p.plant || "").trim();
      if (!site) continue;
      const created = p.createdOn instanceof Date ? p.createdOn : new Date(p.createdOn);
      if (Number.isNaN(created.getTime())) continue;

      const month = toMonthKey(created);
      const key = `${month}__${site}`;

      if (!byKey.has(key)) {
        const plant = plantsData.find((x) => x.code === site);
        const siteName =
          plant?.location || plant?.city || plant?.name || plant?.abbreviation || plant?.country || undefined;

        byKey.set(key, {
          month,
          siteCode: site,
          siteName,
          customerComplaintsQ1: 0,
          supplierComplaintsQ2: 0,
          internalComplaintsQ3: 0,
          deviationsD: 0,
          ppapP: { inProgress: 0, completed: 0 },
          customerPpm: null,
          supplierPpm: null,
          customerDeliveries: 0,
          supplierDeliveries: 0,
          customerDefectiveParts: 0,
          supplierDefectiveParts: 0,
          internalDefectiveParts: 0,
        });
      }

      const kpi = byKey.get(key)!;
      if (p.notificationType === "P1") kpi.ppapP.inProgress += 1;
      else kpi.ppapP.completed += 1; // P2 + P3
    }

    return Array.from(byKey.values()).sort((a, b) => a.month.localeCompare(b.month) || a.siteCode.localeCompare(b.siteCode));
  }, [filteredPpaps, plantsData]);

  const generateAISummary = useCallback(async () => {
    if (ppapMonthlySiteKpisForAi.length === 0) {
      setAiSummary(null);
      return;
    }

    setAiSummaryLoading(true);
    setAiSummaryError(null);
    setAiSummaryErrorType(null);
    setAiSummaryErrorDetails(null);

    try {
      const selectedSitesForAI =
        filters.selectedPlants.length > 0
          ? filters.selectedPlants
          : Array.from(new Set(ppapMonthlySiteKpisForAi.map((k) => k.siteCode))).sort();

      const selectedMonthsForAI = Array.from(new Set(ppapMonthlySiteKpisForAi.map((k) => k.month))).sort();

      const filterContext = {
        selectedPlants: filters.selectedPlants.length > 0 ? filters.selectedPlants : null,
        dateRange:
          filters.dateFrom || filters.dateTo
            ? {
                from: filters.dateFrom ? filters.dateFrom.toISOString().split("T")[0] : null,
                to: filters.dateTo ? filters.dateTo.toISOString().split("T")[0] : null,
              }
            : null,
        notificationTypes: ["P1", "P2", "P3"],
        complaintTypes: null,
      };

      const response = await fetch("/api/ai/interpret-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlySiteKpis: ppapMonthlySiteKpisForAi,
          globalPpm: { customerPpm: null, supplierPpm: null },
          selectedSites: selectedSitesForAI,
          selectedMonths: selectedMonthsForAI,
          filterContext,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as AISummaryResponse;
        setAiSummaryErrorType(errorData.errorType || "unknown");
        setAiSummaryErrorDetails(errorData.errorDetails || null);
        throw new Error(errorData.error || "Failed to generate AI summary");
      }

      const data = (await response.json()) as AISummaryResponse;
      if (data.error && (!data.summary || data.summary.trim().length === 0)) {
        setAiSummaryErrorType(data.errorType || "unknown");
        setAiSummaryErrorDetails(data.errorDetails || null);
        throw new Error(data.error || "Failed to generate AI summary");
      }

      const summaryText = data.summary?.trim() || null;
      if (!summaryText) throw new Error("AI service returned an empty summary. Please try again.");
      setAiSummary(summaryText);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate summary";
      setAiSummaryError(message);
      if (!aiSummaryErrorType) setAiSummaryErrorType("unknown");
    } finally {
      setAiSummaryLoading(false);
    }
  }, [ppapMonthlySiteKpisForAi, filters, aiSummaryErrorType]);

  // Auto-generate AI summary when PPAP filters change (same behavior as dashboard)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateAISummary();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [generateAISummary]);

  const ppapNotificationsByMonthPlant = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    const sitesSet = new Set<string>();

    for (const p of filteredPpaps) {
      const site = String(p.siteCode || p.plant || "").trim();
      if (!site) continue;
      const created = p.createdOn instanceof Date ? p.createdOn : new Date(p.createdOn);
      if (Number.isNaN(created.getTime())) continue;

      const month = toMonthKey(created);
      if (!byMonth.has(month)) byMonth.set(month, {});
      const monthRow = byMonth.get(month)!;
      monthRow[site] = (monthRow[site] || 0) + 1;
      sitesSet.add(site);
    }

    const sites = Array.from(sitesSet).sort((a, b) => {
      const an = Number.parseInt(a, 10);
      const bn = Number.parseInt(b, 10);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return a.localeCompare(b);
    });

    const months = Array.from(byMonth.keys()).sort();
    const data = months.map((month) => {
      const row = byMonth.get(month) || {};
      const total = sites.reduce((sum, s) => sum + (row[s] || 0), 0);
      return { month, ...row, total };
    });

    return { data, sites };
  }, [filteredPpaps]);

  const availablePpapSites = useMemo(() => {
    const s = new Set<string>();
    for (const p of filteredPpaps) {
      const site = String(p.siteCode || p.plant || "").trim();
      if (site) s.add(site);
    }
    return Array.from(s).sort((a, b) => {
      const an = Number.parseInt(a, 10);
      const bn = Number.parseInt(b, 10);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return a.localeCompare(b);
    });
  }, [filteredPpaps]);

  const ppapStatusByMonth = useMemo(() => {
    const base = selectedPlantForStatusChart
      ? filteredPpaps.filter((p) => String(p.siteCode || p.plant || "").trim() === selectedPlantForStatusChart)
      : filteredPpaps;

    const byMonth = new Map<string, { closed: number; inProgress: number; total: number }>();

    for (const p of base) {
      const created = p.createdOn instanceof Date ? p.createdOn : new Date(p.createdOn);
      if (Number.isNaN(created.getTime())) continue;

      const month = toMonthKey(created);
      if (!byMonth.has(month)) byMonth.set(month, { closed: 0, inProgress: 0, total: 0 });
      const row = byMonth.get(month)!;

      if (p.status === "Completed") row.closed += 1;
      else row.inProgress += 1; // treat Pending as In Progress for this view

      row.total += 1;
    }

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, [t.charts.deviations.closed]: v.closed, [t.ppaps.inProgress]: v.inProgress, total: v.total }));
  }, [filteredPpaps, selectedPlantForStatusChart]);

  const PlantLegend = useCallback(({
    sites,
    selectedPlant,
    onPlantClick,
  }: {
    sites: string[];
    selectedPlant?: string | null;
    onPlantClick?: (plantCode: string | null) => void;
  }) => {
    if (sites.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-4 justify-center mt-4 pt-4 border-t border-border/50">
        {sites.map((site) => {
          const plant = plantsData.find((p) => p.code === site);
          // Use combined abbreviation (city, country) or fallback to single abbreviation or city
          const abbrevParts: string[] = [];
          if (plant?.abbreviationCity) abbrevParts.push(plant.abbreviationCity);
          if (plant?.abbreviationCountry) abbrevParts.push(plant.abbreviationCountry);
          const combinedAbbrev = abbrevParts.length > 0 ? abbrevParts.join(', ') : (plant?.abbreviation || '');
          const city = plant?.city || plant?.location || '';
          // Only show abbreviation/city, not plant code (already shown in color indicator)
          const displayText = combinedAbbrev || city || `Site ${site}`;
          const isSelected = selectedPlant === site;
          return (
            <div
              key={site}
              className={cn(
                "flex items-center gap-2 cursor-pointer transition-all",
                "hover:opacity-80 active:scale-95",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg p-1"
              )}
              onClick={() => onPlantClick?.(isSelected ? null : site)}
              title={isSelected ? t.charts.resetToShowAll : `${t.charts.clickToFilterBy} ${combinedAbbrev || city || site}`}
            >
              <div
                className={cn("h-6 w-6 rounded flex items-center justify-center text-xs font-semibold text-white flex-shrink-0")}
                style={{ backgroundColor: getPlantColorHex(site) }}
              >
                {site}
              </div>
              <span className={cn("text-sm whitespace-nowrap", isSelected ? "text-primary font-semibold" : "text-foreground")}>
                {displayText}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [plantsData]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">PPAPs Overview YTD //</h1>
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
          <p className="text-muted-foreground mt-2">Internal Performance • PPAPs Overview</p>
          {selectedMonth !== null && selectedYear !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing 12-month lookback from {monthNames[selectedMonth - 1]} {selectedYear}
              {lookbackPeriod.startMonthStr !== lookbackPeriod.endMonthStr && (
                <> ({lookbackPeriod.startMonthStr} to {lookbackPeriod.endMonthStr})</>
              )}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">YTD PPAP Metrics</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-stretch">
            {/* Metrics stacked */}
            <div className="space-y-4">
              <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardContent className="p-6 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">P Notifications</p>
                  <div className="text-3xl font-bold mt-1">{totalPNotifications.toLocaleString("de-DE")}</div>
                  <p className="text-xs text-muted-foreground mt-1">P1 / P2 / P3 notifications</p>
                  <p className="text-xs text-muted-foreground mt-auto">Filtered by plants/date</p>
                </CardContent>
              </Card>

              <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardContent className="p-6 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">P Notification Status</p>
                  <div className="text-3xl font-bold mt-1">{closed.toLocaleString("de-DE")} / {inProgress.toLocaleString("de-DE")}</div>
                  <p className="text-xs text-muted-foreground mt-1">Closed / In Progress</p>
                  <p className="text-xs text-muted-foreground mt-auto">Based on SAP Notification Status (NOCO/OSNO)</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Summary (dashboard-style) */}
            <div className="flex flex-col" style={{ height: "100%" }}>
              <Card
                className="bg-card/50 transition-all hover:shadow-lg glass-card-glow flex flex-col overflow-hidden"
                style={{ borderColor: "#9E9E9E", borderWidth: "2px", height: "100%" }}
              >
                <CardContent className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-3 flex-shrink-0">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Summary</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          generateAISummary();
                        }}
                        disabled={aiSummaryLoading || ppapMonthlySiteKpisForAi.length === 0}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t.dashboard.clickToGenerateSummary}
                        aria-label="Refresh AI Summary"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${aiSummaryLoading ? "animate-spin" : ""}`} style={{ color: "#9E9E9E" }} />
                      </button>
                      <IAmQButton
                        onClick={() => {
                          setChartContext({
                            title: "AI Summary - PPAPs",
                            description: "AI-generated summary of PPAP (P1, P2, P3) notifications and trends",
                            chartType: "metric",
                            dataType: "ppaps",
                            hasData: ppapMonthlySiteKpisForAi.length > 0,
                            dataCount: ppapMonthlySiteKpisForAi.length,
                          });
                          setIsChatOpen(true);
                        }}
                      />
                      <div className="p-3 rounded-lg" style={{ backgroundColor: "#9E9E9E20", borderColor: "#9E9E9E50", borderWidth: "1px" }}>
                        <Sparkles className="h-4 w-4" style={{ color: "#9E9E9E" }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {aiSummaryLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                        <p className="text-sm text-muted-foreground">Generating summary...</p>
                      </div>
                    ) : aiSummaryError ? (
                      <div className="space-y-1.5 overflow-hidden">
                        <p className="text-xs text-muted-foreground italic">Unable to generate summary</p>
                        <div className="space-y-1.5 text-[10px] overflow-hidden">
                          {aiSummaryErrorType === "api_key" ? (
                            <div className="space-y-1">
                              <p className="text-muted-foreground/90 font-medium text-[11px]">API Key Issue</p>
                              <p className="text-muted-foreground/70 leading-tight">{aiSummaryError}</p>
                            </div>
                          ) : aiSummaryErrorType === "rate_limit" ? (
                            <div className="space-y-0.5">
                              <p className="text-muted-foreground/90 font-medium text-[11px]">Rate Limit Exceeded</p>
                              <p className="text-muted-foreground/70 leading-tight text-[10px]">{aiSummaryError}</p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <p className="text-muted-foreground/70 leading-tight text-[10px]">{aiSummaryError}</p>
                              {aiSummaryErrorDetails?.message && (
                                <p className="text-muted-foreground/60 text-[9px] leading-tight">{aiSummaryErrorDetails.message}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : aiSummary ? (
                      <div className="space-y-2 flex-1 flex flex-col justify-start overflow-hidden min-h-0">
                        {(() => {
                          const lines = aiSummary.split("\n").filter((line) => line.trim());
                          const cleanLines = lines
                            .map((line) => line.trim().replace(/^[•\-\d+\.]\s*/, "").trim())
                            .filter((line) => line.length > 0);
                          const statementsToShow = cleanLines.slice(0, 3);

                          const getIcon = (text: string) => {
                            const lower = text.toLowerCase();
                            if (
                              lower.includes("spike") ||
                              lower.includes("increase") ||
                              lower.includes("rise") ||
                              lower.includes("worsen") ||
                              lower.includes("critical") ||
                              lower.includes("risk") ||
                              lower.includes("concern") ||
                              lower.includes("issue")
                            ) {
                              return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />;
                            }
                            if (
                              lower.includes("improve") ||
                              lower.includes("decrease") ||
                              lower.includes("better") ||
                              lower.includes("positive") ||
                              lower.includes("good") ||
                              lower.includes("excellent") ||
                              lower.includes("strong")
                            ) {
                              return <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />;
                            }
                            if (lower.includes("stable") || lower.includes("maintain") || lower.includes("consistent") || lower.includes("steady")) {
                              return <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />;
                            }
                            return <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />;
                          };

                          return statementsToShow.map((statement, idx) => (
                            <div key={idx} className="flex items-start gap-2 flex-shrink-0">
                              {getIcon(statement)}
                              <p className="text-xs text-foreground leading-relaxed flex-1 min-w-0 break-words">{statement}</p>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground italic">No summary available</p>
                        {ppapMonthlySiteKpisForAi.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground/70">No filtered data to analyze. Adjust filters to generate a summary.</p>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              generateAISummary();
                            }}
                            disabled={aiSummaryLoading}
                            className="text-[10px] text-primary hover:underline disabled:opacity-50"
                          >
                            Click to generate summary
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-3 space-y-1.5 flex-shrink-0 border-t border-border">
                    <Button
                      onClick={() => router.push("/ai-summary")}
                      variant="outline"
                      size="sm"
                      className="w-full bg-[#00FF88] text-black hover:bg-[#00FF88]/90 border-[#00FF88] font-semibold text-xs py-1.5 h-auto"
                    >
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      AI Management Summary
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Based on Selected Plants</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <Card className="glass-card-glow chart-container">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>YTD P Notifications by Month and Plant</CardTitle>
                  <CardDescription>Number of PPAP notifications by month and plant (stacked)</CardDescription>
                </div>
                <IAmQButton
                  onClick={() => {
                    setChartContext({
                      title: "YTD P Notifications by Month and Plant",
                      description: "Number of PPAP notifications by month and plant (stacked)",
                      chartType: "bar",
                      dataType: "ppaps",
                      hasData: ppapNotificationsByMonthPlant.data.length > 0 && ppapNotificationsByMonthPlant.sites.length > 0,
                      dataCount: ppapNotificationsByMonthPlant.sites.length,
                    });
                    setIsChatOpen(true);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {ppapNotificationsByMonthPlant.data.length > 0 && ppapNotificationsByMonthPlant.sites.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ppapNotificationsByMonthPlant.data} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: ValueType, name: NameType) => {
                          const n = typeof value === "number" ? value : Number(value);
                          const label = typeof name === "string" ? formatPlantLabel(name) : String(name);
                          return [Number.isFinite(n) ? n.toLocaleString("de-DE") : String(value), label];
                        }}
                      />
                      {ppapNotificationsByMonthPlant.sites.map((site, index) => {
                        const isLast = index === ppapNotificationsByMonthPlant.sites.length - 1;
                        return (
                          <Bar
                            key={site}
                            dataKey={site}
                            stackId="a"
                            fill={getPlantColorHex(site)}
                            name={site}
                            radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            {...getBarAnimation(index)}
                          >
                            {isLast && (
                              <LabelList
                                dataKey="total"
                                position="top"
                                fill="rgba(255, 255, 255, 0.9)"
                                fontSize={12}
                                fontWeight="500"
                                offset={10}
                                formatter={(value: number) => (value ? value.toLocaleString("de-DE") : "")}
                              />
                            )}
                          </Bar>
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                  <PlantLegend sites={ppapNotificationsByMonthPlant.sites} />
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available for chart
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card-glow chart-container">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>YTD P Notifications Closed vs. In Progress by Month and Plant</CardTitle>
                  <CardDescription>
                    {selectedPlantForStatusChart
                      ? `Closed vs. In Progress for ${formatPlantLabel(selectedPlantForStatusChart)}`
                      : "Closed vs. In Progress across all selected plants"}
                  </CardDescription>
                </div>
                {selectedPlantForStatusChart && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedPlantForStatusChart(null)}>
                    Reset Filter
                  </Button>
                )}
                <IAmQButton
                  onClick={() => {
                    setChartContext({
                      title: "YTD P Notifications Closed vs. In Progress by Month and Plant",
                      description: selectedPlantForStatusChart
                        ? `Closed vs. In Progress for ${formatPlantLabel(selectedPlantForStatusChart)}`
                        : "Closed vs. In Progress across all selected plants",
                      chartType: "bar",
                      dataType: "ppaps",
                      hasData: ppapStatusByMonth.length > 0,
                      dataCount: ppapStatusByMonth.length,
                    });
                    setIsChatOpen(true);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {ppapStatusByMonth.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ppapStatusByMonth} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: ValueType, name: NameType) => {
                          const n = typeof value === "number" ? value : Number(value);
                          const label = typeof name === "string" ? name : String(name);
                          return [Number.isFinite(n) ? n.toLocaleString("de-DE") : String(value), label];
                        }}
                      />
                      <Bar dataKey={t.charts.deviations.closed} fill="#10b981" name={t.charts.deviations.closed} stackId="a" radius={[0, 0, 0, 0]} {...getBarAnimation(0)} />
                      <Bar dataKey={t.ppaps.inProgress} fill="#f59e0b" name={t.ppaps.inProgress} stackId="a" radius={[4, 4, 0, 0]} {...getBarAnimation(1)}>
                        <LabelList
                          dataKey="total"
                          position="top"
                          fill="rgba(255, 255, 255, 0.9)"
                          fontSize={12}
                          fontWeight="500"
                          offset={10}
                          formatter={(value: number) => (value ? value.toLocaleString("de-DE") : "")}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <PlantLegend
                    sites={availablePpapSites}
                    selectedPlant={selectedPlantForStatusChart}
                    onPlantClick={setSelectedPlantForStatusChart}
                  />
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available for chart</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Source Reference */}
        <Card className="glass-card-glow chart-container">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Data Source Reference</CardTitle>
            </div>
            <CardDescription className="mt-2">
              PPAP metrics on this page are calculated from the following data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">PPAP Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-2">PPAP P Notif_PS4.XLSX</p>
                  <p className="text-sm mb-3">P1/P2/P3 notifications</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Notification Number
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Plant / Site
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Created On
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">PPAP Status Reference</h4>
                  <p className="text-sm text-muted-foreground mb-2">PPAP P Notif_STATUS_PS4.XLSX</p>
                  <p className="text-sm mb-3">Status mapping for Closed vs In Progress</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Notification Number
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Status
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-shrink-0">
        <FilterPanel
          monthlySiteKpis={monthlySiteKpis}
          filters={filters}
          onFiltersChange={setFilters}
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
        monthlySiteKpis={ppapMonthlySiteKpisForAi}
        selectedSites={filters.selectedPlants.length > 0 ? filters.selectedPlants : Array.from(new Set(ppaps.map(p => String(p.siteCode || p.plant || "").trim()))).sort()}
        selectedMonths={Array.from(new Set(ppaps.map(p => {
          const created = p.createdOn instanceof Date ? p.createdOn : new Date(p.createdOn);
          return toMonthKey(created);
        }))).sort()}
      />
    </div>
  );
}

