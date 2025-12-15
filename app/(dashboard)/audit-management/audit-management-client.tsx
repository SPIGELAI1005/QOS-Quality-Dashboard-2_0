"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Info } from "lucide-react";

export function AuditManagementClient() {
  const [monthlySiteKpis, setMonthlySiteKpis] = useState<MonthlySiteKpi[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    selectedPlants: [],
    selectedComplaintTypes: [],
    selectedNotificationTypes: [],
    dateFrom: null,
    dateTo: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedKpis = localStorage.getItem("qos-et-kpis");
    if (!storedKpis) return;
    try {
      const parsed = JSON.parse(storedKpis) as MonthlySiteKpi[];
      setMonthlySiteKpis(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("[Audit Management] Failed to parse stored KPIs:", e);
    }
  }, []);

  const monthNames = useMemo(
    () => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    []
  );

  const availableMonthsYears = useMemo(() => {
    const monthYearSet = new Set<string>();
    monthlySiteKpis.forEach((k) => monthYearSet.add(k.month));
    const sorted = Array.from(monthYearSet).sort();
    const years = new Set<number>();
    sorted.forEach((monthStr) => {
      const [y] = monthStr.split("-").map(Number);
      if (y) years.add(y);
    });
    return {
      years: Array.from(years).sort((a, b) => b - a),
      lastMonthYear: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    };
  }, [monthlySiteKpis]);

  useEffect(() => {
    if (selectedMonth !== null && selectedYear !== null) return;
    if (availableMonthsYears.lastMonthYear) {
      const [y, m] = availableMonthsYears.lastMonthYear.split("-").map(Number);
      setSelectedYear(y);
      setSelectedMonth(m);
      return;
    }
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  }, [availableMonthsYears.lastMonthYear, selectedMonth, selectedYear]);

  const lookbackPeriod = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      const start = new Date(end);
      start.setMonth(start.getMonth() - 11);
      return { startMonthStr: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, endMonthStr: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}` };
    }
    const end = new Date(selectedYear, selectedMonth - 1, 1);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 11);
    return { startMonthStr: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, endMonthStr: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}` };
  }, [selectedMonth, selectedYear]);

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">Audit Management YTD //</h1>
            {selectedMonth !== null && selectedYear !== null && (
              <div className="flex items-center gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Month" />
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
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Year" />
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
          <p className="text-muted-foreground mt-2">Internal Performance • Audit Management</p>
          {selectedMonth !== null && selectedYear !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing 12-month lookback from {monthNames[selectedMonth - 1]} {selectedYear} ({lookbackPeriod.startMonthStr} to {lookbackPeriod.endMonthStr})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">YTD Audit Metrics</h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-stretch">
            <div className="space-y-4">
              <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardContent className="p-6 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audits</p>
                  <div className="text-3xl font-bold mt-1">—</div>
                  <p className="text-xs text-muted-foreground mt-1">Planned / Executed audits</p>
                  <p className="text-xs text-muted-foreground mt-auto">Data Source Missing (Under Construction)</p>
                </CardContent>
              </Card>

              <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardContent className="p-6 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Findings</p>
                  <div className="text-3xl font-bold mt-1">—</div>
                  <p className="text-xs text-muted-foreground mt-1">Open / Closed findings</p>
                  <p className="text-xs text-muted-foreground mt-auto">Data Source Missing (Under Construction)</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col" style={{ height: "100%" }}>
              <Card
                className="glass-card-glow min-h-0 overflow-hidden flex flex-col"
                style={{ borderColor: "#9E9E9E", borderWidth: "2px", height: "100%" }}
              >
                <CardContent className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Summary</p>
                  <div className="flex-1 flex items-center justify-center text-center min-h-0">
                    <p className="text-sm font-semibold" style={{ color: "#FF8A00" }}>
                      Data Source Missing (Under Construction)
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-auto">Will interpret audit KPIs once connected</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="glass-card-glow chart-container">
            <CardHeader>
              <CardTitle>YTD Audits by Month and Plant</CardTitle>
              <CardDescription>Placeholder until audit data source is connected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-center">
                <p className="text-sm font-semibold" style={{ color: "#FF8A00" }}>
                  Data Source Missing (Under Construction)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-glow chart-container">
            <CardHeader>
              <CardTitle>YTD Audit Findings Closed vs. Open by Month and Plant</CardTitle>
              <CardDescription>Placeholder until audit data source is connected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-center">
                <p className="text-sm font-semibold" style={{ color: "#FF8A00" }}>
                  Data Source Missing (Under Construction)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card-glow chart-container">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Data Source Reference</CardTitle>
            </div>
            <CardDescription className="mt-2">Audit KPIs are not connected yet. This section will list the official data sources once available.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Audit Data Source</h4>
                  <p className="text-sm text-muted-foreground mb-2">TBD</p>
                  <p className="text-sm mb-3">Audit plans, execution, findings, and actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Under Construction
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-80 flex-shrink-0">
        <FilterPanel
          monthlySiteKpis={monthlySiteKpis}
          filters={filters}
          onFiltersChange={setFilters}
          showComplaintTypes={false}
          showNotificationTypes={false}
        />
      </div>
    </div>
  );
}

