/**
 * Core domain models and types for QOS ET Quality Report
 */

/**
 * Notification category classification
 */
export enum NotificationCategory {
  CustomerComplaint = "CustomerComplaint",
  SupplierComplaint = "SupplierComplaint",
  InternalComplaint = "InternalComplaint",
  Deviation = "Deviation",
  PPAP = "PPAP",
}

/**
 * Notification type codes from SAP S/4HANA
 */
export type NotificationType = "Q1" | "Q2" | "Q3" | "D1" | "D2" | "D3" | "P1" | "P2" | "P3" | "Other";

/**
 * Delivery kind (customer or supplier)
 */
export type DeliveryKind = "Customer" | "Supplier";

/**
 * Data source identifier
 */
export type DataSource = "SAP_S4" | "Manual" | "Import";

/**
 * Unit conversion information for various units to PC conversion
 * Supports: ML (milliliters), M (meters), M2 (square meters)
 */
export interface UnitConversion {
  originalValue: number;
  originalUnit: string; // "ML", "M", "M2", or "PC"
  convertedValue: number; // Always in PC
  bottleSize?: number; // Reused for: bottle size (ML), length per piece (M), or area per piece (M2)
  materialDescription?: string;
  wasConverted: boolean;
}

/**
 * Complaint notification record
 */
export interface Complaint {
  id: string;
  notificationNumber: string;
  notificationType: NotificationType;
  category: NotificationCategory;
  plant: string;
  siteCode: string;
  siteName?: string;
  createdOn: Date;
  defectiveParts: number;
  source: DataSource;
  // Unit conversion fields (for supplier complaints - Q2)
  unitOfMeasure?: string; // "PC", "ML", etc.
  materialDescription?: string;
  materialNumber?: string; // Material number from SAP
  conversion?: UnitConversion; // Conversion info if ML was converted to PC
}

/**
 * Delivery record
 */
export interface Delivery {
  id: string;
  plant: string;
  siteCode: string;
  siteName?: string;
  date: Date;
  quantity: number;
  kind: DeliveryKind;
}

/**
 * Monthly KPI aggregated by site
 */
export interface MonthlySiteKpi {
  month: string; // Format: "YYYY-MM" (e.g., "2025-02")
  siteCode: string;
  siteName?: string;
  customerComplaintsQ1: number;
  supplierComplaintsQ2: number;
  internalComplaintsQ3: number;
  deviationsD: number;
  ppapP: {
    inProgress: number;
    completed: number;
  };
  customerPpm: number | null;
  supplierPpm: number | null;
  // Delivery quantities from Outbound (Customer) and Inbound (Supplier) files
  customerDeliveries: number; // Sum of quantities from Outbound files
  supplierDeliveries: number; // Sum of quantities from Inbound files
  // Defective parts quantities from Q1 (Customer) and Q2 (Supplier) complaints
  customerDefectiveParts: number; // Sum of defectiveParts from Q1 notifications
  supplierDefectiveParts: number; // Sum of defectiveParts from Q2 notifications
  // Defective parts quantities from Q3 (Internal) complaints
  internalDefectiveParts: number; // Sum of defectiveParts from Q3 notifications
  // Conversion information for customer defective parts (ML/M/M2 to PC) - Q1
  customerConversions?: {
    totalConverted: number; // Total number of complaints converted
    totalML: number; // Total original units before conversion (ML, M, or M2)
    totalPC: number; // Total PC after conversion
    conversions: Array<{
      notificationNumber: string;
      originalML: number; // Original value (can be ML, M, or M2)
      originalUnit?: string; // Unit type: "ML", "M", "M2"
      convertedPC: number;
      bottleSize: number; // Reused for: bottle size (ML), length per piece (M), or area per piece (M2)
      materialDescription?: string;
    }>;
  };
  // Conversion information for supplier defective parts (ML/M/M2 to PC) - Q2
  supplierConversions?: {
    totalConverted: number; // Total number of complaints converted
    totalML: number; // Total original units before conversion (ML, M, or M2)
    totalPC: number; // Total PC after conversion
    conversions: Array<{
      notificationNumber: string;
      originalML: number; // Original value (can be ML, M, or M2)
      originalUnit?: string; // Unit type: "ML", "M", "M2"
      convertedPC: number;
      bottleSize: number; // Reused for: bottle size (ML), length per piece (M), or area per piece (M2)
      materialDescription?: string;
    }>;
  };
}

/**
 * Helper function to map NotificationType to NotificationCategory
 */
export function getCategoryFromNotificationType(
  notificationType: NotificationType
): NotificationCategory {
  switch (notificationType) {
    case "Q1":
      return NotificationCategory.CustomerComplaint;
    case "Q2":
      return NotificationCategory.SupplierComplaint;
    case "Q3":
      return NotificationCategory.InternalComplaint;
    case "D1":
    case "D2":
    case "D3":
      return NotificationCategory.Deviation;
    case "P1":
    case "P2":
    case "P3":
      return NotificationCategory.PPAP;
    case "Other":
    default:
      // Default to InternalComplaint for unknown types
      return NotificationCategory.InternalComplaint;
  }
}

/**
 * Helper function to check if a notification type is a deviation
 */
export function isDeviation(notificationType: NotificationType): boolean {
  return notificationType === "D1" || notificationType === "D2" || notificationType === "D3";
}

/**
 * Helper function to check if a notification type is PPAP
 */
export function isPPAP(notificationType: NotificationType): boolean {
  return notificationType === "P1" || notificationType === "P2" || notificationType === "P3";
}

/**
 * Helper function to check if a notification type is a customer complaint
 */
export function isCustomerComplaint(notificationType: NotificationType): boolean {
  return notificationType === "Q1";
}

/**
 * Helper function to check if a notification type is a supplier complaint
 */
export function isSupplierComplaint(notificationType: NotificationType): boolean {
  return notificationType === "Q2";
}

/**
 * Helper function to check if a notification type is an internal complaint
 */
export function isInternalComplaint(notificationType: NotificationType): boolean {
  return notificationType === "Q3";
}

/**
 * Helper function to parse notification type from string
 * Normalizes the input and returns a valid NotificationType
 */
export function parseNotificationType(value: string | null | undefined): NotificationType {
  if (!value) return "Other";

  const normalized = value.toString().trim().toUpperCase();

  // Check for exact matches
  const validTypes: NotificationType[] = ["Q1", "Q2", "Q3", "D1", "D2", "D3", "P1", "P2", "P3"];
  if (validTypes.includes(normalized as NotificationType)) {
    return normalized as NotificationType;
  }

  // Check for partial matches or variations
  if (normalized.startsWith("Q")) {
    const num = normalized.slice(1);
    if (num === "1") return "Q1";
    if (num === "2") return "Q2";
    if (num === "3") return "Q3";
  }

  if (normalized.startsWith("D")) {
    const num = normalized.slice(1);
    if (num === "1") return "D1";
    if (num === "2") return "D2";
    if (num === "3") return "D3";
  }

  if (normalized.startsWith("P")) {
    const num = normalized.slice(1);
    if (num === "1") return "P1";
    if (num === "2") return "P2";
    if (num === "3") return "P3";
  }

  return "Other";
}

/**
 * Helper function to generate a unique ID for complaints
 */
export function generateComplaintId(notificationNumber: string, plant: string): string {
  return `${plant}-${notificationNumber}`;
}

/**
 * Helper function to generate a unique ID for deliveries
 */
export function generateDeliveryId(plant: string, siteCode: string, date: Date, kind: DeliveryKind): string {
  const dateStr = date.toISOString().split("T")[0];
  return `${plant}-${siteCode}-${dateStr}-${kind}`;
}

/**
 * Helper function to format month string (YYYY-MM)
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Helper function to parse month string to Date (first day of month)
 */
export function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * Plant/Site information
 */
export interface Plant {
  code: string;
  name: string;
  site: string;
}

/**
 * KPI filters for data aggregation
 */
export interface KpiFilters {
  startDate: Date;
  endDate: Date;
  sites: string[];
}

/**
 * Aggregated KPI data for reporting
 */
export interface AggregatedKpiData {
  monthlyData: MonthlySiteKpi[];
  siteData: Record<string, MonthlySiteKpi[]>;
  totalComplaints: number;
  totalDeliveries: number;
  totalDefectiveParts: number;
  totalDeliveredQuantity: number;
  currentPPM: number;
  activeSites: string[];
  complaintTypes: Record<NotificationType, number>;
}
