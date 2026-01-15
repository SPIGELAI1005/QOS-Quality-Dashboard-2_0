/**
 * I AM Q Context Builder
 * 
 * Builds a lightweight context snapshot from dashboard state to send with questions.
 * Includes aggregated values and optionally full KPI data for deep analysis (like AI Summary).
 */

import type { FilterState } from '@/components/dashboard/filter-panel';
import type { DatasetHealthSummary } from '@/lib/data/datasetHealth';
import type { MonthlySiteKpi } from '@/lib/domain/types';

export interface IAmQContext {
  page?: string;
  chartContext?: {
    title?: string;
    description?: string;
    chartType?: string; // "bar", "line", "pie", "table", etc.
    dataType?: string; // "complaints", "deliveries", "ppm", "ppaps", "deviations", etc.
    hasData?: boolean;
    dataCount?: number;
  };
  selectedPlants?: string[];
  dateRange?: {
    from: string | null;
    to: string | null;
  };
  complaintTypes?: string[]; // Q1, Q2, Q3
  notificationTypes?: string[]; // Q1, Q2, Q3, D1, D2, D3, P1, P2, P3
  metrics?: {
    customerComplaints?: number;
    supplierComplaints?: number;
    customerDeliveries?: number;
    supplierDeliveries?: number;
    customerDefective?: number;
    supplierDefective?: number;
    customerPpm?: number;
    supplierPpm?: number;
    selectedSitesCount?: number;
  };
  monthlySiteKpis?: MonthlySiteKpi[]; // Full KPI data for deep analysis (like AI Summary)
  globalPpm?: {
    customerPpm: number | null;
    supplierPpm: number | null;
  };
  selectedSites?: string[];
  selectedMonths?: string[];
  datasetHealth?: DatasetHealthSummary;
}

/**
 * Build context snapshot from filter state and metrics
 * Can include full monthlySiteKpis for deep analysis (like AI Summary)
 */
export function buildIAmQContext(options: {
  page?: string;
  chartContext?: {
    title?: string;
    description?: string;
    chartType?: string;
    dataType?: string;
    hasData?: boolean;
    dataCount?: number;
  };
  filters?: FilterState;
  metrics?: {
    customerComplaints?: number;
    supplierComplaints?: number;
    customerDeliveries?: number;
    supplierDeliveries?: number;
    customerDefective?: number;
    supplierDefective?: number;
    customerPpm?: number;
    supplierPpm?: number;
    selectedSitesCount?: number;
  };
  monthlySiteKpis?: MonthlySiteKpi[]; // Full KPI data for deep analysis
  globalPpm?: {
    customerPpm: number | null;
    supplierPpm: number | null;
  };
  selectedSites?: string[];
  selectedMonths?: string[];
  datasetHealth?: DatasetHealthSummary;
}): IAmQContext {
  const context: IAmQContext = {};

  // Page name
  if (options.page) {
    context.page = options.page;
  }

  // Chart/Table context
  if (options.chartContext) {
    context.chartContext = options.chartContext;
  }

  // Filter state
  if (options.filters) {
    if (options.filters.selectedPlants.length > 0) {
      context.selectedPlants = options.filters.selectedPlants;
    }

    if (options.filters.dateFrom || options.filters.dateTo) {
      context.dateRange = {
        from: options.filters.dateFrom ? options.filters.dateFrom.toISOString().split('T')[0] : null,
        to: options.filters.dateTo ? options.filters.dateTo.toISOString().split('T')[0] : null,
      };
    }

    // Map complaint types to notification types if relevant
    if (options.filters.selectedComplaintTypes.length > 0) {
      // Customer -> Q1, Supplier -> Q2, Internal -> Q3
      const notificationMap: Record<string, string> = {
        'Customer': 'Q1',
        'Supplier': 'Q2',
        'Internal': 'Q3',
      };
      context.complaintTypes = options.filters.selectedComplaintTypes
        .map(type => notificationMap[type])
        .filter(Boolean);
    }

    if (options.filters.selectedNotificationTypes.length > 0) {
      context.notificationTypes = options.filters.selectedNotificationTypes;
    }
  }

  // Metrics (only aggregated values, not raw data)
  if (options.metrics) {
    context.metrics = {};
    
    if (options.metrics.customerComplaints !== undefined) {
      context.metrics.customerComplaints = options.metrics.customerComplaints;
    }
    if (options.metrics.supplierComplaints !== undefined) {
      context.metrics.supplierComplaints = options.metrics.supplierComplaints;
    }
    if (options.metrics.customerDeliveries !== undefined) {
      context.metrics.customerDeliveries = options.metrics.customerDeliveries;
    }
    if (options.metrics.supplierDeliveries !== undefined) {
      context.metrics.supplierDeliveries = options.metrics.supplierDeliveries;
    }
    if (options.metrics.customerDefective !== undefined) {
      context.metrics.customerDefective = options.metrics.customerDefective;
    }
    if (options.metrics.supplierDefective !== undefined) {
      context.metrics.supplierDefective = options.metrics.supplierDefective;
    }
    if (options.metrics.customerPpm !== undefined) {
      context.metrics.customerPpm = options.metrics.customerPpm;
    }
    if (options.metrics.supplierPpm !== undefined) {
      context.metrics.supplierPpm = options.metrics.supplierPpm;
    }
    if (options.metrics.selectedSitesCount !== undefined) {
      context.metrics.selectedSitesCount = options.metrics.selectedSitesCount;
    }

    // Only include metrics object if it has at least one value
    if (Object.keys(context.metrics).length === 0) {
      delete context.metrics;
    }
  }

  // Full KPI data (for deep analysis like AI Summary)
  if (options.monthlySiteKpis && options.monthlySiteKpis.length > 0) {
    context.monthlySiteKpis = options.monthlySiteKpis;
  }

  // Global PPM
  if (options.globalPpm) {
    context.globalPpm = options.globalPpm;
  }

  // Selected sites and months
  if (options.selectedSites && options.selectedSites.length > 0) {
    context.selectedSites = options.selectedSites;
  }
  if (options.selectedMonths && options.selectedMonths.length > 0) {
    context.selectedMonths = options.selectedMonths;
  }

  // Dataset health
  if (options.datasetHealth && Object.keys(options.datasetHealth).length > 0) {
    context.datasetHealth = options.datasetHealth;
  }

  // Only return context if it has at least one property
  return Object.keys(context).length > 0 ? context : {};
}

