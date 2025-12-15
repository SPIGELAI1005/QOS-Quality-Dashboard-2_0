/**
 * API endpoint for automatically processing all Excel files from attachments folder
 * Scans the folder, detects file types, and processes them accordingly
 */

import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseComplaints } from '@/lib/excel/parseComplaints';
import { parseDeliveries } from '@/lib/excel/parseDeliveries';
import { parseDeviations } from '@/lib/excel/parseDeviations';
import { parsePPAP } from '@/lib/excel/parsePPAP';
import { parseInspections } from '@/lib/excel/parseInspections';
import { detectFileType } from '@/lib/excel/fileDetector';
import {
  calculateMonthlySiteKpis,
  calculateGlobalPPM,
} from '@/lib/domain/kpi';
import type { Complaint, Delivery } from '@/lib/domain/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // Allow up to 2 minutes for processing all files

export async function POST(request: NextRequest) {
  try {
    console.log('[upload-all-files] Endpoint called at', new Date().toISOString());
    
    // Verify imports are working
    try {
      console.log('[upload-all-files] Testing imports...');
      const testDetect = detectFileType('test.xlsx');
      console.log('[upload-all-files] Imports OK, file detection works');
    } catch (importError) {
      console.error('[upload-all-files] Import error:', importError);
      return NextResponse.json(
        { error: `Import error: ${importError instanceof Error ? importError.message : 'Unknown'}` },
        { status: 500 }
      );
    }
    
    const attachmentsPath = join(process.cwd(), 'attachments');
    console.log('[upload-all-files] Attachments path:', attachmentsPath);
    console.log('[upload-all-files] Current working directory:', process.cwd());
    
    // Get all Excel files from attachments folder
    let excelFiles: string[] = [];
    try {
      const files = readdirSync(attachmentsPath);
      console.log('Files in attachments folder:', files);
      excelFiles = files.filter(
        (f) => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.XLSX') || f.endsWith('.XLS')
      );
      console.log('Excel files found:', excelFiles);
    } catch (error) {
      console.error('Error reading attachments folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to read attachments folder: ${errorMessage}`, path: attachmentsPath },
        { status: 500 }
      );
    }
    
    if (excelFiles.length === 0) {
      return NextResponse.json(
        { error: 'No Excel files found in attachments folder' },
        { status: 404 }
      );
    }
    
    console.log(`Found ${excelFiles.length} Excel files in attachments folder`);
    
    // Process all files by type
    const allComplaints: Complaint[] = [];
    const allDeliveries: Delivery[] = [];
    const allDeviations: any[] = [];
    const allPPAPs: any[] = [];
    const allInspections: any[] = [];
    
    const processingResults: {
      fileName: string;
      type: string;
      count: number;
      error?: string;
    }[] = [];
    
    console.log(`[upload-all-files] Starting to process ${excelFiles.length} files...`);
    for (const fileName of excelFiles) {
      console.log(`[upload-all-files] === Processing file: ${fileName} ===`);
      try {
        // Skip temporary Excel files (starting with ~$)
        if (fileName.startsWith('~$')) {
          console.log(`[upload-all-files] Skipping temporary file: ${fileName}`);
          continue;
        }
        
        const filePath = join(attachmentsPath, fileName);
        const detected = detectFileType(fileName);
        console.log(`[upload-all-files] Processing file: ${fileName}, detected type: ${detected.type}`);
        
        // Special logging for delivery files
        if (detected.type === 'deliveries-outbound' || detected.type === 'deliveries-inbound') {
          console.log(`[upload-all-files] *** DELIVERY FILE DETECTED: ${fileName} -> ${detected.type} ***`);
          console.log(`[upload-all-files] *** About to read file buffer for: ${fileName} ***`);
        }
        
        const buffer = readFileSync(filePath);
        
        if (detected.type === 'deliveries-outbound' || detected.type === 'deliveries-inbound') {
          console.log(`[upload-all-files] *** File buffer read successfully, size: ${buffer.length} bytes ***`);
        }
        
        let count = 0;
        
        console.log(`[upload-all-files] *** About to enter switch statement for ${fileName}, type: ${detected.type} ***`);
        
        switch (detected.type) {
          case 'complaints': {
            const complaints = parseComplaints(buffer);
            // Log Q1, Q2, Q3 counts per file for debugging
            const fileQ1 = complaints.filter(c => c.notificationType === 'Q1').length;
            const fileQ2 = complaints.filter(c => c.notificationType === 'Q2').length;
            const fileQ3 = complaints.filter(c => c.notificationType === 'Q3').length;
            console.log(`[File: ${fileName}] Q1: ${fileQ1}, Q2: ${fileQ2}, Q3: ${fileQ3}, Total: ${complaints.length}`);
            allComplaints.push(...complaints);
            count = complaints.length;
            break;
          }
          
          case 'deliveries-outbound':
          case 'deliveries-inbound': {
            // Use the same parser for both inbound and outbound
            console.log(`[upload-all-files] *** ENTERED DELIVERY CASE for ${fileName}, type: ${detected.type} ***`);
            console.log(`[upload-all-files] Processing delivery file: ${fileName}, type: ${detected.type}`);
            try {
              console.log(`[upload-all-files] *** About to call parseDeliveries for ${fileName} ***`);
              const deliveries = parseDeliveries(buffer, undefined, fileName);
              console.log(`[upload-all-files] *** parseDeliveries returned ${deliveries.length} deliveries ***`);
              console.log(`[upload-all-files] Parsed ${deliveries.length} deliveries from ${fileName}`);
              if (deliveries.length > 0) {
                console.log(`[upload-all-files] Sample delivery:`, {
                  plant: deliveries[0].plant,
                  siteCode: deliveries[0].siteCode,
                  date: deliveries[0].date,
                  quantity: deliveries[0].quantity,
                  kind: deliveries[0].kind,
                });
              } else {
                console.warn(`[upload-all-files] WARNING: No deliveries parsed from ${fileName}. Check column mappings and data format.`);
              }
              allDeliveries.push(...deliveries);
              count = deliveries.length;
            } catch (parseError) {
              console.error(`[upload-all-files] ERROR parsing delivery file ${fileName}:`, parseError);
              console.error(`[upload-all-files] Error details:`, parseError instanceof Error ? parseError.message : String(parseError));
              throw parseError; // Re-throw to be caught by outer try-catch
            }
            break;
          }
          
          case 'deviations': {
            const deviations = parseDeviations(buffer);
            // Convert deviations to complaints format for KPI calculation
            allComplaints.push(...deviations.map(d => ({
              id: d.id,
              notificationNumber: d.notificationNumber,
              notificationType: d.notificationType,
              category: d.category,
              plant: d.plant,
              siteCode: d.siteCode,
              siteName: d.siteName,
              createdOn: d.createdOn,
              defectiveParts: d.defectiveParts,
              source: d.source,
            })));
            allDeviations.push(...deviations);
            count = deviations.length;
            break;
          }
          
          case 'ppap': {
            const ppaps = parsePPAP(buffer);
            // Convert PPAPs to complaints format for KPI calculation
            allComplaints.push(...ppaps.map(p => ({
              id: p.id,
              notificationNumber: p.notificationNumber,
              notificationType: p.notificationType,
              category: p.category,
              plant: p.plant,
              siteCode: p.siteCode,
              siteName: p.siteName,
              createdOn: p.createdOn,
              defectiveParts: p.defectiveParts,
              source: p.source,
            })));
            allPPAPs.push(...ppaps);
            count = ppaps.length;
            break;
          }
          
          case 'inspections': {
            const inspections = parseInspections(buffer);
            allInspections.push(...inspections);
            count = inspections.length;
            break;
          }
          
          case 'plants': {
            // Plants are handled separately via /api/plants
            count = 0;
            break;
          }
          
          default: {
            console.warn(`Unknown file type for ${fileName}, skipping`);
            count = 0;
          }
        }
        
        processingResults.push({
          fileName,
          type: detected.type,
          count,
        });
        
        console.log(`[upload-all-files] Processed ${fileName}: ${detected.type}, ${count} records`);
        if (detected.type === 'deliveries-outbound' || detected.type === 'deliveries-inbound') {
          console.log(`[upload-all-files] *** Delivery file processed: ${fileName}, count: ${count} ***`);
          console.log(`[upload-all-files] *** Total deliveries so far: ${allDeliveries.length} ***`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error(`Error processing ${fileName}:`, errorMsg);
        console.error('Error stack:', errorStack);
        processingResults.push({
          fileName,
          type: 'error',
          count: 0,
          error: errorMsg,
        });
      }
    }
    
    // Log complaint type counts before KPI calculation
    const q1Count = allComplaints.filter(c => c.notificationType === 'Q1').length;
    const q2Count = allComplaints.filter(c => c.notificationType === 'Q2').length;
    const q3Count = allComplaints.filter(c => c.notificationType === 'Q3').length;
    console.log(`[Upload All Files] Raw complaint counts - Q1: ${q1Count}, Q2: ${q2Count}, Q3: ${q3Count}, Total: ${allComplaints.length}`);
    
    // Log Q2 defective parts breakdown by unit
    const q2Complaints = allComplaints.filter(c => c.notificationType === 'Q2');
    const q2TotalDefective = q2Complaints.reduce((sum, c) => sum + c.defectiveParts, 0);
    const q2ByUnit = new Map<string, number>();
    q2Complaints.forEach(c => {
      const unit = c.unitOfMeasure || 'UNKNOWN';
      q2ByUnit.set(unit, (q2ByUnit.get(unit) || 0) + c.defectiveParts);
    });
    console.log(`[Upload All Files] Q2 total defective parts: ${q2TotalDefective}`);
    console.log(`[Upload All Files] Q2 defective parts by unit:`, Array.from(q2ByUnit.entries()));
    const q2Converted = q2Complaints.filter(c => c.conversion && c.conversion.wasConverted);
    const q2ConvertedTotal = q2Converted.reduce((sum, c) => sum + (c.conversion?.convertedValue || 0), 0);
    const q2NotConverted = q2Complaints.filter(c => !c.conversion || !c.conversion.wasConverted);
    const q2NotConvertedTotal = q2NotConverted.reduce((sum, c) => sum + c.defectiveParts, 0);
    console.log(`[Upload All Files] Q2 converted to PC: ${q2Converted.length} complaints, total: ${q2ConvertedTotal} PC`);
    console.log(`[Upload All Files] Q2 not converted (already PC or no conversion): ${q2NotConverted.length} complaints, total: ${q2NotConvertedTotal} PC`);
    console.log(`[Upload All Files] Q2 total PC (converted + not converted): ${q2ConvertedTotal + q2NotConvertedTotal}`);
    
    // Log breakdown by site code for Q1 to help identify duplicates
    const q1BySite = new Map<string, number>();
    allComplaints.filter(c => c.notificationType === 'Q1').forEach(c => {
      const site = c.siteCode || 'unknown';
      q1BySite.set(site, (q1BySite.get(site) || 0) + 1);
    });
    console.log(`[Upload All Files] Q1 complaints by site:`, Array.from(q1BySite.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20));
    
    // Check for duplicate notification numbers (same complaint processed multiple times)
    const notificationNumbers = new Map<string, number>();
    allComplaints.forEach(c => {
      const key = c.notificationNumber || 'unknown';
      notificationNumbers.set(key, (notificationNumbers.get(key) || 0) + 1);
    });
    const duplicates = Array.from(notificationNumbers.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.warn(`[Upload All Files] WARNING: Found ${duplicates.length} duplicate notification numbers!`);
      console.warn(`[Upload All Files] Sample duplicates:`, duplicates.slice(0, 10));
    }
    
    // Log processing results for delivery files specifically
    const deliveryFileResults = processingResults.filter(r => 
      r.type === 'deliveries-outbound' || r.type === 'deliveries-inbound'
    );
    console.log(`[upload-all-files] Delivery file processing results:`, deliveryFileResults);
    if (deliveryFileResults.length === 0) {
      console.warn(`[upload-all-files] WARNING: No delivery files were processed!`);
      console.warn(`[upload-all-files]   Check if files are being detected correctly`);
      const allDetectedTypes = excelFiles.map(f => {
        const detected = detectFileType(f);
        return { file: f, type: detected.type };
      });
      console.warn(`[upload-all-files]   All file detections:`, allDetectedTypes);
    }
    
    // Calculate total quantity from all deliveries (this is what matters for PPM)
    const totalDeliveryQuantity = allDeliveries.reduce((sum, d) => sum + d.quantity, 0);
    const customerDeliveryQuantity = allDeliveries
      .filter(d => d.kind === 'Customer')
      .reduce((sum, d) => sum + d.quantity, 0);
    const supplierDeliveryQuantity = allDeliveries
      .filter(d => d.kind === 'Supplier')
      .reduce((sum, d) => sum + d.quantity, 0);
    
    // Log totals before KPI calculation
    console.log(`[upload-all-files] Summary before KPI calculation:`);
    console.log(`[upload-all-files]   Total complaints: ${allComplaints.length}`);
    console.log(`[upload-all-files]   Total delivery records: ${allDeliveries.length}`);
    console.log(`[upload-all-files]   Total delivery quantity: ${totalDeliveryQuantity.toLocaleString('de-DE')} pieces`);
    console.log(`[upload-all-files]   Customer delivery quantity: ${customerDeliveryQuantity.toLocaleString('de-DE')} pieces`);
    console.log(`[upload-all-files]   Supplier delivery quantity: ${supplierDeliveryQuantity.toLocaleString('de-DE')} pieces`);
    if (allDeliveries.length === 0) {
      console.warn(`[upload-all-files] WARNING: No deliveries parsed!`);
      console.warn(`[upload-all-files]   Check if delivery files exist in attachments folder`);
      console.warn(`[upload-all-files]   Delivery files should start with "Outbound" or "Inbound" in filename`);
      console.warn(`[upload-all-files]   Files found: ${excelFiles.join(', ')}`);
    }
    
    // Calculate monthly site KPIs
    let monthlySiteKpis;
    try {
      monthlySiteKpis = calculateMonthlySiteKpis(allComplaints, allDeliveries);
      console.log(`[upload-all-files] Calculated KPIs for ${monthlySiteKpis.length} site-month combinations`);
      
      // Verify KPI counts match raw counts
      const kpiQ1Total = monthlySiteKpis.reduce((sum, k) => sum + k.customerComplaintsQ1, 0);
      const kpiQ2Total = monthlySiteKpis.reduce((sum, k) => sum + k.supplierComplaintsQ2, 0);
      const kpiQ3Total = monthlySiteKpis.reduce((sum, k) => sum + k.internalComplaintsQ3, 0);
      console.log(`[Upload All Files] KPI aggregated counts - Q1: ${kpiQ1Total}, Q2: ${kpiQ2Total}, Q3: ${kpiQ3Total}`);
      
      if (q1Count !== kpiQ1Total || q2Count !== kpiQ2Total || q3Count !== kpiQ3Total) {
        console.warn(`[Upload All Files] WARNING: KPI counts don't match raw counts! This indicates a counting issue.`);
      }
    } catch (error) {
      console.error('Error calculating monthly site KPIs:', error);
      return NextResponse.json(
        {
          error: `Failed to calculate KPIs: ${error instanceof Error ? error.message : 'Unknown error'}`,
          processingResults,
        },
        { status: 500 }
      );
    }
    
    // Calculate global PPM
    let globalPpm;
    try {
      globalPpm = calculateGlobalPPM(allComplaints, allDeliveries);
      console.log(`Global PPM - Customer: ${globalPpm.customerPpm}, Supplier: ${globalPpm.supplierPpm}`);
    } catch (error) {
      console.error('Error calculating global PPM:', error);
      return NextResponse.json(
        {
          error: `Failed to calculate global PPM: ${error instanceof Error ? error.message : 'Unknown error'}`,
          processingResults,
        },
        { status: 500 }
      );
    }
    
    // Serialize dates to ISO strings for JSON response
    const serializedKpis = monthlySiteKpis.map(kpi => ({
      ...kpi,
      // Dates are already in month format (YYYY-MM), no need to serialize
    }));

    // Return results
    return NextResponse.json({
      monthlySiteKpis: serializedKpis,
      globalPpm,
      summary: {
        totalComplaints: allComplaints.length,
        totalDeliveries: allDeliveries.length,
        totalDeliveryQuantity: totalDeliveryQuantity,
        customerDeliveryQuantity: customerDeliveryQuantity,
        supplierDeliveryQuantity: supplierDeliveryQuantity,
        totalDeviations: allDeviations.length,
        totalPPAPs: allPPAPs.length,
        totalInspections: allInspections.length,
        siteMonthCombinations: monthlySiteKpis.length,
        filesProcessed: processingResults.length,
      },
      processingResults,
      // Don't include raw data with Date objects - they can't be serialized
      // additionalData: {
      //   deviations: allDeviations,
      //   ppaps: allPPAPs,
      //   inspections: allInspections,
      // },
    });
  } catch (error) {
    console.error('Unexpected error in upload-all-files endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorStack ? errorStack.split('\n').slice(0, 5).join('\n') : undefined,
      },
      { status: 500 }
    );
  }
}

