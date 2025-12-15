"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  ComposedChart,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  TrendingDown, 
  FileSpreadsheet, 
  AlertCircle,
  AlertTriangle,
  Package,
  Target,
  Factory,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Sparkles,
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle as AlertCircleIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import { FilterPanel, type FilterState } from "@/components/dashboard/filter-panel";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  getPlantColorHex,
  getPlantColorByIndex,
  generateColorPalette,
  getNotificationTypeColor,
  CHART_ANIMATION,
  getBarAnimation,
  getLineAnimation,
  PIE_ANIMATION,
  getStaggeredAnimation,
} from "@/lib/utils/chartColors";

interface DashboardClientProps {
  monthlySiteKpis?: MonthlySiteKpi[];
  globalPpm?: { customerPpm: number | null; supplierPpm: number | null };
  viewMode?: "full" | "customer" | "supplier"; // "full" shows both, "customer" shows only customer, "supplier" shows only supplier
}

interface PlantData {
  code: string;
  name: string;
  erp?: string;
  city?: string;
  abbreviation?: string;
  country?: string;
  location?: string;
}

interface TrendData {
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

export function DashboardClient({ monthlySiteKpis: propsKpis = [], globalPpm: propsPpm, viewMode = "full" }: DashboardClientProps) {
  const router = useRouter();
  const isCustomerView = viewMode === "customer";
  const isSupplierView = viewMode === "supplier";
  const isFullView = viewMode === "full";
  const [mounted, setMounted] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [monthlySiteKpis, setMonthlySiteKpis] = useState<MonthlySiteKpi[]>(propsKpis);
  const [globalPpm, setGlobalPpm] = useState<{ customerPpm: number | null; supplierPpm: number | null } | undefined>(propsPpm);
  const [customerPpmAveragePeriod, setCustomerPpmAveragePeriod] = useState<"3" | "6" | "12">("3");
  const [supplierPpmAveragePeriod, setSupplierPpmAveragePeriod] = useState<"3" | "6" | "12">("3");
  const [selectedNotificationTypes, setSelectedNotificationTypes] = useState<Set<"Q1" | "Q2" | "Q3">>(new Set(["Q1", "Q2", "Q3"]));
  const [plantsData, setPlantsData] = useState<PlantData[]>([]);
  // Local chart filter: selected plant for "YTD Total Number of Notifications by Month and Plant" chart only
  const [selectedPlantForChart, setSelectedPlantForChart] = useState<string | null>(null);
  // Defect type filter for "YTD Total Number of Defects by Month and Plant" chart
  const [selectedDefectType, setSelectedDefectType] = useState<"Customer" | "Supplier" | "Both">("Both");
  // Local chart filter: selected plant for "YTD Total Number of Defects by Month and Plant" chart only
  const [selectedPlantForDefectsChart, setSelectedPlantForDefectsChart] = useState<string | null>(null);
  // Refs for scrolling to charts
  const notificationsChartRef = useRef<HTMLDivElement>(null);
  const customerDeliveriesChartRef = useRef<HTMLDivElement>(null);
  const supplierDeliveriesChartRef = useRef<HTMLDivElement>(null);
  const defectsChartRef = useRef<HTMLDivElement>(null);
  const customerPpmTrendChartRef = useRef<HTMLDivElement>(null);
  const supplierPpmTrendChartRef = useRef<HTMLDivElement>(null);

  // Set mounted flag after hydration to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
          console.log('[Dashboard] Loaded plants from official file:', data.plants.length);
          setPlantsData(data.plants);
        }
      })
      .catch((error) => {
        console.error('[Dashboard] Error loading plants from API:', error);
      });
  }, []);

  // Plant color mapping (Tailwind classes) - matches filter-panel.tsx
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

  // Get Tailwind color class for a plant code
  const getPlantColorClass = useCallback((code: string): string => {
    return PLANT_COLORS[code] || "bg-gray-500";
  }, []);

  // Helper function to format site code with city/location for chart legends
  // Format: "145 (Doncaster Carr)" or "Site 145 (Doncaster Carr)"
  const formatSiteNameForChart = useCallback((siteCode: string, includePrefix: boolean = false): string => {
    const plant = plantsData.find(p => p.code === siteCode);
    const city = plant?.city || plant?.location || '';
    
    if (city) {
      return includePrefix ? `Site ${siteCode} (${city})` : `${siteCode} (${city})`;
    }
    
    // Fallback: try to extract from siteName in KPIs
    const kpi = monthlySiteKpis.find(k => k.siteCode === siteCode);
    if (kpi?.siteName) {
      let cityFromName = kpi.siteName.trim();
      // Remove common prefixes
      cityFromName = cityFromName.replace(/^(Site|Plant|Werk|Location)\s+/i, '');
      cityFromName = cityFromName.replace(/^(Plant|Site|Werk)\s*\d+\s*/i, '');
      const words = cityFromName.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0 && words[0].length >= 3) {
        const extractedCity = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
        return includePrefix ? `Site ${siteCode} (${extractedCity})` : `${siteCode} (${extractedCity})`;
      }
    }
    
    // Final fallback: just the site code
    return includePrefix ? `Site ${siteCode}` : siteCode;
  }, [plantsData, monthlySiteKpis]);

  // Custom Plant Legend Component - matches "Individual Plants" style from Filter Panel
  // Supports click-to-filter functionality for chart-specific filtering
  const PlantLegend = useCallback(({ 
    sites, 
    selectedPlant, 
    onPlantClick 
  }: { 
    sites: string[]; 
    selectedPlant?: string | null;
    onPlantClick?: (plantCode: string | null) => void;
  }) => {
    if (sites.length === 0) return null;
    
    return (
      <div className="flex flex-wrap items-center gap-4 justify-center mt-4 pt-4 border-t border-border/50">
        {sites.map((site) => {
          const plant = plantsData.find(p => p.code === site);
          const city = plant?.city || plant?.location || '';
          const colorClass = getPlantColorClass(site);
          const isSelected = selectedPlant === site;
          
          return (
            <div 
              key={site} 
              className={cn(
                "flex items-center gap-2 cursor-pointer transition-all",
                "hover:opacity-80 active:scale-95",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg p-1"
              )}
              onClick={() => onPlantClick?.(isSelected ? null : site)}
              title={isSelected ? `Click to show all plants` : `Click to filter by ${city || site}`}
            >
              <div className={cn(
                "h-6 w-6 rounded flex items-center justify-center text-xs font-semibold text-white flex-shrink-0",
                colorClass,
                isSelected && "ring-2 ring-white"
              )}>
                {site}
              </div>
              <span className={cn(
                "text-sm whitespace-nowrap",
                isSelected ? "text-primary font-semibold" : "text-foreground"
              )}>
                {city || `Site ${site}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [plantsData, getPlantColorClass]);

  // Custom Notification Type Legend Component - similar style to Plant Legend
  const NotificationTypeLegend = useCallback(({ types }: { types: string[] }) => {
    if (types.length === 0) return null;
    
    const typeLabels: Record<string, string> = {
      Q1: "Customer Complaints",
      Q2: "Supplier Complaints",
      Q3: "Internal Complaints",
      D: "Deviations",
      P: "PPAP",
    };
    
    return (
      <div className="flex flex-wrap items-center gap-4 justify-center mt-4 pt-4 border-t border-border/50">
        {types.map((type) => {
          const colorHex = getNotificationTypeColor(type);
          const label = typeLabels[type] || type;
          
          return (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="h-6 w-6 rounded flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: colorHex }}
              >
                {type}
              </div>
              <span className="text-sm text-foreground whitespace-nowrap">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, []);
  
  // Filter state - load from localStorage or use default
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qos-et-filters');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          return {
            ...parsed,
            dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : null,
            dateTo: parsed.dateTo ? new Date(parsed.dateTo) : null,
          };
        } catch (e) {
          console.error('Failed to parse stored filters:', e);
        }
      }
    }
    return {
      selectedPlants: [],
      selectedComplaintTypes: [],
      selectedNotificationTypes: [],
      dateFrom: null,
      dateTo: null,
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && filters.selectedPlants.length > 0) {
      localStorage.setItem('qos-et-filters', JSON.stringify(filters));
    }
  }, [filters]);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [aiSummaryErrorType, setAiSummaryErrorType] = useState<'api_key' | 'rate_limit' | 'network' | 'unknown' | null>(null);
  const [aiSummaryErrorDetails, setAiSummaryErrorDetails] = useState<{ message: string; code?: string; statusCode?: number } | null>(null);

  // Month/Year selection state - initialize with last available month/year from data
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKpis = localStorage.getItem('qos-et-kpis');
      const storedPpm = localStorage.getItem('qos-et-global-ppm');
      
      if (storedKpis) {
        try {
          const parsed = JSON.parse(storedKpis);
          setMonthlySiteKpis(parsed);
        } catch (e) {
          console.error('Failed to parse stored KPIs:', e);
        }
      }
      
      if (storedPpm) {
        try {
          const parsed = JSON.parse(storedPpm);
          setGlobalPpm(parsed);
        } catch (e) {
          console.error('Failed to parse stored PPM:', e);
        }
      }
    }
  }, []);

  // Calculate trends by comparing current period with previous period
  // Always show percentage change (no "stable" status)
  const calculateTrend = useCallback((current: number, previous: number): TrendData => {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    
    if (changePercent > 0) {
      trend = 'up';
    } else if (changePercent < 0) {
      trend = 'down';
    } else {
      trend = 'stable'; // Only for exactly 0% change
    }
    
    return {
      value: current,
      previousValue: previous,
      change,
      changePercent: Math.abs(changePercent),
      trend,
    };
  }, []);

  // Use props if provided, otherwise use state
  const kpis = propsKpis.length > 0 ? propsKpis : monthlySiteKpis;
  const ppm = propsPpm || globalPpm;

  // Calculate available months and years from data
  const availableMonthsYears = useMemo(() => {
    const monthYearSet = new Set<string>();
    kpis.forEach(k => {
      monthYearSet.add(k.month); // Format: "YYYY-MM"
    });
    const sorted = Array.from(monthYearSet).sort();
    
    const months = new Set<number>();
    const years = new Set<number>();
    
    sorted.forEach(monthStr => {
      const [year, month] = monthStr.split('-').map(Number);
      months.add(month);
      years.add(year);
    });
    
    return {
      months: Array.from(months).sort((a, b) => a - b),
      years: Array.from(years).sort((a, b) => b - a), // Descending (newest first)
      allMonthYears: sorted,
      lastMonthYear: sorted.length > 0 ? sorted[sorted.length - 1] : null, // Last available month
    };
  }, [kpis]);

  // Initialize selected month/year to last available if not set
  useEffect(() => {
    if (selectedMonth === null || selectedYear === null) {
      if (availableMonthsYears.lastMonthYear) {
        const [year, month] = availableMonthsYears.lastMonthYear.split('-').map(Number);
        setSelectedYear(year);
        setSelectedMonth(month);
      } else {
        // Fallback to current date if no data
        const currentDate = new Date();
        setSelectedYear(currentDate.getFullYear());
        setSelectedMonth(currentDate.getMonth() + 1);
      }
    }
  }, [availableMonthsYears.lastMonthYear, selectedMonth, selectedYear]);

  // Calculate total sites from all KPIs (unfiltered)
  // Total ET Sites is 22
  const totalSites = 22;

  // Calculate 12-month lookback period from selected month/year
  const lookbackPeriod = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) {
      // Return a default period if not initialized yet
      const currentDate = new Date();
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 11);
      return {
        start: startDate,
        end: endDate,
        startMonthStr: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        endMonthStr: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`,
      };
    }
    
    const endDate = new Date(selectedYear, selectedMonth - 1, 1); // First day of selected month
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11); // 12 months back (including selected month)
    
    return {
      start: startDate,
      end: endDate,
      startMonthStr: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      endMonthStr: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`,
    };
  }, [selectedMonth, selectedYear]);

  // Filter KPIs by selected sites, filter panel filters, AND 12-month lookback period
  const filteredKpis = useMemo(() => {
    let result = kpis;

    // Filter by plants (from filter panel) - prioritize filter panel over selectedSites
    // If no plants selected, show all plants (cumulative across all)
    if (filters.selectedPlants.length > 0) {
      result = result.filter((k) => filters.selectedPlants.includes(k.siteCode));
    } else if (selectedSites.length > 0) {
      // Fallback to selectedSites if filter panel plants not set
      result = result.filter((k) => selectedSites.includes(k.siteCode));
    }
    // If neither is set, result contains all KPIs (all plants - cumulative)

    // Filter by 12-month lookback period (from selected month/year)
    result = result.filter((k) => {
      const kpiDate = new Date(k.month + "-01");
      // Include months from startDate (inclusive) to endDate (inclusive)
      return kpiDate >= lookbackPeriod.start && kpiDate <= lookbackPeriod.end;
    });

    // Filter by date range (if specified in filter panel - this further restricts the lookback)
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter((k) => {
        const kpiDate = new Date(k.month + "-01");
        if (filters.dateFrom && kpiDate < filters.dateFrom) return false;
        if (filters.dateTo) {
          const endOfMonth = new Date(kpiDate.getFullYear(), kpiDate.getMonth() + 1, 0);
          if (endOfMonth > filters.dateTo) return false;
        }
        return true;
      });
    }

    // Filter by complaint types (Customer, Supplier, Internal)
    if (filters.selectedComplaintTypes.length > 0) {
      result = result.map((kpi) => {
        // Create a filtered version of the KPI based on complaint types
        const filteredKpi = { ...kpi };
        
        // If Customer is not selected, exclude Q1 complaints
        if (!filters.selectedComplaintTypes.includes('Customer')) {
          filteredKpi.customerComplaintsQ1 = 0;
          filteredKpi.customerDefectiveParts = 0;
          filteredKpi.customerDeliveries = 0;
        }
        
        // If Supplier is not selected, exclude Q2 complaints
        if (!filters.selectedComplaintTypes.includes('Supplier')) {
          filteredKpi.supplierComplaintsQ2 = 0;
          filteredKpi.supplierDefectiveParts = 0;
          filteredKpi.supplierDeliveries = 0;
        }
        
        // If Internal is not selected, exclude Q3 complaints
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
        
        // Filter Q1, Q2, Q3
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
        
        // Filter deviations (D1, D2, D3) - if none selected, set to 0
        const hasDeviation = filters.selectedNotificationTypes.some(t => t.startsWith('D'));
        if (!hasDeviation) {
          filteredKpi.deviationsD = 0;
        }
        
        // Filter PPAP (P1, P2, P3)
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

    return result;
  }, [kpis, selectedSites, filters, lookbackPeriod]);

  // AI Summary generation function - can be called manually or automatically
  const generateAISummary = useCallback(async () => {
      if (filteredKpis.length === 0) {
      console.log('[AI Summary] No filtered KPIs available, skipping generation');
        setAiSummary(null);
        return;
      }

    console.log('[AI Summary] Starting generation with', filteredKpis.length, 'filtered KPIs');

      setAiSummaryLoading(true);
      setAiSummaryError(null);
    setAiSummaryErrorType(null);
    setAiSummaryErrorDetails(null);

      try {
        // Get available sites from filtered KPIs
        const sitesFromFiltered = Array.from(new Set(filteredKpis.map((k) => k.siteCode))).sort();
        const selectedSitesForAI = filters.selectedPlants.length > 0 
          ? filters.selectedPlants 
          : (selectedSites.length > 0 ? selectedSites : sitesFromFiltered);
        
        const selectedMonthsForAI = Array.from(new Set(filteredKpis.map(k => k.month))).sort();

        // Build filter context for AI
        const filterContext = {
          selectedPlants: filters.selectedPlants.length > 0 ? filters.selectedPlants : null,
          dateRange: filters.dateFrom || filters.dateTo 
            ? {
                from: filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : null,
                to: filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : null,
              }
            : null,
          notificationTypes: filters.selectedNotificationTypes.length > 0 ? filters.selectedNotificationTypes : null,
          complaintTypes: filters.selectedComplaintTypes.length > 0 ? filters.selectedComplaintTypes : null,
        };

        console.log('[AI Summary] Sending request with', filteredKpis.length, 'KPIs');
        const response = await fetch("/api/ai/interpret-kpis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monthlySiteKpis: filteredKpis,
            globalPpm: ppm,
            selectedSites: selectedSitesForAI,
            selectedMonths: selectedMonthsForAI,
            filterContext: filterContext,
          }),
        });

        console.log('[AI Summary] Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json();
        // Store structured error information
        setAiSummaryErrorType(errorData.errorType || 'unknown');
        setAiSummaryErrorDetails(errorData.errorDetails || null);
        throw new Error(errorData.error || errorData.summary || "Failed to generate AI summary");
        }

        const data = await response.json();
        console.log('[AI Summary] Response data received:', {
          hasSummary: !!data.summary,
          summaryLength: data.summary?.length || 0,
          hasError: !!data.error,
          errorType: data.errorType,
        });
        
        // Check if response contains an error (even with 200 status)
        // Only treat as error if error field exists AND summary is empty/unusable
        if (data.error && (!data.summary || data.summary.trim().length === 0 || data.summary === 'AI analysis is processing your data.')) {
          console.error('[AI Summary] Error in response:', data.error);
          setAiSummaryErrorType(data.errorType || 'unknown');
          setAiSummaryErrorDetails(data.errorDetails || null);
          throw new Error(data.error || "Failed to generate AI summary");
        }
        
        // Check if summary is empty or missing
        if (!data.summary || (typeof data.summary === 'string' && data.summary.trim().length === 0)) {
          console.warn('[AI Summary] Empty summary received, using fallback');
          // If we have partial data (trends, risks, etc.), use that instead of throwing error
          if (data.trendsAndSiteComparison || data.keyRisksAndAnomalies || (data.recommendedActions && data.recommendedActions.length > 0)) {
            console.log('[AI Summary] Using partial data from response');
            // Use trends as summary if available
            const fallbackSummary = data.trendsAndSiteComparison || data.keyRisksAndAnomalies || 'AI analysis completed with partial results.';
            setAiSummary(fallbackSummary);
            setAiSummaryError(null);
            setAiSummaryErrorType(null);
            setAiSummaryErrorDetails(null);
            return; // Exit early with partial data
          }
          throw new Error("AI service returned an empty summary. Please try again.");
        }
        
        // Use the summary field as the brief summary
        // Handle case where summary might be an array or raw JSON string
        let summaryText = data.summary || "AI analysis complete";
        if (Array.isArray(summaryText)) {
          summaryText = summaryText.join('\n');
        } else if (typeof summaryText === 'string' && summaryText.trim().startsWith('{')) {
          // If summary is raw JSON, try to parse it
          try {
            const parsed = JSON.parse(summaryText);
            summaryText = parsed.summary || summaryText;
          } catch {
            // If parsing fails, use as-is but clean it up
            summaryText = summaryText.replace(/^\{[^}]*"summary"\s*:\s*\[?\s*/, '').replace(/\s*\]?\s*[,\}].*$/, '');
          }
        }
        setAiSummary(summaryText);
        // Clear any previous errors on success
        setAiSummaryError(null);
        setAiSummaryErrorType(null);
        setAiSummaryErrorDetails(null);
        console.log('[AI Summary] Successfully generated summary');
      } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate summary";
      setAiSummaryError(errorMessage);
      // If error type/details weren't set, try to infer from error message
      if (!aiSummaryErrorType) {
        if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('invalid')) {
          setAiSummaryErrorType('api_key');
        } else if (errorMessage.toLowerCase().includes('rate limit')) {
          setAiSummaryErrorType('rate_limit');
        } else if (errorMessage.toLowerCase().includes('network')) {
          setAiSummaryErrorType('network');
        } else {
          setAiSummaryErrorType('unknown');
        }
      }
        console.error("AI summary error:", err);
      } finally {
        setAiSummaryLoading(false);
      }
  }, [filteredKpis, filters, ppm, selectedSites]);

  // Auto-generate AI Summary when filtered data or filters change
  useEffect(() => {
    // Small delay to avoid too frequent calls
    const timeoutId = setTimeout(() => {
      generateAISummary();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [generateAISummary]);

  // Calculate Year-to-Date (YTD) data from FILTERED KPIs
  // YTD = all months from January 1st of current year to current date
  // This ensures metrics reflect the selected filters (plants, dates, etc.)
  const { ytdCurrentYear, ytdPreviousYear } = useMemo(() => {
    const sorted = [...filteredKpis].sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime();
    });

    if (sorted.length === 0) {
      return { ytdCurrentYear: [], ytdPreviousYear: [] };
    }

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const previousYear = currentYear - 1;

    // Filter for YTD current year (January to current month)
    const ytdCurrent = sorted.filter((k) => {
      const kpiDate = new Date(k.month + "-01");
      const kpiYear = kpiDate.getFullYear();
      const kpiMonth = kpiDate.getMonth() + 1;
      return kpiYear === currentYear && kpiMonth <= currentMonth;
    });
    
    // If no data in current year, use all available data (for cases where Excel has previous year data)
    const ytdCurrentFinal = ytdCurrent.length > 0 ? ytdCurrent : sorted;
    
    // Filter for YTD previous year (January to same month as current year)
    const ytdPrevious = sorted.filter((k) => {
      const kpiDate = new Date(k.month + "-01");
      const kpiYear = kpiDate.getFullYear();
      const kpiMonth = kpiDate.getMonth() + 1;
      return kpiYear === previousYear && kpiMonth <= currentMonth;
    });
    
    // Debug logging - always log to help diagnose the issue
    console.log('[YTD Calculation] Current year:', currentYear, 'Current month:', currentMonth);
    console.log('[YTD Calculation] Total filtered KPIs:', sorted.length);
    console.log('[YTD Calculation] YTD current year KPIs:', ytdCurrent.length);
    console.log('[YTD Calculation] Using:', ytdCurrentFinal.length, 'KPIs for YTD');
    if (ytdCurrentFinal.length > 0) {
      const yearRange = ytdCurrentFinal.map(k => {
        const d = new Date(k.month + "-01");
        return d.getFullYear();
      });
      const uniqueYears = Array.from(new Set(yearRange));
      console.log('[YTD Calculation] Years in data:', uniqueYears);
      const totalQ1 = ytdCurrentFinal.reduce((sum, k) => sum + k.customerComplaintsQ1, 0);
      const totalQ2 = ytdCurrentFinal.reduce((sum, k) => sum + k.supplierComplaintsQ2, 0);
      const totalQ3 = ytdCurrentFinal.reduce((sum, k) => sum + k.internalComplaintsQ3, 0);
      console.log('[YTD Calculation] Total Q1:', totalQ1, 'Q2:', totalQ2, 'Q3:', totalQ3);
      // Log sample KPIs to see what we're counting
      console.log('[YTD Calculation] Sample KPIs (first 5):', ytdCurrentFinal.slice(0, 5).map(k => ({
        month: k.month,
        site: k.siteCode,
        q1: k.customerComplaintsQ1,
        q2: k.supplierComplaintsQ2,
        q3: k.internalComplaintsQ3
      })));
    }

    return {
      ytdCurrentYear: ytdCurrentFinal,
      ytdPreviousYear: ytdPrevious,
    };
  }, [filteredKpis]);

  // Get all available sites - use filter panel plants if available, otherwise use all sites
  const availableSites = useMemo(() => {
    // If filter panel has plants selected, use those
    if (filters.selectedPlants.length > 0) {
      return filters.selectedPlants.sort();
    }
    
    // Otherwise, use all sites from KPIs
    const sites = Array.from(new Set(kpis.map((k) => k.siteCode))).sort();
    return sites;
  }, [kpis, filters.selectedPlants]);

  // Initialize selectedSites when availableSites changes (but only if selectedSites is empty)
  // This must be in useEffect to avoid hydration mismatches
  useEffect(() => {
    if (selectedSites.length === 0 && availableSites.length > 0) {
      setSelectedSites(availableSites);
    }
  }, [availableSites, selectedSites.length]);

  // All available sites for the chart (before local legend filter)
  // These are the sites that will appear in the legend
  const availableChartSites = useMemo(() => {
    const sitesFromData = Array.from(new Set(filteredKpis.map((k) => k.siteCode))).sort();
    // If filters are applied, only show selected plants that have data
    if (filters.selectedPlants.length > 0) {
      return sitesFromData.filter(site => filters.selectedPlants.includes(site));
    }
    return sitesFromData;
  }, [filteredKpis, filters.selectedPlants]);

  // Chart sites after applying local legend filter
  // This is what actually gets displayed in the chart bars
  const chartSites = useMemo(() => {
    // Apply local chart filter if a plant is selected in the legend
    if (selectedPlantForChart) {
      return availableChartSites.filter(site => site === selectedPlantForChart);
    }
    return availableChartSites;
  }, [availableChartSites, selectedPlantForChart]);

  // Get last available month and previous month for month-to-month comparison
  // If last available month is November, compare November with October
  const { lastMonthKpis, previousMonthKpis, lastMonth, previousMonth } = useMemo(() => {
    if (filteredKpis.length === 0) {
      return { lastMonthKpis: [], previousMonthKpis: [], lastMonth: null, previousMonth: null };
    }

    // Sort by month (newest first)
    const sorted = [...filteredKpis].sort((a, b) => {
      const dateA = new Date(a.month + "-01");
      const dateB = new Date(b.month + "-01");
      return dateB.getTime() - dateA.getTime();
    });

    // Get the most recent month
    const lastMonthStr = sorted[0].month;
    const lastMonthDate = new Date(lastMonthStr + "-01");
    
    // Calculate previous month
    const previousMonthDate = new Date(lastMonthDate);
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const previousMonthStr = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // Get KPIs for last month and previous month
    const lastMonthData = sorted.filter(k => k.month === lastMonthStr);
    const previousMonthData = sorted.filter(k => k.month === previousMonthStr);

    return {
      lastMonthKpis: lastMonthData,
      previousMonthKpis: previousMonthData,
      lastMonth: lastMonthStr,
      previousMonth: previousMonthStr,
    };
  }, [filteredKpis]);

  // Calculate YTD (Year-to-Date) customer and supplier metrics with trends
  // YTD = sum of all months from January 1st to current month of current year
  // Customer complaints = count of Q1 notifications from Excel file (YTD)
  // Supplier complaints = count of Q2 notifications from Excel file (YTD)
  // Customer deliveries = sum of quantities from Outbound files (YTD)
  // Supplier deliveries = sum of quantities from Inbound files (YTD)
  // 
  // IMPORTANT: These metrics aggregate across ALL filtered plants (cumulative YTD values)
  // - When all plants are selected → shows cumulative YTD values across all plants
  // - When specific plants are selected → shows cumulative YTD values across only those plants
  // - When no plants are selected → shows cumulative YTD values across all plants (default)
  const customerMetrics = useMemo(() => {
    // Count each Q1 notification row from the Excel file
    // Each row in Excel with Notification Type = Q1 counts as 1 complaint
    // Sum across all filtered KPIs (respects plant/date filters, but shows all available data)
    const q1Count = filteredKpis.reduce((sum, k) => sum + k.customerComplaintsQ1, 0);
    
    // Debug logging - always log to help diagnose
    console.log('[YTD Customer Metrics] ========================================');
    console.log('[YTD Customer Metrics] Total filtered KPIs:', filteredKpis.length);
    console.log('[YTD Customer Metrics] Q1 complaints count:', q1Count);
    
    // Breakdown by site to identify which sites contribute to the count
    const q1BySite = new Map<string, number>();
    filteredKpis.forEach(k => {
      if (k.customerComplaintsQ1 > 0) {
        q1BySite.set(k.siteCode, (q1BySite.get(k.siteCode) || 0) + k.customerComplaintsQ1);
      }
    });
    console.log('[YTD Customer Metrics] Q1 complaints by site:', Array.from(q1BySite.entries()).sort((a, b) => b[1] - a[1]));
    
    console.log('[YTD Customer Metrics] Breakdown by month/site (first 10 with Q1>0):', filteredKpis
      .filter(k => k.customerComplaintsQ1 > 0)
      .slice(0, 10)
      .map(k => ({
        month: k.month,
        site: k.siteCode,
        q1Complaints: k.customerComplaintsQ1,
        q1Defective: k.customerDefectiveParts
      })));
    // Verify we're counting complaints, not summing defective parts
    const totalDefective = filteredKpis.reduce((sum, k) => sum + (k.customerDefectiveParts || 0), 0);
    console.log('[YTD Customer Metrics] Total Q1 defective parts:', totalDefective);
    console.log('[YTD Customer Metrics] VERIFICATION: Q1 complaints should be count of rows, not sum of defective parts');
    console.log('[YTD Customer Metrics] ========================================');
    
    // Collect conversion information from all filtered KPIs (Q1)
    const allCustomerConversions: Array<{
      notificationNumber: string;
      originalML: number;
      originalUnit?: string;
      convertedPC: number;
      bottleSize: number;
      materialDescription?: string;
      siteCode: string;
      month: string;
    }> = [];
    let totalCustomerMLConverted = 0;
    let totalCustomerPCConverted = 0;
    
    filteredKpis.forEach((kpi) => {
      if (kpi.customerConversions && kpi.customerConversions.conversions.length > 0) {
        kpi.customerConversions.conversions.forEach((conv) => {
          allCustomerConversions.push({
            notificationNumber: conv.notificationNumber,
            originalML: conv.originalML,
            originalUnit: conv.originalUnit,
            convertedPC: conv.convertedPC,
            bottleSize: conv.bottleSize,
            materialDescription: conv.materialDescription,
            siteCode: kpi.siteCode,
            month: kpi.month,
          });
        });
        totalCustomerMLConverted += kpi.customerConversions.totalML; // Keep field name for backward compatibility
        totalCustomerPCConverted += kpi.customerConversions.totalPC;
      }
    });
    
    // Current period: YTD (Year-to-Date) cumulative values through last available month
    // If last month is December, this is YTD through December (cumulative for entire year)
    const current = {
      // Count of Q1 notifications (Customer Complaints) - YTD through last month
      // Each row in Excel with Notification Type = Q1 counts as 1
      complaints: filteredKpis.reduce((sum, k) => sum + k.customerComplaintsQ1, 0),
      // Defective parts = sum of defectiveParts from Q1 notifications - YTD through last month
      defective: filteredKpis.reduce((sum, k) => sum + (k.customerDefectiveParts || 0), 0),
      // Customer deliveries = sum of quantities from Outbound files - YTD through last month
      deliveries: filteredKpis.reduce((sum, k) => sum + (k.customerDeliveries || 0), 0),
      // PPM = (total defective / total deliveries) * 1,000,000 - YTD through last month
      ppm: (() => {
        const totalDefective = filteredKpis.reduce((sum, k) => sum + (k.customerDefectiveParts || 0), 0);
        const totalDeliveries = filteredKpis.reduce((sum, k) => sum + (k.customerDeliveries || 0), 0);
        return totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
      })(),
    };

    // Previous period for trend comparison: YTD through previous month (e.g., YTD through November)
    // Percentage change compares YTD through last month vs YTD through previous month
    // If last available month is December, compare YTD through December vs YTD through November
    const previousYtdKpis = previousMonth
      ? filteredKpis.filter((k) => {
          const kpiDate = new Date(k.month + "-01");
          const previousMonthDate = new Date(previousMonth + "-01");
          return kpiDate <= previousMonthDate;
        })
      : [];
    
    const previous = {
      complaints: previousYtdKpis.reduce((sum, k) => sum + k.customerComplaintsQ1, 0),
      // Defective parts = sum of defectiveParts from Q1 notifications - YTD through previous month
      defective: previousYtdKpis.reduce((sum, k) => sum + (k.customerDefectiveParts || 0), 0),
      // Customer deliveries = sum of quantities from Outbound files - YTD through previous month
      deliveries: previousYtdKpis.reduce((sum, k) => sum + (k.customerDeliveries || 0), 0),
      // PPM = (total defective / total deliveries) * 1,000,000 - YTD through previous month
      ppm: (() => {
        const totalDefective = previousYtdKpis.reduce((sum, k) => sum + (k.customerDefectiveParts || 0), 0);
        const totalDeliveries = previousYtdKpis.reduce((sum, k) => sum + (k.customerDeliveries || 0), 0);
        return totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
      })(),
    };

    return {
      complaints: calculateTrend(current.complaints, previous.complaints),
      defective: calculateTrend(current.defective, previous.defective),
      deliveries: calculateTrend(current.deliveries, previous.deliveries),
      ppm: calculateTrend(current.ppm, previous.ppm),
      selectedSites: availableSites.length,
      // Conversion information for info popup
      conversions: {
        hasConversions: allCustomerConversions.length > 0,
        totalConverted: allCustomerConversions.length,
        totalML: totalCustomerMLConverted,
        totalPC: totalCustomerPCConverted,
        details: allCustomerConversions,
      },
    };
  }, [filteredKpis, previousMonth, calculateTrend, availableSites]);

  const supplierMetrics = useMemo(() => {
    // Count each Q2 notification row from the Excel file
    // Each row in Excel with Notification Type = Q2 counts as 1 complaint
    // Sum across all filtered KPIs (respects plant/date filters, but shows all available data)
    const q2Count = filteredKpis.reduce((sum, k) => sum + k.supplierComplaintsQ2, 0);
    
    // Debug logging - always log to help diagnose
    console.log('[YTD Supplier Metrics] ========================================');
    console.log('[YTD Supplier Metrics] Total filtered KPIs:', filteredKpis.length);
    console.log('[YTD Supplier Metrics] Q2 complaints count:', q2Count);
    console.log('[YTD Supplier Metrics] Breakdown by month/site (first 10 with Q2>0):', filteredKpis
      .filter(k => k.supplierComplaintsQ2 > 0)
      .slice(0, 10)
      .map(k => ({
        month: k.month,
        site: k.siteCode,
        q2Complaints: k.supplierComplaintsQ2,
        q2Defective: k.supplierDefectiveParts
      })));
    // Verify we're counting complaints, not summing defective parts
    const totalDefective = filteredKpis.reduce((sum, k) => sum + (k.supplierDefectiveParts || 0), 0);
    console.log('[YTD Supplier Metrics] Total Q2 defective parts (in PC):', totalDefective);
    console.log('[YTD Supplier Metrics] Breakdown by site (top 10):', filteredKpis
      .filter(k => k.supplierDefectiveParts > 0)
      .sort((a, b) => b.supplierDefectiveParts - a.supplierDefectiveParts)
      .slice(0, 10)
      .map(k => ({
        site: k.siteCode,
        month: k.month,
        defective: k.supplierDefectiveParts,
        conversions: k.supplierConversions?.totalConverted || 0
      })));
    console.log('[YTD Supplier Metrics] VERIFICATION: Q2 complaints should be count of rows, not sum of defective parts');
    console.log('[YTD Supplier Metrics] VERIFICATION: Q2 defective parts should be sum of all defective parts (converted to PC)');
    console.log('[YTD Supplier Metrics] ========================================');
    
    // Collect conversion information from all filtered KPIs
    const allConversions: Array<{
      notificationNumber: string;
      originalML: number;
      originalUnit?: string;
      convertedPC: number;
      bottleSize: number;
      materialDescription?: string;
      siteCode: string;
      month: string;
    }> = [];
    let totalMLConverted = 0;
    let totalPCConverted = 0;
    
    filteredKpis.forEach((kpi) => {
      if (kpi.supplierConversions && kpi.supplierConversions.conversions.length > 0) {
        kpi.supplierConversions.conversions.forEach((conv) => {
          allConversions.push({
            notificationNumber: conv.notificationNumber,
            originalML: conv.originalML,
            originalUnit: conv.originalUnit,
            convertedPC: conv.convertedPC,
            bottleSize: conv.bottleSize,
            materialDescription: conv.materialDescription,
            siteCode: kpi.siteCode,
            month: kpi.month,
          });
        });
        totalMLConverted += kpi.supplierConversions.totalML; // Keep field name for backward compatibility
        totalPCConverted += kpi.supplierConversions.totalPC;
      }
    });
    
    // Current period: YTD (Year-to-Date) cumulative values through last available month
    // If last month is December, this is YTD through December (cumulative for entire year)
    const current = {
      // Count of Q2 notifications (Supplier Complaints) - YTD through last month
      // Each row in Excel with Notification Type = Q2 counts as 1
      complaints: filteredKpis.reduce((sum, k) => sum + k.supplierComplaintsQ2, 0),
      // Defective parts = sum of defectiveParts from Q2 notifications - YTD through last month
      defective: filteredKpis.reduce((sum, k) => sum + (k.supplierDefectiveParts || 0), 0),
      // Supplier deliveries = sum of quantities from Inbound files - YTD through last month
      deliveries: filteredKpis.reduce((sum, k) => sum + (k.supplierDeliveries || 0), 0),
      // PPM = (total defective / total deliveries) * 1,000,000 - YTD through last month
      ppm: (() => {
        const totalDefective = filteredKpis.reduce((sum, k) => sum + (k.supplierDefectiveParts || 0), 0);
        const totalDeliveries = filteredKpis.reduce((sum, k) => sum + (k.supplierDeliveries || 0), 0);
        return totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
      })(),
    };

    // Previous period for trend comparison: YTD through previous month (e.g., YTD through November)
    // Percentage change compares YTD through last month vs YTD through previous month
    // If last available month is December, compare YTD through December vs YTD through November
    const previousYtdKpis = previousMonth
      ? filteredKpis.filter((k) => {
          const kpiDate = new Date(k.month + "-01");
          const previousMonthDate = new Date(previousMonth + "-01");
          return kpiDate <= previousMonthDate;
        })
      : [];
    
    const previous = {
      complaints: previousYtdKpis.reduce((sum, k) => sum + k.supplierComplaintsQ2, 0),
      // Defective parts = sum of defectiveParts from Q2 notifications - YTD through previous month
      defective: previousYtdKpis.reduce((sum, k) => sum + (k.supplierDefectiveParts || 0), 0),
      // Supplier deliveries = sum of quantities from Inbound files - YTD through previous month
      deliveries: previousYtdKpis.reduce((sum, k) => sum + (k.supplierDeliveries || 0), 0),
      // PPM = (total defective / total deliveries) * 1,000,000 - YTD through previous month
      ppm: (() => {
        const totalDefective = previousYtdKpis.reduce((sum, k) => sum + (k.supplierDefectiveParts || 0), 0);
        const totalDeliveries = previousYtdKpis.reduce((sum, k) => sum + (k.supplierDeliveries || 0), 0);
        return totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
      })(),
    };

    return {
      complaints: calculateTrend(current.complaints, previous.complaints),
      defective: calculateTrend(current.defective, previous.defective),
      deliveries: calculateTrend(current.deliveries, previous.deliveries),
      ppm: calculateTrend(current.ppm, previous.ppm),
      selectedSites: availableSites.length,
      // Conversion information for info popup
      conversions: {
        hasConversions: allConversions.length > 0,
        totalConverted: allConversions.length,
        totalML: totalMLConverted,
        totalPC: totalPCConverted,
        details: allConversions,
      },
    };
  }, [filteredKpis, previousMonth, calculateTrend, availableSites]);

  // Sparkline data for metric tiles - shows YTD cumulative values by month
  // This shows the running YTD total as each month progresses
  const sparklineData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Filter KPIs for current year only (YTD)
    const currentYearKpis = filteredKpis.filter((kpi) => {
      const kpiDate = new Date(kpi.month + "-01");
      const kpiYear = kpiDate.getFullYear();
      const kpiMonth = kpiDate.getMonth() + 1;
      return kpiYear === currentYear && kpiMonth <= currentMonth;
    });

    // Group by month and calculate cumulative YTD values
    const byMonth = currentYearKpis.reduce((acc, kpi) => {
      if (!acc[kpi.month]) {
        acc[kpi.month] = {
          customerComplaints: 0,
          supplierComplaints: 0,
          customerDeliveries: 0,
          supplierDeliveries: 0,
          customerDefective: 0,
          supplierDefective: 0,
          customerPpm: 0,
          supplierPpm: 0,
        };
      }
      acc[kpi.month].customerComplaints += kpi.customerComplaintsQ1;
      acc[kpi.month].supplierComplaints += kpi.supplierComplaintsQ2;
      acc[kpi.month].customerDefective += kpi.customerDefectiveParts || 0;
      acc[kpi.month].supplierDefective += kpi.supplierDefectiveParts || 0;
      // Use actual delivery quantities from Outbound/Inbound files
      acc[kpi.month].customerDeliveries += kpi.customerDeliveries || 0;
      acc[kpi.month].supplierDeliveries += kpi.supplierDeliveries || 0;
      acc[kpi.month].customerPpm += kpi.customerPpm || 0;
      acc[kpi.month].supplierPpm += kpi.supplierPpm || 0;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate cumulative YTD values
    const sortedMonths = Object.entries(byMonth)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());

    // Calculate cumulative YTD values
    let cumulativeCustomerComplaints = 0;
    let cumulativeSupplierComplaints = 0;
    let cumulativeCustomerDefective = 0;
    let cumulativeSupplierDefective = 0;
    let cumulativeCustomerDeliveries = 0;
    let cumulativeSupplierDeliveries = 0;
    let cumulativeCustomerPpm = 0;
    let cumulativeSupplierPpm = 0;

    return sortedMonths.map(([month, data]: [string, any]) => {
      cumulativeCustomerComplaints += data.customerComplaints;
      cumulativeSupplierComplaints += data.supplierComplaints;
      cumulativeCustomerDefective += data.customerDefective;
      cumulativeSupplierDefective += data.supplierDefective;
      cumulativeCustomerDeliveries += data.customerDeliveries;
      cumulativeSupplierDeliveries += data.supplierDeliveries;
      cumulativeCustomerPpm = cumulativeCustomerDeliveries > 0
        ? (cumulativeCustomerDefective / cumulativeCustomerDeliveries) * 1_000_000
        : 0;
      cumulativeSupplierPpm = cumulativeSupplierDeliveries > 0
        ? (cumulativeSupplierDefective / cumulativeSupplierDeliveries) * 1_000_000
        : 0;

      return {
        month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
        customerComplaints: cumulativeCustomerComplaints,
        supplierComplaints: cumulativeSupplierComplaints,
        customerDefective: cumulativeCustomerDefective,
        supplierDefective: cumulativeSupplierDefective,
        customerDeliveries: cumulativeCustomerDeliveries,
        supplierDeliveries: cumulativeSupplierDeliveries,
        customerPpm: cumulativeCustomerPpm,
        supplierPpm: cumulativeSupplierPpm,
      };
    });
  }, [filteredKpis]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalComplaints = filteredKpis.reduce(
      (sum, k) => sum + k.customerComplaintsQ1 + k.supplierComplaintsQ2 + k.internalComplaintsQ3 + k.deviationsD + k.ppapP.inProgress + k.ppapP.completed,
      0
    );
    
    const totalDefective = filteredKpis.reduce((sum, k) => {
      // Sum defective parts from Q1 and Q2 complaints
      return sum + k.customerComplaintsQ1 + k.supplierComplaintsQ2;
    }, 0);

    // Calculate total deliveries from PPM if available
    // PPM = (defective / deliveries) * 1,000,000
    // So deliveries = (defective / PPM) * 1,000,000
    let totalDeliveries = 0;
    const totalDefectiveForPpm = filteredKpis.reduce((sum, k) => {
      return sum + k.customerComplaintsQ1 + k.supplierComplaintsQ2;
    }, 0);
    
    // Try to calculate from average PPM
    const customerPpms = filteredKpis
      .map((k) => k.customerPpm)
      .filter((p): p is number => p !== null && p > 0);
    const supplierPpms = filteredKpis
      .map((k) => k.supplierPpm)
      .filter((p): p is number => p !== null && p > 0);
    
    if (customerPpms.length > 0 || supplierPpms.length > 0) {
      const avgCustomerPpm = customerPpms.length > 0
        ? customerPpms.reduce((sum, p) => sum + p, 0) / customerPpms.length
        : 0;
      const avgSupplierPpm = supplierPpms.length > 0
        ? supplierPpms.reduce((sum, p) => sum + p, 0) / supplierPpms.length
        : 0;
      
      const avgPpm = (avgCustomerPpm + avgSupplierPpm) / 2;
      if (avgPpm > 0 && totalDefectiveForPpm > 0) {
        totalDeliveries = (totalDefectiveForPpm / avgPpm) * 1_000_000;
      }
    }
    
    // If we can't calculate, use a placeholder or estimate
    if (totalDeliveries === 0) {
      // Estimate: assume average PPM of 50, or use a large number as placeholder
      totalDeliveries = totalDefectiveForPpm > 0 
        ? (totalDefectiveForPpm / 50) * 1_000_000 
        : 9_088_100; // Placeholder from reference
    }

    // Calculate filtered PPM (average of customer and supplier PPM)
    const allPpms = [
      ...filteredKpis.map((k) => k.customerPpm).filter((p): p is number => p !== null),
      ...filteredKpis.map((k) => k.supplierPpm).filter((p): p is number => p !== null),
    ];
    const filteredPpm = allPpms.length > 0
      ? allPpms.reduce((sum, p) => sum + p, 0) / allPpms.length
      : null;

    return {
      totalComplaints,
      totalDefective,
      totalDeliveries,
      filteredPpm,
      selectedSitesCount: selectedSites.length,
      totalSites: availableSites.length,
    };
  }, [filteredKpis, selectedSites, availableSites]);

  // Aggregate data for charts
  // All charts use filteredKpis, so they automatically reflect the selected filters:
  // - Plant selection: shows only selected plants (or all plants if none selected)
  // - Date range: shows only dates within range
  // - Complaint/Notification types: shows only selected types
  // When multiple plants are selected, charts show each plant separately for comparison
  // Metrics show cumulative values across all filtered plants
  const notificationsByMonthPlant = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    
    // Get the list of sites to include (only selected plants if filters are applied)
    let sitesToInclude = filters.selectedPlants.length > 0 
      ? filters.selectedPlants 
      : Array.from(new Set(filteredKpis.map((k) => k.siteCode)));
    
    // Apply local chart filter if a plant is selected in the legend
    if (selectedPlantForChart) {
      sitesToInclude = sitesToInclude.filter(site => site === selectedPlantForChart);
    }
    
    // In customer view mode, only show Q1 notifications
    const effectiveNotificationTypes = isCustomerView
      ? new Set(["Q1"])
      : isSupplierView
        ? new Set(["Q2"])
        : selectedNotificationTypes;
    
    filteredKpis.forEach((kpi) => {
      // Only include sites that are in the selected plants (if filters are applied)
      if (filters.selectedPlants.length > 0 && !filters.selectedPlants.includes(kpi.siteCode)) {
        return;
      }
      
      // Apply local chart filter
      if (selectedPlantForChart && kpi.siteCode !== selectedPlantForChart) {
        return;
      }
      
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, {});
      }
      const monthData = byMonth.get(kpi.month)!;
      // Only include selected notification types (Q1, Q2, Q3) - force Q1 in customer view
      const total = (effectiveNotificationTypes.has("Q1") ? kpi.customerComplaintsQ1 : 0) +
                    (effectiveNotificationTypes.has("Q2") ? kpi.supplierComplaintsQ2 : 0) +
                    (effectiveNotificationTypes.has("Q3") ? kpi.internalComplaintsQ3 : 0);
      // Aggregate by site code - if same site appears multiple times (different months), sum them
      monthData[kpi.siteCode] = (monthData[kpi.siteCode] || 0) + total;
    });

    const months = Array.from(byMonth.keys()).sort();
    return months.map((month) => {
      const data: Record<string, any> = { month: month };
      const monthData = byMonth.get(month);
      let total = 0;
      if (monthData) {
        // Only include sites that are in the selected plants
        Object.entries(monthData).forEach(([site, count]) => {
          if (sitesToInclude.includes(site)) {
            data[`Site ${site}`] = count;
            total += count;
          }
        });
      }
      // Add total for label display
      data.total = total;
      return data;
    });
  }, [filteredKpis, filters.selectedPlants, selectedNotificationTypes, selectedPlantForChart, isCustomerView, isSupplierView]);

  // Calculate maximum Y-axis value from unfiltered data (all available plants)
  // This ensures the Y-axis scale stays constant when filtering by plant
  const maxYAxisValue = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    
    // Get the list of sites to include (only selected plants if filters are applied)
    // BUT don't apply the local chart filter (selectedPlantForChart) - use all available plants
    const sitesToInclude = filters.selectedPlants.length > 0 
      ? filters.selectedPlants 
      : Array.from(new Set(filteredKpis.map((k) => k.siteCode)));
    
    // In customer view mode, only show Q1 notifications
    const effectiveNotificationTypes = isCustomerView
      ? new Set(["Q1"])
      : isSupplierView
        ? new Set(["Q2"])
        : selectedNotificationTypes;
    
    filteredKpis.forEach((kpi) => {
      // Only include sites that are in the selected plants (if filters are applied)
      if (filters.selectedPlants.length > 0 && !filters.selectedPlants.includes(kpi.siteCode)) {
        return;
      }
      
      // Don't apply local chart filter here - we want the max from all available plants
      
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, {});
      }
      const monthData = byMonth.get(kpi.month)!;
      // Only include selected notification types (Q1, Q2, Q3) - force Q1 in customer view
      const total = (effectiveNotificationTypes.has("Q1") ? kpi.customerComplaintsQ1 : 0) +
                    (effectiveNotificationTypes.has("Q2") ? kpi.supplierComplaintsQ2 : 0) +
                    (effectiveNotificationTypes.has("Q3") ? kpi.internalComplaintsQ3 : 0);
      // Aggregate by site code
      monthData[kpi.siteCode] = (monthData[kpi.siteCode] || 0) + total;
    });

    const months = Array.from(byMonth.keys()).sort();
    const allTotals = months.map((month) => {
      const monthData = byMonth.get(month);
      let total = 0;
      if (monthData) {
        // Sum all sites for this month
        Object.entries(monthData).forEach(([site, count]) => {
          if (sitesToInclude.includes(site)) {
            total += count;
          }
        });
      }
      return total;
    });

    // Find the maximum total across all months
    const maxTotal = allTotals.length > 0 ? Math.max(...allTotals) : 0;
    
    // Round up to the next nice number (e.g., if max is 101, round to 120)
    // This provides some padding at the top
    if (maxTotal === 0) return 100;
    const rounded = Math.ceil(maxTotal / 20) * 20; // Round to nearest 20
    return Math.max(rounded, 100); // Minimum of 100
  }, [filteredKpis, filters.selectedPlants, selectedNotificationTypes, isCustomerView, isSupplierView]);

  // Aggregate defects data by month and plant
  const defectsByMonthPlant = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    
    // Get the list of sites to include (only selected plants if filters are applied)
    let sitesToInclude = filters.selectedPlants.length > 0 
      ? filters.selectedPlants 
      : Array.from(new Set(filteredKpis.map((k) => k.siteCode)));
    
    // Apply local chart filter if a plant is selected in the legend
    if (selectedPlantForDefectsChart) {
      sitesToInclude = sitesToInclude.filter(site => site === selectedPlantForDefectsChart);
    }
    
    // In customer view mode, only show Customer defects
    const effectiveDefectType = isCustomerView ? "Customer" : isSupplierView ? "Supplier" : selectedDefectType;
    
    filteredKpis.forEach((kpi) => {
      // Only include sites that are in the selected plants (if filters are applied)
      if (filters.selectedPlants.length > 0 && !filters.selectedPlants.includes(kpi.siteCode)) {
        return;
      }
      
      // Apply local chart filter
      if (selectedPlantForDefectsChart && kpi.siteCode !== selectedPlantForDefectsChart) {
        return;
      }
      
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, {});
      }
      const monthData = byMonth.get(kpi.month)!;
      
      // Calculate defects based on selected defect type - force Customer in customer view
      let defects = 0;
      if (effectiveDefectType === "Customer" || effectiveDefectType === "Both") {
        defects += kpi.customerDefectiveParts || 0;
      }
      if (effectiveDefectType === "Supplier" || effectiveDefectType === "Both") {
        defects += kpi.supplierDefectiveParts || 0;
      }
      
      // Aggregate by site code
      monthData[kpi.siteCode] = (monthData[kpi.siteCode] || 0) + defects;
    });

    const months = Array.from(byMonth.keys()).sort();
    return months.map((month) => {
      const data: Record<string, any> = { month: month };
      const monthData = byMonth.get(month);
      let total = 0;
      if (monthData) {
        // Only include sites that are in the selected plants
        Object.entries(monthData).forEach(([site, count]) => {
          if (sitesToInclude.includes(site)) {
            data[`Site ${site}`] = count;
            total += count;
          }
        });
      }
      // Add total for label display
      data.total = total;
      return data;
    });
  }, [filteredKpis, filters.selectedPlants, selectedDefectType, selectedPlantForDefectsChart, isCustomerView, isSupplierView]);

  // Calculate maximum Y-axis value for defects chart from unfiltered data
  const maxYAxisValueDefects = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    
    const sitesToInclude = filters.selectedPlants.length > 0 
      ? filters.selectedPlants 
      : Array.from(new Set(filteredKpis.map((k) => k.siteCode)));
    
    // In customer view mode, only show Customer defects
    const effectiveDefectType = isCustomerView ? "Customer" : isSupplierView ? "Supplier" : selectedDefectType;
    
    filteredKpis.forEach((kpi) => {
      if (filters.selectedPlants.length > 0 && !filters.selectedPlants.includes(kpi.siteCode)) {
        return;
      }
      
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, {});
      }
      const monthData = byMonth.get(kpi.month)!;
      
      // Calculate defects based on selected defect type (but use all available plants) - force Customer in customer view
      let defects = 0;
      if (effectiveDefectType === "Customer" || effectiveDefectType === "Both") {
        defects += kpi.customerDefectiveParts || 0;
      }
      if (effectiveDefectType === "Supplier" || effectiveDefectType === "Both") {
        defects += kpi.supplierDefectiveParts || 0;
      }
      
      monthData[kpi.siteCode] = (monthData[kpi.siteCode] || 0) + defects;
    });

    const months = Array.from(byMonth.keys()).sort();
    const allTotals = months.map((month) => {
      const monthData = byMonth.get(month);
      let total = 0;
      if (monthData) {
        Object.entries(monthData).forEach(([site, count]) => {
          if (sitesToInclude.includes(site)) {
            total += count;
          }
        });
      }
      return total;
    });

    const maxTotal = allTotals.length > 0 ? Math.max(...allTotals) : 0;
    if (maxTotal === 0) return 1000;
    const rounded = Math.ceil(maxTotal / 100) * 100; // Round to nearest 100 for defects
    return Math.max(rounded, 1000); // Minimum of 1000
  }, [filteredKpis, filters.selectedPlants, selectedDefectType, isCustomerView, isSupplierView]);

  // All available sites for the defects chart (before local legend filter)
  const availableChartSitesDefects = useMemo(() => {
    const sitesFromData = Array.from(new Set(filteredKpis.map((k) => k.siteCode))).sort();
    if (filters.selectedPlants.length > 0) {
      return sitesFromData.filter(site => filters.selectedPlants.includes(site));
    }
    return sitesFromData;
  }, [filteredKpis, filters.selectedPlants]);

  // Chart sites after applying local legend filter for defects chart
  const chartSitesDefects = useMemo(() => {
    if (selectedPlantForDefectsChart) {
      return availableChartSitesDefects.filter(site => site === selectedPlantForDefectsChart);
    }
    return availableChartSitesDefects;
  }, [availableChartSitesDefects, selectedPlantForDefectsChart]);

  const notificationsByType = useMemo(() => {
    const byMonth = new Map<string, { Q1: number; Q2: number; Q3: number; D: number; P: number }>();
    
    // In customer view mode, only show Q1 notifications
    const effectiveNotificationTypes = isCustomerView
      ? new Set(["Q1"])
      : isSupplierView
        ? new Set(["Q2"])
        : selectedNotificationTypes;
    
    filteredKpis.forEach((kpi) => {
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, { Q1: 0, Q2: 0, Q3: 0, D: 0, P: 0 });
      }
      const monthData = byMonth.get(kpi.month)!;
      monthData.Q1 += kpi.customerComplaintsQ1;
      monthData.Q2 += kpi.supplierComplaintsQ2;
      monthData.Q3 += kpi.internalComplaintsQ3;
      monthData.D += kpi.deviationsD;
      monthData.P += kpi.ppapP.inProgress + kpi.ppapP.completed;
    });

    const months = Array.from(byMonth.keys()).sort();
    return months.map((month) => {
      const monthData = byMonth.get(month)!;
      // Calculate total for label display (only selected Q1, Q2, Q3) - force Q1 in customer view
      const total = (effectiveNotificationTypes.has("Q1") ? (monthData.Q1 || 0) : 0) +
                    (effectiveNotificationTypes.has("Q2") ? (monthData.Q2 || 0) : 0) +
                    (effectiveNotificationTypes.has("Q3") ? (monthData.Q3 || 0) : 0);
      return {
        month,
        ...monthData,
        total,
      };
    });
  }, [filteredKpis, selectedNotificationTypes, isCustomerView, isSupplierView]);

  // Customer PPM Trend Data with configurable average period
  // Calculate PPM the same way as metrics: aggregate defective parts and deliveries per month, then calculate PPM
  const customerPpmTrendData = useMemo(() => {
    const byMonth = new Map<string, { totalDefective: number; totalDeliveries: number; ppm: number }>();
    
    // Aggregate defective parts and deliveries per month across all sites
    filteredKpis.forEach((kpi) => {
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, { totalDefective: 0, totalDeliveries: 0, ppm: 0 });
      }
      const monthData = byMonth.get(kpi.month)!;
      monthData.totalDefective += kpi.customerDefectiveParts || 0;
      monthData.totalDeliveries += kpi.customerDeliveries || 0;
    });

    const months = Array.from(byMonth.keys()).sort();
    const period = parseInt(customerPpmAveragePeriod);
    
    // Calculate PPM for each month using the same formula as metrics
    const monthlyPpmData = months.map((month) => {
      const data = byMonth.get(month)!;
      // PPM = (total defective / total deliveries) * 1,000,000
      const ppm = data.totalDeliveries > 0 
        ? (data.totalDefective / data.totalDeliveries) * 1_000_000 
        : 0;
      
      return {
        month,
        ppm,
        totalDefective: data.totalDefective,
        totalDeliveries: data.totalDeliveries,
      };
    });
    
    // Calculate N-month average trend for each month
    return monthlyPpmData.map((data, monthIndex) => {
      let periodAvg = data.ppm;
      
      if (monthIndex >= period - 1) {
        // Calculate average of PPM values over the selected period
        const prevMonths = monthlyPpmData.slice(monthIndex - (period - 1), monthIndex + 1);
        const sum = prevMonths.reduce((sum, m) => sum + m.ppm, 0);
        periodAvg = sum / prevMonths.length;
      } else if (monthIndex > 0) {
        // For months before we have enough data, use available months
        const prevMonths = monthlyPpmData.slice(0, monthIndex + 1);
        const sum = prevMonths.reduce((sum, m) => sum + m.ppm, 0);
        periodAvg = sum / prevMonths.length;
      }

      return {
        month: data.month,
        ppm: data.ppm,
        averageTarget: periodAvg,
      };
    });
  }, [filteredKpis, customerPpmAveragePeriod]);

  const ppmTrendData = useMemo(() => {
    const byMonth = new Map<string, { ppm: number; count: number }>();
    
    filteredKpis.forEach((kpi) => {
      if (kpi.customerPpm !== null) {
        if (!byMonth.has(kpi.month)) {
          byMonth.set(kpi.month, { ppm: 0, count: 0 });
        }
        const monthData = byMonth.get(kpi.month)!;
        monthData.ppm += kpi.customerPpm;
        monthData.count += 1;
      }
    });

    const months = Array.from(byMonth.keys()).sort();
    return months.map((month) => {
      const data = byMonth.get(month)!;
      const avgPpm = data.count > 0 ? data.ppm / data.count : 0;
      
      // Calculate 3-month average
      const monthIndex = months.indexOf(month);
      let threeMonthAvg = avgPpm;
      if (monthIndex >= 2) {
        const prev3Months = months.slice(monthIndex - 2, monthIndex + 1);
        const sum = prev3Months.reduce((sum, m) => {
          const mData = byMonth.get(m);
          return sum + (mData && mData.count > 0 ? mData.ppm / mData.count : 0);
        }, 0);
        threeMonthAvg = sum / prev3Months.length;
      }

      return {
        month,
        ppm: avgPpm,
        threeMonthAvg,
      };
    });
  }, [filteredKpis]);

  // Monthly Trend Table - Use same calculation as Customer PPM chart
  const monthlyTrendTable = useMemo(() => {
    const byMonth = new Map<string, { 
      totalDefective: number; 
      totalDeliveries: number;
    }>();
    
    // Aggregate customer defective parts and deliveries per month across all sites
    filteredKpis.forEach((kpi) => {
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, { totalDefective: 0, totalDeliveries: 0 });
      }
      const monthData = byMonth.get(kpi.month)!;
      monthData.totalDefective += kpi.customerDefectiveParts || 0;
      monthData.totalDeliveries += kpi.customerDeliveries || 0;
    });

    const months = Array.from(byMonth.keys()).sort();
    let prevPpm: number | null = null;
    let prevDefective: number | null = null;
    let prevDeliveries: number | null = null;

    // Calculate PPM for each month first
    const monthlyPpmData = months.map((month) => {
      const data = byMonth.get(month)!;
      // Calculate PPM the same way as the chart: (total defective / total deliveries) * 1,000,000
      const ppm = data.totalDeliveries > 0 
        ? (data.totalDefective / data.totalDeliveries) * 1_000_000 
        : 0;
      return { month, ppm, data };
    });

    // Calculate 3-month average for each month
    return monthlyPpmData.map((item, monthIndex) => {
      const { month, ppm, data } = item;
      
      // Calculate 3-month average
      let threeMonthAvg = ppm;
      if (monthIndex >= 2) {
        // Calculate average of last 3 months including current
        const prev3Months = monthlyPpmData.slice(monthIndex - 2, monthIndex + 1);
        const sum = prev3Months.reduce((sum, m) => sum + m.ppm, 0);
        threeMonthAvg = sum / prev3Months.length;
      } else if (monthIndex > 0) {
        // For months before we have 3 months, use available months
        const prevMonths = monthlyPpmData.slice(0, monthIndex + 1);
        const sum = prevMonths.reduce((sum, m) => sum + m.ppm, 0);
        threeMonthAvg = sum / prevMonths.length;
      }
      
      const ppmChange = prevPpm !== null && prevPpm > 0
        ? ((ppm - prevPpm) / prevPpm) * 100
        : null;
      const defectiveChange = prevDefective !== null && prevDefective > 0
        ? ((data.totalDefective - prevDefective) / prevDefective) * 100
        : null;
      const deliveriesChange = prevDeliveries !== null && prevDeliveries > 0
        ? ((data.totalDeliveries - prevDeliveries) / prevDeliveries) * 100
        : null;

      prevPpm = ppm;
      prevDefective = data.totalDefective;
      prevDeliveries = data.totalDeliveries;

      // Format month as "Jan 2025" format
      const monthDate = new Date(month + "-01");
      const formattedMonth = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      return {
        month: formattedMonth,
        ppm,
        threeMonthAvg,
        ppmChange,
        defective: data.totalDefective,
        defectiveChange,
        deliveries: data.totalDeliveries,
        deliveriesChange,
      };
    });
  }, [filteredKpis]);

  // Customer PPM Site Contribution per Month
  const customerPpmSiteContribution = useMemo(() => {
    const bySiteMonth = new Map<string, Map<string, { defective: number; deliveries: number }>>();
    const months = new Set<string>();
    
    // Filter by selected plants if any are selected
    const sitesToInclude = filters.selectedPlants.length > 0 
      ? filters.selectedPlants 
      : Array.from(new Set(filteredKpis.map((k) => k.siteCode)));
    
    // Aggregate data by site and month
    filteredKpis.forEach((kpi) => {
      // Only include sites that are in the selected plants (if filters are applied)
      if (!sitesToInclude.includes(kpi.siteCode)) {
        return;
      }
      
      months.add(kpi.month);
      if (!bySiteMonth.has(kpi.siteCode)) {
        bySiteMonth.set(kpi.siteCode, new Map());
      }
      const siteData = bySiteMonth.get(kpi.siteCode)!;
      if (!siteData.has(kpi.month)) {
        siteData.set(kpi.month, { defective: 0, deliveries: 0 });
      }
      const monthData = siteData.get(kpi.month)!;
      monthData.defective += kpi.customerDefectiveParts || 0;
      monthData.deliveries += kpi.customerDeliveries || 0;
    });

    const sortedMonths = Array.from(months).sort();
    const sortedSites = Array.from(bySiteMonth.keys()).sort();
    
    // Get site names and locations from official plants file
    const siteNames = new Map<string, string>();
    const siteLocations = new Map<string, string>();
    
    // First, use official plant data from "Webasto ET Plants.xlsx"
    plantsData.forEach((plant) => {
      if (plant.code && (plant.city || plant.location)) {
        siteNames.set(plant.code, plant.name || plant.code);
        siteLocations.set(plant.code, plant.city || plant.location || '');
      }
    });
    
    // Fallback: extract from siteName in KPIs if not found in official file
    filteredKpis.forEach((kpi) => {
      if (!siteLocations.has(kpi.siteCode) && kpi.siteName) {
        siteNames.set(kpi.siteCode, kpi.siteName);
        // Extract location abbreviation - take first 3-4 uppercase letters or first word
        // Examples: "Kampen" -> "KAM", "Vienna" -> "VIE", "Doncaster Carr" -> "DON"
        const locationMatch = kpi.siteName.match(/\b([A-Z]{2,4})\b/) || 
                             kpi.siteName.match(/^([A-Z][a-z]+)/);
        if (locationMatch) {
          const location = locationMatch[1].toUpperCase().substring(0, 3);
          siteLocations.set(kpi.siteCode, location);
        } else {
          // Fallback: use first 3 letters of siteName
          siteLocations.set(kpi.siteCode, kpi.siteName.substring(0, 3).toUpperCase());
        }
      }
    });

    // Calculate totals per month
    const totalsByMonth = new Map<string, { defective: number; deliveries: number; ppm: number }>();
    sortedMonths.forEach((month) => {
      let totalDefective = 0;
      let totalDeliveries = 0;
      sortedSites.forEach((siteCode) => {
        const siteData = bySiteMonth.get(siteCode);
        if (siteData) {
          const monthData = siteData.get(month);
          if (monthData) {
            totalDefective += monthData.defective;
            totalDeliveries += monthData.deliveries;
          }
        }
      });
      const ppm = totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
      totalsByMonth.set(month, { defective: totalDefective, deliveries: totalDeliveries, ppm });
    });

    return {
      sites: sortedSites,
      months: sortedMonths,
      siteNames,
      siteLocations,
      bySiteMonth,
      totalsByMonth,
    };
  }, [filteredKpis, filters.selectedPlants, plantsData]);

  const defectiveBySite = useMemo(() => {
    const bySite = new Map<string, { defective: number; siteName?: string }>();
    
    filteredKpis.forEach((kpi) => {
      if (!bySite.has(kpi.siteCode)) {
        bySite.set(kpi.siteCode, { defective: 0, siteName: kpi.siteName });
      }
      const siteData = bySite.get(kpi.siteCode)!;
      siteData.defective += kpi.customerComplaintsQ1 + kpi.supplierComplaintsQ2;
    });

    const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.defective, 0);
    
    return Array.from(bySite.entries()).map(([siteCode, data]) => ({
      name: `${siteCode}${data.siteName ? ` - ${data.siteName}` : ''}`,
      value: data.defective,
      percentage: total > 0 ? (data.defective / total) * 100 : 0,
    }));
  }, [filteredKpis]);

  // Defective Parts by Site - Inbound (Supplier/Q2)
  const defectiveBySiteInbound = useMemo(() => {
    const bySite = new Map<string, { defective: number; siteName?: string }>();
    
    filteredKpis.forEach((kpi) => {
      if (!bySite.has(kpi.siteCode)) {
        bySite.set(kpi.siteCode, { defective: 0, siteName: kpi.siteName });
      }
      const siteData = bySite.get(kpi.siteCode)!;
      siteData.defective += kpi.supplierComplaintsQ2; // Q2 = Supplier = Inbound
    });

    const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.defective, 0);
    
    return Array.from(bySite.entries()).map(([siteCode, data]) => ({
      name: `${siteCode}${data.siteName ? ` - ${data.siteName}` : ''}`,
      value: data.defective,
      percentage: total > 0 ? (data.defective / total) * 100 : 0,
    }));
  }, [filteredKpis]);

  // Defective Parts by Site - Outbound (Customer/Q1)
  const defectiveBySiteOutbound = useMemo(() => {
    const bySite = new Map<string, { defective: number; siteName?: string }>();
    
    filteredKpis.forEach((kpi) => {
      if (!bySite.has(kpi.siteCode)) {
        bySite.set(kpi.siteCode, { defective: 0, siteName: kpi.siteName });
      }
      const siteData = bySite.get(kpi.siteCode)!;
      siteData.defective += kpi.customerComplaintsQ1; // Q1 = Customer = Outbound
    });

    const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.defective, 0);
    
    return Array.from(bySite.entries()).map(([siteCode, data]) => ({
      name: `${siteCode}${data.siteName ? ` - ${data.siteName}` : ''}`,
      value: data.defective,
      percentage: total > 0 ? (data.defective / total) * 100 : 0,
    }));
  }, [filteredKpis]);

  // Deliveries by Site - Calculate from PPM
  const deliveriesBySiteInbound = useMemo(() => {
    const bySite = new Map<string, { deliveries: number; siteName?: string }>();
    
    filteredKpis.forEach((kpi) => {
      if (!bySite.has(kpi.siteCode)) {
        bySite.set(kpi.siteCode, { deliveries: 0, siteName: kpi.siteName });
      }
      const siteData = bySite.get(kpi.siteCode)!;
      // Calculate deliveries from supplier PPM: deliveries = (defective / PPM) * 1,000,000
      if (kpi.supplierPpm !== null && kpi.supplierPpm > 0 && kpi.supplierComplaintsQ2 > 0) {
        siteData.deliveries += (kpi.supplierComplaintsQ2 / kpi.supplierPpm) * 1_000_000;
      }
    });

    const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.deliveries, 0);
    
    return Array.from(bySite.entries()).map(([siteCode, data]) => ({
      name: `${siteCode}${data.siteName ? ` - ${data.siteName}` : ''}`,
      value: Math.round(data.deliveries),
      percentage: total > 0 ? (data.deliveries / total) * 100 : 0,
    }));
  }, [filteredKpis]);

  const deliveriesBySiteOutbound = useMemo(() => {
    const bySite = new Map<string, { deliveries: number; siteName?: string }>();
    
    filteredKpis.forEach((kpi) => {
      if (!bySite.has(kpi.siteCode)) {
        bySite.set(kpi.siteCode, { deliveries: 0, siteName: kpi.siteName });
      }
      const siteData = bySite.get(kpi.siteCode)!;
      // Calculate deliveries from customer PPM: deliveries = (defective / PPM) * 1,000,000
      if (kpi.customerPpm !== null && kpi.customerPpm > 0 && kpi.customerComplaintsQ1 > 0) {
        siteData.deliveries += (kpi.customerComplaintsQ1 / kpi.customerPpm) * 1_000_000;
      }
    });

    const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.deliveries, 0);
    
    return Array.from(bySite.entries()).map(([siteCode, data]) => ({
      name: `${siteCode}${data.siteName ? ` - ${data.siteName}` : ''}`,
      value: Math.round(data.deliveries),
      percentage: total > 0 ? (data.deliveries / total) * 100 : 0,
    }));
  }, [filteredKpis]);

  // Supplier PPM Trend Data - Similar to customer
  const supplierPpmTrendData = useMemo(() => {
    const byMonth = new Map<string, { totalDefective: number; totalDeliveries: number; ppm: number }>();
    
    // Aggregate supplier defective parts and deliveries per month across all sites
    filteredKpis.forEach((kpi) => {
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, { totalDefective: 0, totalDeliveries: 0, ppm: 0 });
      }
      const monthData = byMonth.get(kpi.month)!;
      monthData.totalDefective += kpi.supplierDefectiveParts || 0;
      monthData.totalDeliveries += kpi.supplierDeliveries || 0;
    });

    const months = Array.from(byMonth.keys()).sort();
    const period = parseInt(supplierPpmAveragePeriod);
    
    // Calculate PPM for each month using the same formula as metrics
    const monthlyPpmData = months.map((month) => {
      const data = byMonth.get(month)!;
      // PPM = (total defective / total deliveries) * 1,000,000
      const ppm = data.totalDeliveries > 0 
        ? (data.totalDefective / data.totalDeliveries) * 1_000_000 
        : 0;
      
      return {
        month,
        ppm,
        totalDefective: data.totalDefective,
        totalDeliveries: data.totalDeliveries,
      };
    });
    
    // Calculate N-month average trend for each month
    return monthlyPpmData.map((data, monthIndex) => {
      let periodAvg = data.ppm;
      
      if (monthIndex >= period - 1) {
        // Calculate average of PPM values over the selected period
        const prevMonths = monthlyPpmData.slice(monthIndex - (period - 1), monthIndex + 1);
        const sum = prevMonths.reduce((sum, m) => sum + m.ppm, 0);
        periodAvg = sum / prevMonths.length;
      } else if (monthIndex > 0) {
        // For months before we have enough data, use available months
        const prevMonths = monthlyPpmData.slice(0, monthIndex + 1);
        const sum = prevMonths.reduce((sum, m) => sum + m.ppm, 0);
        periodAvg = sum / prevMonths.length;
      }

      return {
        month: data.month,
        ppm: data.ppm,
        averageTarget: periodAvg,
      };
    });
  }, [filteredKpis, supplierPpmAveragePeriod]);

  // Supplier Monthly Trend Table
  const supplierMonthlyTrendTable = useMemo(() => {
    const byMonth = new Map<string, { 
      totalDefective: number; 
      totalDeliveries: number;
    }>();
    
    // Aggregate supplier defective parts and deliveries per month across all sites
    filteredKpis.forEach((kpi) => {
      if (!byMonth.has(kpi.month)) {
        byMonth.set(kpi.month, { totalDefective: 0, totalDeliveries: 0 });
      }
      const monthData = byMonth.get(kpi.month)!;
      monthData.totalDefective += kpi.supplierDefectiveParts || 0;
      monthData.totalDeliveries += kpi.supplierDeliveries || 0;
    });

    const months = Array.from(byMonth.keys()).sort();
    let prevPpm: number | null = null;
    let prevDefective: number | null = null;
    let prevDeliveries: number | null = null;

    // Calculate PPM for each month first
    const monthlyPpmData = months.map((month) => {
      const data = byMonth.get(month)!;
      // Calculate PPM the same way as the chart: (total defective / total deliveries) * 1,000,000
      const ppm = data.totalDeliveries > 0 
        ? (data.totalDefective / data.totalDeliveries) * 1_000_000 
        : 0;
      return { month, ppm, data };
    });

    // Calculate 3-month average for each month
    return monthlyPpmData.map((item, monthIndex) => {
      const { month, ppm, data } = item;
      
      // Calculate 3-month average
      let threeMonthAvg = ppm;
      if (monthIndex >= 2) {
        // Calculate average of last 3 months including current
        const prev3Months = monthlyPpmData.slice(monthIndex - 2, monthIndex + 1);
        const sum = prev3Months.reduce((sum, m) => sum + m.ppm, 0);
        threeMonthAvg = sum / prev3Months.length;
      } else if (monthIndex > 0) {
        // For months before we have 3 months, use available months
        const prevMonths = monthlyPpmData.slice(0, monthIndex + 1);
        const sum = prevMonths.reduce((sum, m) => sum + m.ppm, 0);
        threeMonthAvg = sum / prevMonths.length;
      }
      
      const ppmChange = prevPpm !== null && prevPpm > 0
        ? ((ppm - prevPpm) / prevPpm) * 100
        : null;
      const defectiveChange = prevDefective !== null && prevDefective > 0
        ? ((data.totalDefective - prevDefective) / prevDefective) * 100
        : null;
      const deliveriesChange = prevDeliveries !== null && prevDeliveries > 0
        ? ((data.totalDeliveries - prevDeliveries) / prevDeliveries) * 100
        : null;

      prevPpm = ppm;
      prevDefective = data.totalDefective;
      prevDeliveries = data.totalDeliveries;

      // Format month as "Jan 2025" format
      const monthDate = new Date(month + "-01");
      const formattedMonth = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      return {
        month: formattedMonth,
        ppm,
        threeMonthAvg,
        ppmChange,
        defective: data.totalDefective,
        defectiveChange,
        deliveries: data.totalDeliveries,
        deliveriesChange,
      };
    });
  }, [filteredKpis, plantsData]);

  // Supplier PPM Site Contribution per Month
  const supplierPpmSiteContribution = useMemo(() => {
    const bySiteMonth = new Map<string, Map<string, { defective: number; deliveries: number }>>();
    const months = new Set<string>();
    
    // Filter by selected plants if any are selected
    const sitesToInclude = filters.selectedPlants.length > 0 
      ? filters.selectedPlants 
      : Array.from(new Set(filteredKpis.map((k) => k.siteCode)));
    
    // Aggregate data by site and month
    filteredKpis.forEach((kpi) => {
      // Only include sites that are in the selected plants (if filters are applied)
      if (!sitesToInclude.includes(kpi.siteCode)) {
        return;
      }
      
      months.add(kpi.month);
      if (!bySiteMonth.has(kpi.siteCode)) {
        bySiteMonth.set(kpi.siteCode, new Map());
      }
      const siteData = bySiteMonth.get(kpi.siteCode)!;
      if (!siteData.has(kpi.month)) {
        siteData.set(kpi.month, { defective: 0, deliveries: 0 });
      }
      const monthData = siteData.get(kpi.month)!;
      monthData.defective += kpi.supplierDefectiveParts || 0;
      monthData.deliveries += kpi.supplierDeliveries || 0;
    });

    const sortedMonths = Array.from(months).sort();
    const sortedSites = Array.from(bySiteMonth.keys()).sort();
    
    // Get site names and locations from official plants file
    const siteNames = new Map<string, string>();
    const siteLocations = new Map<string, string>();
    
    // First, use official plant data from "Webasto ET Plants.xlsx"
    plantsData.forEach((plant) => {
      if (plant.code && (plant.city || plant.location)) {
        siteNames.set(plant.code, plant.name || plant.code);
        siteLocations.set(plant.code, plant.city || plant.location || '');
      }
    });
    
    // Fallback: extract from siteName in KPIs if not found in official file
    filteredKpis.forEach((kpi) => {
      if (!siteLocations.has(kpi.siteCode) && kpi.siteName) {
        siteNames.set(kpi.siteCode, kpi.siteName);
        // Extract location abbreviation - take first 3-4 uppercase letters or first word
        const locationMatch = kpi.siteName.match(/\b([A-Z]{2,4})\b/) || 
                             kpi.siteName.match(/^([A-Z][a-z]+)/);
        if (locationMatch) {
          const location = locationMatch[1].toUpperCase().substring(0, 3);
          siteLocations.set(kpi.siteCode, location);
        } else {
          // Fallback: use first 3 letters of siteName
          siteLocations.set(kpi.siteCode, kpi.siteName.substring(0, 3).toUpperCase());
        }
      }
    });

    // Calculate totals per month
    const totalsByMonth = new Map<string, { defective: number; deliveries: number; ppm: number }>();
    sortedMonths.forEach((month) => {
      let totalDefective = 0;
      let totalDeliveries = 0;
      sortedSites.forEach((siteCode) => {
        const siteData = bySiteMonth.get(siteCode);
        if (siteData) {
          const monthData = siteData.get(month);
          if (monthData) {
            totalDefective += monthData.defective;
            totalDeliveries += monthData.deliveries;
          }
        }
      });
      const ppm = totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
      totalsByMonth.set(month, { defective: totalDefective, deliveries: totalDeliveries, ppm });
    });

    return {
      sites: sortedSites,
      months: sortedMonths,
      siteNames,
      siteLocations,
      bySiteMonth,
      totalsByMonth,
    };
  }, [filteredKpis, filters.selectedPlants, plantsData]);

  const toggleSite = useCallback((site: string) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
  }, []);

  const selectAllSites = useCallback(() => {
    setSelectedSites(availableSites);
  }, [availableSites]);

  const clearAllSites = useCallback(() => {
    setSelectedSites([]);
  }, []);

  // Get month name for display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const selectedMonthName = selectedMonth !== null ? monthNames[selectedMonth - 1] : '';

  // Enhanced Metric Tile Component
  // Helper function to format numbers in German locale (comma for decimal, dot for thousands)
  const formatGermanNumber = (num: number, decimals: number = 0): string => {
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const MetricTile = ({
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color, 
    trend, 
    sparklineDataKey,
    infoContent,
    hideChangePercentage = false,
    onClick
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: string;
    trend: TrendData;
    sparklineDataKey?: string;
    infoContent?: React.ReactNode;
    hideChangePercentage?: boolean;
    onClick?: () => void;
  }) => {
    return (
      <Card 
        className={cn(
          "bg-card/50 transition-all hover:shadow-lg glass-card-glow h-full flex flex-col",
          onClick && "cursor-pointer hover:scale-[1.02]"
        )} 
        style={{ borderColor: color, borderWidth: '2px' }}
        onClick={onClick}
      >
        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Top Row: Title (left) + Icon (right) */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2 flex-1">
              <div className="flex flex-col">
                {title.startsWith('Customer ') ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Customer
                    </p>
                    <div className="flex items-center gap-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {title.replace('Customer ', '').replace(' Parts', '')}
                      </p>
                      {title.includes('Parts') && (
                        <>
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parts</span>
                          {infoContent && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent -mt-0.5 ml-0.5">
                                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                                {infoContent}
                              </PopoverContent>
                            </Popover>
                          )}
                        </>
                      )}
                      {!title.includes('Parts') && infoContent && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent -mt-0.5 ml-0.5">
                              <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                            {infoContent}
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </>
                ) : title.startsWith('Supplier ') ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Supplier
                    </p>
                    <div className="flex items-center gap-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {title.replace('Supplier ', '').replace(' Parts', '')}
                      </p>
                      {title.includes('Parts') && (
                        <>
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parts</span>
                          {infoContent && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent -mt-0.5 ml-0.5">
                                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                                {infoContent}
                              </PopoverContent>
                            </Popover>
                          )}
                        </>
                      )}
                      {!title.includes('Parts') && infoContent && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent -mt-0.5 ml-0.5">
                              <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                            {infoContent}
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {title}
                    </p>
                    {infoContent && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-3 w-3 p-0 hover:bg-transparent -mt-0.5">
                            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                          {infoContent}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20`, borderColor: `${color}50`, borderWidth: '1px' }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
          </div>

          {/* Value */}
          <div className="mb-3">
            <p className="text-3xl font-bold text-foreground">
              {typeof value === 'number' 
                ? formatGermanNumber(Math.round(value), 0)
                : value}
            </p>
          </div>

          {/* Change Percentage - Under Value */}
          {!hideChangePercentage && (
            <div className="mb-3">
              {trend.trend === 'up' && (
                <Badge variant="destructive" className="text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {formatGermanNumber(trend.changePercent, 1)}%
                </Badge>
              )}
              {trend.trend === 'down' && (
                <Badge variant="default" className="text-xs bg-green-600">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {formatGermanNumber(trend.changePercent, 1)}%
                </Badge>
              )}
              {trend.trend === 'stable' && (
                <Badge variant="secondary" className="text-xs">
                  <Minus className="h-3 w-3 mr-1" />
                  {formatGermanNumber(trend.changePercent, 1)}%
                </Badge>
              )}
            </div>
          )}
          
          {/* Sparkline Chart */}
          {sparklineDataKey && sparklineData.length > 1 && (
            <div className="h-12 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData.slice(-6)}>
                  <Line
                    type="monotone"
                    dataKey={sparklineDataKey}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Information/Description at Bottom */}
          <p className="text-xs text-muted-foreground mt-auto">{subtitle}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              {isCustomerView
                ? "Customer Performance YTD //"
                : isSupplierView
                  ? "Supplier Performance YTD //"
                  : "QOS ET Dashboard YTD //"}
            </h1>
            {selectedMonth !== null && selectedYear !== null && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value, 10))}
                >
                  <SelectTrigger className="min-w-[180px] w-auto h-auto py-1 px-2 text-3xl font-bold tracking-tight border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-transparent">
                    <SelectValue className="text-3xl font-bold tracking-tight" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((monthName, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
                >
                  <SelectTrigger className="min-w-[120px] w-auto h-auto py-1 px-2 text-3xl font-bold tracking-tight border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-transparent">
                    <SelectValue className="text-3xl font-bold tracking-tight" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonthsYears.years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            {isCustomerView
              ? "Customer Performance"
              : isSupplierView
                ? "Supplier Performance"
                : "Customer + Supplier Performance • Cost Performance • Internal Performance"}
          </p>
          {selectedMonth !== null && selectedYear !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing 12-month lookback from {selectedMonthName} {selectedYear}
              {lookbackPeriod.startMonthStr !== lookbackPeriod.endMonthStr && (
                <> ({lookbackPeriod.startMonthStr} to {lookbackPeriod.endMonthStr})</>
              )}
            </p>
          )}
        </div>

      {/* Combined Metrics Section with Sidebar */}
      <div className="space-y-2">
        {/* Headings */}
        <h2 className="text-lg font-semibold text-foreground">
          {isSupplierView ? "YTD Supplier Metrics" : "YTD Customer Metrics"}
        </h2>
        
        {/* Metrics and Sidebar Grid - Perfectly Aligned */}
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-stretch">
          {/* Main Metrics Area */}
          <div className="space-y-6">
            {/* Customer-only: use 2x2 grid to make tiles larger; Supplier-only: render supplier tiles instead */}
            {!isSupplierView && (
              <div
                className={cn("grid gap-4 auto-rows-fr", isCustomerView ? "md:grid-cols-2" : "md:grid-cols-4")}
                style={{ gridAutoRows: "1fr" }}
              >
          <MetricTile
            title="Customer Complaints"
            value={customerMetrics.complaints.value}
            subtitle="Q1 notifications"
            icon={AlertTriangle}
            color="#06b6d4"
            trend={customerMetrics.complaints}
            sparklineDataKey="customerComplaints"
            onClick={() => {
              // Set notification type filter to show only Q1 (Customer Complaints)
              setSelectedNotificationTypes(new Set(["Q1"]));
              // Scroll to the chart
              setTimeout(() => {
                notificationsChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
          <MetricTile
            title="Customer Deliveries"
            value={customerMetrics.deliveries.value > 0 
              ? `${formatGermanNumber(customerMetrics.deliveries.value / 1_000_000, 2)}M`
              : 'N/A'}
            subtitle="Parts shipped"
            icon={Package}
            color="#00BCD4"
            trend={customerMetrics.deliveries}
            sparklineDataKey="customerDeliveries"
            onClick={() => {
              // Scroll to the Customer Deliveries chart
              setTimeout(() => {
                customerDeliveriesChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
          <MetricTile
            title="Customer Defective Parts"
            value={customerMetrics.defective.value}
            subtitle="Q1 defective"
            icon={TrendingDown}
            color="#F44336"
            trend={customerMetrics.defective}
            sparklineDataKey="customerDefective"
            onClick={() => {
              // Set defect type filter to show only Customer defects
              setSelectedDefectType("Customer");
              // Scroll to the defects chart
              setTimeout(() => {
                defectsChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
            infoContent={
              customerMetrics.conversions?.hasConversions ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Unit Conversion Summary</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Some customer defective parts were converted to PC (pieces) based on unit specifications found in material descriptions.
                      Supported conversions: ML → PC (bottle size), M → PC (length per piece), M² → PC (area per piece).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Converted:</span>
                      <span className="font-medium">{customerMetrics.conversions.totalConverted} complaints</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Original Units:</span>
                      <span className="font-medium">
                        {formatGermanNumber(customerMetrics.conversions.details.reduce((sum, c) => sum + c.originalML, 0), 0)} 
                        {' '}
                        {customerMetrics.conversions.details.length > 0 && customerMetrics.conversions.details[0].originalUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total PC (converted):</span>
                      <span className="font-medium">{formatGermanNumber(customerMetrics.conversions.totalPC, 0)} PC</span>
                    </div>
                  </div>
                  {customerMetrics.conversions.details.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold mb-2">Sample Conversions:</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {customerMetrics.conversions.details.slice(0, 10).map((conv, idx) => {
                          const unit = conv.originalUnit || 'ML';
                          let unitLabel = '';
                          if (unit === 'ML') {
                            unitLabel = `${conv.bottleSize} ML/bottle`;
                          } else if (unit === 'M') {
                            unitLabel = `${conv.bottleSize} M/piece`;
                          } else if (unit === 'M2') {
                            unitLabel = `${conv.bottleSize} M²/piece`;
                          }
                          
                          return (
                            <div key={idx} className="text-xs p-2 bg-muted rounded">
                              <div className="font-medium">Notif: {conv.notificationNumber}</div>
                              <div className="text-muted-foreground">
                                {formatGermanNumber(conv.originalML, 0)} {unit} → {formatGermanNumber(conv.convertedPC, 0)} PC
                                {conv.bottleSize && ` (${unitLabel})`}
                              </div>
                              {conv.materialDescription && (
                                <div className="text-muted-foreground text-[10px] mt-1 truncate">
                                  {conv.materialDescription}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {customerMetrics.conversions.details.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
                            +{customerMetrics.conversions.details.length - 10} more conversions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Unit Information</h4>
                  <p className="text-xs text-muted-foreground">
                    All customer defective parts are shown in PC (pieces). All other units of measure, like ML or M have been converted to PC, based on calculation of the delivery unit. E.g. if in description is mentioned 600 ML, this means that it is considered as 1 PC.
                  </p>
                </div>
              )
            }
          />
          <MetricTile
            title="Customer PPM"
            value={customerMetrics.ppm.value > 0 
              ? formatGermanNumber(customerMetrics.ppm.value, 2)
              : 'N/A'}
            subtitle="Parts per million"
            icon={Activity}
            color="#4CAF50"
            trend={customerMetrics.ppm}
            sparklineDataKey="customerPpm"
            onClick={() => {
              // Scroll to the Customer PPM Trend chart
              setTimeout(() => {
                customerPpmTrendChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
              </div>
            )}

            {isSupplierView && (
              <div className={cn("grid gap-4 auto-rows-fr", "md:grid-cols-2")} style={{ gridAutoRows: "1fr" }}>
                <MetricTile
                  title="Supplier Complaints"
                  value={supplierMetrics.complaints.value}
                  subtitle="Q2 notifications"
                  icon={AlertTriangle}
                  color="#14b8a6"
                  trend={supplierMetrics.complaints}
                  sparklineDataKey="supplierComplaints"
                  onClick={() => {
                    setSelectedNotificationTypes(new Set(["Q2"]));
                    setTimeout(() => {
                      notificationsChartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }}
                />
                <MetricTile
                  title="Supplier Deliveries"
                  value={
                    supplierMetrics.deliveries.value > 0
                      ? `${formatGermanNumber(supplierMetrics.deliveries.value / 1_000_000, 2)}M`
                      : "N/A"
                  }
                  subtitle="Parts shipped"
                  icon={Package}
                  color="#00BCD4"
                  trend={supplierMetrics.deliveries}
                  sparklineDataKey="supplierDeliveries"
                  onClick={() => {
                    setTimeout(() => {
                      supplierDeliveriesChartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }}
                />
                <MetricTile
                  title="Supplier Defective Parts"
                  value={supplierMetrics.defective.value}
                  subtitle="Q2 defective"
                  icon={TrendingDown}
                  color="#F44336"
                  trend={supplierMetrics.defective}
                  sparklineDataKey="supplierDefective"
                  onClick={() => {
                    setSelectedDefectType("Supplier");
                    setTimeout(() => {
                      defectsChartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }}
                  infoContent={supplierMetrics.conversions?.hasConversions ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Unit Conversion Summary</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Some supplier defective parts were converted to PC (pieces) based on unit specifications found in material descriptions.
                          Supported conversions: ML → PC (bottle size), M → PC (length per piece), M² → PC (area per piece).
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Converted:</span>
                          <span className="font-medium">{supplierMetrics.conversions.totalConverted} complaints</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Original Units:</span>
                          <span className="font-medium">
                            {formatGermanNumber(
                              supplierMetrics.conversions.details.reduce((sum, c) => sum + c.originalML, 0),
                              0
                            )}{" "}
                            {supplierMetrics.conversions.details.length > 0 && supplierMetrics.conversions.details[0].originalUnit}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total PC (converted):</span>
                          <span className="font-medium">{formatGermanNumber(supplierMetrics.conversions.totalPC, 0)} PC</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Unit Information</h4>
                      <p className="text-xs text-muted-foreground">
                        All supplier defective parts are shown in PC (pieces). All other units of measure, like ML or M have been converted to PC, based on calculation of the delivery unit.
                      </p>
                    </div>
                  )}
                />
                <MetricTile
                  title="Supplier PPM"
                  value={supplierMetrics.ppm.value > 0 ? formatGermanNumber(supplierMetrics.ppm.value, 2) : "N/A"}
                  subtitle="Parts per million"
                  icon={Activity}
                  color="#4CAF50"
                  trend={supplierMetrics.ppm}
                  sparklineDataKey="supplierPpm"
                  onClick={() => {
                    setTimeout(() => {
                      supplierPpmTrendChartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }}
                />
              </div>
            )}

            {/* YTD Supplier Metrics Heading - Only show in full view (supplier-only view uses the main heading above) */}
            {isFullView && (
              <>
                <h2 className="text-lg font-semibold text-foreground">YTD Supplier Metrics</h2>
                
                {/* YTD Supplier Metrics Row */}
                <div className="grid gap-4 md:grid-cols-4 auto-rows-fr" style={{ gridAutoRows: '1fr' }}>
          <MetricTile
            title="Supplier Complaints"
            value={supplierMetrics.complaints.value}
            subtitle="Q2 notifications"
            icon={AlertTriangle}
            color="#14b8a6"
            trend={supplierMetrics.complaints}
            sparklineDataKey="supplierComplaints"
            onClick={() => {
              // Set notification type filter to show only Q2 (Supplier Complaints)
              setSelectedNotificationTypes(new Set(["Q2"]));
              // Scroll to the chart
              setTimeout(() => {
                notificationsChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
          <MetricTile
            title="Supplier Deliveries"
            value={supplierMetrics.deliveries.value > 0 
              ? `${formatGermanNumber(supplierMetrics.deliveries.value / 1_000_000, 2)}M`
              : 'N/A'}
            subtitle="Parts shipped"
            icon={Package}
            color="#00BCD4"
            trend={supplierMetrics.deliveries}
            sparklineDataKey="supplierDeliveries"
            onClick={() => {
              // Scroll to the Supplier Deliveries chart
              setTimeout(() => {
                supplierDeliveriesChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
          <MetricTile
            title="Supplier Defective Parts"
            value={supplierMetrics.defective.value}
            subtitle="Q2 defective"
            icon={TrendingDown}
            color="#F44336"
            trend={supplierMetrics.defective}
            sparklineDataKey="supplierDefective"
            onClick={() => {
              // Set defect type filter to show only Supplier defects
              setSelectedDefectType("Supplier");
              // Scroll to the defects chart
              setTimeout(() => {
                defectsChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
            infoContent={
              supplierMetrics.conversions?.hasConversions ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Unit Conversion Summary</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Some supplier defective parts were converted to PC (pieces) based on unit specifications found in material descriptions.
                      Supported conversions: ML → PC (bottle size), M → PC (length per piece), M² → PC (area per piece).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Converted:</span>
                      <span className="font-medium">{supplierMetrics.conversions.totalConverted} complaints</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Original Units:</span>
                      <span className="font-medium">
                        {formatGermanNumber(supplierMetrics.conversions.details.reduce((sum, c) => sum + c.originalML, 0), 0)} 
                        {' '}
                        {supplierMetrics.conversions.details.length > 0 && supplierMetrics.conversions.details[0].originalUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total PC (converted):</span>
                      <span className="font-medium">{formatGermanNumber(supplierMetrics.conversions.totalPC, 0)} PC</span>
                    </div>
                  </div>
                  {supplierMetrics.conversions.details.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold mb-2">Sample Conversions:</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {supplierMetrics.conversions.details.slice(0, 10).map((conv, idx) => {
                          const unit = conv.originalUnit || 'ML';
                          let unitLabel = '';
                          if (unit === 'ML') {
                            unitLabel = `${conv.bottleSize} ML/bottle`;
                          } else if (unit === 'M') {
                            unitLabel = `${conv.bottleSize} M/piece`;
                          } else if (unit === 'M2') {
                            unitLabel = `${conv.bottleSize} M²/piece`;
                          }
                          
                          return (
                            <div key={idx} className="text-xs p-2 bg-muted rounded">
                              <div className="font-medium">Notif: {conv.notificationNumber}</div>
                              <div className="text-muted-foreground">
                                {formatGermanNumber(conv.originalML, 0)} {unit} → {formatGermanNumber(conv.convertedPC, 0)} PC
                                {conv.bottleSize && ` (${unitLabel})`}
                              </div>
                              {conv.materialDescription && (
                                <div className="text-muted-foreground text-[10px] mt-1 truncate">
                                  {conv.materialDescription}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {supplierMetrics.conversions.details.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
                            +{supplierMetrics.conversions.details.length - 10} more conversions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Unit Information</h4>
                  <p className="text-xs text-muted-foreground">
                    All supplier defective parts are shown in PC (pieces). All other units of measure, like ML or M have been converted to PC, based on calculation of the delivery unit. E.g. if in description is mentioned 600 ML, this means that it is considered as 1 PC.
                  </p>
                </div>
              )
            }
          />
          <MetricTile
            title="Supplier PPM"
            value={supplierMetrics.ppm.value > 0 
              ? formatGermanNumber(supplierMetrics.ppm.value, 2)
              : 'N/A'}
            subtitle="Parts per million"
            icon={Activity}
            color="#4CAF50"
            trend={supplierMetrics.ppm}
            sparklineDataKey="supplierPpm"
            onClick={() => {
              // Scroll to the Supplier PPM Trend chart
              setTimeout(() => {
                supplierPpmTrendChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          />
                </div>
              </>
            )}
          </div>

          {/* Combined Selected Sites & AI Summary Sidebar */}
          <div className="flex flex-col" style={{ height: '100%' }}>
            <Card className="bg-card/50 transition-all hover:shadow-lg glass-card-glow flex flex-col overflow-hidden" style={{ borderColor: "#9E9E9E", borderWidth: '2px', height: '100%' }}>
            <CardContent className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Selected Sites Section */}
              <div className="mb-4 flex-shrink-0">
                {/* Top Row: Title (left) + Icon (right) */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Selected Sites
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "#9E9E9E20", borderColor: "#9E9E9E50", borderWidth: '1px' }}>
                    <Factory className="h-4 w-4" style={{ color: "#9E9E9E" }} />
                  </div>
                </div>

                {/* Value */}
                <div className="mb-3">
                  <p className="text-3xl font-bold text-foreground">
                    {mounted ? customerMetrics.selectedSites : 0}
                  </p>
                </div>

                {/* Information/Description at Bottom */}
                <p className="text-xs text-muted-foreground">of {totalSites} total ET Sites</p>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-4 flex-shrink-0"></div>

              {/* AI Summary Section */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Top Row: Title (left) + Icons (right) */}
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        AI Summary
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        generateAISummary();
                      }}
                      disabled={aiSummaryLoading || filteredKpis.length === 0}
                      className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh AI Summary"
                      aria-label="Refresh AI Summary"
                    >
                      <RefreshCw 
                        className={`h-3.5 w-3.5 ${aiSummaryLoading ? 'animate-spin' : ''}`} 
                        style={{ color: "#9E9E9E" }} 
                      />
                    </button>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "#9E9E9E20", borderColor: "#9E9E9E50", borderWidth: '1px' }}>
                    <Sparkles className="h-4 w-4" style={{ color: "#9E9E9E" }} />
                    </div>
                  </div>
                </div>

                {/* AI Summary Content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {aiSummaryLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                      <p className="text-sm text-muted-foreground">Generating summary...</p>
                    </div>
                  ) : aiSummaryError ? (
                    <div className="space-y-1.5 overflow-hidden">
                      <p className="text-xs text-muted-foreground italic">Unable to generate summary</p>
                      <div className="space-y-1.5 text-[10px] overflow-hidden">
                        {aiSummaryErrorType === 'api_key' ? (
                    <div className="space-y-1">
                            <p className="text-muted-foreground/90 font-medium text-[11px]">API Key Issue</p>
                            <p className="text-muted-foreground/70 leading-tight">{aiSummaryError}</p>
                            <div className="flex flex-col gap-1 mt-1.5">
                              <p className="text-muted-foreground/80 font-medium text-[10px]">How to fix:</p>
                              <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground/70 leading-tight ml-1">
                                <li>Check <code className="bg-background px-0.5 rounded text-[9px]">AI_API_KEY</code> in env vars</li>
                                <li>Verify key is valid and not expired</li>
                                <li>Get new key: 
                                  <span className="inline-flex items-center gap-0.5 ml-1">
                                    <Link 
                                      href="https://platform.openai.com/account/api-keys" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-[9px]"
                                    >
                                      OpenAI
                                    </Link>
                                    <span className="text-muted-foreground/50">|</span>
                                    <Link 
                                      href="https://console.anthropic.com/" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-[9px]"
                                    >
                                      Anthropic
                                    </Link>
                                  </span>
                                </li>
                                <li>Update <code className="bg-background px-0.5 rounded text-[9px]">.env.local</code> and restart</li>
                              </ol>
                            </div>
                          </div>
                        ) : aiSummaryErrorType === 'rate_limit' ? (
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground/90 font-medium text-[11px]">Rate Limit Exceeded</p>
                            <p className="text-muted-foreground/70 leading-tight text-[10px]">{aiSummaryError}</p>
                            <p className="text-muted-foreground/70 text-[10px] leading-tight">Wait a moment and try again.</p>
                          </div>
                        ) : aiSummaryErrorType === 'network' ? (
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground/90 font-medium text-[11px]">Network Error</p>
                            <p className="text-muted-foreground/70 leading-tight text-[10px]">{aiSummaryError}</p>
                            <p className="text-muted-foreground/70 text-[10px] leading-tight">Check your internet connection.</p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground/70 leading-tight text-[10px]">{aiSummaryError}</p>
                            {aiSummaryErrorDetails?.message && (
                              <p className="text-muted-foreground/60 text-[9px] leading-tight">
                                {aiSummaryErrorDetails.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : aiSummary ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-start overflow-hidden min-h-0">
                      {(() => {
                        // Extract 2-3 statements from the summary
                        // Split by newlines first, then by sentences if needed
                        const lines = aiSummary.split('\n').filter(line => line.trim());
                        
                        // Remove any bullet points, numbers, or prefixes
                        const cleanLines = lines.map(line => {
                          const trimmed = line.trim();
                          // Remove bullet points, dashes, or numbered prefixes
                          return trimmed.replace(/^[•\-\d+\.]\s*/, '').trim();
                        }).filter(line => line.length > 0);
                        
                        // Take first 2-3 statements (up to 3, but at least show what we have)
                        const statementsToShow = cleanLines.slice(0, 3);
                        
                        // Determine icon based on content
                        const getIcon = (text: string) => {
                          const lower = text.toLowerCase();
                          if (lower.includes('spike') || lower.includes('increase') || lower.includes('rise') || lower.includes('worsen') || lower.includes('critical') || lower.includes('risk') || lower.includes('concern') || lower.includes('issue')) {
                            return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />;
                          }
                          if (lower.includes('improve') || lower.includes('decrease') || lower.includes('better') || lower.includes('positive') || lower.includes('good') || lower.includes('excellent') || lower.includes('strong')) {
                            return <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />;
                          }
                          if (lower.includes('stable') || lower.includes('maintain') || lower.includes('consistent') || lower.includes('steady')) {
                            return <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />;
                          }
                          // Default icon
                          return <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />;
                        };
                        
                        return statementsToShow.map((statement, idx) => (
                          <div key={idx} className="flex items-start gap-2 flex-shrink-0">
                            {getIcon(statement)}
                            <p className="text-xs text-foreground leading-relaxed flex-1 min-w-0 break-words">{statement}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground italic">No summary available</p>
                      {filteredKpis.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground/70">No filtered data to analyze. Adjust filters to generate a summary.</p>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            generateAISummary();
                          }}
                          disabled={aiSummaryLoading}
                          className="text-[10px] text-primary hover:underline disabled:opacity-50"
                        >
                          Click to generate summary
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Section: Button and Subtitle - Fixed at bottom */}
                <div className="mt-auto pt-3 space-y-1.5 flex-shrink-0 border-t border-border">
                  {/* Button to AI Management Summary */}
                  <Button
                    onClick={() => router.push('/ai-summary')}
                    variant="outline"
                    size="sm"
                    className="w-full bg-[#00FF88] text-black hover:bg-[#00FF88]/90 border-[#00FF88] font-semibold text-xs py-1.5 h-auto"
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    AI Management Summary
                  </Button>

                  {/* Information/Description at Bottom - Same level as metric subtitles */}
                  <p className="text-xs text-muted-foreground text-center">Based on Selected Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* QOS KPIs Overview Section */}
      <div className="space-y-6 mt-12">
        <h2 className="text-lg font-semibold text-foreground">QOS KPIs Overview</h2>
      </div>

      {/* Legacy Key Metrics Cards - Hidden but kept for reference */}
      <div className="hidden grid gap-4 md:grid-cols-5">
        {/* Total Complaints - Yellow/Orange */}
        <Card className="border-2 border-[#FF9800] bg-card/50 hover:border-[#FF9800]/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Total Complaints
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatGermanNumber(summaryMetrics.totalComplaints, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#FF9800]/20 border border-[#FF9800]/50">
                <AlertTriangle className="h-3 w-3 text-[#FF9800]" fill="#FF9800" fillOpacity={0.2} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Quality notifications</p>
          </CardContent>
        </Card>

        {/* Total Deliveries - Teal/Green */}
        <Card className="border-2 border-[#00BCD4] bg-card/50 hover:border-[#00BCD4]/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Total Deliveries
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {summaryMetrics.totalDeliveries > 0 
                    ? `${formatGermanNumber(summaryMetrics.totalDeliveries / 1_000_000, 2)}M`
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#00BCD4]/20 border border-[#00BCD4]/50">
                <Package className="h-3 w-3 text-[#00BCD4]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Parts shipped</p>
          </CardContent>
        </Card>

        {/* Defective Parts - Red */}
        <Card className="border-2 border-[#F44336] bg-card/50 hover:border-[#F44336]/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Defective Parts
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatGermanNumber(summaryMetrics.totalDefective, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#F44336]/20 border border-[#F44336]/50">
                <TrendingDown className="h-3 w-3 text-[#F44336]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Internal + External</p>
          </CardContent>
        </Card>

        {/* Filtered PPM - Green */}
        <Card className="border-2 border-[#4CAF50] bg-card/50 hover:border-[#4CAF50]/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Filtered PPM
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {summaryMetrics.filteredPpm !== null 
                    ? formatGermanNumber(summaryMetrics.filteredPpm, 2)
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#4CAF50]/20 border border-[#4CAF50]/50">
                <Activity className="h-3 w-3 text-[#4CAF50]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Parts per million</p>
          </CardContent>
        </Card>

        {/* Selected Sites - Gray/White */}
        <Card className="border-2 border-[#9E9E9E] bg-card/50 hover:border-[#9E9E9E]/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Selected Sites
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {mounted ? summaryMetrics.selectedSitesCount : 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#9E9E9E]/20 border border-[#9E9E9E]/50">
                <Factory className="h-3 w-3 text-[#9E9E9E]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              of {mounted ? summaryMetrics.totalSites : 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* YTD Total Number of Notifications by Month and Plant Chart - Directly under metrics tiles */}
      <Card ref={notificationsChartRef} className="glass-card-glow chart-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>
                  {isCustomerView
                    ? "YTD Total Number of Customer Notifications by Month and Plant"
                    : isSupplierView
                      ? "YTD Total Number of Supplier Notifications by Month and Plant"
                      : "YTD Total Number of Notifications by Month and Plant"}
                </span>
                <TooltipProvider>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="/glossary#how-to-notifications-by-month-plant"
                        className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50 transition-colors"
                        title="How to read this chart"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>How to read this chart</TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                {isCustomerView
                  ? "Number of customer complaints (Q1) by month and plant"
                  : isSupplierView
                    ? "Number of supplier complaints (Q2) by month and plant"
                    : "Number of complaints by month and plant"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedPlantForChart && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedPlantForChart(null)}
                  title="Reset to show all plants"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset Filter
                </Button>
              )}
              {/* Only show notification type filter in full dashboard view */}
              {isFullView && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                        {(() => {
                          const selected = Array.from(selectedNotificationTypes);
                          if (selected.length === 1) {
                            if (selected[0] === "Q1") return "Customer Complaints Q1";
                            if (selected[0] === "Q2") return "Supplier Complaints Q2";
                            if (selected[0] === "Q3") return "Internal Complaints Q3";
                          }
                          if (selected.length === 2) {
                            const types = selected.sort();
                            if (types[0] === "Q1" && types[1] === "Q2") return "Customer & Supplier";
                            if (types[0] === "Q1" && types[1] === "Q3") return "Customer & Internal";
                            if (types[0] === "Q2" && types[1] === "Q3") return "Supplier & Internal";
                          }
                          return "Notification Type";
                        })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-3">
                      <div className="font-semibold text-sm mb-2">Notification Types</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-plant-q1"
                            checked={selectedNotificationTypes.has("Q1")}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedNotificationTypes);
                              if (checked) {
                                newSet.add("Q1");
                              } else {
                                newSet.delete("Q1");
                              }
                              setSelectedNotificationTypes(newSet);
                            }}
                          />
                          <Label htmlFor="filter-plant-q1" className="text-sm cursor-pointer">
                            Customer Complaints Q1
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-plant-q2"
                            checked={selectedNotificationTypes.has("Q2")}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedNotificationTypes);
                              if (checked) {
                                newSet.add("Q2");
                              } else {
                                newSet.delete("Q2");
                              }
                              setSelectedNotificationTypes(newSet);
                            }}
                          />
                          <Label htmlFor="filter-plant-q2" className="text-sm cursor-pointer">
                            Supplier Complaints Q2
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-plant-q3"
                            checked={selectedNotificationTypes.has("Q3")}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedNotificationTypes);
                              if (checked) {
                                newSet.add("Q3");
                              } else {
                                newSet.delete("Q3");
                              }
                              setSelectedNotificationTypes(newSet);
                            }}
                          />
                          <Label htmlFor="filter-plant-q3" className="text-sm cursor-pointer">
                            Internal Complaints Q3
                          </Label>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredKpis.length > 0 && notificationsByMonthPlant.length > 0 ? (
            <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={notificationsByMonthPlant} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.5)" 
                    domain={[0, maxYAxisValue]}
                  />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                  }}
                />
                {chartSites.map((site, index) => {
                  const isLastBar = index === chartSites.length - 1;
                    const siteName = formatSiteNameForChart(site, chartSites.length <= 10);
                  return (
                    <Bar 
                      key={site} 
                      dataKey={`Site ${site}`} 
                      fill={getPlantColorHex(site)}
                        name={siteName}
                      stackId="a"
                      radius={isLastBar ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      {...getBarAnimation(index)}
                    >
                      {isLastBar && (
                        <LabelList 
                          dataKey="total"
                          position="top"
                          fill="rgba(255, 255, 255, 0.9)"
                          fontSize={12}
                          fontWeight="500"
                          offset={10}
                          formatter={(value: number) => {
                            if (!value || value === 0) return '';
                            return formatGermanNumber(value, 0);
                          }}
                        />
                      )}
                    </Bar>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
              {availableChartSites.length > 0 && (
                <PlantLegend 
                  sites={availableChartSites}
                  selectedPlant={selectedPlantForChart}
                  onPlantClick={setSelectedPlantForChart}
                />
              )}
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for chart
            </div>
          )}
        </CardContent>
      </Card>

      {/* YTD Total Number of Defects by Month and Plant Chart - Directly under the notifications chart */}
      <Card ref={defectsChartRef} className="glass-card-glow chart-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>
                  {isCustomerView
                    ? "YTD Total Number of Customer Defects by Month and Plant"
                    : isSupplierView
                      ? "YTD Total Number of Supplier Defects by Month and Plant"
                      : "YTD Total Number of Defects by Month and Plant"}
                </span>
                <TooltipProvider>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="/glossary#how-to-defects-by-month-plant"
                        className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50 transition-colors"
                        title="How to read this chart"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>How to read this chart</TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                {isCustomerView
                  ? "Number of customer defective parts by month and plant"
                  : isSupplierView
                    ? "Number of supplier defective parts by month and plant"
                    : "Number of defective parts by month and plant"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedPlantForDefectsChart && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedPlantForDefectsChart(null)}
                  title="Reset to show all plants"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset Filter
                </Button>
              )}
              {/* Only show defect type filter in full dashboard view */}
              {isFullView && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {selectedDefectType === "Customer" 
                        ? "Customer Defects" 
                        : selectedDefectType === "Supplier" 
                        ? "Supplier Defects" 
                        : "Defect Type"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-3">
                      <div className="font-semibold text-sm mb-2">Defect Types</div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-defect-customer"
                            checked={selectedDefectType === "Customer" || selectedDefectType === "Both"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // If customer is checked, check if supplier is also checked
                                if (selectedDefectType === "Supplier") {
                                  setSelectedDefectType("Both");
                                } else {
                                  setSelectedDefectType("Customer");
                                }
                              } else {
                                // If customer is unchecked, switch to supplier only (or Both if supplier is also checked)
                                if (selectedDefectType === "Both") {
                                  setSelectedDefectType("Supplier");
                                } else {
                                  setSelectedDefectType("Supplier"); // Fallback
                                }
                              }
                            }}
                          />
                          <Label htmlFor="filter-defect-customer" className="text-sm cursor-pointer">
                            Customer Defects
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-defect-supplier"
                            checked={selectedDefectType === "Supplier" || selectedDefectType === "Both"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // If supplier is checked, check if customer is also checked
                                if (selectedDefectType === "Customer") {
                                  setSelectedDefectType("Both");
                                } else {
                                  setSelectedDefectType("Supplier");
                                }
                              } else {
                                // If supplier is unchecked, switch to customer only (or Both if customer is also checked)
                                if (selectedDefectType === "Both") {
                                  setSelectedDefectType("Customer");
                                } else {
                                  setSelectedDefectType("Customer"); // Fallback
                                }
                              }
                            }}
                          />
                          <Label htmlFor="filter-defect-supplier" className="text-sm cursor-pointer">
                            Supplier Defects
                          </Label>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredKpis.length > 0 && defectsByMonthPlant.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={defectsByMonthPlant} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.5)" 
                    domain={[0, maxYAxisValueDefects]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  {chartSitesDefects.map((site, index) => {
                    const isLastBar = index === chartSitesDefects.length - 1;
                    const siteName = formatSiteNameForChart(site, chartSitesDefects.length <= 10);
                    return (
                      <Bar 
                        key={site} 
                        dataKey={`Site ${site}`} 
                        fill={getPlantColorHex(site)}
                        name={siteName}
                        stackId="a"
                        radius={isLastBar ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        {...getBarAnimation(index)}
                      >
                        {isLastBar && (
                          <LabelList 
                            dataKey="total"
                            position="top"
                            fill="rgba(255, 255, 255, 0.9)"
                            fontSize={12}
                            fontWeight="500"
                            offset={10}
                            formatter={(value: number) => {
                              if (!value || value === 0) return '';
                              return formatGermanNumber(value, 0);
                            }}
                          />
                        )}
                      </Bar>
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
              {availableChartSitesDefects.length > 0 && (
                <PlantLegend 
                  sites={availableChartSitesDefects}
                  selectedPlant={selectedPlantForDefectsChart}
                  onPlantClick={setSelectedPlantForDefectsChart}
                />
              )}
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for chart
            </div>
          )}
        </CardContent>
      </Card>

      {/* YTD Number of Notifications by Month and Notification Type Chart - Directly under the first chart */}
      <Card className="glass-card-glow chart-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isCustomerView
                  ? "YTD Number of Customer Notifications by Month and Notification Type"
                  : isSupplierView
                    ? "YTD Number of Supplier Notifications by Month and Notification Type"
                    : "YTD Number of Notifications by Month and Notification Type"}
              </CardTitle>
              <CardDescription>
                {isCustomerView
                  ? "Number of customer complaints (Q1) by month"
                  : isSupplierView
                    ? "Number of supplier complaints (Q2) by month"
                    : "Number of complaints by month and notification type (Q1, Q2, Q3)"}
              </CardDescription>
            </div>
            {/* Only show notification type filter in full dashboard view */}
            {isFullView && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Notification Type
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <div className="font-semibold text-sm mb-2">Notification Types</div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-q1"
                          checked={selectedNotificationTypes.has("Q1")}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedNotificationTypes);
                            if (checked) {
                              newSet.add("Q1");
                            } else {
                              newSet.delete("Q1");
                            }
                            setSelectedNotificationTypes(newSet);
                          }}
                        />
                        <Label htmlFor="filter-q1" className="text-sm cursor-pointer">
                          Customer Complaints Q1
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-q2"
                          checked={selectedNotificationTypes.has("Q2")}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedNotificationTypes);
                            if (checked) {
                              newSet.add("Q2");
                            } else {
                              newSet.delete("Q2");
                            }
                            setSelectedNotificationTypes(newSet);
                          }}
                        />
                        <Label htmlFor="filter-q2" className="text-sm cursor-pointer">
                          Supplier Complaints Q2
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-q3"
                          checked={selectedNotificationTypes.has("Q3")}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedNotificationTypes);
                            if (checked) {
                              newSet.add("Q3");
                            } else {
                              newSet.delete("Q3");
                            }
                            setSelectedNotificationTypes(newSet);
                          }}
                        />
                        <Label htmlFor="filter-q3" className="text-sm cursor-pointer">
                          Internal Complaints Q3
                        </Label>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredKpis.length > 0 && notificationsByType.length > 0 ? (
            <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={notificationsByType} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                  }}
                />
                {(() => {
                  // In customer view mode, only show Q1; otherwise use selectedNotificationTypes
                  const effectiveTypes = isCustomerView
                    ? new Set(["Q1"])
                    : isSupplierView
                      ? new Set(["Q2"])
                      : selectedNotificationTypes;
                  const typesArray = Array.from(effectiveTypes) as ("Q1" | "Q2" | "Q3")[];
                  
                  return typesArray.map((type, index) => {
                    const isLast = index === typesArray.length - 1;
                    const isQ1 = type === "Q1";
                    const isQ2 = type === "Q2";
                    const isQ3 = type === "Q3";
                    
                    if (isQ1) {
                      return (
                        <Bar 
                          key="Q1"
                          dataKey="Q1" 
                          fill={getNotificationTypeColor("Q1")} 
                          name="Q1 - Customer Complaints" 
                          stackId="a"
                          radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                          {...getBarAnimation(0)}
                        >
                          {isLast && (
                            <LabelList 
                              dataKey="total"
                              position="top"
                              fill="rgba(255, 255, 255, 0.9)"
                              fontSize={12}
                              fontWeight="500"
                              offset={10}
                              formatter={(value: number) => {
                                if (!value || value === 0) return '';
                                return formatGermanNumber(value, 0);
                              }}
                            />
                          )}
                        </Bar>
                      );
                    }
                    if (isQ2) {
                      return (
                        <Bar 
                          key="Q2"
                          dataKey="Q2" 
                          fill={getNotificationTypeColor("Q2")} 
                          name="Q2 - Supplier Complaints" 
                          stackId="a"
                          radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                          {...getBarAnimation(1)}
                        >
                          {isLast && (
                            <LabelList 
                              dataKey="total"
                              position="top"
                              fill="rgba(255, 255, 255, 0.9)"
                              fontSize={12}
                              fontWeight="500"
                              offset={10}
                              formatter={(value: number) => {
                                if (!value || value === 0) return '';
                                return formatGermanNumber(value, 0);
                              }}
                            />
                          )}
                        </Bar>
                      );
                    }
                    if (isQ3) {
                      return (
                        <Bar 
                          key="Q3"
                          dataKey="Q3" 
                          fill={getNotificationTypeColor("Q3")} 
                          name="Q3 - Internal Complaints" 
                          stackId="a"
                          radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                          {...getBarAnimation(2)}
                        >
                          {isLast && (
                            <LabelList 
                              dataKey="total"
                              position="top"
                              fill="rgba(255, 255, 255, 0.9)"
                              fontSize={12}
                              fontWeight="500"
                              offset={10}
                              formatter={(value: number) => {
                                if (!value || value === 0) return '';
                                return formatGermanNumber(value, 0);
                              }}
                            />
                          )}
                        </Bar>
                      );
                    }
                    return null;
                  });
                })()}
              </BarChart>
            </ResponsiveContainer>
              <NotificationTypeLegend
                types={isCustomerView ? ["Q1"] : isSupplierView ? ["Q2"] : Array.from(selectedNotificationTypes)}
              />
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for chart
            </div>
          )}
        </CardContent>
      </Card>

      {/* YTD Cumulative Customer PPM Trend - All Sites Chart */}
      {!isSupplierView && (
      <Card ref={customerPpmTrendChartRef} className="glass-card-glow chart-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>YTD Cumulative Customer PPM Trend - All Sites</span>
                <TooltipProvider>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="/glossary#how-to-ppm-trend"
                        className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50 transition-colors"
                        title="How to read this chart"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>How to read this chart</TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Combined Customer PPM performance (PPM = Defective Parts / Total Deliveries × 1,000,000)
              </CardDescription>
            </div>
            <Select value={customerPpmAveragePeriod} onValueChange={(value: "3" | "6" | "12") => setCustomerPpmAveragePeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3-Months Average Trend</SelectItem>
                <SelectItem value="6">6-Months Average Trend</SelectItem>
                <SelectItem value="12">12-Months Average Trend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredKpis.length > 0 && customerPpmTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={customerPpmTrendData} margin={{ top: 40, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255, 255, 255, 0.5)"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.5)"
                  label={{ value: 'PPM', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.7)' }}
                  tickFormatter={(value) => formatGermanNumber(value, 0)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "Actual PPM" || name.includes("Avg Target")) {
                      return [formatGermanNumber(value, 2), name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="ppm" 
                  fill={getNotificationTypeColor("Q1")}
                  name="Actual PPM"
                  radius={[4, 4, 0, 0]}
                  {...getBarAnimation(0)}
                >
                  <LabelList 
                    dataKey="ppm"
                    position="top"
                    fill="rgba(255, 255, 255, 0.9)"
                    fontSize={12}
                    fontWeight="500"
                    offset={10}
                    formatter={(value: number) => {
                      if (!value || value === 0) return '';
                      return formatGermanNumber(value, 0);
                    }}
                  />
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="averageTarget" 
                  stroke={getNotificationTypeColor("Q2")} 
                  name={`${customerPpmAveragePeriod}-Month Avg Target`}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={{ r: 4, fill: getNotificationTypeColor("Q2"), strokeWidth: 2, stroke: "rgba(255, 255, 255, 0.8)" }}
                  activeDot={{ r: 7, fill: getNotificationTypeColor("Q2"), strokeWidth: 2, stroke: "rgba(255, 255, 255, 1)" }}
                  {...getLineAnimation(1)}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for chart
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Empty State Message - Show below tiles if no data */}
      {kpis.length === 0 && filteredKpis.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload Excel files to view quality metrics and KPIs
            </p>
            <Button asChild>
              <a href="/upload">Go to Upload Data</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Charts Section - Only show if data exists */}
      {filteredKpis.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
          </div>

          {/* Monthly Trend Analysis Table */}
          {!isSupplierView && (
          <Card className="glass-card-glow chart-container">
        <CardHeader>
          <CardTitle>YTD Customer PPM Monthly Trend Analysis - All Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Month</TableHead>
                  <TableHead className="text-center">PPM</TableHead>
                  <TableHead className="text-center">Change</TableHead>
                  <TableHead className="text-center">Defective</TableHead>
                  <TableHead className="text-center">Deliveries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTrendTable.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="text-center">{row.month}</TableCell>
                    <TableCell className="text-center">
                      <span className={row.ppm > row.threeMonthAvg ? "text-red-500" : "text-green-500"}>{formatGermanNumber(row.ppm, 0)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.ppmChange !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          {row.ppmChange > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-red-500" />
                              <span className="text-red-500 font-medium">{formatGermanNumber(Math.abs(row.ppmChange), 1)}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-green-500" />
                              <span className="text-green-500">{formatGermanNumber(Math.abs(row.ppmChange), 1)}%</span>
                            </>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={row.defective > 100 ? "text-red-500" : "text-green-500"}>{row.defective}</span>
                        {row.defectiveChange !== null && (
                          <span className={`text-xs font-medium ${row.defectiveChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {row.defectiveChange > 0 ? '+' : ''}{formatGermanNumber(row.defectiveChange, 0)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span>{formatGermanNumber(row.deliveries, 0)}</span>
                        {row.deliveriesChange !== null && (
                          <span className={`text-xs font-medium ${row.deliveriesChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {row.deliveriesChange > 0 ? '+' : ''}{formatGermanNumber(row.deliveriesChange, 0)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Avg PPM</p>
              <p className="text-2xl font-bold text-green-500">
                {monthlyTrendTable.length > 0
                  ? formatGermanNumber(monthlyTrendTable.reduce((sum, r) => sum + r.ppm, 0) / monthlyTrendTable.length, 0)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best PPM</p>
              <p className="text-2xl font-bold text-green-500">
                {monthlyTrendTable.length > 0
                  ? formatGermanNumber(Math.min(...monthlyTrendTable.map((r) => r.ppm)), 0)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Worst PPM</p>
              <p className="text-2xl font-bold text-red-500">
                {monthlyTrendTable.length > 0
                  ? formatGermanNumber(Math.max(...monthlyTrendTable.map((r) => r.ppm)), 0)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Defective</p>
              <p className="text-2xl font-bold">
                {monthlyTrendTable.reduce((sum, r) => sum + r.defective, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
          )}

      {/* Customer PPM - Site Contribution per Month */}
      {!isSupplierView && filteredKpis.length > 0 && customerPpmSiteContribution.sites.length > 0 && (
            <Card className="glass-card-glow chart-container">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer PPM - Site Contribution per Month</CardTitle>
                    <CardDescription>
                      Source: Defective Parts from Q Cockpit (Column AF - Return delivery qty) | Deliveries from Outbound files (Column E - Quantity)
                    </CardDescription>
                    <CardDescription className="mt-1">
                      Formula: PPM = (Total Defective Parts / Total Deliveries) × 1,000,000
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Prepare data for export
                      const { sites, months, siteNames, siteLocations, bySiteMonth, totalsByMonth } = customerPpmSiteContribution;
                      
                      // Create worksheet data
                      const wsData: any[][] = [];
                      
                      // Header row
                      const header = ['DATA', ...months.map(m => {
                        const date = new Date(m + "-01");
                        return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      }), 'TOTAL'];
                      wsData.push(header);
                      
                      // Site rows
                      sites.forEach((siteCode) => {
                        const formattedSiteName = formatSiteNameForChart(siteCode, false);
                        const row: Array<string | number> = [`${formattedSiteName} Defective Parts`];
                        let siteTotal = 0;
                        months.forEach((month) => {
                          const siteData = bySiteMonth.get(siteCode);
                          const value = siteData?.get(month)?.defective || 0;
                          row.push(value);
                          siteTotal += value;
                        });
                        row.push(siteTotal);
                        wsData.push(row);
                      });
                      
                      // Total Defective Parts row
                      const totalDefectiveRow: Array<string | number> = ['Total Defective Parts'];
                      let grandTotalDefective = 0;
                      months.forEach((month) => {
                        const value = totalsByMonth.get(month)?.defective || 0;
                        totalDefectiveRow.push(value);
                        grandTotalDefective += value;
                      });
                      totalDefectiveRow.push(grandTotalDefective);
                      wsData.push(totalDefectiveRow);
                      
                      // Total Deliveries row
                      const totalDeliveriesRow: Array<string | number> = ['Total Deliveries'];
                      let grandTotalDeliveries = 0;
                      months.forEach((month) => {
                        const value = totalsByMonth.get(month)?.deliveries || 0;
                        totalDeliveriesRow.push(value);
                        grandTotalDeliveries += value;
                      });
                      totalDeliveriesRow.push(grandTotalDeliveries);
                      wsData.push(totalDeliveriesRow);
                      
                      // Calculated PPM row
                      const ppmRow: Array<string | number> = ['Calculated PPM'];
                      months.forEach((month) => {
                        const ppm = totalsByMonth.get(month)?.ppm || 0;
                        ppmRow.push(ppm);
                      });
                      const totalPpm = grandTotalDeliveries > 0 ? (grandTotalDefective / grandTotalDeliveries) * 1_000_000 : 0;
                      ppmRow.push(totalPpm);
                      wsData.push(ppmRow);
                      
                      // Create workbook and worksheet
                      const wb = XLSX.utils.book_new();
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      XLSX.utils.book_append_sheet(wb, ws, 'Customer PPM Site Contribution');
                      
                      // Export
                      XLSX.writeFile(wb, `Customer_PPM_Site_Contribution_${new Date().toISOString().split('T')[0]}.xlsx`);
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Data / Plant</TableHead>
                    {customerPpmSiteContribution.months.map((month) => {
                      const date = new Date(month + "-01");
                      return (
                        <TableHead key={month} className="text-center">
                          {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </TableHead>
                      );
                    })}
                    <TableHead className="text-center bg-muted/30 font-bold">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Site rows */}
                  {customerPpmSiteContribution.sites.map((siteCode) => {
                    const location = customerPpmSiteContribution.siteLocations.get(siteCode) || '';
                    const siteData = customerPpmSiteContribution.bySiteMonth.get(siteCode);
                    const formattedSiteName = formatSiteNameForChart(siteCode, false);
                    let siteTotal = 0;
                    return (
                      <TableRow key={`${siteCode}-defective`}>
                        <TableCell>
                          <div>
                            <span>{formattedSiteName} Defective Parts</span>
                            <span className="text-xs text-muted-foreground block">(Site contribution)</span>
                          </div>
                        </TableCell>
                        {customerPpmSiteContribution.months.map((month) => {
                          const value = siteData?.get(month)?.defective || 0;
                          siteTotal += value;
                          return (
                            <TableCell key={month} className={`text-center ${value > 0 ? 'text-red-500' : ''}`}>
                              {formatGermanNumber(value, 0)}
                            </TableCell>
                          );
                        })}
                        <TableCell className={`text-center font-bold text-lg bg-muted/30 ${siteTotal > 0 ? 'text-red-500' : ''}`}>
                          {formatGermanNumber(siteTotal, 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Total Defective Parts */}
                  <TableRow>
                    <TableCell>
                      <div>
                        <span>Total Defective Parts</span>
                        <span className="text-xs text-muted-foreground block">from Q Cockpit - Col AF</span>
                      </div>
                    </TableCell>
                    {customerPpmSiteContribution.months.map((month) => {
                      const value = customerPpmSiteContribution.totalsByMonth.get(month)?.defective || 0;
                      return (
                        <TableCell key={month} className={`text-center font-medium ${value > 0 ? 'text-red-500' : ''}`}>
                          {formatGermanNumber(value, 0)}
                        </TableCell>
                      );
                    })}
                    <TableCell className={`text-center font-bold text-lg bg-muted/30 text-red-500`}>
                      {formatGermanNumber(
                        customerPpmSiteContribution.months.reduce((sum, month) => 
                          sum + (customerPpmSiteContribution.totalsByMonth.get(month)?.defective || 0), 0
                        ), 0
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {/* Total Deliveries */}
                  <TableRow>
                    <TableCell>
                      <div>
                        <span>Total Deliveries</span>
                        <span className="text-xs text-muted-foreground block">from Outbound files - Col E</span>
                      </div>
                    </TableCell>
                    {customerPpmSiteContribution.months.map((month) => {
                      const value = customerPpmSiteContribution.totalsByMonth.get(month)?.deliveries || 0;
                      return (
                        <TableCell key={month} className="text-center font-medium">
                          {formatGermanNumber(value, 0)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold text-lg bg-muted/30">
                      {formatGermanNumber(
                        customerPpmSiteContribution.months.reduce((sum, month) => 
                          sum + (customerPpmSiteContribution.totalsByMonth.get(month)?.deliveries || 0), 0
                      ), 0)}
                    </TableCell>
                  </TableRow>
                  
                  {/* Calculated PPM */}
                  <TableRow>
                    <TableCell>
                      <div>
                        <span>Calculated PPM</span>
                        <span className="text-xs text-muted-foreground block">Defective / Deliveries × 1M</span>
                      </div>
                    </TableCell>
                    {(() => {
                      // Calculate average PPM for trend comparison
                      const allPpmValues = customerPpmSiteContribution.months.map(month => 
                        customerPpmSiteContribution.totalsByMonth.get(month)?.ppm || 0
                      ).filter(p => p > 0);
                      const avgPpm = allPpmValues.length > 0 
                        ? allPpmValues.reduce((sum, p) => sum + p, 0) / allPpmValues.length 
                        : 0;
                      
                      return customerPpmSiteContribution.months.map((month) => {
                        const ppm = customerPpmSiteContribution.totalsByMonth.get(month)?.ppm || 0;
                        // Compare to average: above average = negative trend (orange/red), below average = positive trend (green)
                        const isPositiveTrend = ppm <= avgPpm;
                        const bgColor = isPositiveTrend ? 'bg-green-500/20' : 'bg-orange-500/20';
                        const textColor = isPositiveTrend ? 'text-green-500' : 'text-orange-500';
                        
                        return (
                          <TableCell key={month} className={`text-center font-medium ${bgColor} ${textColor} py-2 px-3 rounded`}>
                            {formatGermanNumber(ppm, 2)}
                          </TableCell>
                        );
                      });
                    })()}
                    {(() => {
                      const totalDefective = customerPpmSiteContribution.months.reduce((sum, month) => 
                        sum + (customerPpmSiteContribution.totalsByMonth.get(month)?.defective || 0), 0
                      );
                      const totalDeliveries = customerPpmSiteContribution.months.reduce((sum, month) => 
                        sum + (customerPpmSiteContribution.totalsByMonth.get(month)?.deliveries || 0), 0
                      );
                      const totalPpm = totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
                      
                      // Calculate average for comparison
                      const allPpmValues = customerPpmSiteContribution.months.map(month => 
                        customerPpmSiteContribution.totalsByMonth.get(month)?.ppm || 0
                      ).filter(p => p > 0);
                      const avgPpm = allPpmValues.length > 0 
                        ? allPpmValues.reduce((sum, p) => sum + p, 0) / allPpmValues.length 
                        : 0;
                      const isPositiveTrend = totalPpm <= avgPpm;
                      const bgColor = isPositiveTrend ? 'bg-green-500/20' : 'bg-orange-500/20';
                      const textColor = isPositiveTrend ? 'text-green-500' : 'text-orange-500';
                      
                      return (
                        <TableCell className={`text-center font-bold text-lg bg-muted/30 ${bgColor} ${textColor} py-2 px-3 rounded`}>
                          {formatGermanNumber(totalPpm, 2)}
                        </TableCell>
                      );
                    })()}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

      {/* Customer Defective Parts and Deliveries by Site - Donut Charts */}
      {!isSupplierView && filteredKpis.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Defective Parts by Site */}
          <Card className="glass-card-glow chart-container">
            <CardHeader>
              <CardTitle>Customer Defective Parts by Site - All Sites</CardTitle>
              <CardDescription>Share of total customer defective parts per manufacturing location</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calculate customer defective parts by site
                const bySite = new Map<string, { defective: number; siteName?: string }>();
                const siteAbbreviations = new Map<string, string>();
                filteredKpis.forEach((kpi) => {
                  if (!bySite.has(kpi.siteCode)) {
                    bySite.set(kpi.siteCode, { defective: 0, siteName: kpi.siteName });
                    // Get abbreviation from plant data - use same logic as filter panel
                    const plantData = plantsData.find((p) => p.code === kpi.siteCode);
                    if (plantData?.abbreviation) {
                      // Use abbreviation exactly as stored in plant data (same as filter panel)
                      siteAbbreviations.set(kpi.siteCode, plantData.abbreviation);
                    } else {
                      // Fallback: extract from siteName
                      if (kpi.siteName) {
                        const locationMatch = kpi.siteName.match(/\b([A-Z]{2,4})\b/) || 
                                             kpi.siteName.match(/^([A-Z][a-z]+)/);
                        if (locationMatch) {
                          const location = locationMatch[1].toUpperCase().substring(0, 3);
                          siteAbbreviations.set(kpi.siteCode, location);
                        } else {
                          siteAbbreviations.set(kpi.siteCode, kpi.siteName.substring(0, 3).toUpperCase());
                        }
                      }
                    }
                  }
                  const siteData = bySite.get(kpi.siteCode)!;
                  siteData.defective += kpi.customerDefectiveParts || 0;
                });

                const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.defective, 0);
                const customerDefectiveBySite = Array.from(bySite.entries())
                  .map(([siteCode, data]) => {
                    const formattedSiteName = formatSiteNameForChart(siteCode, false);
                    return {
                      name: formattedSiteName,
                    siteCode,
                    abbreviation: siteAbbreviations.get(siteCode) || '',
                    value: data.defective,
                    percentage: total > 0 ? (data.defective / total) * 100 : 0,
                    };
                  })
                  .filter(item => item.value > 0)
                  .sort((a, b) => b.value - a.value);

                return customerDefectiveBySite.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={customerDefectiveBySite}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => {
                            const siteCode = entry.siteCode || entry.name?.split(' - ')[0] || '';
                            const value = entry.value || 0;
                            const formattedSiteName = formatSiteNameForChart(siteCode, false);
                            return `${formattedSiteName} (${formatGermanNumber(value, 0)})`;
                          }}
                          outerRadius={90}
                          innerRadius={50}
                          fill="#8884d8"
                          dataKey="value"
                          {...PIE_ANIMATION}
                        >
                          {customerDefectiveBySite.map((entry, index) => {
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getPlantColorHex(entry.siteCode)} 
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          itemStyle={{
                            color: "#ffffff",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                          }}
                          formatter={(value: number, name: string, props: any) => {
                            const siteCode = props.siteCode || name.split(' - ')[0];
                            const abbreviation = props.abbreviation || '';
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            return [
                              `${formatGermanNumber(value, 0)} (${formatGermanNumber(percentage, 1)}%)`,
                              abbreviation ? `${siteCode} ${abbreviation}` : siteCode
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Customer Deliveries by Site */}
          <Card ref={customerDeliveriesChartRef} className="glass-card-glow chart-container">
            <CardHeader>
              <CardTitle>Customer Deliveries by Site - All Sites</CardTitle>
              <CardDescription>Share of total customer deliveries per manufacturing location</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calculate customer deliveries by site
                const bySite = new Map<string, { deliveries: number; siteName?: string }>();
                const siteAbbreviations = new Map<string, string>();
                filteredKpis.forEach((kpi) => {
                  if (!bySite.has(kpi.siteCode)) {
                    bySite.set(kpi.siteCode, { deliveries: 0, siteName: kpi.siteName });
                    // Get abbreviation from plant data - use same logic as filter panel
                    const plantData = plantsData.find((p) => p.code === kpi.siteCode);
                    if (plantData?.abbreviation) {
                      // Use abbreviation exactly as stored in plant data (same as filter panel)
                      siteAbbreviations.set(kpi.siteCode, plantData.abbreviation);
                    } else {
                      // Fallback: extract from siteName
                      if (kpi.siteName) {
                        const locationMatch = kpi.siteName.match(/\b([A-Z]{2,4})\b/) || 
                                             kpi.siteName.match(/^([A-Z][a-z]+)/);
                        if (locationMatch) {
                          const location = locationMatch[1].toUpperCase().substring(0, 3);
                          siteAbbreviations.set(kpi.siteCode, location);
                        } else {
                          siteAbbreviations.set(kpi.siteCode, kpi.siteName.substring(0, 3).toUpperCase());
                        }
                      }
                    }
                  }
                  const siteData = bySite.get(kpi.siteCode)!;
                  siteData.deliveries += kpi.customerDeliveries || 0;
                });

                const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.deliveries, 0);
                const customerDeliveriesBySite = Array.from(bySite.entries())
                  .map(([siteCode, data]) => {
                    const formattedSiteName = formatSiteNameForChart(siteCode, false);
                    return {
                      name: formattedSiteName,
                    siteCode,
                    abbreviation: siteAbbreviations.get(siteCode) || '',
                    value: data.deliveries,
                    percentage: total > 0 ? (data.deliveries / total) * 100 : 0,
                    };
                  })
                  .filter(item => item.value > 0)
                  .sort((a, b) => b.value - a.value);

                return customerDeliveriesBySite.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={customerDeliveriesBySite}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => {
                            const siteCode = entry.siteCode || entry.name?.split(' - ')[0] || '';
                            const value = entry.value || 0;
                            const formattedSiteName = formatSiteNameForChart(siteCode, false);
                            return `${formattedSiteName} (${formatGermanNumber(value, 0)})`;
                          }}
                          outerRadius={90}
                          innerRadius={50}
                          fill="#8884d8"
                          dataKey="value"
                          {...PIE_ANIMATION}
                        >
                          {customerDeliveriesBySite.map((entry, index) => {
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getPlantColorHex(entry.siteCode)} 
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          itemStyle={{
                            color: "#ffffff",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                          }}
                          formatter={(value: number, name: string, props: any) => {
                            const siteCode = props.siteCode || name.split(' - ')[0] || name;
                            const formattedSiteName = formatSiteNameForChart(siteCode, false);
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            return [
                              `${formatGermanNumber(value, 0)} (${formatGermanNumber(percentage, 1)}%)`,
                              formattedSiteName
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
        </>
      )}

      {/* Supplier Charts and Tables Section - Only show when not customer-only view */}
      {!isCustomerView && filteredKpis.length > 0 && (
        <>
          {/* YTD Cumulative Supplier PPM Trend - All Sites Chart */}
          <Card ref={supplierPpmTrendChartRef} className="glass-card-glow chart-container">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>YTD Cumulative Supplier PPM Trend - All Sites</span>
                    <TooltipProvider>
                      <UiTooltip>
                        <TooltipTrigger asChild>
                          <a
                            href="/glossary#how-to-ppm-trend"
                            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/50 transition-colors"
                            title="How to read this chart"
                          >
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>How to read this chart</TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>
                    Combined Supplier PPM performance (PPM = Defective Parts / Total Deliveries × 1,000,000)
                  </CardDescription>
                </div>
                <Select value={supplierPpmAveragePeriod} onValueChange={(value: "3" | "6" | "12") => setSupplierPpmAveragePeriod(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3-Months Average Trend</SelectItem>
                    <SelectItem value="6">6-Months Average Trend</SelectItem>
                    <SelectItem value="12">12-Months Average Trend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredKpis.length > 0 && supplierPpmTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={supplierPpmTrendData} margin={{ top: 40, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255, 255, 255, 0.5)"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.5)"
                      label={{ value: 'PPM', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.7)' }}
                      tickFormatter={(value) => formatGermanNumber(value, 0)}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "Actual PPM" || name.includes("Avg Target")) {
                          return [formatGermanNumber(value, 2), name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="ppm" 
                      fill={getNotificationTypeColor("Q2")}
                      name="Actual PPM"
                      radius={[4, 4, 0, 0]}
                      {...getBarAnimation(0)}
                    >
                      <LabelList 
                        dataKey="ppm"
                        position="top"
                        fill="rgba(255, 255, 255, 0.9)"
                        fontSize={12}
                        fontWeight="500"
                        offset={10}
                        formatter={(value: number) => {
                          if (!value || value === 0) return '';
                          return formatGermanNumber(value, 0);
                        }}
                      />
                    </Bar>
                    <Line 
                      type="monotone" 
                      dataKey="averageTarget" 
                      stroke={getNotificationTypeColor("Q1")} 
                      name={`${supplierPpmAveragePeriod}-Month Avg Target`}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={{ r: 4, fill: getNotificationTypeColor("Q1"), strokeWidth: 2, stroke: "rgba(255, 255, 255, 0.8)" }}
                      activeDot={{ r: 7, fill: getNotificationTypeColor("Q1"), strokeWidth: 2, stroke: "rgba(255, 255, 255, 1)" }}
                      {...getLineAnimation(1)}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available for chart
                </div>
              )}
            </CardContent>
          </Card>

          {/* YTD Supplier PPM Monthly Trend Analysis - All Sites Table */}
          <Card className="glass-card-glow chart-container">
            <CardHeader>
              <CardTitle>YTD Supplier PPM Monthly Trend Analysis - All Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Month</TableHead>
                      <TableHead className="text-center">PPM</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead className="text-center">Defective</TableHead>
                      <TableHead className="text-center">Deliveries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierMonthlyTrendTable.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell className="text-center">{row.month}</TableCell>
                        <TableCell className="text-center">
                          <span className={row.ppm > row.threeMonthAvg ? "text-red-500" : "text-green-500"}>{formatGermanNumber(row.ppm, 0)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.ppmChange !== null ? (
                            <div className="flex items-center justify-center gap-1">
                              {row.ppmChange > 0 ? (
                                <>
                                  <TrendingUp className="h-4 w-4 text-red-500" />
                                  <span className="text-red-500 font-medium">{formatGermanNumber(Math.abs(row.ppmChange), 1)}%</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="h-4 w-4 text-green-500" />
                                  <span className="text-green-500">{formatGermanNumber(Math.abs(row.ppmChange), 1)}%</span>
                                </>
                              )}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={row.defective > 100 ? "text-red-500" : "text-green-500"}>{formatGermanNumber(row.defective, 0)}</span>
                            {row.defectiveChange !== null && (
                              <span className={`text-xs font-medium ${row.defectiveChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {row.defectiveChange > 0 ? '+' : ''}{formatGermanNumber(row.defectiveChange, 0)}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span>{formatGermanNumber(row.deliveries, 0)}</span>
                            {row.deliveriesChange !== null && (
                              <span className={`text-xs font-medium ${row.deliveriesChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {row.deliveriesChange > 0 ? '+' : ''}{formatGermanNumber(row.deliveriesChange, 0)}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Avg PPM</p>
                  <p className="text-2xl font-bold text-green-500">
                    {supplierMonthlyTrendTable.length > 0
                      ? formatGermanNumber(supplierMonthlyTrendTable.reduce((sum, r) => sum + r.ppm, 0) / supplierMonthlyTrendTable.length, 0)
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best PPM</p>
                  <p className="text-2xl font-bold text-green-500">
                    {supplierMonthlyTrendTable.length > 0
                      ? formatGermanNumber(Math.min(...supplierMonthlyTrendTable.map((r) => r.ppm)), 0)
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Worst PPM</p>
                  <p className="text-2xl font-bold text-red-500">
                    {supplierMonthlyTrendTable.length > 0
                      ? formatGermanNumber(Math.max(...supplierMonthlyTrendTable.map((r) => r.ppm)), 0)
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Defective</p>
                  <p className="text-2xl font-bold">
                    {formatGermanNumber(supplierMonthlyTrendTable.reduce((sum, r) => sum + r.defective, 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier PPM - Site Contribution per Month */}
          {filteredKpis.length > 0 && supplierPpmSiteContribution.sites.length > 0 && (
            <Card className="glass-card-glow chart-container">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Supplier PPM - Site Contribution per Month</CardTitle>
                    <CardDescription>
                      Source: Defective Parts from Q Cockpit (Column AF - Return delivery qty) | Deliveries from Inbound files (Column E - Quantity)
                    </CardDescription>
                    <CardDescription className="mt-1">
                      Formula: PPM = (Total Defective Parts / Total Deliveries) × 1,000,000
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Prepare data for export
                      const { sites, months, siteNames, siteLocations, bySiteMonth, totalsByMonth } = supplierPpmSiteContribution;
                      
                      // Create worksheet data
                      const wsData: any[][] = [];
                      
                      // Header row
                      const header = ['DATA', ...months.map(m => {
                        const date = new Date(m + "-01");
                        return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      }), 'TOTAL'];
                      wsData.push(header);
                      
                      // Site rows
                      sites.forEach((siteCode) => {
                        const formattedSiteName = formatSiteNameForChart(siteCode, false);
                        const row: Array<string | number> = [`${formattedSiteName} Defective Parts`];
                        let siteTotal = 0;
                        months.forEach((month) => {
                          const siteData = bySiteMonth.get(siteCode);
                          const value = siteData?.get(month)?.defective || 0;
                          row.push(value);
                          siteTotal += value;
                        });
                        row.push(siteTotal);
                        wsData.push(row);
                      });
                      
                      // Total Defective Parts row
                      const totalDefectiveRow: Array<string | number> = ['Total Defective Parts'];
                      let grandTotalDefective = 0;
                      months.forEach((month) => {
                        const value = totalsByMonth.get(month)?.defective || 0;
                        totalDefectiveRow.push(value);
                        grandTotalDefective += value;
                      });
                      totalDefectiveRow.push(grandTotalDefective);
                      wsData.push(totalDefectiveRow);
                      
                      // Total Deliveries row
                      const totalDeliveriesRow: Array<string | number> = ['Total Deliveries'];
                      let grandTotalDeliveries = 0;
                      months.forEach((month) => {
                        const value = totalsByMonth.get(month)?.deliveries || 0;
                        totalDeliveriesRow.push(value);
                        grandTotalDeliveries += value;
                      });
                      totalDeliveriesRow.push(grandTotalDeliveries);
                      wsData.push(totalDeliveriesRow);
                      
                      // Calculated PPM row
                      const ppmRow: Array<string | number> = ['Calculated PPM'];
                      months.forEach((month) => {
                        const ppm = totalsByMonth.get(month)?.ppm || 0;
                        ppmRow.push(ppm);
                      });
                      const totalPpm = grandTotalDeliveries > 0 ? (grandTotalDefective / grandTotalDeliveries) * 1_000_000 : 0;
                      ppmRow.push(totalPpm);
                      wsData.push(ppmRow);
                      
                      // Create workbook and worksheet
                      const wb = XLSX.utils.book_new();
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      XLSX.utils.book_append_sheet(wb, ws, 'Supplier PPM Site Contribution');
                      
                      // Export
                      XLSX.writeFile(wb, `Supplier_PPM_Site_Contribution_${new Date().toISOString().split('T')[0]}.xlsx`);
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Data / Plant</TableHead>
                        {supplierPpmSiteContribution.months.map((month) => {
                          const date = new Date(month + "-01");
                          return (
                            <TableHead key={month} className="text-center">
                              {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                            </TableHead>
                          );
                        })}
                        <TableHead className="text-center bg-muted/30 font-bold">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Site rows */}
                      {supplierPpmSiteContribution.sites.map((siteCode) => {
                        const siteData = supplierPpmSiteContribution.bySiteMonth.get(siteCode);
                        const formattedSiteName = formatSiteNameForChart(siteCode, false);
                        let siteTotal = 0;
                        return (
                          <TableRow key={`${siteCode}-defective`}>
                            <TableCell>
                              <div>
                                <span>{formattedSiteName} Defective Parts</span>
                                <span className="text-xs text-muted-foreground block">(Site contribution)</span>
                              </div>
                            </TableCell>
                            {supplierPpmSiteContribution.months.map((month) => {
                              const value = siteData?.get(month)?.defective || 0;
                              siteTotal += value;
                              return (
                                <TableCell key={month} className={`text-center ${value > 0 ? 'text-red-500' : ''}`}>
                                  {formatGermanNumber(value, 0)}
                                </TableCell>
                              );
                            })}
                            <TableCell className={`text-center font-bold text-lg bg-muted/30 ${siteTotal > 0 ? 'text-red-500' : ''}`}>
                              {formatGermanNumber(siteTotal, 0)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Total Defective Parts */}
                      <TableRow>
                        <TableCell>
                          <div>
                            <span>Total Defective Parts</span>
                            <span className="text-xs text-muted-foreground block">from Q Cockpit - Col AF</span>
                          </div>
                        </TableCell>
                        {supplierPpmSiteContribution.months.map((month) => {
                          const value = supplierPpmSiteContribution.totalsByMonth.get(month)?.defective || 0;
                          return (
                            <TableCell key={month} className={`text-center font-medium ${value > 0 ? 'text-red-500' : ''}`}>
                              {formatGermanNumber(value, 0)}
                            </TableCell>
                          );
                        })}
                        <TableCell className={`text-center font-bold text-lg bg-muted/30 text-red-500`}>
                          {formatGermanNumber(
                            supplierPpmSiteContribution.months.reduce((sum, month) => 
                              sum + (supplierPpmSiteContribution.totalsByMonth.get(month)?.defective || 0), 0
                            ), 0
                          )}
                        </TableCell>
                      </TableRow>
                      
                      {/* Total Deliveries */}
                      <TableRow>
                        <TableCell>
                          <div>
                            <span>Total Deliveries</span>
                            <span className="text-xs text-muted-foreground block">from Inbound files - Col E</span>
                          </div>
                        </TableCell>
                        {supplierPpmSiteContribution.months.map((month) => {
                          const value = supplierPpmSiteContribution.totalsByMonth.get(month)?.deliveries || 0;
                          return (
                            <TableCell key={month} className="text-center font-medium">
                              {formatGermanNumber(value, 0)}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold text-lg bg-muted/30">
                          {formatGermanNumber(
                            supplierPpmSiteContribution.months.reduce((sum, month) => 
                              sum + (supplierPpmSiteContribution.totalsByMonth.get(month)?.deliveries || 0), 0
                          ), 0)}
                        </TableCell>
                      </TableRow>
                      
                      {/* Calculated PPM */}
                      <TableRow>
                        <TableCell>
                          <div>
                            <span>Calculated PPM</span>
                            <span className="text-xs text-muted-foreground block">Defective / Deliveries × 1M</span>
                          </div>
                        </TableCell>
                        {(() => {
                          // Calculate average PPM for trend comparison
                          const allPpmValues = supplierPpmSiteContribution.months.map(month => 
                            supplierPpmSiteContribution.totalsByMonth.get(month)?.ppm || 0
                          ).filter(p => p > 0);
                          const avgPpm = allPpmValues.length > 0 
                            ? allPpmValues.reduce((sum, p) => sum + p, 0) / allPpmValues.length 
                            : 0;
                          
                          return supplierPpmSiteContribution.months.map((month) => {
                            const ppm = supplierPpmSiteContribution.totalsByMonth.get(month)?.ppm || 0;
                            // Compare to average: above average = negative trend (orange/red), below average = positive trend (green)
                            const isPositiveTrend = ppm <= avgPpm;
                            const bgColor = isPositiveTrend ? 'bg-green-500/20' : 'bg-orange-500/20';
                            const textColor = isPositiveTrend ? 'text-green-500' : 'text-orange-500';
                            
                            return (
                              <TableCell key={month} className={`text-center font-medium ${bgColor} ${textColor} py-2 px-3 rounded`}>
                                {formatGermanNumber(ppm, 2)}
                              </TableCell>
                            );
                          });
                        })()}
                        {(() => {
                          const totalDefective = supplierPpmSiteContribution.months.reduce((sum, month) => 
                            sum + (supplierPpmSiteContribution.totalsByMonth.get(month)?.defective || 0), 0
                          );
                          const totalDeliveries = supplierPpmSiteContribution.months.reduce((sum, month) => 
                            sum + (supplierPpmSiteContribution.totalsByMonth.get(month)?.deliveries || 0), 0
                          );
                          const totalPpm = totalDeliveries > 0 ? (totalDefective / totalDeliveries) * 1_000_000 : 0;
                          
                          // Calculate average for comparison
                          const allPpmValues = supplierPpmSiteContribution.months.map(month => 
                            supplierPpmSiteContribution.totalsByMonth.get(month)?.ppm || 0
                          ).filter(p => p > 0);
                          const avgPpm = allPpmValues.length > 0 
                            ? allPpmValues.reduce((sum, p) => sum + p, 0) / allPpmValues.length 
                            : 0;
                          const isPositiveTrend = totalPpm <= avgPpm;
                          const bgColor = isPositiveTrend ? 'bg-green-500/20' : 'bg-orange-500/20';
                          const textColor = isPositiveTrend ? 'text-green-500' : 'text-orange-500';
                          
                          return (
                            <TableCell className={`text-center font-bold text-lg bg-muted/30 ${bgColor} ${textColor} py-2 px-3 rounded`}>
                              {formatGermanNumber(totalPpm, 2)}
                            </TableCell>
                          );
                        })()}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supplier Defective Parts and Deliveries by Site - Donut Charts */}
          {filteredKpis.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Supplier Defective Parts by Site */}
              <Card className="glass-card-glow chart-container">
                <CardHeader>
                  <CardTitle>Supplier Defective Parts by Site - All Sites</CardTitle>
                  <CardDescription>Share of total supplier defective parts per manufacturing location</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Calculate supplier defective parts by site
                    const bySite = new Map<string, { defective: number; siteName?: string }>();
                    const siteAbbreviations = new Map<string, string>();
                    filteredKpis.forEach((kpi) => {
                      if (!bySite.has(kpi.siteCode)) {
                        bySite.set(kpi.siteCode, { defective: 0, siteName: kpi.siteName });
                        // Get abbreviation from plant data - use same logic as filter panel
                        const plantData = plantsData.find((p) => p.code === kpi.siteCode);
                        if (plantData?.abbreviation) {
                          // Use abbreviation exactly as stored in plant data (same as filter panel)
                          siteAbbreviations.set(kpi.siteCode, plantData.abbreviation);
                        } else {
                          // Fallback: extract from siteName
                          if (kpi.siteName) {
                            const locationMatch = kpi.siteName.match(/\b([A-Z]{2,4})\b/) || 
                                                 kpi.siteName.match(/^([A-Z][a-z]+)/);
                            if (locationMatch) {
                              const location = locationMatch[1].toUpperCase().substring(0, 3);
                              siteAbbreviations.set(kpi.siteCode, location);
                            } else {
                              siteAbbreviations.set(kpi.siteCode, kpi.siteName.substring(0, 3).toUpperCase());
                            }
                          }
                        }
                      }
                      const siteData = bySite.get(kpi.siteCode)!;
                      siteData.defective += kpi.supplierDefectiveParts || 0;
                    });

                    const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.defective, 0);
                    const supplierDefectiveBySite = Array.from(bySite.entries())
                      .map(([siteCode, data]) => {
                        const formattedSiteName = formatSiteNameForChart(siteCode, false);
                        return {
                          name: formattedSiteName,
                        siteCode,
                        abbreviation: siteAbbreviations.get(siteCode) || '',
                        value: data.defective,
                        percentage: total > 0 ? (data.defective / total) * 100 : 0,
                        };
                      })
                      .filter(item => item.value > 0)
                      .sort((a, b) => b.value - a.value);

                    return supplierDefectiveBySite.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={supplierDefectiveBySite}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => {
                                const siteCode = entry.siteCode || entry.name?.split(' - ')[0] || '';
                                const value = entry.value || 0;
                                const formattedSiteName = formatSiteNameForChart(siteCode, false);
                                return `${formattedSiteName} (${formatGermanNumber(value, 0)})`;
                              }}
                              outerRadius={90}
                              innerRadius={50}
                              fill="#8884d8"
                              dataKey="value"
                              {...PIE_ANIMATION}
                            >
                              {supplierDefectiveBySite.map((entry, index) => {
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={getPlantColorHex(entry.siteCode)} 
                                  />
                                );
                              })}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "8px",
                                color: "#ffffff",
                              }}
                              itemStyle={{
                                color: "#ffffff",
                              }}
                              labelStyle={{
                                color: "#ffffff",
                              }}
                              formatter={(value: number, name: string, props: any) => {
                                const siteCode = props.siteCode || name.split(' - ')[0] || name;
                                const formattedSiteName = formatSiteNameForChart(siteCode, false);
                                const percentage = total > 0 ? (value / total) * 100 : 0;
                                return [
                                  `${formatGermanNumber(value, 0)} (${formatGermanNumber(percentage, 1)}%)`,
                                  formattedSiteName
                                ];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Supplier Deliveries by Site */}
              <Card ref={supplierDeliveriesChartRef} className="glass-card-glow chart-container">
                <CardHeader>
                  <CardTitle>Supplier Deliveries by Site - All Sites</CardTitle>
                  <CardDescription>Share of total supplier deliveries per manufacturing location</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Calculate supplier deliveries by site
                    const bySite = new Map<string, { deliveries: number; siteName?: string }>();
                    const siteAbbreviations = new Map<string, string>();
                    filteredKpis.forEach((kpi) => {
                      if (!bySite.has(kpi.siteCode)) {
                        bySite.set(kpi.siteCode, { deliveries: 0, siteName: kpi.siteName });
                        // Get abbreviation from plant data - use same logic as filter panel
                        const plantData = plantsData.find((p) => p.code === kpi.siteCode);
                        if (plantData?.abbreviation) {
                          // Use abbreviation exactly as stored in plant data (same as filter panel)
                          siteAbbreviations.set(kpi.siteCode, plantData.abbreviation);
                        } else {
                          // Fallback: extract from siteName
                          if (kpi.siteName) {
                            const locationMatch = kpi.siteName.match(/\b([A-Z]{2,4})\b/) || 
                                                 kpi.siteName.match(/^([A-Z][a-z]+)/);
                            if (locationMatch) {
                              const location = locationMatch[1].toUpperCase().substring(0, 3);
                              siteAbbreviations.set(kpi.siteCode, location);
                            } else {
                              siteAbbreviations.set(kpi.siteCode, kpi.siteName.substring(0, 3).toUpperCase());
                            }
                          }
                        }
                      }
                      const siteData = bySite.get(kpi.siteCode)!;
                      siteData.deliveries += kpi.supplierDeliveries || 0;
                    });

                    const total = Array.from(bySite.values()).reduce((sum, s) => sum + s.deliveries, 0);
                    const supplierDeliveriesBySite = Array.from(bySite.entries())
                      .map(([siteCode, data]) => {
                        const formattedSiteName = formatSiteNameForChart(siteCode, false);
                        return {
                          name: formattedSiteName,
                        siteCode,
                        abbreviation: siteAbbreviations.get(siteCode) || '',
                        value: data.deliveries,
                        percentage: total > 0 ? (data.deliveries / total) * 100 : 0,
                        };
                      })
                      .filter(item => item.value > 0)
                      .sort((a, b) => b.value - a.value);

                    return supplierDeliveriesBySite.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={supplierDeliveriesBySite}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => {
                                const siteCode = entry.siteCode || entry.name?.split(' - ')[0] || '';
                                const value = entry.value || 0;
                                const formattedSiteName = formatSiteNameForChart(siteCode, false);
                                return `${formattedSiteName} (${formatGermanNumber(value, 0)})`;
                              }}
                              outerRadius={90}
                              innerRadius={50}
                              fill="#8884d8"
                              dataKey="value"
                              {...PIE_ANIMATION}
                            >
                              {supplierDeliveriesBySite.map((entry, index) => {
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={getPlantColorHex(entry.siteCode)} 
                                  />
                                );
                              })}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "8px",
                                color: "#ffffff",
                              }}
                              itemStyle={{
                                color: "#ffffff",
                              }}
                              labelStyle={{
                                color: "#ffffff",
                              }}
                              formatter={(value: number, name: string, props: any) => {
                                const siteCode = props.siteCode || name.split(' - ')[0] || name;
                                const formattedSiteName = formatSiteNameForChart(siteCode, false);
                                const percentage = total > 0 ? (value / total) * 100 : 0;
                                return [
                                  `${formatGermanNumber(value, 0)} (${formatGermanNumber(percentage, 1)}%)`,
                                  formattedSiteName
                                ];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Data Source Reference */}
      <Card className="glass-card-glow chart-container">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Data Source Reference</CardTitle>
          </div>
          <CardDescription className="mt-2">
            All metrics on this page are calculated from the following data sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Complaints Data */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Complaints Data</h4>
                <p className="text-sm text-muted-foreground mb-2">Q Cockpit QOS ET_Complaints_Parts_PPM_PS4.XLSX</p>
                <p className="text-sm mb-3">Quality notifications and defective parts data</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                    Column B - Site
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                    Column C - Notification
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                    Column AF - Return delivery qty
                  </Badge>
                </div>
              </div>
            </div>

            {/* Delivery Data */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Delivery Data</h4>
                <p className="text-sm text-muted-foreground mb-2">Outbound Files (per site)</p>
                <p className="text-sm mb-3">Total parts delivered to customers</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                    Column E - Quantity
                  </Badge>
                </div>
              </div>
            </div>

            {/* Plant Information */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30">
                <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Plant Information</h4>
                <p className="text-sm text-muted-foreground mb-2">Plants.xlsx</p>
                <p className="text-sm mb-3">Manufacturing site details</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                    Column A - Code
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                    Column B - City
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                    Column C - Country
                  </Badge>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t pt-6 mt-6">
              <p className="text-sm font-medium">
                PPM Formula: (Total Defective Parts / Total Deliveries) × 1,000,000
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      
      {/* Filter Panel - Right Sidebar */}
      <div className="w-80 flex-shrink-0">
        <FilterPanel
          monthlySiteKpis={kpis}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  );
}
