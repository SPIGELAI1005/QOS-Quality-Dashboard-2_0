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
import { CalendarIcon, PanelRightClose, PanelRightOpen, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface PlantData {
  code: string;
  name: string;
  erp?: string;
  city?: string;
  abbreviation?: string;
  abbreviationCity?: string;
  abbreviationCountry?: string;
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
  const { t } = useTranslation();
  const [plantsData, setPlantsData] = useState<PlantData[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("qos-et-filters-collapsed");
    setIsCollapsed(stored === "1");
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("qos-et-filters-collapsed", next ? "1" : "0");
      // Force chart/layout re-measure (e.g. Recharts) when filter panel width changes
      setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
      return next;
    });
  };

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

  // Get unique plants - merge plants from "Webasto ET Plants.xlsx" with any additional plants from KPI data
  const availablePlants = useMemo(() => {
    const plantMap = new Map<string, PlantData>();
    
    // First, add all plants from official Excel file (authoritative source)
    if (plantsData.length > 0) {
      plantsData.forEach((plant) => {
        plantMap.set(plant.code, plant);
      });
      console.log('[Filter Panel] Loaded plants from official "Webasto ET Plants.xlsx" file:', plantsData.length, 'plants');
    }
    
    // Then, add any plants from KPI data that are NOT in the official file
    monthlySiteKpis.forEach((kpi) => {
      if (!plantMap.has(kpi.siteCode)) {
        // This plant exists in KPI data but not in official file - add it
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
        console.log(`[Filter Panel] Added plant ${kpi.siteCode} from KPI data (not in official file)`);
      }
    });
    
    // Sort all plants
    const allPlants = Array.from(plantMap.values()).sort((a, b) => {
      // Sort numerically if both are numbers, otherwise alphabetically
      const aNum = parseInt(a.code);
      const bNum = parseInt(b.code);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.code.localeCompare(b.code);
    });
    
    console.log('[Filter Panel] Total available plants:', allPlants.length);
    console.log('[Filter Panel] Plant codes:', allPlants.map(p => p.code).join(', '));
    
    return allPlants;
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
    // Multi-select behavior:
    // - If no explicit selection is applied (empty list => "all plants"), start a manual selection with this plant.
    // - Otherwise toggle the plant in/out of the selection.
    if (filters.selectedPlants.length === 0) {
      onFiltersChange({ ...filters, selectedPlants: [plantCode] });
      return;
    }

    const nextSelected = filters.selectedPlants.includes(plantCode)
      ? filters.selectedPlants.filter((p) => p !== plantCode)
      : [...filters.selectedPlants, plantCode];

    onFiltersChange({ ...filters, selectedPlants: nextSelected });
  };

  const selectAllPlants = () => {
    onFiltersChange({ ...filters, selectedPlants: availablePlants.map((p) => p.code) });
  };

  const clearAllPlants = () => {
    onFiltersChange({ ...filters, selectedPlants: [] });
  };

  // Quick Access filter functions
  // These override any previous individual plant selections
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
    // Override previous selections with Quick Access selection
    onFiltersChange({ ...filters, selectedPlants: sapP01Plants });
  };

  const filterBySapPS4 = () => {
    // Use getSapPS4PlantCodes to get ALL PS4 plants from Excel file (authoritative source)
    // This ensures all PS4 plants are shown, even if they don't have KPI data
    const sapPS4Plants = getSapPS4PlantCodes.length > 0
      ? getSapPS4PlantCodes
      : availablePlants
          .filter((plant) => {
            // Fallback: if Excel file not loaded, try to find ERP info from available plant data
            const plantData = plantsData.find((p) => p.code === plant.code) || plant;
            if (!plantData?.erp) return false;
            const erp = plantData.erp.toUpperCase().trim();
            return erp.includes('PS4') || erp.includes('S4') || erp.includes('SAP S4');
          })
          .map((p) => p.code);
    // Override previous selections with Quick Access selection
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
    // Override previous selections with Quick Access selection
    onFiltersChange({ ...filters, selectedPlants: axPlants });
  };

  const filterByAutomotive = () => {
    // Automotive Sites: only plant 101
    const automotivePlants = availablePlants
      .filter((plant) => plant.code === '101')
      .map((p) => p.code);
    // Override previous selections with Quick Access selection
    onFiltersChange({ ...filters, selectedPlants: automotivePlants });
  };

  const filterByAftermarket = () => {
    // Aftermarket Sites: all plants except 101
    const aftermarketPlants = availablePlants
      .filter((plant) => plant.code !== '101')
      .map((p) => p.code);
    // Override previous selections with Quick Access selection
    onFiltersChange({ ...filters, selectedPlants: aftermarketPlants });
  };

  // Helper functions to check if a quick access filter is active
  const getSapPS4PlantCodes = useMemo(() => {
    if (plantsData.length === 0) return [];
    return plantsData
      .filter((plant) => {
        if (!plant.erp) return false;
        const erp = plant.erp.toUpperCase().trim();
        return erp.includes('PS4') || erp.includes('S4') || erp.includes('SAP S4');
      })
      .map((p) => p.code);
  }, [plantsData]);

  const getSapP01PlantCodes = useMemo(() => {
    if (plantsData.length === 0) return [];
    return plantsData
      .filter((plant) => {
        if (!plant.erp) return false;
        const erp = plant.erp.toUpperCase().trim();
        return erp.includes('P01') && !erp.includes('PS4') && !erp.includes('S4');
      })
      .map((p) => p.code);
  }, [plantsData]);

  const getAXPlantCodes = useMemo(() => {
    if (plantsData.length === 0) return [];
    return plantsData
      .filter((plant) => {
        if (!plant.erp) return false;
        const erp = plant.erp.toUpperCase().trim();
        return (erp === 'AX' || erp.includes('AX')) && !erp.includes('P01') && !erp.includes('PS4') && !erp.includes('S4');
      })
      .map((p) => p.code);
  }, [plantsData]);

  const isSapPS4Active = useMemo(() => {
    if (filters.selectedPlants.length === 0 || getSapPS4PlantCodes.length === 0) return false;
    if (filters.selectedPlants.length !== getSapPS4PlantCodes.length) return false;
    return getSapPS4PlantCodes.every(code => filters.selectedPlants.includes(code)) &&
           filters.selectedPlants.every(code => getSapPS4PlantCodes.includes(code));
  }, [filters.selectedPlants, getSapPS4PlantCodes]);

  const isSapP01Active = useMemo(() => {
    if (filters.selectedPlants.length === 0 || getSapP01PlantCodes.length === 0) return false;
    if (filters.selectedPlants.length !== getSapP01PlantCodes.length) return false;
    return getSapP01PlantCodes.every(code => filters.selectedPlants.includes(code)) &&
           filters.selectedPlants.every(code => getSapP01PlantCodes.includes(code));
  }, [filters.selectedPlants, getSapP01PlantCodes]);

  const isAXActive = useMemo(() => {
    if (filters.selectedPlants.length === 0 || getAXPlantCodes.length === 0) return false;
    if (filters.selectedPlants.length !== getAXPlantCodes.length) return false;
    return getAXPlantCodes.every(code => filters.selectedPlants.includes(code)) &&
           filters.selectedPlants.every(code => getAXPlantCodes.includes(code));
  }, [filters.selectedPlants, getAXPlantCodes]);

  const isAutomotiveActive = useMemo(() => {
    return filters.selectedPlants.length === 1 && filters.selectedPlants[0] === '101';
  }, [filters.selectedPlants]);

  const isAftermarketActive = useMemo(() => {
    if (filters.selectedPlants.length === 0 || availablePlants.length === 0) return false;
    const aftermarketCodes = availablePlants.filter(p => p.code !== '101').map(p => p.code);
    if (filters.selectedPlants.length !== aftermarketCodes.length) return false;
    return aftermarketCodes.every(code => filters.selectedPlants.includes(code)) &&
           filters.selectedPlants.every(code => aftermarketCodes.includes(code));
  }, [filters.selectedPlants, availablePlants]);

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
    <div
      className={cn(
        "flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-full sm:w-80"
      )}
    >
      <div className={cn("flex items-center justify-between", isCollapsed ? "justify-center" : "mb-4")}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            {t.common.filter}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size={isCollapsed ? "icon" : "sm"}
          className={cn(isCollapsed ? "h-10 w-10" : "h-9")}
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Show filters" : "Hide filters"}
          title={isCollapsed ? "Show filters" : "Hide filters"}
        >
          {isCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
          {!isCollapsed && <span>{t.common.close}</span>}
        </Button>
      </div>

      <div
        className={cn(
          "space-y-4 transition-all duration-300 ease-in-out",
          isCollapsed ? "opacity-0 -translate-x-2 pointer-events-none" : "opacity-100 translate-x-0"
        )}
        aria-hidden={isCollapsed}
        inert={isCollapsed ? true : undefined}
      >
      {/* PLANT Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t.filterPanel.plant}
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
                  <div
                    className={cn(
                "h-3 w-3 rounded-full border-2 mr-2",
                filters.selectedPlants.length === availablePlants.length
                  ? "bg-primary border-primary" 
                  : "border-muted-foreground"
                    )}
                  />
              {filters.selectedPlants.length === availablePlants.length ? t.common.clearSelection : t.common.selectAll}
            </Button>
          )}

          {/* Plant List - Two Columns */}
          {availablePlants.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t.filterPanel.noPlantsAvailable} {monthlySiteKpis.length === 0 ? t.filterPanel.uploadDataFirst : t.common.loading}
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
                    className={cn(
                      "w-full justify-start text-xs py-1.5 px-2",
                      isSelected && "dark:!text-black dark:hover:!text-black"
                    )}
                    onClick={() => togglePlant(plant.code)}
                  >
                        <div
                          className={cn(
                      "h-3 w-3 rounded-full mr-1.5 flex-shrink-0",
                      isSelected ? color : "border-2 border-muted-foreground"
                          )}
                        />
                    <span className={cn(
                      "flex items-center gap-1 whitespace-nowrap",
                      isSelected ? "text-black dark:text-black" : "text-black dark:text-foreground"
                    )}>
                      <span className="font-medium">{plant.code}</span>
                      {(() => {
                        // Combine city and country abbreviations with comma (e.g., "NBB, DE")
                        const abbrevParts: string[] = [];
                        if (plantData.abbreviationCity) abbrevParts.push(plantData.abbreviationCity);
                        if (plantData.abbreviationCountry) abbrevParts.push(plantData.abbreviationCountry);
                        const combinedAbbrev = abbrevParts.length > 0 ? abbrevParts.join(', ') : plantData.abbreviation;
                        return combinedAbbrev ? (
                          <span className="opacity-70 font-normal">{combinedAbbrev}</span>
                        ) : null;
                      })()}
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
            {t.filterPanel.quickAccess}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Access Filter Buttons */}
          <div className="space-y-2">
            <Button
              variant={isSapP01Active ? "default" : "outline"}
              size="sm"
              className={cn(
                "w-full justify-start text-xs",
                isSapP01Active && "dark:!text-black"
              )}
              onClick={filterBySapP01}
            >
              <span className="mr-2">📊</span>
              {t.filterPanel.sapP01Sites}
            </Button>
            <Button
              variant={isSapPS4Active ? "default" : "outline"}
              size="sm"
              className={cn(
                "w-full justify-start text-xs",
                isSapPS4Active && "dark:!text-black"
              )}
              onClick={filterBySapPS4}
            >
              <span className="mr-2">📊</span>
              {t.filterPanel.sapPS4Sites}
            </Button>
            <Button
              variant={isAXActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "w-full justify-start text-xs",
                isAXActive && "dark:!text-black"
              )}
              onClick={filterByAX}
            >
              <span className="mr-2">📊</span>
              {t.filterPanel.axSites}
            </Button>
            <Button
              variant={isAutomotiveActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "w-full justify-start text-xs",
                isAutomotiveActive && "dark:!text-black"
              )}
              onClick={filterByAutomotive}
            >
              <span className="mr-2">🚗</span>
              {t.filterPanel.automotiveSites}
            </Button>
            <Button
              variant={isAftermarketActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "w-full justify-start text-xs",
                isAftermarketActive && "dark:!text-black"
              )}
              onClick={filterByAftermarket}
            >
              <span className="mr-2">📦</span>
              {t.filterPanel.aftermarketSites}
            </Button>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">{t.filterPanel.individualPlants}</p>
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
                    <div
                      className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white",
                  color
                      )}
                    >
                  {plant.code}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {plantData.name || plant.name || `Plant ${plant.code}`}
                    {plantData.abbreviation && ` (${plantData.abbreviation})`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                        {plantData.location ||
                          plantData.city ||
                          plantData.country ||
                          plant.location ||
                          "No location data"}
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
              {t.filterPanel.complaintTypes}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "Customer", label: t.filterPanel.customer },
              { key: "Supplier", label: t.filterPanel.supplier },
              { key: "Internal", label: t.filterPanel.internal }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`complaint-${key}`}
                  checked={filters.selectedComplaintTypes.includes(key)}
                  onCheckedChange={() => toggleComplaintType(key)}
                />
                    <Label htmlFor={`complaint-${key}`} className="text-sm font-medium cursor-pointer">
                  {label}
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
              {t.filterPanel.notificationTypes}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t.filterPanel.customerComplaints}</p>
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
            <p className="text-xs text-muted-foreground mb-2">{t.filterPanel.supplierComplaints}</p>
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
            <p className="text-xs text-muted-foreground mb-2">{t.filterPanel.internalComplaints}</p>
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
            <p className="text-xs text-muted-foreground mb-2">{t.filterPanel.deviations}</p>
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
            <p className="text-xs text-muted-foreground mb-2">{t.filterPanel.ppap}</p>
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
            {t.filterPanel.dateRange}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
                <Label htmlFor="date-from" className="text-xs">
                  {t.filterPanel.fromDate}
                </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-from"
                  variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !filters.dateFrom && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : <span>{t.filterPanel.pickDate}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom || undefined}
                      onSelect={(date: Date | undefined) => onFiltersChange({ ...filters, dateFrom: date || null })}
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
                {t.common.clear}
              </Button>
            )}
          </div>

          <div className="space-y-2">
                <Label htmlFor="date-to" className="text-xs">
                  {t.filterPanel.toDate}
                </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-to"
                  variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !filters.dateTo && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : <span>{t.filterPanel.pickDate}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo || undefined}
                      onSelect={(date: Date | undefined) => onFiltersChange({ ...filters, dateTo: date || null })}
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
                {t.common.clear}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clear All Filters Button */}
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>
        {t.filterPanel.clearAllFilters}
      </Button>
      </div>
    </div>
  );
}

