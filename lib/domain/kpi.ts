/**
 * KPI calculation service for QOS ET Quality Report
 * Handles aggregation and calculation of quality metrics
 */

import type {
  Complaint,
  Delivery,
  MonthlySiteKpi,
  NotificationType,
} from './types';
import {
  formatMonth,
  isCustomerComplaint,
  isSupplierComplaint,
  isInternalComplaint,
  isDeviation,
  isPPAP,
} from './types';

/**
 * Group complaints by site and month
 * Key format: `${siteCode}::${monthKey}` where monthKey = "YYYY-MM"
 */
export function groupComplaintsByMonthAndSite(
  complaints: Complaint[]
): Map<string, Complaint[]> {
  const grouped = new Map<string, Complaint[]>();

  for (const complaint of complaints) {
    const monthKey = formatMonth(complaint.createdOn);
    const key = `${complaint.siteCode}::${monthKey}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(complaint);
  }

  return grouped;
}

/**
 * Group deliveries by site and month
 * Key format: `${siteCode}::${monthKey}` where monthKey = "YYYY-MM"
 */
export function groupDeliveriesByMonthAndSite(
  deliveries: Delivery[]
): Map<string, Delivery[]> {
  const grouped = new Map<string, Delivery[]>();

  for (const delivery of deliveries) {
    const monthKey = formatMonth(delivery.date);
    const key = `${delivery.siteCode}::${monthKey}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(delivery);
  }

  return grouped;
}

/**
 * Calculate PPM (Parts Per Million)
 * Returns null if denominator is zero
 */
function calculatePPM(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }
  return (numerator / denominator) * 1_000_000;
}

/**
 * Calculate monthly site KPIs from complaints and deliveries
 */
export function calculateMonthlySiteKpis(
  complaints: Complaint[],
  deliveries: Delivery[]
): MonthlySiteKpi[] {
  // Group data by site and month
  const complaintsBySiteMonth = groupComplaintsByMonthAndSite(complaints);
  const deliveriesBySiteMonth = groupDeliveriesByMonthAndSite(deliveries);

  // Get all unique site+month combinations
  const allKeys = new Set<string>();
  complaintsBySiteMonth.forEach((_, key) => allKeys.add(key));
  deliveriesBySiteMonth.forEach((_, key) => allKeys.add(key));

  const kpis: MonthlySiteKpi[] = [];

  for (const key of allKeys) {
    const [siteCode, month] = key.split('::');
    if (!siteCode || !month) continue;

    const siteComplaints = complaintsBySiteMonth.get(key) || [];
    const siteDeliveries = deliveriesBySiteMonth.get(key) || [];

    // Get site name from first complaint or delivery (if available)
    const siteName =
      siteComplaints[0]?.siteName || siteDeliveries[0]?.siteName || undefined;

    // Count complaints by type
    // Customer Complaints = count of Q1 notifications from Excel file
    // Supplier Complaints = count of Q2 notifications from Excel file
    let customerComplaintsQ1 = 0;
    let supplierComplaintsQ2 = 0;
    let internalComplaintsQ3 = 0;
    let deviationsD = 0;
    let ppapInProgress = 0;
    let ppapCompleted = 0;

    for (const complaint of siteComplaints) {
      // Count each Q1 notification as one customer complaint
      if (isCustomerComplaint(complaint.notificationType)) {
        customerComplaintsQ1++;
      } 
      // Count each Q2 notification as one supplier complaint
      else if (isSupplierComplaint(complaint.notificationType)) {
        supplierComplaintsQ2++;
      } else if (isInternalComplaint(complaint.notificationType)) {
        internalComplaintsQ3++;
      }

      if (isDeviation(complaint.notificationType)) {
        deviationsD++;
      }

      if (complaint.notificationType === 'P1') {
        ppapInProgress++;
      } else if (complaint.notificationType === 'P2' || complaint.notificationType === 'P3') {
        ppapCompleted++;
      }
    }

    // Calculate Customer PPM
    // Numerator: sum of defectiveParts for Q1 complaints (already converted to PC if applicable)
    const customerComplaintsQ1List = siteComplaints.filter((c) => isCustomerComplaint(c.notificationType));
    const customerDefectiveParts = customerComplaintsQ1List
      .reduce((sum, c) => sum + c.defectiveParts, 0);
    
    // Track conversions for customer complaints (Q1)
    const customerConversions = {
      totalConverted: 0,
      totalML: 0,
      totalPC: 0,
      conversions: [] as Array<{
        notificationNumber: string;
        originalML: number;
        originalUnit?: string;
        convertedPC: number;
        bottleSize: number;
        materialDescription?: string;
      }>,
    };
    
    customerComplaintsQ1List.forEach((c) => {
      if (c.conversion && c.conversion.wasConverted) {
        customerConversions.totalConverted++;
        customerConversions.totalML += c.conversion.originalValue; // Keep field name for backward compatibility
        customerConversions.totalPC += c.conversion.convertedValue;
        customerConversions.conversions.push({
          notificationNumber: c.notificationNumber,
          originalML: c.conversion.originalValue, // Keep field name, but value can be ML, M, or M2
          originalUnit: c.conversion.originalUnit, // Add unit type
          convertedPC: c.conversion.convertedValue,
          bottleSize: c.conversion.bottleSize!, // Reused for: bottle size (ML), length (M), or area (M2)
          materialDescription: c.conversion.materialDescription,
        });
      }
    });

    // Denominator: sum of quantity for Customer deliveries (from Outbound files)
    // Customer deliveries = sum of all quantities from files starting with "Outbound"
    const customerDeliveredQuantity = siteDeliveries
      .filter((d) => d.kind === 'Customer')
      .reduce((sum, d) => sum + d.quantity, 0);

    const customerPpm = calculatePPM(customerDefectiveParts, customerDeliveredQuantity);

    // Calculate Supplier PPM
    // Numerator: sum of defectiveParts for Q2 complaints (already converted to PC if applicable)
    const supplierComplaintsQ2List = siteComplaints.filter((c) => isSupplierComplaint(c.notificationType));
    const supplierDefectiveParts = supplierComplaintsQ2List
      .reduce((sum, c) => sum + c.defectiveParts, 0);
    
    // Track conversions for supplier complaints
    const supplierConversions = {
      totalConverted: 0,
      totalML: 0,
      totalPC: 0,
      conversions: [] as Array<{
        notificationNumber: string;
        originalML: number;
        originalUnit?: string;
        convertedPC: number;
        bottleSize: number;
        materialDescription?: string;
      }>,
    };
    
    supplierComplaintsQ2List.forEach((c) => {
      if (c.conversion && c.conversion.wasConverted) {
        supplierConversions.totalConverted++;
        supplierConversions.totalML += c.conversion.originalValue; // Keep field name for backward compatibility
        supplierConversions.totalPC += c.conversion.convertedValue;
        supplierConversions.conversions.push({
          notificationNumber: c.notificationNumber,
          originalML: c.conversion.originalValue, // Keep field name, but value can be ML, M, or M2
          originalUnit: c.conversion.originalUnit, // Add unit type
          convertedPC: c.conversion.convertedValue,
          bottleSize: c.conversion.bottleSize!, // Reused for: bottle size (ML), length (M), or area (M2)
          materialDescription: c.conversion.materialDescription,
        });
      }
    });

    // Denominator: sum of quantity for Supplier deliveries (from Inbound files)
    // Supplier deliveries = sum of all quantities from files starting with "Inbound"
    const supplierDeliveredQuantity = siteDeliveries
      .filter((d) => d.kind === 'Supplier')
      .reduce((sum, d) => sum + d.quantity, 0);

    const supplierPpm = calculatePPM(supplierDefectiveParts, supplierDeliveredQuantity);

    // Calculate Internal defective parts (Q3)
    const internalComplaintsQ3List = siteComplaints.filter((c) => isInternalComplaint(c.notificationType));
    const internalDefectiveParts = internalComplaintsQ3List.reduce((sum, c) => sum + c.defectiveParts, 0);

    // Create KPI object
    const kpi: MonthlySiteKpi = {
      month,
      siteCode,
      siteName,
      customerComplaintsQ1,
      supplierComplaintsQ2,
      internalComplaintsQ3,
      deviationsD,
      ppapP: {
        inProgress: ppapInProgress,
        completed: ppapCompleted,
      },
      customerPpm,
      supplierPpm,
      // Store actual delivery quantities from Outbound/Inbound files
      customerDeliveries: customerDeliveredQuantity,
      supplierDeliveries: supplierDeliveredQuantity,
      // Store actual defective parts quantities from Q1/Q2 notifications
      customerDefectiveParts: customerDefectiveParts,
      supplierDefectiveParts: supplierDefectiveParts,
      internalDefectiveParts,
      // Store conversion information if any conversions were made
      customerConversions: customerConversions.totalConverted > 0 ? customerConversions : undefined,
      supplierConversions: supplierConversions.totalConverted > 0 ? supplierConversions : undefined,
    };

    kpis.push(kpi);
  }

  // Sort by month, then by siteCode
  return kpis.sort((a, b) => {
    if (a.month !== b.month) {
      return a.month.localeCompare(b.month);
    }
    return a.siteCode.localeCompare(b.siteCode);
  });
}

/**
 * Calculate overall global PPM across all sites
 * Returns customer and supplier PPM aggregated across all sites and months
 */
export function calculateGlobalPPM(
  complaints: Complaint[],
  deliveries: Delivery[]
): {
  customerPpm: number | null;
  supplierPpm: number | null;
} {
  // Calculate total defective parts for customer complaints (Q1)
  const totalCustomerDefectiveParts = complaints
    .filter((c) => isCustomerComplaint(c.notificationType))
    .reduce((sum, c) => sum + c.defectiveParts, 0);

  // Calculate total delivered quantity for customer deliveries
  const totalCustomerDeliveredQuantity = deliveries
    .filter((d) => d.kind === 'Customer')
    .reduce((sum, d) => sum + d.quantity, 0);

  // Calculate total defective parts for supplier complaints (Q2)
  const totalSupplierDefectiveParts = complaints
    .filter((c) => isSupplierComplaint(c.notificationType))
    .reduce((sum, c) => sum + c.defectiveParts, 0);

  // Calculate total delivered quantity for supplier deliveries
  const totalSupplierDeliveredQuantity = deliveries
    .filter((d) => d.kind === 'Supplier')
    .reduce((sum, d) => sum + d.quantity, 0);

  return {
    customerPpm: calculatePPM(totalCustomerDefectiveParts, totalCustomerDeliveredQuantity),
    supplierPpm: calculatePPM(totalSupplierDefectiveParts, totalSupplierDeliveredQuantity),
  };
}

