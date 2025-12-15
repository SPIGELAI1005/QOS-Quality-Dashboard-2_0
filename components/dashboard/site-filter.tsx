"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SiteFilterProps {
  selectedSites: string[];
  onToggleSite: (site: string) => void;
  title?: string;
  availableSites?: string[];
}

export function SiteFilter({
  selectedSites,
  onToggleSite,
  title = "Filter Analysis",
  availableSites = [],
}: SiteFilterProps) {
  const toggleAll = () => {
    if (selectedSites.length === availableSites.length) {
      // Deselect all
      availableSites.forEach(site => {
        if (selectedSites.includes(site)) {
          onToggleSite(site);
        }
      });
    } else {
      // Select all
      availableSites.forEach(site => {
        if (!selectedSites.includes(site)) {
          onToggleSite(site);
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableSites.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="w-full"
          >
            {selectedSites.length === availableSites.length ? "Clear All" : "Select All"}
          </Button>
        )}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {availableSites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sites available
            </p>
          ) : (
            availableSites.map((site) => (
              <div key={site} className="flex items-center space-x-2">
                <Checkbox
                  id={site}
                  checked={selectedSites.includes(site)}
                  onCheckedChange={() => onToggleSite(site)}
                />
                <label
                  htmlFor={site}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  Site {site}
                </label>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

