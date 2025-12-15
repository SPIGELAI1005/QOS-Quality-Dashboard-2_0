"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import type { KpiFilters } from "@/lib/domain/types";

interface KpiFiltersProps {
  availableSites: string[];
  onFiltersChange: (filters: KpiFilters) => void;
}

export function KpiFilters({ availableSites, onFiltersChange }: KpiFiltersProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  useEffect(() => {
    // Set default dates (last 12 months)
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      onFiltersChange({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        sites: selectedSites,
      });
    }
  }, [startDate, endDate, selectedSites, onFiltersChange]);

  const toggleSite = (site: string) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
        <CardDescription>Select time range and sites to analyze</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sites</Label>
          <div className="flex flex-wrap gap-2">
            {availableSites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sites available. Upload data first.</p>
            ) : (
              availableSites.map((site) => (
                <Button
                  key={site}
                  variant={selectedSites.includes(site) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSite(site)}
                >
                  {site}
                </Button>
              ))
            )}
          </div>
          {selectedSites.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSites([])}
              className="mt-2"
            >
              Clear Selection
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

