"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, FileText } from "lucide-react";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";

export function ComplaintsClient() {
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

  const complaintsByMonth = useMemo(() => {
    const byMonth = new Map<string, { Q1: number; Q2: number; Q3: number; total: number }>();
    
    filteredKpis.forEach((kpi) => {
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, { Q1: 0, Q2: 0, Q3: 0, total: 0 });
      }
      const monthData = byMonth.get(kpi.month)!;
      monthData.Q1 += kpi.customerComplaintsQ1;
      monthData.Q2 += kpi.supplierComplaintsQ2;
      monthData.Q3 += kpi.internalComplaintsQ3;
      monthData.total += kpi.customerComplaintsQ1 + kpi.supplierComplaintsQ2 + kpi.internalComplaintsQ3;
    });

    const months = Array.from(byMonth.keys()).sort();
    return months.map((month) => ({
      month,
      ...byMonth.get(month)!,
    }));
  }, [filteredKpis]);

  const totalComplaints = useMemo(() => {
    return filteredKpis.reduce((sum, kpi) => {
      return sum + kpi.customerComplaintsQ1 + kpi.supplierComplaintsQ2 + kpi.internalComplaintsQ3;
    }, 0);
  }, [filteredKpis]);

  if (monthlySiteKpis.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Number of Complaints (Q)</h2>
          <p className="text-muted-foreground">
            Track customer (Q1), supplier (Q2), and internal (Q3) complaints
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
        <h2 className="text-2xl font-bold tracking-tight">Number of Complaints (Q)</h2>
        <p className="text-muted-foreground">
          Track customer (Q1), supplier (Q2), and internal (Q3) complaints
        </p>
      </div>

      <FilterPanel filters={filters} onFiltersChange={setFilters} monthlySiteKpis={monthlySiteKpis} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalComplaints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Q1 + Q2 + Q3
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customer Complaints (Q1)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredKpis.reduce((sum, kpi) => sum + kpi.customerComplaintsQ1, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Supplier Complaints (Q2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredKpis.reduce((sum, kpi) => sum + kpi.supplierComplaintsQ2, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaints Trend</CardTitle>
          <CardDescription>Monthly breakdown of Q1, Q2, and Q3 complaints</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={complaintsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Q1" fill="#ef4444" name="Customer (Q1)" />
              <Bar dataKey="Q2" fill="#f59e0b" name="Supplier (Q2)" />
              <Bar dataKey="Q3" fill="#3b82f6" name="Internal (Q3)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complaints by Site and Month</CardTitle>
          <CardDescription>Detailed breakdown of complaints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Site Code</TableHead>
                  <TableHead>Site Name</TableHead>
                  <TableHead className="text-right">Q1 (Customer)</TableHead>
                  <TableHead className="text-right">Q2 (Supplier)</TableHead>
                  <TableHead className="text-right">Q3 (Internal)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKpis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No data matching the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKpis.map((kpi, index) => {
                    const total = kpi.customerComplaintsQ1 + kpi.supplierComplaintsQ2 + kpi.internalComplaintsQ3;
                    return (
                      <TableRow key={`${kpi.siteCode}-${kpi.month}-${index}`}>
                        <TableCell className="font-medium">{kpi.month}</TableCell>
                        <TableCell>{kpi.siteCode}</TableCell>
                        <TableCell>{kpi.siteName || "-"}</TableCell>
                        <TableCell className="text-right">{kpi.customerComplaintsQ1}</TableCell>
                        <TableCell className="text-right">{kpi.supplierComplaintsQ2}</TableCell>
                        <TableCell className="text-right">{kpi.internalComplaintsQ3}</TableCell>
                        <TableCell className="text-right font-semibold">{total}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

