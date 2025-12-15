"use client";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlySiteKpi } from "@/lib/domain/types";

interface PpmPerMonthChartProps {
  data: MonthlySiteKpi[];
  selectedSites: string[];
}

export function PpmPerMonthChart({ data, selectedSites }: PpmPerMonthChartProps) {
  // Filter data by selected sites
  const filteredData = selectedSites.length > 0
    ? data.filter((kpi) => selectedSites.includes(kpi.siteCode))
    : data;

  // Group by month and calculate average PPM (or sum if multiple sites)
  const monthlyData = filteredData.reduce((acc, kpi) => {
    if (!acc[kpi.month]) {
      acc[kpi.month] = {
        month: kpi.month,
        customerPpm: 0,
        supplierPpm: 0,
        customerCount: 0,
        supplierCount: 0,
      };
    }
    if (kpi.customerPpm !== null) {
      acc[kpi.month].customerPpm += kpi.customerPpm;
      acc[kpi.month].customerCount += 1;
    }
    if (kpi.supplierPpm !== null) {
      acc[kpi.month].supplierPpm += kpi.supplierPpm;
      acc[kpi.month].supplierCount += 1;
    }
    return acc;
  }, {} as Record<string, { month: string; customerPpm: number; supplierPpm: number; customerCount: number; supplierCount: number }>);

  const chartData = Object.values(monthlyData)
    .map((item) => ({
      month: item.month,
      customerPpm: item.customerCount > 0 ? item.customerPpm / item.customerCount : null,
      supplierPpm: item.supplierCount > 0 ? item.supplierPpm / item.supplierCount : null,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PPM per Month</CardTitle>
          <CardDescription>No data available for selected filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PPM per Month</CardTitle>
        <CardDescription>
          Parts Per Million for Customer (Q1) and Supplier (Q2) complaints
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "PPM",
                angle: -90,
                position: "insideLeft",
                style: { fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "calc(var(--radius) - 2px)",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              formatter={(value) => {
                if (value === null || value === undefined) return "N/A";
                const num = typeof value === "number" ? value : Number(value);
                if (Number.isNaN(num)) return String(value);
                return `${num.toFixed(2)} PPM`;
              }}
            />
            <Legend
              wrapperStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar
              dataKey="customerPpm"
              name="Customer PPM (Q1)"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="supplierPpm"
              name="Supplier PPM (Q2)"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

