"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { MonthlySiteKpi } from "@/lib/domain/types";

interface PlantData {
  code: string;
  name: string;
  erp?: string;
  city?: string;
  abbreviation?: string;
  country?: string;
  location?: string;
}

export interface FilterState {
  selectedPlants: string[];
  selectedComplaintTypes: string[]; // Customer, Supplier, Internal
  selectedNotificationTypes: string[]; // Q1, Q2, Q3, D1, D2, D3, P1, P2, P3
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface FilterPanelProps {
  monthlySiteKpis: MonthlySiteKpi[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showComplaintTypes?: boolean;
  showNotificationTypes?: boolean;
}

// Plant color mapping (for visual indicators)
// Colors assigned to plants for visual distinction in charts and filters
const PLANT_COLORS: Record<string, string> = {
  "101": "bg-cyan-500",
  "106": "bg-cyan-400",
  "111": "bg-indigo-500",
  "131": "bg-teal-500",
  "135": "bg-emerald-500",
  "145": "bg-green-500",
  "155": "bg-lime-500",
  "167": "bg-yellow-500",
  "175": "bg-blue-500",
  "180": "bg-sky-500",
  "195": "bg-cyan-500",
  "200": "bg-violet-500",
  "205": "bg-purple-500",
  "211": "bg-fuchsia-500",
  "215": "bg-pink-500",
  "230": "bg-rose-500",
  "235": "bg-orange-500",
  "410": "bg-red-500",
  "411": "bg-purple-500",
  "705": "bg-amber-500",
  "752": "bg-stone-500",
  "770": "bg-slate-500",
};

// Fallback color generator for plants not in the mapping
function getPlantColor(code: string): string {
  return PLANT_COLORS[code] || "bg-gray-500";
}

export function FilterPanel({
  monthlySiteKpis,
  filters,
  onFiltersChange,
  showComplaintTypes = true,
  showNotificationTypes = true,
}: FilterPanelProps) {
  const [plantsData, setPlantsData] = useState<PlantData[]>([]);
  const hasInitialized = useRef(false);

  // Load plants from API
  useEffect(() => {
    fetch('/api/plants')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.plants && Array.isArray(data.plants) && data.plants.length > 0) {
          console.log('Loaded plants from API:', data.plants.length);
          setPlantsData(data.plants);
        } else {
          console.warn('No plants data from API, using fallback');
        }
      })
      .catch((error) => {
        console.error('Error loading plants from API:', error);
        // Don't set empty array, let fallback handle it
      });
  }, []);

  // Get unique plants - prefer loaded plant data from "Webasto ET Plants.xlsx", fallback to KPI data
  const availablePlants = useMemo(() => {
    // If we have plant data from official Excel file, use it (shows ALL plants from file)
    if (plantsData.length > 0) {
      console.log('[Filter Panel] Using plants from official "Webasto ET Plants.xlsx" file:', plantsData.length, 'plants');
      console.log('[Filter Panel] Plant codes:', plantsData.map(p => p.code).join(', '));
      
      // Validate that KPI sites exist in official file
      const kpiSiteCodes = new Set(monthlySiteKpis.map(k => k.siteCode));
      const officialPlantCodes = new Set(plantsData.map(p => p.code));
      const missingInOfficial = Array.from(kpiSiteCodes).filter(code => !officialPlantCodes.has(code));
      if (missingInOfficial.length > 0) {
        console.warn('[Filter Panel] Warning: Some KPI site codes not found in official plants file:', missingInOfficial.join(', '));
      }
      
      return plantsData.sort((a, b) => {
        // Sort numerically if both are numbers, otherwise alphabetically
        const aNum = parseInt(a.code);
        const bNum = parseInt(b.code);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.code.localeCompare(b.code);
      });
    }

    // Fallback to KPI data if plants file not loaded
    const plantMap = new Map<string, PlantData>();
    monthlySiteKpis.forEach((kpi) => {
      if (!plantMap.has(kpi.siteCode)) {
        const abbreviation =
          typeof kpi.siteName === "string" && kpi.siteName.trim().length > 0
            ? kpi.siteName.trim().substring(0, 3).toUpperCase()
            : undefined;
        plantMap.set(kpi.siteCode, {
          code: kpi.siteCode,
          name: kpi.siteName || kpi.siteCode,
          location: kpi.siteName || undefined,
          abbreviation,
        });
      }
    });
    const fallbackPlants = Array.from(plantMap.values()).sort((a, b) => {
      const aNum = parseInt(a.code);
      const bNum = parseInt(b.code);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.code.localeCompare(b.code);
    });
    console.log('Using fallback plants from KPIs:', fallbackPlants.length, fallbackPlants.map(p => p.code).join(', '));
    return fallbackPlants;
  }, [monthlySiteKpis, plantsData]);

  // Auto-select SAP PS4 plants when availablePlants and plantsData are loaded and no plants are selected
  // Only runs if no plants are selected (either from localStorage or initial state)
  useEffect(() => {
    // Check if filters are already loaded from localStorage (has plants selected)
    const hasStoredFilters = filters.selectedPlants.length > 0;
    
    if (availablePlants.length > 0 && !hasStoredFilters && !hasInitialized.current) {
      // If plantsData is available, filter for SAP PS4 plants
      if (plantsData.length > 0) {
        const sapPS4Plants = availablePlants
          .filter((plant) => {
            const plantData = plantsData.find((p) => p.code === plant.code);
            if (!plantData?.erp) return false;
            const erp = plantData.erp.toUpperCase().trim();
            // Match: SAP PS4, PS4, SAP S4, S4, etc.
            return erp.includes('PS4') || erp.includes('S4') || erp.includes('SAP S4');
          })
          .map((p) => p.code);
        
        // If we found SAP PS4 plants, use them; otherwise fall back to all plants
        const plantsToSelect = sapPS4Plants.length > 0 ? sapPS4Plants : availablePlants.map((p) => p.code);
        onFiltersChange({ ...filters, selectedPlants: plantsToSelect });
        hasInitialized.current = true;
      } else {
        // If plantsData is not loaded yet, wait for it with a timeout
        const timeoutId = setTimeout(() => {
          if (!hasInitialized.current && availablePlants.length > 0 && filters.selectedPlants.length === 0) {
            if (plantsData.length > 0) {
              const sapPS4Plants = availablePlants
                .filter((plant) => {
                  const plantData = plantsData.find((p) => p.code === plant.code);
                  if (!plantData?.erp) return false;
                  const erp = plantData.erp.toUpperCase().trim();
                  return erp.includes('PS4') || erp.includes('S4') || erp.includes('SAP S4');
                })
                .map((p) => p.code);
              
              const plantsToSelect = sapPS4Plants.length > 0 ? sapPS4Plants : availablePlants.map((p) => p.code);
              onFiltersChange({ ...filters, selectedPlants: plantsToSelect });
            } else {
              // If still no plantsData, select all plants as fallback
              const allPlantCodes = availablePlants.map((p) => p.code);
              onFiltersChange({ ...filters, selectedPlants: allPlantCodes });
            }
            hasInitialized.current = true;
          }
        }, 1500); // Wait 1.5 seconds for plantsData to load
        
        return () => clearTimeout(timeoutId);
      }
    } else if (filters.selectedPlants.length > 0) {
      // If we have stored filters (from localStorage), mark as initialized to prevent overwriting
      hasInitialized.current = true;
    }
  }, [availablePlants.length, filters.selectedPlants.length, plantsData.length, filters, onFiltersChange]); // Trigger when plantsData loads

  const togglePlant = (plantCode: string) => {
    const newPlants = filters.selectedPlants.includes(plantCode)
      ? filters.selectedPlants.filter((p) => p !== plantCode)
      : [...filters.selectedPlants, plantCode];
    onFiltersChange({ ...filters, selectedPlants: newPlants });
  };

  const selectAllPlants = () => {
    onFiltersChange({ ...filters, selectedPlants: availablePlants.map((p) => p.code) });
  };

  const clearAllPlants = () => {
    onFiltersChange({ ...filters, selectedPlants: [] });
  };

  // Quick Access filter functions
  const filterBySapP01 = () => {
    const sapP01Plants = availablePlants
      .filter((plant) => {
        const plantData = plantsData.find((p) => p.code === plant.code);
        if (!plantData?.erp) return false;
        const erp = plantData.erp.toUpperCase().trim();
        // Match: SAP P01, P01, SAP P01 Sites, etc.
        return erp.includes('P01') && !erp.includes('PS4') && !erp.includes('S4');
      })
      .map((p) => p.code);
    onFiltersChange({ ...filters, selectedPlants: sapP01Plants });
  };

  const filterBySapPS4 = () => {
    const sapPS4Plants = availablePlants
      .filter((plant) => {
        const plantData = plantsData.find((p) => p.code === plant.code);
        if (!plantData?.erp) return false;
        const erp = plantData.erp.toUpperCase().trim();
        // Match: SAP PS4, PS4, SAP S4, S4, etc.
        return erp.includes('PS4') || erp.includes('S4') || erp.includes('SAP S4');
      })
      .map((p) => p.code);
    onFiltersChange({ ...filters, selectedPlants: sapPS4Plants });
  };

  const filterByAX = () => {
    const axPlants = availablePlants
      .filter((plant) => {
        const plantData = plantsData.find((p) => p.code === plant.code);
        if (!plantData?.erp) return false;
        const erp = plantData.erp.toUpperCase().trim();
        // Match: AX, Dynamics AX, Microsoft AX, etc.
        return (erp === 'AX' || erp.includes('AX')) && !erp.includes('P01') && !erp.includes('PS4') && !erp.includes('S4');
      })
      .map((p) => p.code);
    onFiltersChange({ ...filters, selectedPlants: axPlants });
  };

  const filterByAutomotive = () => {
    // Automotive Sites: only plant 101
    const automotivePlants = availablePlants
      .filter((plant) => plant.code === '101')
      .map((p) => p.code);
    onFiltersChange({ ...filters, selectedPlants: automotivePlants });
  };

  const filterByAftermarket = () => {
    // Aftermarket Sites: all plants except 101
    const aftermarketPlants = availablePlants
      .filter((plant) => plant.code !== '101')
      .map((p) => p.code);
    onFiltersChange({ ...filters, selectedPlants: aftermarketPlants });
  };

  const toggleComplaintType = (type: string) => {
    const newTypes = filters.selectedComplaintTypes.includes(type)
      ? filters.selectedComplaintTypes.filter((t) => t !== type)
      : [...filters.selectedComplaintTypes, type];
    onFiltersChange({ ...filters, selectedComplaintTypes: newTypes });
  };

  const toggleNotificationType = (type: string) => {
    const newTypes = filters.selectedNotificationTypes.includes(type)
      ? filters.selectedNotificationTypes.filter((t) => t !== type)
      : [...filters.selectedNotificationTypes, type];
    onFiltersChange({ ...filters, selectedNotificationTypes: newTypes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      selectedPlants: [],
      selectedComplaintTypes: [],
      selectedNotificationTypes: [],
      dateFrom: null,
      dateTo: null,
    });
  };

  return (
    <div className="w-80 space-y-4">
      {/* PLANT Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            PLANT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Select All / Clear Selection Button - At the top */}
          {availablePlants.length > 0 && (
            <Button
              variant={filters.selectedPlants.length === availablePlants.length ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={filters.selectedPlants.length === availablePlants.length ? clearAllPlants : selectAllPlants}
            >
              <div className={cn(
                "h-3 w-3 rounded-full border-2 mr-2",
                filters.selectedPlants.length === availablePlants.length
                  ? "bg-primary border-primary" 
                  : "border-muted-foreground"
              )} />
              {filters.selectedPlants.length === availablePlants.length ? "Clear Selection" : "Select All"}
            </Button>
          )}

          {/* Plant List - Two Columns */}
          {availablePlants.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No plants available. {monthlySiteKpis.length === 0 ? "Upload data first." : "Loading plants..."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availablePlants.map((plant) => {
                const isSelected = filters.selectedPlants.includes(plant.code);
                const color = getPlantColor(plant.code);
                const plantData = plantsData.find((p) => p.code === plant.code) || plant;
                
                return (
                  <Button
                    key={plant.code}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start text-xs py-1.5 px-2"
                    onClick={() => togglePlant(plant.code)}
                  >
                    <div className={cn(
                      "h-3 w-3 rounded-full mr-1.5 flex-shrink-0",
                      isSelected ? color : "border-2 border-muted-foreground"
                    )} />
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <span className="font-medium">{plant.code}</span>
                      {plantData.abbreviation && (
                        <span className="opacity-70 font-normal">{plantData.abbreviation}</span>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QUICK ACCESS Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            QUICK ACCESS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Access Filter Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={filterBySapP01}
            >
              <span className="mr-2">📊</span>
              SAP P01 Sites
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={filterBySapPS4}
            >
              <span className="mr-2">📊</span>
              SAP PS4 Sites
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={filterByAX}
            >
              <span className="mr-2">📊</span>
              AX Sites
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={filterByAutomotive}
            >
              <span className="mr-2">🚗</span>
              Automotive Sites
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={filterByAftermarket}
            >
              <span className="mr-2">📦</span>
              Aftermarket Sites
            </Button>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Individual Plants</p>
          </div>

          {availablePlants.map((plant) => {
            const color = getPlantColor(plant.code);
            const plantData = plantsData.find((p) => p.code === plant.code) || plant;
            return (
              <div
                key={plant.code}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => togglePlant(plant.code)}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white",
                  color
                )}>
                  {plant.code}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {plantData.name || plant.name || `Plant ${plant.code}`}
                    {plantData.abbreviation && ` (${plantData.abbreviation})`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plantData.location || plantData.city || plantData.country || plant.location || "No location data"}
                    {plantData.erp && ` • ERP: ${plantData.erp}`}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Complaint Types Section */}
      {showComplaintTypes && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Complaint Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Customer", "Supplier", "Internal"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`complaint-${type}`}
                  checked={filters.selectedComplaintTypes.includes(type)}
                  onCheckedChange={() => toggleComplaintType(type)}
                />
                <Label
                  htmlFor={`complaint-${type}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {type}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notification Types Section */}
      {showNotificationTypes && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Notification Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Customer Complaints</p>
            <div className="space-y-2 pl-4">
              {["Q1"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`notif-${type}`}
                    checked={filters.selectedNotificationTypes.includes(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                  <Label htmlFor={`notif-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Supplier Complaints</p>
            <div className="space-y-2 pl-4">
              {["Q2"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`notif-${type}`}
                    checked={filters.selectedNotificationTypes.includes(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                  <Label htmlFor={`notif-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Internal Complaints</p>
            <div className="space-y-2 pl-4">
              {["Q3"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`notif-${type}`}
                    checked={filters.selectedNotificationTypes.includes(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                  <Label htmlFor={`notif-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Deviations</p>
            <div className="space-y-2 pl-4">
              {["D1", "D2", "D3"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`notif-${type}`}
                    checked={filters.selectedNotificationTypes.includes(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                  <Label htmlFor={`notif-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">PPAP</p>
            <div className="space-y-2 pl-4">
              {["P1", "P2", "P3"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`notif-${type}`}
                    checked={filters.selectedNotificationTypes.includes(type)}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                  <Label htmlFor={`notif-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Date Range Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="date-from" className="text-xs">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-from"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? (
                    format(filters.dateFrom, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom || undefined}
                  onSelect={(date: Date | undefined) =>
                    onFiltersChange({ ...filters, dateFrom: date || null })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {filters.dateFrom && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onFiltersChange({ ...filters, dateFrom: null })}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-to" className="text-xs">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-to"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? (
                    format(filters.dateTo, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo || undefined}
                  onSelect={(date: Date | undefined) =>
                    onFiltersChange({ ...filters, dateTo: date || null })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {filters.dateTo && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onFiltersChange({ ...filters, dateTo: null })}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clear All Filters Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={clearAllFilters}
      >
        Clear All Filters
      </Button>
    </div>
  );
}

