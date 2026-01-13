/**
 * Corrected Data Utilities
 * 
 * Manages corrected data from upload summaries and applies them to KPI calculations
 */

import type { Complaint, Delivery } from "@/lib/domain/types";
import type { UploadSummaryEntry } from "./uploadSummary";
import { getAllUploadSummaries } from "./uploadSummary";

/**
 * Get all corrected complaints from upload summaries
 */
export function getCorrectedComplaints(): Complaint[] {
  if (typeof window === "undefined") return [];
  
  const summaries = getAllUploadSummaries();
  const correctedComplaints: Complaint[] = [];
  const seenIds = new Set<string>();

  // Collect all corrected complaints, prioritizing processed data over raw
  summaries.forEach(summary => {
    if (summary.processedData.complaints) {
      summary.processedData.complaints.forEach(complaint => {
        // Only include if it was actually corrected (has change history)
        const wasCorrected = summary.changeHistory.some(
          change => change.recordId === complaint.id && change.recordType === "complaint"
        );
        
        if (wasCorrected && !seenIds.has(complaint.id)) {
          // Ensure complaint has all required fields before pushing
          if ('category' in complaint && 'plant' in complaint && 'source' in complaint && 'defectiveParts' in complaint) {
            correctedComplaints.push(complaint as Complaint);
            seenIds.add(complaint.id);
          }
        }
      });
    }
  });

  return correctedComplaints;
}

/**
 * Get all corrected deliveries from upload summaries
 */
export function getCorrectedDeliveries(): Delivery[] {
  if (typeof window === "undefined") return [];
  
  const summaries = getAllUploadSummaries();
  const correctedDeliveries: Delivery[] = [];
  const seenIds = new Set<string>();

  summaries.forEach(summary => {
    if (summary.processedData.deliveries) {
      summary.processedData.deliveries.forEach(delivery => {
        const wasCorrected = summary.changeHistory.some(
          change => change.recordId === delivery.id && change.recordType === "delivery"
        );
        
        if (wasCorrected && !seenIds.has(delivery.id)) {
          // Ensure delivery has all required fields and convert date if needed
          if ('plant' in delivery && 'siteCode' in delivery && 'kind' in delivery && 'quantity' in delivery) {
            const fullDelivery: Delivery = {
              ...delivery,
              date: delivery.date instanceof Date ? delivery.date : new Date(delivery.date),
            } as Delivery;
            correctedDeliveries.push(fullDelivery);
            seenIds.add(delivery.id);
          }
        }
      });
    }
  });

  return correctedDeliveries;
}

/**
 * Merge corrected data with raw data
 * Corrected records override raw records with the same ID
 */
export function mergeWithCorrectedData<T extends { id: string }>(
  rawData: T[],
  correctedData: T[]
): T[] {
  const correctedMap = new Map(correctedData.map(item => [item.id, item]));
  const merged: T[] = [];
  const processedIds = new Set<string>();

  // First, add all corrected data
  correctedData.forEach(item => {
    merged.push(item);
    processedIds.add(item.id);
  });

  // Then, add raw data that wasn't corrected
  rawData.forEach(item => {
    if (!processedIds.has(item.id)) {
      merged.push(item);
      processedIds.add(item.id);
    }
  });

  return merged;
}

/**
 * Apply corrections to complaints array
 */
export function applyComplaintCorrections(complaints: Complaint[]): Complaint[] {
  const corrected = getCorrectedComplaints();
  return mergeWithCorrectedData(complaints, corrected);
}

/**
 * Apply corrections to deliveries array
 */
export function applyDeliveryCorrections(deliveries: Delivery[]): Delivery[] {
  const corrected = getCorrectedDeliveries();
  return mergeWithCorrectedData(deliveries, corrected);
}

