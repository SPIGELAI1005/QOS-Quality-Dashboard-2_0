"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";
import { useGlobalFilters } from "@/lib/hooks/useGlobalFilters";
import { IAmQButton } from "@/components/iamq/iamq-button";
import { IAmQChatPanel } from "@/components/iamq/iamq-chat-panel";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { FileSpreadsheet, Info, Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WarrantiesCostsClient() {
  const [kpis, setKpis] = useState<MonthlySiteKpi[]>([]);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedKpis = localStorage.getItem("qos-et-kpis");
    if (!storedKpis) return;
    try {
      const parsed = JSON.parse(storedKpis) as MonthlySiteKpi[];
      setKpis(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("[Warranties Costs] Failed to parse stored KPIs:", e);
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
    const years = new Set<number>();
    sorted.forEach((monthStr) => {
      const [y] = monthStr.split("-").map(Number);
      if (y) years.add(y);
    });
    // Always include 2025 and 2026 in the years list
    years.add(2025);
    years.add(2026);
    
    return {
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

  const metrics = [
    "Warranty Claims",
    "Warranty Current vs. Budget",
    "Warranty Cost",
    "Warranty Returns (ZREK Sales Orders)",
    "FOC Replacements (ZRER Sales Orders)",
    "Return Back to Customer (ZRRK Sales Orders)",
    "Credit Notes Value (ZG2W Sales Orders)",
  ] as const;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">Warranty Costs YTD //</h1>
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
          <p className="text-muted-foreground mt-2">Cost Performance • Warranty Costs</p>
          {selectedMonth !== null && selectedYear !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing 12-month lookback from {monthNames[selectedMonth - 1]} {selectedYear}
              {lookbackPeriod.startMonthStr !== lookbackPeriod.endMonthStr && (
                <> ({lookbackPeriod.startMonthStr} to {lookbackPeriod.endMonthStr})</>
              )}
            </p>
          )}
        </div>

        {/* Metrics + (placeholder) AI card */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">YTD Warranty Metrics</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-stretch">
            <div className="space-y-6">
              <div className="grid gap-4 auto-rows-fr md:grid-cols-3" style={{ gridAutoRows: "1fr" }}>
                {metrics.map((title) => (
                  <Card
                    key={title}
                    className="glass-card-glow"
                    style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}
                  >
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

            {/* AI Summary placeholder */}
            <div className="flex flex-col" style={{ height: "100%" }}>
              <Card
                className="glass-card-glow min-h-0 overflow-hidden"
                style={{ borderColor: "#9E9E9E", borderWidth: "2px", height: "100%" }}
              >
                <CardContent className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-3 flex-shrink-0">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Summary</p>
                      <p className="text-xs text-muted-foreground mt-1">Warranty metrics overview (coming soon)</p>
                    </div>
                    <IAmQButton
                      onClick={() => {
                        setChartContext({
                          title: "AI Summary - Warranty Costs",
                          description: "AI-generated summary of warranty costs and metrics",
                          chartType: "metric",
                          dataType: "warranties",
                          hasData: false,
                          dataCount: 0,
                        });
                        setIsChatOpen(true);
                      }}
                    />
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="text-sm font-semibold text-orange-400">
                      Data Source Missing (Under Construction)
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Connect warranty cost/claims data sources to enable analytics and AI insights.
                    </p>
                  </div>

                  <div className="mt-auto pt-3 space-y-1.5 flex-shrink-0 border-t border-border/50">
                    <Button variant="outline" size="sm" className="w-full justify-center gap-2" disabled>
                      Coming soon
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Based on Selected Sites</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Placeholder charts: one per metric */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Warranty Charts</h2>
          <div className="space-y-6">
            {metrics.map((title) => (
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
                          dataType: "warranties",
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
              This page will calculate warranty metrics from the following data sources (to be connected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Warranty Claims & Costs</h4>
                  <p className="text-sm text-muted-foreground mb-2">ERP / Warranty Claims Extract (TBD)</p>
                  <p className="text-sm mb-3">Warranty claims count, warranty cost, budget comparison</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      Pending mapping
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Sales Orders (Returns / Replacements)</h4>
                  <p className="text-sm text-muted-foreground mb-2">ZREK / ZRER / ZRRK / ZG2W exports (TBD)</p>
                  <p className="text-sm mb-3">Returns, FOC replacements, return-to-customer, credit note values</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      Pending mapping
                    </Badge>
                  </div>
                </div>
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
          onFiltersChange={(next) => setFilters({ ...next, selectedComplaintTypes: [], selectedNotificationTypes: [] })}
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
        monthlySiteKpis={kpis}
        selectedSites={filters.selectedPlants.length > 0 ? filters.selectedPlants : Array.from(new Set(kpis.map((k) => k.siteCode))).sort()}
        selectedMonths={Array.from(new Set(kpis.map(k => k.month))).sort()}
      />
    </div>
  );
}

