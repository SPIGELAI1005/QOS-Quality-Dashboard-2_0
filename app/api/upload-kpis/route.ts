/**
 * API endpoint for uploading Excel files and calculating KPIs
 * Handles complaints and delivery files, parses them, and returns calculated KPIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseComplaints } from '@/lib/excel/parseComplaints';
import { parseDeliveries } from '@/lib/excel/parseDeliveries';
import {
  calculateMonthlySiteKpis,
  calculateGlobalPPM,
} from '@/lib/domain/kpi';
import type { Complaint, Delivery } from '@/lib/domain/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for large file processing

export async function POST(request: NextRequest) {
  try {
    console.log('Upload KPIs endpoint called');
    // Parse FormData
    const formData = await request.formData();
    console.log('FormData parsed successfully');

    // Get complaints files (supports legacy single "complaintsFile" + new multi "complaintsFiles")
    const legacyComplaintsFile = formData.get('complaintsFile') as File | null;
    const complaintsFiles = (formData.getAll('complaintsFiles') as File[]) || [];
    const allComplaintsFiles = [...complaintsFiles, ...(legacyComplaintsFile ? [legacyComplaintsFile] : [])];

    if (allComplaintsFiles.length === 0) {
      return NextResponse.json({ error: 'Missing complaintsFile(s) in FormData' }, { status: 400 });
    }

    // Get delivery files (can be multiple)
    const deliveryFiles = formData.getAll('deliveryFiles') as File[];

    if (deliveryFiles.length === 0) {
      return NextResponse.json(
        { error: 'Missing deliveryFiles in FormData' },
        { status: 400 }
      );
    }

    // Parse complaints files
    let allComplaints: Complaint[] = [];
    try {
      for (const f of allComplaintsFiles) {
        const complaintsBuffer = Buffer.from(await f.arrayBuffer());
        const complaints = parseComplaints(complaintsBuffer);
        allComplaints.push(...complaints);
        console.log(`Parsed ${complaints.length} complaints from ${f.name}`);
      }
      console.log(`Parsed ${allComplaints.length} total complaints from ${allComplaintsFiles.length} file(s)`);
    } catch (error) {
      console.error('Error parsing complaints file:', error);
      return NextResponse.json(
        {
          error: `Failed to parse complaints file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 400 }
      );
    }

    // Parse all delivery files and merge
    let allDeliveries: Delivery[] = [];
    const deliveryErrors: string[] = [];

    for (const deliveryFile of deliveryFiles) {
      try {
        const deliveryBuffer = Buffer.from(await deliveryFile.arrayBuffer());
        const deliveries = parseDeliveries(deliveryBuffer, undefined, deliveryFile.name);
        allDeliveries.push(...deliveries);
        console.log(`Parsed ${deliveries.length} deliveries from ${deliveryFile.name}`);
      } catch (error) {
        const errorMsg = `Failed to parse ${deliveryFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg, error);
        deliveryErrors.push(errorMsg);
        // Continue processing other files even if one fails
      }
    }

    // If all delivery files failed, return error
    if (allDeliveries.length === 0 && deliveryErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Failed to parse all delivery files',
          details: deliveryErrors,
        },
        { status: 400 }
      );
    }

    // Log warnings if some files failed but we have some data
    if (deliveryErrors.length > 0) {
      console.warn(`Some delivery files failed to parse:`, deliveryErrors);
    }

    // Calculate monthly site KPIs
    let monthlySiteKpis;
    try {
      monthlySiteKpis = calculateMonthlySiteKpis(allComplaints, allDeliveries);
      console.log(`Calculated KPIs for ${monthlySiteKpis.length} site-month combinations`);
    } catch (error) {
      console.error('Error calculating monthly site KPIs:', error);
      return NextResponse.json(
        {
          error: `Failed to calculate KPIs: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        },
        { status: 500 }
      );
    }

    // Return results
    return NextResponse.json({
      monthlySiteKpis,
      globalPpm,
      summary: {
        totalComplaints: allComplaints.length,
        totalDeliveries: allDeliveries.length,
        siteMonthCombinations: monthlySiteKpis.length,
        deliveryFileErrors: deliveryErrors.length > 0 ? deliveryErrors : undefined,
      },
    });
  } catch (error) {
    console.error('Unexpected error in upload-kpis endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 10).join('\n'),
    });
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

