"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  primary: "border-primary/20 bg-primary/5",
  success: "border-green-500/20 bg-green-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  destructive: "border-red-500/20 bg-red-500/5",
};

const variantIconColors = {
  primary: "text-primary",
  success: "text-green-500",
  warning: "text-amber-500",
  destructive: "text-red-500",
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
}: MetricCardProps) {
  return (
    <Card className={cn("border-2", variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mb-1">
              {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
            </p>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className={cn("p-2 rounded-lg", variantIconColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

