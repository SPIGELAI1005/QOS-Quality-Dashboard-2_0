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

interface ComplaintsPerMonthChartProps {
  data: MonthlySiteKpi[];
  selectedSites: string[];
}

export function ComplaintsPerMonthChart({
  data,
  selectedSites,
}: ComplaintsPerMonthChartProps) {
  // Filter data by selected sites
  const filteredData = selectedSites.length > 0
    ? data.filter((kpi) => selectedSites.includes(kpi.siteCode))
    : data;

  // Group by month and aggregate complaints
  const monthlyData = filteredData.reduce((acc, kpi) => {
    if (!acc[kpi.month]) {
      acc[kpi.month] = {
        month: kpi.month,
        q1: 0,
        q2: 0,
        q3: 0,
      };
    }
    acc[kpi.month].q1 += kpi.customerComplaintsQ1;
    acc[kpi.month].q2 += kpi.supplierComplaintsQ2;
    acc[kpi.month].q3 += kpi.internalComplaintsQ3;
    return acc;
  }, {} as Record<string, { month: string; q1: number; q2: number; q3: number }>);

  const chartData = Object.values(monthlyData).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complaints per Month</CardTitle>
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
        <CardTitle>Complaints per Month</CardTitle>
        <CardDescription>
          Customer (Q1), Supplier (Q2), and Internal (Q3) complaints by month
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "calc(var(--radius) - 2px)",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
            />
            <Legend
              wrapperStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar
              dataKey="q1"
              name="Q1 (Customer)"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="q2"
              name="Q2 (Supplier)"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="q3"
              name="Q3 (Internal)"
              fill="hsl(var(--chart-3))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

