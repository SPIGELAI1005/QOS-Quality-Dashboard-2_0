"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";
import { AIInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { useTranslation } from "@/lib/i18n/useTranslation";


interface PlantData {
  code: string;
  name: string;
  erp?: string;
  city?: string;
  abbreviation?: string;
  country?: string;
  location?: string;
}

interface AISummaryClientProps {
  monthlySiteKpis?: MonthlySiteKpi[];
  globalPpm?: { customerPpm: number | null; supplierPpm: number | null };
}

export function AISummaryClient({ monthlySiteKpis: propsKpis = [], globalPpm: propsPpm }: AISummaryClientProps) {
  const { t } = useTranslation();
  const [monthlySiteKpis, setMonthlySiteKpis] = useState<MonthlySiteKpi[]>(propsKpis);
  const [globalPpm, setGlobalPpm] = useState<{ customerPpm: number | null; supplierPpm: number | null } | null>(propsPpm || null);
  const [loading, setLoading] = useState(propsKpis.length === 0);
  const [plantsData, setPlantsData] = useState<PlantData[]>([]);
  
  // Filter state - same as dashboard
  const [filters, setFilters] = useState<FilterState>({
    selectedPlants: [],
    selectedComplaintTypes: [],
    selectedNotificationTypes: [],
    dateFrom: null,
    dateTo: null,
  });

  // Load plants data from API (official "Webasto ET Plants.xlsx" file)
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
          console.log('[AI Summary] Loaded plants from official file:', data.plants.length);
          setPlantsData(data.plants);
        }
      })
      .catch((error) => {
        console.error('[AI Summary] Error loading plants from API:', error);
      });
  }, []);

  // Fallback: only if server-provided KPIs are missing (e.g., during dev experimentation)
  useEffect(() => {
    if (propsKpis.length > 0) {
      setLoading(false);
      return;
    }

    if (typeof window === "undefined") return;
    const storedKpis = localStorage.getItem("qos-et-kpis");
    const storedPpm = localStorage.getItem("qos-et-global-ppm");

    if (storedKpis) {
      try {
        const parsed = JSON.parse(storedKpis);
        setMonthlySiteKpis(parsed);
      } catch (e) {
        console.error("Failed to parse stored KPIs:", e);
      }
    }

    if (storedPpm) {
      try {
        const parsed = JSON.parse(storedPpm);
        setGlobalPpm(parsed);
      } catch (e) {
        console.error("Failed to parse stored PPM:", e);
      }
    }

    setLoading(false);
  }, [propsKpis.length]);

  // Filter KPIs using the same logic as dashboard
  const filteredKpis = useMemo(() => {
    let result = [...monthlySiteKpis];

    // Filter by selected plants
    if (filters.selectedPlants.length > 0) {
      result = result.filter((kpi) => filters.selectedPlants.includes(kpi.siteCode));
    }

    // Filter by complaint types (Customer, Supplier, Internal)
    if (filters.selectedComplaintTypes.length > 0) {
      result = result.map((kpi) => {
        const filteredKpi = { ...kpi };
        
        if (!filters.selectedComplaintTypes.includes('Customer')) {
          filteredKpi.customerComplaintsQ1 = 0;
          filteredKpi.customerDefectiveParts = 0;
        }
        if (!filters.selectedComplaintTypes.includes('Supplier')) {
          filteredKpi.supplierComplaintsQ2 = 0;
          filteredKpi.supplierDefectiveParts = 0;
        }
        if (!filters.selectedComplaintTypes.includes('Internal')) {
          filteredKpi.internalComplaintsQ3 = 0;
        }
        
        return filteredKpi;
      });
    }

    // Filter by notification types (Q1, Q2, Q3, D1, D2, D3, P1, P2, P3)
    if (filters.selectedNotificationTypes.length > 0) {
      result = result.map((kpi) => {
        const filteredKpi = { ...kpi };
        
        if (!filters.selectedNotificationTypes.includes('Q1')) {
          filteredKpi.customerComplaintsQ1 = 0;
          filteredKpi.customerDefectiveParts = 0;
        }
        if (!filters.selectedNotificationTypes.includes('Q2')) {
          filteredKpi.supplierComplaintsQ2 = 0;
          filteredKpi.supplierDefectiveParts = 0;
        }
        if (!filters.selectedNotificationTypes.includes('Q3')) {
          filteredKpi.internalComplaintsQ3 = 0;
        }
        
        const hasDeviation = filters.selectedNotificationTypes.some(t => t.startsWith('D'));
        if (!hasDeviation) {
          filteredKpi.deviationsD = 0;
        }
        
        const hasP1 = filters.selectedNotificationTypes.includes('P1');
        const hasP2 = filters.selectedNotificationTypes.includes('P2');
        const hasP3 = filters.selectedNotificationTypes.includes('P3');
        
        if (!hasP1) {
          filteredKpi.ppapP = { ...filteredKpi.ppapP, inProgress: 0 };
        }
        if (!hasP2 && !hasP3) {
          filteredKpi.ppapP = { ...filteredKpi.ppapP, completed: 0 };
        }
        
        return filteredKpi;
      });
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter((kpi) => {
        const kpiDate = new Date(kpi.month + "-01");
        if (filters.dateFrom && kpiDate < filters.dateFrom) return false;
        if (filters.dateTo) {
          const endOfMonth = new Date(kpiDate);
          endOfMonth.setMonth(endOfMonth.getMonth() + 1);
          endOfMonth.setDate(0);
          if (endOfMonth > filters.dateTo) return false;
        }
        return true;
      });
    }

    return result;
  }, [monthlySiteKpis, filters]);

  // Get selected sites from filter
  const selectedSites = useMemo(() => {
    if (filters.selectedPlants.length > 0) {
      return filters.selectedPlants;
    }
    return Array.from(new Set(monthlySiteKpis.map(k => k.siteCode))).sort();
  }, [filters.selectedPlants, monthlySiteKpis]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (monthlySiteKpis.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {t.aiSummary.title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t.aiSummary.subtitle}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t.aiSummary.noDataMessage}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            {t.aiSummary.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t.aiSummary.subtitle}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <AIInsightsPanel
            monthlySiteKpis={filteredKpis}
            globalPpm={globalPpm || { customerPpm: null, supplierPpm: null }}
            selectedSites={selectedSites}
            selectedMonths={[]}
            plantsData={plantsData}
          />
        </div>

        {/* Filter Panel - Right Sidebar */}
        <div className="flex-shrink-0">
          <FilterPanel
            monthlySiteKpis={monthlySiteKpis}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
    </div>
  );
}
