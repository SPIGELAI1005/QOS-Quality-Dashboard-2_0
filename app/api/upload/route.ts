/**
 * API route for uploading and parsing Excel files
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseComplaints } from '@/lib/excel/parseComplaints';
import { parseDeliveries } from '@/lib/excel/parseDeliveries';
import { parsePlants } from '@/lib/excel/parsePlants';
import { parsePPAP } from '@/lib/excel/parsePPAP';
import { parseDeviations } from '@/lib/excel/parseDeviations';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileType = formData.get('fileType') as string;
    const files = formData.getAll('files') as File[];

    if (!fileType || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing fileType or files' },
        { status: 400 }
      );
    }

    const results: {
      complaints?: unknown[];
      deliveries?: unknown[];
      plants?: unknown[];
      ppaps?: unknown[];
      deviations?: unknown[];
      errors?: string[];
    } = {};

    const errors: string[] = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        switch (fileType) {
          case 'complaints':
            if (!results.complaints) results.complaints = [];
            const complaints = parseComplaints(buffer);
            results.complaints.push(...complaints);
            break;

          case 'deliveries':
            if (!results.deliveries) results.deliveries = [];
            const deliveries = parseDeliveries(buffer, undefined, file.name);
            results.deliveries.push(...deliveries);
            break;

          case 'plants':
            if (!results.plants) results.plants = [];
            const plants = parsePlants(buffer);
            results.plants.push(...plants);
            break;

          case 'ppap':
            if (!results.ppaps) results.ppaps = [];
            const ppaps = parsePPAP(buffer);
            results.ppaps.push(...ppaps);
            break;

          case 'deviations':
            if (!results.deviations) results.deviations = [];
            const deviations = parseDeviations(buffer);
            results.deviations.push(...deviations);
            break;

          default:
            errors.push(`Unknown file type: ${fileType}`);
        }
      } catch (error) {
        errors.push(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      results.errors = errors;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

