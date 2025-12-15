"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, FileText } from "lucide-react";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";

export function PPMClient() {
  const [monthlySiteKpis, setMonthlySiteKpis] = useState<MonthlySiteKpi[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    selectedPlants: [],
    selectedComplaintTypes: [],
    selectedNotificationTypes: [],
    dateFrom: null,
    dateTo: null,
  });

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

  const filteredKpis = useMemo(() => {
    let filtered = monthlySiteKpis;

    if (filters.selectedPlants.length > 0) {
      filtered = filtered.filter(kpi => filters.selectedPlants.includes(kpi.siteCode));
    }

    return filtered;
  }, [monthlySiteKpis, filters]);

  const ppmBySiteMonth = useMemo(() => {
    const bySiteMonth = new Map<string, { month: string; siteCode: string; siteName: string; customerPpm: number; supplierPpm: number }>();
    
    filteredKpis.forEach((kpi) => {
      const key = `${kpi.siteCode}-${kpi.month}`;
      bySiteMonth.set(key, {
        month: kpi.month,
        siteCode: kpi.siteCode,
        siteName: kpi.siteName || kpi.siteCode,
        customerPpm: kpi.customerPpm || 0,
        supplierPpm: kpi.supplierPpm || 0,
      });
    });

    return Array.from(bySiteMonth.values()).sort((a, b) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      return a.siteCode.localeCompare(b.siteCode);
    });
  }, [filteredKpis]);

  const uniqueSites = useMemo(() => {
    return Array.from(new Set(filteredKpis.map(kpi => kpi.siteCode))).sort();
  }, [filteredKpis]);

  const chartData = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    
    filteredKpis.forEach((kpi) => {
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, {});
      }
      const monthData = byMonth.get(kpi.month)!;
      if (kpi.customerPpm !== null) {
        monthData[`${kpi.siteCode}_customer`] = kpi.customerPpm;
      }
      if (kpi.supplierPpm !== null) {
        monthData[`${kpi.siteCode}_supplier`] = kpi.supplierPpm;
      }
    });

    const months = Array.from(byMonth.keys()).sort();
    return months.map(month => ({
      month,
      ...byMonth.get(month)!,
    }));
  }, [filteredKpis]);

  if (monthlySiteKpis.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PPM / ET Site</h2>
          <p className="text-muted-foreground">
            Parts Per Million metrics by site
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No data available. Please upload data from the Upload Data page first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">PPM / ET Site</h2>
        <p className="text-muted-foreground">
          Parts Per Million metrics by site
        </p>
      </div>

      <FilterPanel filters={filters} onFiltersChange={setFilters} monthlySiteKpis={monthlySiteKpis} />

      <Card>
        <CardHeader>
          <CardTitle>PPM Trend by Site</CardTitle>
          <CardDescription>Customer and Supplier PPM trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {uniqueSites.map((site, index) => (
                <Line
                  key={`${site}_customer`}
                  type="monotone"
                  dataKey={`${site}_customer`}
                  stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                  name={`${site} Customer`}
                  strokeWidth={2}
                />
              ))}
              {uniqueSites.map((site, index) => (
                <Line
                  key={`${site}_supplier`}
                  type="monotone"
                  dataKey={`${site}_supplier`}
                  stroke={`hsl(${(index * 60) % 360}, 70%, 30%)`}
                  name={`${site} Supplier`}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PPM by Site and Month</CardTitle>
          <CardDescription>Detailed breakdown of PPM metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Site Code</TableHead>
                  <TableHead>Site Name</TableHead>
                  <TableHead className="text-right">Customer PPM</TableHead>
                  <TableHead className="text-right">Supplier PPM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ppmBySiteMonth.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No data matching the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  ppmBySiteMonth.map((item, index) => (
                    <TableRow key={`${item.siteCode}-${item.month}-${index}`}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>{item.siteCode}</TableCell>
                      <TableCell>{item.siteName}</TableCell>
                      <TableCell className="text-right">
                        {item.customerPpm > 0 ? item.customerPpm.toFixed(2) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.supplierPpm > 0 ? item.supplierPpm.toFixed(2) : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

