import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_RECORDS_PER_CHUNK = 2000;

const allowedFileTypes = new Set([
  "complaints",
  "deliveries",
  "ppap",
  "deviations",
  "plants",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fileType = String(body?.fileType || "");
    const chunkIndex = Number(body?.chunkIndex || 0);
    const totalChunks = Number(body?.totalChunks || 0);
    const records = Array.isArray(body?.records) ? body.records : null;

    if (!allowedFileTypes.has(fileType)) {
      return NextResponse.json({ error: `Unsupported file type: ${fileType}` }, { status: 400 });
    }
    if (!records) {
      return NextResponse.json({ error: "Missing records array" }, { status: 400 });
    }
    if (records.length > MAX_RECORDS_PER_CHUNK) {
      return NextResponse.json(
        { error: `Chunk too large. Max ${MAX_RECORDS_PER_CHUNK} records.` },
        { status: 413 }
      );
    }

    return NextResponse.json({
      fileType,
      chunkIndex,
      totalChunks,
      count: records.length,
      records,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid JSON payload" },
      { status: 400 }
    );
  }
}

