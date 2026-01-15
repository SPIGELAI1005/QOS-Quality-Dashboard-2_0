/**
 * Upload Summary and Change History Types
 * 
 * Tracks imported data, conversion issues, editor corrections, and their impact
 * on metrics and visualizations throughout the dashboard.
 */

import type { Complaint, Delivery } from "@/lib/domain/types";

/**
 * Affected metrics and visualizations
 */
export interface AffectedMetrics {
  metrics: string[]; // e.g., ["Customer Complaints", "Supplier PPM", "Customer Defective Parts"]
  visualizations: string[]; // e.g., ["Dashboard Metric Tiles", "Customer Performance Charts", "PPM Trend Chart"]
  pages: string[]; // e.g., ["/dashboard", "/complaints", "/ppm"]
  calculations: string[]; // e.g., ["Customer PPM = (Defective / Deliveries) * 1M", "YTD Complaints"]
}

/**
 * Change history entry with impact tracking
 */
export interface ChangeHistoryEntry {
  id: string;
  timestamp: string; // ISO timestamp
  editor: string; // Name of person who made the change
  recordId: string; // Complaint ID, delivery ID, or manual entry identifier
  recordType: "complaint" | "delivery" | "ppap" | "deviation" | "manual_entry" | "file_upload";
  field: string; // Field that was changed (e.g., "defectiveParts", "unitOfMeasure") or "all" for new entries
  oldValue: any;
  newValue: any;
  reason?: string; // Optional reason for change
  changeType: "conversion" | "manual_edit" | "correction" | "bulk_action" | "new_entry" | "file_upload";
  affectedMetrics: AffectedMetrics; // Which metrics/visualizations are affected
  onePagerLink?: string; // Link to one-pager folder/document
  dataDetails?: Record<string, any>; // Additional details about what data was changed (for manual entries and file uploads)
}

/**
 * Upload summary entry for a single upload session
 */
export interface UploadSummaryEntry {
  id: string; // Links to UploadHistoryEntry.id
  uploadedAtIso: string;
  section: "complaints" | "deliveries" | "ppap" | "deviations" | "audit" | "plants";
  files: { name: string; size: number }[];
  
  // Raw imported data (stored as minimal metadata to save space)
  rawData: {
    complaints?: Array<{
      id: string;
      notificationNumber: string;
      notificationType: string;
      siteCode: string;
      createdOn: string | Date;
      [key: string]: any; // Allow additional fields for full complaints
    }>;
    deliveries?: Array<{
      id: string;
      plant: string;
      siteCode: string;
      date: string | Date;
      kind: string;
      quantity: number;
      [key: string]: any;
    }>;
    // Add other types as needed
  };
  
  // Processed data (after editor corrections, stored as minimal metadata to save space)
  processedData: {
    complaints?: Array<{
      id: string;
      notificationNumber: string;
      notificationType: string;
      siteCode: string;
      createdOn: string | Date;
      [key: string]: any; // Allow additional fields for full complaints
    }>;
    deliveries?: Array<{
      id: string;
      plant: string;
      siteCode: string;
      date: string | Date;
      kind: string;
      quantity: number;
      [key: string]: any;
    }>;
    // Add other types as needed
  };
  
  // Conversion status for each record
  conversionStatus: {
    complaints?: Array<{
      complaintId: string;
      notificationNumber: string;
      status: "converted" | "failed" | "needs_attention" | "not_applicable";
      originalValue: number;
      originalUnit: string;
      convertedValue?: number;
      error?: string;
      materialDescription?: string;
      // Additional fields for reconstruction
      siteCode?: string;
      notificationType?: string;
    }>;
  };
  
  // Change history for this upload
  changeHistory: ChangeHistoryEntry[];
  
  // Summary statistics
  summary: {
    totalRecords: number;
    recordsWithIssues: number;
    recordsCorrected: number;
    recordsUnchanged: number;
  };
}

/**
 * Get affected metrics and visualizations for a complaint change
 */
export function getAffectedMetricsForComplaint(
  complaint: Complaint,
  fieldChanged: string
): AffectedMetrics {
  const affected: AffectedMetrics = {
    metrics: [],
    visualizations: [],
    pages: [],
    calculations: [],
  };

  // Determine which notification type
  const isQ1 = complaint.notificationType === "Q1";
  const isQ2 = complaint.notificationType === "Q2";
  const isQ3 = complaint.notificationType === "Q3";

  // If defectiveParts changed, it affects multiple metrics
  if (fieldChanged === "defectiveParts" || fieldChanged === "conversion") {
    if (isQ1) {
      affected.metrics.push("Customer Complaints", "Customer Defective Parts");
      affected.calculations.push("Customer PPM = (Customer Defective Parts / Customer Deliveries) * 1,000,000");
      affected.visualizations.push(
        "Dashboard - Customer Complaints Metric Tile",
        "Dashboard - Customer Defective Parts Metric Tile",
        "Dashboard - Customer PPM Metric Tile",
        "Customer Performance - Complaints Chart",
        "Customer Performance - Defective Parts Chart",
        "Customer Performance - PPM Trend Chart"
      );
      affected.pages.push("/dashboard", "/customer-performance", "/complaints", "/ppm");
    }
    if (isQ2) {
      affected.metrics.push("Supplier Complaints", "Supplier Defective Parts");
      affected.calculations.push("Supplier PPM = (Supplier Defective Parts / Supplier Deliveries) * 1,000,000");
      affected.visualizations.push(
        "Dashboard - Supplier Complaints Metric Tile",
        "Dashboard - Supplier Defective Parts Metric Tile",
        "Dashboard - Supplier PPM Metric Tile",
        "Supplier Performance - Complaints Chart",
        "Supplier Performance - Defective Parts Chart",
        "Supplier Performance - PPM Trend Chart"
      );
      affected.pages.push("/dashboard", "/supplier-performance", "/complaints", "/ppm");
    }
    if (isQ3) {
      affected.metrics.push("Internal Complaints", "Internal Defective Parts");
      affected.visualizations.push(
        "Dashboard - Internal Complaints",
        "Poor Quality Costs - Internal Complaints Chart"
      );
      affected.pages.push("/dashboard", "/cost-poor-quality", "/complaints");
    }
  }

  // If complaint count changes (new complaint added/removed)
  if (fieldChanged === "notificationType" || fieldChanged === "category") {
    if (isQ1) {
      affected.metrics.push("Customer Complaints");
      affected.visualizations.push(
        "Dashboard - Customer Complaints Metric Tile",
        "Customer Performance - Complaints Chart",
        "Complaints Page - Q1 Complaints Table"
      );
      affected.pages.push("/dashboard", "/customer-performance", "/complaints");
    }
    if (isQ2) {
      affected.metrics.push("Supplier Complaints");
      affected.visualizations.push(
        "Dashboard - Supplier Complaints Metric Tile",
        "Supplier Performance - Complaints Chart",
        "Complaints Page - Q2 Complaints Table"
      );
      affected.pages.push("/dashboard", "/supplier-performance", "/complaints");
    }
    if (isQ3) {
      affected.metrics.push("Internal Complaints");
      affected.visualizations.push(
        "Complaints Page - Q3 Complaints Table",
        "Poor Quality Costs - Internal Complaints"
      );
      affected.pages.push("/complaints", "/cost-poor-quality");
    }
  }

  // All complaint changes affect AI Summary
  affected.visualizations.push("AI Management Summary", "I AM Q Analysis");
  affected.pages.push("/ai-summary");

  return affected;
}

/**
 * Get affected metrics and visualizations for a delivery change
 */
export function getAffectedMetricsForDelivery(
  delivery: Delivery,
  fieldChanged: string
): AffectedMetrics {
  const affected: AffectedMetrics = {
    metrics: [],
    visualizations: [],
    pages: [],
    calculations: [],
  };

  if (fieldChanged === "quantity") {
    if (delivery.kind === "Customer") {
      affected.metrics.push("Customer Deliveries");
      affected.calculations.push("Customer PPM = (Customer Defective Parts / Customer Deliveries) * 1,000,000");
      affected.visualizations.push(
        "Dashboard - Customer Deliveries Metric Tile",
        "Dashboard - Customer PPM Metric Tile",
        "Customer Performance - Deliveries Chart",
        "Customer Performance - PPM Trend Chart"
      );
      affected.pages.push("/dashboard", "/customer-performance", "/ppm");
    }
    if (delivery.kind === "Supplier") {
      affected.metrics.push("Supplier Deliveries");
      affected.calculations.push("Supplier PPM = (Supplier Defective Parts / Supplier Deliveries) * 1,000,000");
      affected.visualizations.push(
        "Dashboard - Supplier Deliveries Metric Tile",
        "Dashboard - Supplier PPM Metric Tile",
        "Supplier Performance - Deliveries Chart",
        "Supplier Performance - PPM Trend Chart"
      );
      affected.pages.push("/dashboard", "/supplier-performance", "/ppm");
    }
  }

  // All delivery changes affect AI Summary
  affected.visualizations.push("AI Management Summary", "I AM Q Analysis");
  affected.pages.push("/ai-summary");

  return affected;
}

/**
 * Storage utilities
 */
const UPLOAD_SUMMARY_PREFIX = "qos-et-upload-summary-";
const CHANGE_HISTORY_PREFIX = "qos-et-change-history-";

export function saveUploadSummary(summary: UploadSummaryEntry): void {
  if (typeof window === "undefined") return;
  try {
    // Aggressively optimize storage: Store only minimal complaint metadata
    // The conversion status already contains most of what we need
    // Store only essential fields needed for display and reconstruction
    const optimizedSummary: UploadSummaryEntry = {
      ...summary,
      // Store only minimal complaint metadata (essential fields only)
      rawData: {
        complaints: summary.rawData.complaints?.map(c => ({
          id: c.id,
          notificationNumber: c.notificationNumber,
          notificationType: c.notificationType,
          siteCode: c.siteCode,
          createdOn: c.createdOn instanceof Date ? c.createdOn.toISOString() : c.createdOn,
          materialNumber: (c as any).materialNumber,
          // Store minimal fields - rest can be reconstructed from conversionStatus
        })) || [],
        deliveries: summary.rawData.deliveries?.map(d => ({
          id: d.id,
          plant: d.plant,
          siteCode: d.siteCode,
          date: d.date instanceof Date ? d.date.toISOString() : d.date,
          kind: d.kind,
          quantity: d.quantity,
        })) || [],
      },
      processedData: {
        complaints: summary.processedData.complaints?.map(c => ({
          id: c.id,
          notificationNumber: c.notificationNumber,
          notificationType: c.notificationType,
          siteCode: c.siteCode,
          createdOn: c.createdOn instanceof Date ? c.createdOn.toISOString() : c.createdOn,
          materialNumber: (c as any).materialNumber,
          // Store minimal fields - rest can be reconstructed from conversionStatus
        })) || [],
        deliveries: summary.processedData.deliveries?.map(d => ({
          id: d.id,
          plant: d.plant,
          siteCode: d.siteCode,
          date: d.date instanceof Date ? d.date.toISOString() : d.date,
          kind: d.kind,
          quantity: d.quantity,
        })) || [],
      },
    };

    // Try to save, if quota exceeded, clean up old summaries first
    try {
      localStorage.setItem(`${UPLOAD_SUMMARY_PREFIX}${summary.id}`, JSON.stringify(optimizedSummary));
    } catch (quotaError) {
      if (quotaError instanceof Error && quotaError.name === "QuotaExceededError") {
        console.warn("[Upload Summary] Quota exceeded, cleaning up old summaries...");
        // Clean up old summaries (keep only last 5)
        const allSummaries = getAllUploadSummaries();
        if (allSummaries.length > 5) {
          // Sort by date, keep newest 5, delete oldest
          const sorted = allSummaries.sort((a, b) => 
            new Date(b.uploadedAtIso).getTime() - new Date(a.uploadedAtIso).getTime()
          );
          const toDelete = sorted.slice(5);
          toDelete.forEach(s => {
            try {
              localStorage.removeItem(`${UPLOAD_SUMMARY_PREFIX}${s.id}`);
            } catch (e) {
              console.error("[Upload Summary] Failed to delete old summary:", e);
            }
          });
          // Try again after cleanup
          try {
            localStorage.setItem(`${UPLOAD_SUMMARY_PREFIX}${summary.id}`, JSON.stringify(optimizedSummary));
          } catch (retryError) {
            console.error("[Upload Summary] Still failed after cleanup:", retryError);
            // Last resort: store only metadata without data
            const minimalSummary: Partial<UploadSummaryEntry> = {
              id: summary.id,
              uploadedAtIso: summary.uploadedAtIso,
              section: summary.section,
              files: summary.files,
              conversionStatus: summary.conversionStatus,
              changeHistory: summary.changeHistory,
              summary: summary.summary,
            };
            localStorage.setItem(`${UPLOAD_SUMMARY_PREFIX}${summary.id}`, JSON.stringify(minimalSummary));
          }
        } else {
          throw quotaError;
        }
      } else {
        throw quotaError;
      }
    }
  } catch (e) {
    console.error("[Upload Summary] Failed to save summary:", e);
  }
}

export function loadUploadSummary(uploadId: string): UploadSummaryEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${UPLOAD_SUMMARY_PREFIX}${uploadId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("[Upload Summary] Failed to load summary:", e);
    return null;
  }
}

export function saveChangeHistory(uploadId: string, changes: ChangeHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CHANGE_HISTORY_PREFIX}${uploadId}`, JSON.stringify(changes));
  } catch (e) {
    console.error("[Upload Summary] Failed to save change history:", e);
  }
}

export function loadChangeHistory(uploadId: string): ChangeHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(`${CHANGE_HISTORY_PREFIX}${uploadId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("[Upload Summary] Failed to load change history:", e);
    return [];
  }
}

/**
 * Get all upload summaries
 */
export function getAllUploadSummaries(): UploadSummaryEntry[] {
  if (typeof window === "undefined") return [];
  const summaries: UploadSummaryEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(UPLOAD_SUMMARY_PREFIX)) {
        const summary = loadUploadSummary(key.replace(UPLOAD_SUMMARY_PREFIX, ""));
        if (summary) summaries.push(summary);
      }
    }
  } catch (e) {
    console.error("[Upload Summary] Failed to get all summaries:", e);
  }
  return summaries.sort((a, b) => 
    new Date(b.uploadedAtIso).getTime() - new Date(a.uploadedAtIso).getTime()
  );
}

