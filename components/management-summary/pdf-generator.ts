"use client";

import { jsPDF } from "jspdf";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import type { ManagementSummaryExportPayload } from "@/lib/management-summary/types";
import { getReportMonthInfo } from "@/lib/management-summary/constants";

interface PdfSeriesPoint {
  label: string;
  value: number;
}

interface PdfLegendItem {
  label: string;
  value: number;
  color: [number, number, number];
}

interface PdfMetricCard {
  title: string;
  value: string;
  subtitle: string;
  color: [number, number, number];
}

interface PlantInfo {
  code: string;
  name?: string;
  city?: string;
  location?: string;
  country?: string;
  abbreviation?: string;
  abbreviationCity?: string;
  abbreviationCountry?: string;
}

const PLANT_COLOR_PALETTE = [
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#84cc16",
];

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatGermanNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

function monthLabelShort(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIdx)) return month;
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" }).format(
    new Date(year, monthIdx, 1)
  );
}

function monthLabelLong(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIdx)) return month;
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(year, monthIdx, 1)
  );
}

function getMonthKey(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildLast12MonthsEnding(anchor: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(anchor)) return [];
  const [yStr, mStr] = anchor.split("-");
  const year = Number(yStr);
  const month = Number(mStr) - 1;
  const out: string[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(year, month - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [Number.isFinite(r) ? r : 6, Number.isFinite(g) ? g : 182, Number.isFinite(b) ? b : 212];
}

function getPlantColor(idx: number): [number, number, number] {
  return hexToRgb(PLANT_COLOR_PALETTE[idx % PLANT_COLOR_PALETTE.length]);
}

function formatPlantLabel(code: string, plantsByCode: Map<string, PlantInfo>): string {
  const plant = plantsByCode.get(code);
  if (!plant) return code;
  const cityAbbrev =
    plant.abbreviationCity || (plant.city ? plant.city.slice(0, 3).toUpperCase() : "");
  const countryAbbrev =
    plant.abbreviationCountry || (plant.country ? plant.country.slice(0, 2).toUpperCase() : "");
  const tail = [cityAbbrev, countryAbbrev].filter(Boolean).join(", ");
  if (tail) return `${code} ${tail}`;
  if (plant.name) return `${code} ${plant.name}`;
  return code;
}

function drawPdfHeader(
  pdf: jsPDF,
  title: string,
  subtitle: string | undefined,
  logoDataUrl?: string
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(12, 22, 34);
  pdf.rect(0, 0, pageWidth, 18, "F");

  const hasLogo = Boolean(logoDataUrl);
  const titleX = hasLogo ? 28 : 10;
  if (hasLogo) {
    try {
      pdf.addImage(logoDataUrl as string, "PNG", 10, 3, 14, 14, undefined, "FAST");
    } catch {
      // ignore broken logos
    }
  }
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(title, titleX, 11);

  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(subtitle, titleX, 16);
  }
  const generatedOn = new Date().toLocaleString("en-GB");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const generatedOnWidth = pdf.getTextWidth(generatedOn);
  pdf.text(generatedOn, pageWidth - generatedOnWidth - 10, 11);
  pdf.setTextColor(30, 35, 40);
}

function drawMetricCard(
  pdf: jsPDF,
  card: PdfMetricCard,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(220, 227, 236);
  pdf.roundedRect(x, y, width, height, 2, 2, "FD");

  pdf.setFillColor(card.color[0], card.color[1], card.color[2]);
  pdf.rect(x, y, 3, height, "F");

  pdf.setTextColor(95, 105, 120);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(card.title, x + 6, y + 5);

  pdf.setTextColor(25, 35, 50);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(card.value, x + 6, y + 12);

  pdf.setTextColor(110, 120, 135);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(card.subtitle, x + 6, y + 17);
}

function drawPdfTable(
  pdf: jsPDF,
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: { firstColRatio?: number }
): void {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 227, 236);
  pdf.roundedRect(x, y, width, height, 2, 2, "FD");

  pdf.setTextColor(35, 45, 60);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(title, x + 3, y + 6);

  const tableTop = y + 9;
  const rowHeight = 5.5;
  const maxRows = Math.floor((height - 12) / rowHeight) - 1;
  const displayRows = rows.slice(0, Math.max(0, maxRows));
  const firstColRatio = options?.firstColRatio ?? 0.34;
  const colWidths = headers.map((_h, idx) => {
    if (idx === 0) return width * firstColRatio;
    const remaining = width * (1 - firstColRatio);
    return remaining / Math.max(headers.length - 1, 1);
  });

  let cursorX = x;
  pdf.setFillColor(240, 246, 252);
  pdf.rect(x, tableTop, width, rowHeight, "F");
  pdf.setFontSize(7.2);
  headers.forEach((header, idx) => {
    pdf.setTextColor(70, 85, 105);
    pdf.text(header, cursorX + 1.5, tableTop + 3.8);
    cursorX += colWidths[idx] ?? colWidths[colWidths.length - 1] ?? 0;
  });

  displayRows.forEach((row, rowIndex) => {
    const rowY = tableTop + rowHeight * (rowIndex + 1);
    if (rowIndex % 2 === 1) {
      pdf.setFillColor(249, 251, 253);
      pdf.rect(x, rowY, width, rowHeight, "F");
    }
    let valueX = x;
    row.forEach((value, colIndex) => {
      const text = String(value);
      pdf.setTextColor(colIndex === 0 ? 45 : 65, colIndex === 0 ? 55 : 75, colIndex === 0 ? 70 : 95);
      pdf.setFont("helvetica", colIndex === 0 ? "bold" : "normal");
      pdf.text(text, valueX + 1.5, rowY + 3.8);
      valueX += colWidths[colIndex] ?? colWidths[colWidths.length - 1] ?? 0;
    });
  });
  pdf.setTextColor(30, 35, 40);
}

function drawSimpleBarChart(
  pdf: jsPDF,
  title: string,
  data: PdfSeriesPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number],
  yAxisLabel: string,
  legendItems: PdfLegendItem[] = [],
  options?: { showBarValues?: boolean; legendTitle?: string; highlightLabel?: string }
): void {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 227, 236);
  pdf.roundedRect(x, y, width, height, 2, 2, "FD");

  pdf.setTextColor(35, 45, 60);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(title, x + 3, y + 6);

  const hasLegend = legendItems.length > 0;
  const legendWidth = hasLegend ? width * 0.28 : 0;
  const plotX = x + 10;
  const plotY = y + 10;
  const plotWidth = width - 16 - legendWidth;
  const plotHeight = height - 24;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const yTickValues = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  pdf.setDrawColor(235, 240, 246);
  pdf.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);
  pdf.line(plotX, plotY, plotX, plotY + plotHeight);

  yTickValues.forEach((tick) => {
    const tickY = plotY + plotHeight - (tick / maxValue) * plotHeight;
    pdf.setDrawColor(240, 243, 248);
    pdf.line(plotX, tickY, plotX + plotWidth, tickY);
    pdf.setTextColor(130, 140, 155);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    const tickText = formatGermanNumber(Math.round(tick), 0);
    const tickWidth = pdf.getTextWidth(tickText);
    pdf.text(tickText, plotX - tickWidth - 1.5, tickY + 1.8);
  });

  const barCount = data.length || 1;
  const barGap = 1.2;
  const barWidth = Math.max(2.5, Math.min(7.5, (plotWidth - (barCount - 1) * barGap) / barCount));
  const totalBarsWidth = barWidth * barCount + (barCount - 1) * barGap;
  let cursorX = plotX + (plotWidth - totalBarsWidth) / 2;
  const showValues = options?.showBarValues ?? true;
  const highlightLabel = options?.highlightLabel;

  data.forEach((point) => {
    const barHeight = (point.value / maxValue) * (plotHeight - 8);
    const barTop = plotY + plotHeight - barHeight;
    const isHighlight = highlightLabel && point.label === highlightLabel;
    const fill: [number, number, number] = isHighlight
      ? [Math.min(255, color[0] + 30), Math.min(255, color[1] + 30), Math.min(255, color[2] + 30)]
      : color;
    pdf.setFillColor(fill[0], fill[1], fill[2]);
    pdf.roundedRect(cursorX, barTop, barWidth, barHeight, 0.8, 0.8, "F");

    if (showValues) {
      pdf.setTextColor(60, 70, 85);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.2);
      const valueText = formatGermanNumber(Math.round(point.value), 0);
      const valueW = pdf.getTextWidth(valueText);
      const textY = barTop - 1.3;
      pdf.text(valueText, cursorX + barWidth / 2 - valueW / 2, textY);
    }

    pdf.setTextColor(120, 130, 145);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.8);
    pdf.text(point.label, cursorX + barWidth / 2, plotY + plotHeight + 6.2, {
      angle: 45,
      align: "center",
    });

    cursorX += barWidth + barGap;
  });

  pdf.setTextColor(110, 120, 135);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.8);
  pdf.text("X-axis: Month", plotX, y + height - 2.5);
  const yAxisText = `Y-axis: ${yAxisLabel}`;
  const yAxisTextWidth = pdf.getTextWidth(yAxisText);
  pdf.text(yAxisText, plotX + plotWidth - yAxisTextWidth, y + height - 2.5);

  if (hasLegend) {
    const legendX = plotX + plotWidth + 6;
    let legendY = y + 13;
    pdf.setTextColor(70, 85, 105);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text(options?.legendTitle ?? "Plant Legend", legendX, legendY);
    legendY += 3;
    legendItems.slice(0, 8).forEach((item) => {
      legendY += 4.6;
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.roundedRect(legendX, legendY - 2.3, 2.8, 2.8, 0.4, 0.4, "F");
      pdf.setTextColor(85, 95, 110);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.2);
      pdf.text(`${item.label}: ${formatGermanNumber(item.value, 0)}`, legendX + 3.7, legendY);
    });
  }
}

interface StackedBarPoint {
  label: string;
  /** Stacked segments rendered bottom-to-top in this order. */
  segments: Array<{ key: string; value: number }>;
}

function drawStackedBarChart(
  pdf: jsPDF,
  title: string,
  data: StackedBarPoint[],
  segmentColors: Record<string, [number, number, number]>,
  segmentOrder: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  yAxisLabel: string,
  legendItems: PdfLegendItem[] = [],
  options?: { legendTitle?: string; highlightLabel?: string }
): void {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 227, 236);
  pdf.roundedRect(x, y, width, height, 2, 2, "FD");

  pdf.setTextColor(35, 45, 60);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(title, x + 3, y + 6);

  const hasLegend = legendItems.length > 0;
  const legendWidth = hasLegend ? width * 0.28 : 0;
  const plotX = x + 10;
  const plotY = y + 10;
  const plotWidth = width - 16 - legendWidth;
  const plotHeight = height - 24;

  const totals = data.map((p) => p.segments.reduce((s, seg) => s + Math.max(0, seg.value), 0));
  const maxValue = Math.max(...totals, 1);
  const yTickValues = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  pdf.setDrawColor(235, 240, 246);
  pdf.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);
  pdf.line(plotX, plotY, plotX, plotY + plotHeight);

  yTickValues.forEach((tick) => {
    const tickY = plotY + plotHeight - (tick / maxValue) * plotHeight;
    pdf.setDrawColor(240, 243, 248);
    pdf.line(plotX, tickY, plotX + plotWidth, tickY);
    pdf.setTextColor(130, 140, 155);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    const tickText = formatGermanNumber(Math.round(tick), 0);
    const tickWidth = pdf.getTextWidth(tickText);
    pdf.text(tickText, plotX - tickWidth - 1.5, tickY + 1.8);
  });

  const barCount = data.length || 1;
  const barGap = 1.2;
  const barWidth = Math.max(2.5, Math.min(7.5, (plotWidth - (barCount - 1) * barGap) / barCount));
  const totalBarsWidth = barWidth * barCount + (barCount - 1) * barGap;
  let cursorX = plotX + (plotWidth - totalBarsWidth) / 2;
  const highlightLabel = options?.highlightLabel;

  data.forEach((point, idx) => {
    const total = totals[idx];
    const totalBarHeight = (total / maxValue) * (plotHeight - 8);
    let stackTop = plotY + plotHeight;

    segmentOrder.forEach((key) => {
      const seg = point.segments.find((s) => s.key === key);
      const segValue = Math.max(0, seg?.value ?? 0);
      if (segValue <= 0) return;
      const segHeight = (segValue / maxValue) * (plotHeight - 8);
      const segTop = stackTop - segHeight;
      const baseColor = segmentColors[key] ?? [120, 130, 145];
      const isHighlight = highlightLabel && point.label === highlightLabel;
      const fill: [number, number, number] = isHighlight
        ? [
            Math.min(255, baseColor[0] + 30),
            Math.min(255, baseColor[1] + 30),
            Math.min(255, baseColor[2] + 30),
          ]
        : baseColor;
      pdf.setFillColor(fill[0], fill[1], fill[2]);
      pdf.rect(cursorX, segTop, barWidth, segHeight, "F");
      stackTop = segTop;
    });

    if (total > 0) {
      pdf.setTextColor(60, 70, 85);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.2);
      const valueText = formatGermanNumber(Math.round(total), 0);
      const valueW = pdf.getTextWidth(valueText);
      const textY = plotY + plotHeight - totalBarHeight - 1.3;
      pdf.text(valueText, cursorX + barWidth / 2 - valueW / 2, textY);
    }

    pdf.setTextColor(120, 130, 145);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.8);
    pdf.text(point.label, cursorX + barWidth / 2, plotY + plotHeight + 6.2, {
      angle: 45,
      align: "center",
    });

    cursorX += barWidth + barGap;
  });

  pdf.setTextColor(110, 120, 135);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.8);
  pdf.text("X-axis: Month", plotX, y + height - 2.5);
  const yAxisText = `Y-axis: ${yAxisLabel}`;
  const yAxisTextWidth = pdf.getTextWidth(yAxisText);
  pdf.text(yAxisText, plotX + plotWidth - yAxisTextWidth, y + height - 2.5);

  if (hasLegend) {
    const legendX = plotX + plotWidth + 6;
    let legendY = y + 13;
    pdf.setTextColor(70, 85, 105);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text(options?.legendTitle ?? "Legend", legendX, legendY);
    legendY += 3;
    legendItems.slice(0, 8).forEach((item) => {
      legendY += 4.6;
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.roundedRect(legendX, legendY - 2.3, 2.8, 2.8, 0.4, 0.4, "F");
      pdf.setTextColor(85, 95, 110);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.2);
      pdf.text(`${item.label}: ${formatGermanNumber(item.value, 0)}`, legendX + 3.7, legendY);
    });
  }
}

function drawBarWithTrendLineChart(
  pdf: jsPDF,
  title: string,
  bars: PdfSeriesPoint[],
  trend: PdfSeriesPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
  barColor: [number, number, number],
  lineColor: [number, number, number],
  yAxisLabel: string,
  options?: { highlightLabel?: string }
): void {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 227, 236);
  pdf.roundedRect(x, y, width, height, 2, 2, "FD");

  pdf.setTextColor(35, 45, 60);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(title, x + 3, y + 6);

  const plotX = x + 10;
  const plotY = y + 10;
  const plotWidth = width - 16;
  const plotHeight = height - 24;
  const allValues = [...bars, ...trend].map((d) => d.value);
  const maxValue = Math.max(...allValues, 1);
  const yTickValues = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  pdf.setDrawColor(235, 240, 246);
  pdf.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);
  pdf.line(plotX, plotY, plotX, plotY + plotHeight);

  yTickValues.forEach((tick) => {
    const tickY = plotY + plotHeight - (tick / maxValue) * plotHeight;
    pdf.setDrawColor(240, 243, 248);
    pdf.line(plotX, tickY, plotX + plotWidth, tickY);
    pdf.setTextColor(130, 140, 155);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    const tickText = formatGermanNumber(Math.round(tick), 0);
    const tickWidth = pdf.getTextWidth(tickText);
    pdf.text(tickText, plotX - tickWidth - 1.5, tickY + 1.8);
  });

  const barCount = bars.length || 1;
  const barGap = 1.2;
  const barWidth = Math.max(2.5, Math.min(7.5, (plotWidth - (barCount - 1) * barGap) / barCount));
  const totalBarsWidth = barWidth * barCount + (barCount - 1) * barGap;
  let cursorX = plotX + (plotWidth - totalBarsWidth) / 2;
  const highlightLabel = options?.highlightLabel;

  const toY = (value: number) => plotY + plotHeight - (value / maxValue) * (plotHeight - 8);

  bars.forEach((point) => {
    const barHeight = (point.value / maxValue) * (plotHeight - 8);
    const barTop = plotY + plotHeight - barHeight;
    const isHighlight = highlightLabel && point.label === highlightLabel;
    const fill: [number, number, number] = isHighlight
      ? [
          Math.min(255, barColor[0] + 30),
          Math.min(255, barColor[1] + 30),
          Math.min(255, barColor[2] + 30),
        ]
      : barColor;
    pdf.setFillColor(fill[0], fill[1], fill[2]);
    pdf.roundedRect(cursorX, barTop, barWidth, barHeight, 0.8, 0.8, "F");

    pdf.setTextColor(60, 70, 85);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.2);
    const valueText = formatGermanNumber(Math.round(point.value), 0);
    const valueW = pdf.getTextWidth(valueText);
    const textY = barTop - 1.3;
    pdf.text(valueText, cursorX + barWidth / 2 - valueW / 2, textY);

    pdf.setTextColor(120, 130, 145);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.8);
    pdf.text(point.label, cursorX + barWidth / 2, plotY + plotHeight + 6.2, {
      angle: 45,
      align: "center",
    });

    cursorX += barWidth + barGap;
  });

  if (trend.length > 1) {
    pdf.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    pdf.setLineWidth(0.8);
    for (let i = 0; i < trend.length - 1; i += 1) {
      const a = trend[i];
      const b = trend[i + 1];
      if (!a || !b) continue;
      const ax = plotX + (i / Math.max(trend.length - 1, 1)) * plotWidth;
      const bx = plotX + ((i + 1) / Math.max(trend.length - 1, 1)) * plotWidth;
      pdf.line(ax, toY(a.value), bx, toY(b.value));
    }
  }

  pdf.setTextColor(110, 120, 135);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.8);
  pdf.text("X-axis: Month", plotX, y + height - 2.5);
  const yAxisText = `Y-axis: ${yAxisLabel}`;
  const yAxisTextWidth = pdf.getTextWidth(yAxisText);
  pdf.text(yAxisText, plotX + plotWidth - yAxisTextWidth, y + height - 2.5);
}

function drawRemarksCard(
  pdf: jsPDF,
  title: string,
  bodyText: string,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 227, 236);
  pdf.roundedRect(x, y, width, height, 2, 2, "FD");

  pdf.setTextColor(35, 45, 60);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(title, x + 3, y + 6);

  pdf.setDrawColor(235, 240, 246);
  pdf.line(x + 3, y + 8.5, x + width - 3, y + 8.5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.6);
  pdf.setTextColor(60, 70, 90);
  const lineHeight = 4.2;
  const innerWidth = width - 8;
  const lines = pdf.splitTextToSize(bodyText, innerWidth) as string[];
  const usableHeight = height - 12;
  const maxLines = Math.max(1, Math.floor(usableHeight / lineHeight));
  const visible = lines.slice(0, maxLines);
  visible.forEach((line, idx) => {
    pdf.text(line, x + 4, y + 12.5 + idx * lineHeight);
  });
  if (lines.length > visible.length) {
    pdf.setTextColor(140, 150, 165);
    pdf.setFontSize(7.6);
    pdf.text("…", x + 4, y + 12.5 + visible.length * lineHeight);
  }
  pdf.setTextColor(30, 35, 40);
}

function movingAverage(series: PdfSeriesPoint[], windowSize: number): PdfSeriesPoint[] {
  const values = series.map((p) => Number(p.value || 0));
  return series.map((p, idx) => {
    const start = Math.max(0, idx - windowSize + 1);
    const slice = values.slice(start, idx + 1);
    const avg = slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
    return { label: p.label, value: avg };
  });
}

interface MonthSums {
  customerComplaints: number;
  supplierComplaints: number;
  internalComplaints: number;
  customerDefective: number;
  supplierDefective: number;
  customerDeliveries: number;
  supplierDeliveries: number;
}

function emptyMonthSums(): MonthSums {
  return {
    customerComplaints: 0,
    supplierComplaints: 0,
    internalComplaints: 0,
    customerDefective: 0,
    supplierDefective: 0,
    customerDeliveries: 0,
    supplierDeliveries: 0,
  };
}

export async function generateManagementSummaryPdf(
  payload: ManagementSummaryExportPayload
): Promise<void> {
  const kpisRaw = safeParseJson<MonthlySiteKpi[]>(localStorage.getItem("qos-et-kpis"));
  const kpis: MonthlySiteKpi[] = Array.isArray(kpisRaw) ? kpisRaw : [];
  if (kpis.length === 0) throw new Error("No KPI data found. Please upload data first.");

  const plantsResp = await fetch("/api/plants")
    .then((r) => (r.ok ? r.json() : { plants: [] }))
    .catch(() => ({ plants: [] }));
  const plantList: PlantInfo[] = Array.isArray(plantsResp?.plants) ? plantsResp.plants : [];
  const plantsByCode = new Map<string, PlantInfo>(
    plantList.map((p) => [String(p.code), p] as const)
  );
  const totalPlantsCount = plantList.length;

  // Resolve report month: explicit payload key wins; otherwise derive from "today - 1 month".
  const fallbackReportMonth = getReportMonthInfo();
  const reportMonthKey =
    payload.reportMonthKey && /^\d{4}-\d{2}$/.test(payload.reportMonthKey)
      ? payload.reportMonthKey
      : fallbackReportMonth.key;
  const reportMonthLabelLong = monthLabelLong(reportMonthKey);
  const reportMonthLabelShort = monthLabelShort(reportMonthKey);

  const selectedSet = new Set(payload.plantCodes);
  const filtered = kpis.filter((k) => selectedSet.size === 0 || selectedSet.has(k.siteCode));

  // Anchor 12 months on report month (so May → Apr 2025…Apr 2026).
  const last12Months = buildLast12MonthsEnding(reportMonthKey);
  const last12Set = new Set(last12Months);

  const sectionSet = new Set(payload.sectionIds || []);
  const reportTitleBase = (payload.title || "Management Summary QOS ET Report").trim();
  const logoDataUrl = payload.logoDataUrl;
  const reportContext = `Rolling 12 Months ending ${reportMonthLabelLong} | ${payload.plantCodes.length} "Selected Sites"`;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let isFirstPage = true;

  // Pre-aggregate monthly totals across selected plants for last 12 months.
  const monthSums: Map<string, MonthSums> = new Map();
  last12Months.forEach((m) => monthSums.set(m, emptyMonthSums()));
  const monthlyByPlant: Map<string, Map<string, MonthSums>> = new Map();
  filtered.forEach((kpi) => {
    const monthKey = getMonthKey(typeof kpi.month === "string" ? kpi.month : "");
    if (!last12Set.has(monthKey)) return;
    const ms = monthSums.get(monthKey);
    if (!ms) return;
    ms.customerComplaints += Number(kpi.customerComplaintsQ1 || 0);
    ms.supplierComplaints += Number(kpi.supplierComplaintsQ2 || 0);
    ms.internalComplaints += Number(kpi.internalComplaintsQ3 || 0);
    ms.customerDefective += Number(kpi.customerDefectiveParts || 0);
    ms.supplierDefective += Number(kpi.supplierDefectiveParts || 0);
    ms.customerDeliveries += Number(kpi.customerDeliveries || 0);
    ms.supplierDeliveries += Number(kpi.supplierDeliveries || 0);

    if (!monthlyByPlant.has(kpi.siteCode)) {
      monthlyByPlant.set(kpi.siteCode, new Map());
    }
    const plantMap = monthlyByPlant.get(kpi.siteCode)!;
    if (!plantMap.has(monthKey)) plantMap.set(monthKey, emptyMonthSums());
    const pms = plantMap.get(monthKey)!;
    pms.customerComplaints += Number(kpi.customerComplaintsQ1 || 0);
    pms.supplierComplaints += Number(kpi.supplierComplaintsQ2 || 0);
    pms.internalComplaints += Number(kpi.internalComplaintsQ3 || 0);
    pms.customerDefective += Number(kpi.customerDefectiveParts || 0);
    pms.supplierDefective += Number(kpi.supplierDefectiveParts || 0);
    pms.customerDeliveries += Number(kpi.customerDeliveries || 0);
    pms.supplierDeliveries += Number(kpi.supplierDeliveries || 0);
  });

  const totals = Array.from(monthSums.values()).reduce((acc, ms) => {
    acc.customerComplaints += ms.customerComplaints;
    acc.supplierComplaints += ms.supplierComplaints;
    acc.internalComplaints += ms.internalComplaints;
    acc.customerDefective += ms.customerDefective;
    acc.supplierDefective += ms.supplierDefective;
    acc.customerDeliveries += ms.customerDeliveries;
    acc.supplierDeliveries += ms.supplierDeliveries;
    return acc;
  }, emptyMonthSums());

  // ====== Page 1: Executive Overview ======
  if (sectionSet.has("executive")) {
    drawPdfHeader(pdf, reportTitleBase, reportContext, logoDataUrl);
    isFirstPage = false;

    const customerPpm =
      totals.customerDeliveries > 0
        ? (totals.customerDefective / totals.customerDeliveries) * 1_000_000
        : 0;
    const supplierPpm =
      totals.supplierDeliveries > 0
        ? (totals.supplierDefective / totals.supplierDeliveries) * 1_000_000
        : 0;

    const cardW = (pageWidth - 26) / 4;
    const customerCards: PdfMetricCard[] = [
      {
        title: "Customer Complaints",
        value: formatGermanNumber(totals.customerComplaints, 0),
        subtitle: "Q1 notifications",
        color: [6, 182, 212],
      },
      {
        title: "Customer Deliveries",
        value:
          totals.customerDeliveries > 0
            ? `${formatGermanNumber(totals.customerDeliveries / 1_000_000, 2)}M`
            : "N/A",
        subtitle: "Parts shipped",
        color: [0, 188, 212],
      },
      {
        title: "Customer Defective Parts",
        value: formatGermanNumber(totals.customerDefective, 0),
        subtitle: "Q1 defective",
        color: [244, 67, 54],
      },
      {
        title: "Customer PPM",
        value: customerPpm > 0 ? formatGermanNumber(customerPpm, 2) : "N/A",
        subtitle: "Parts per million",
        color: [76, 175, 80],
      },
    ];
    const supplierCards: PdfMetricCard[] = [
      {
        title: "Supplier Complaints",
        value: formatGermanNumber(totals.supplierComplaints, 0),
        subtitle: "Q2 notifications",
        color: [20, 184, 166],
      },
      {
        title: "Supplier Deliveries",
        value:
          totals.supplierDeliveries > 0
            ? `${formatGermanNumber(totals.supplierDeliveries / 1_000_000, 2)}M`
            : "N/A",
        subtitle: "Parts received",
        color: [0, 188, 212],
      },
      {
        title: "Supplier Defective Parts",
        value: formatGermanNumber(totals.supplierDefective, 0),
        subtitle: "Q2 defective",
        color: [244, 67, 54],
      },
      {
        title: "Supplier PPM",
        value: supplierPpm > 0 ? formatGermanNumber(supplierPpm, 2) : "N/A",
        subtitle: "Parts per million",
        color: [76, 175, 80],
      },
    ];

    customerCards.forEach((card, idx) =>
      drawMetricCard(pdf, card, 10 + idx * (cardW + 2), 24, cardW, 24)
    );
    supplierCards.forEach((card, idx) =>
      drawMetricCard(pdf, card, 10 + idx * (cardW + 2), 52, cardW, 24)
    );

    drawPdfTable(
      pdf,
      "Executive Context",
      ["Metric", "Value"],
      [
        ["Reporting month", reportMonthLabelLong],
        ["Selected Sites", `${payload.plantCodes.length} of ${totalPlantsCount}`],
        ["Period Mode", "R12M"],
        [
          "Sections",
          payload.sectionIds.length > 0 ? payload.sectionIds.length.toString() : "All defaults",
        ],
      ],
      10,
      84,
      pageWidth - 20,
      40
    );
  }

  // ====== Page 2: Notifications & Defects ======
  const wantsNotifPage =
    sectionSet.has("chart-notifications-month") ||
    sectionSet.has("chart-defects-month") ||
    sectionSet.has("chart-notifications-type");

  if (wantsNotifPage) {
    if (!isFirstPage) pdf.addPage();
    isFirstPage = false;
    drawPdfHeader(
      pdf,
      `${reportTitleBase}: Notifications & Defects`,
      reportContext,
      logoDataUrl
    );

    function buildSeriesForMetric(getValue: (m: MonthSums) => number): PdfSeriesPoint[] {
      return last12Months.map((m) => {
        const ms = monthSums.get(m) || emptyMonthSums();
        return { label: monthLabelShort(m), value: getValue(ms) };
      });
    }

    if (sectionSet.has("chart-notifications-month")) {
      const series = buildSeriesForMetric(
        (m) => m.customerComplaints + m.supplierComplaints + m.internalComplaints
      );
      drawSimpleBarChart(
        pdf,
        "R12M Total Number of Notifications by Month",
        series,
        10,
        24,
        pageWidth - 20,
        56,
        [6, 182, 212],
        "Notifications",
        [],
        { highlightLabel: reportMonthLabelShort }
      );
    }
    if (sectionSet.has("chart-defects-month")) {
      const series = buildSeriesForMetric(
        (m) => m.customerDefective + m.supplierDefective
      );
      drawSimpleBarChart(
        pdf,
        "R12M Total Number of Defects by Month",
        series,
        10,
        84,
        pageWidth - 20,
        56,
        [244, 67, 54],
        "Defective Parts",
        [],
        { highlightLabel: reportMonthLabelShort }
      );
    }
    if (sectionSet.has("chart-notifications-type")) {
      const stacked: StackedBarPoint[] = last12Months.map((m) => {
        const ms = monthSums.get(m) || emptyMonthSums();
        return {
          label: monthLabelShort(m),
          segments: [
            { key: "Q1", value: ms.customerComplaints },
            { key: "Q2", value: ms.supplierComplaints },
            { key: "Q3", value: ms.internalComplaints },
          ],
        };
      });
      const segmentColors: Record<string, [number, number, number]> = {
        Q1: [6, 182, 212],
        Q2: [20, 184, 166],
        Q3: [244, 67, 54],
      };
      const legend: PdfLegendItem[] = [
        { label: "Q1 (Customer)", value: totals.customerComplaints, color: segmentColors.Q1 },
        { label: "Q2 (Supplier)", value: totals.supplierComplaints, color: segmentColors.Q2 },
        { label: "Q3 (Internal)", value: totals.internalComplaints, color: segmentColors.Q3 },
      ];
      drawStackedBarChart(
        pdf,
        "R12M Notifications by Month, split by Notification Type",
        stacked,
        segmentColors,
        ["Q1", "Q2", "Q3"],
        10,
        144,
        pageWidth - 20,
        56,
        "Notifications",
        legend,
        { legendTitle: "Notification Types", highlightLabel: reportMonthLabelShort }
      );
    }
  }

  // ====== Per-kind PPM Page (Customer / Supplier) ======
  function renderPpmPage(kind: "customer" | "supplier") {
    if (!isFirstPage) pdf.addPage();
    isFirstPage = false;

    const isCustomer = kind === "customer";
    const heading = isCustomer ? "Customer PPM" : "Supplier PPM";
    const barColor: [number, number, number] = isCustomer ? [6, 182, 212] : [20, 184, 166];
    const trendColor: [number, number, number] = [76, 175, 80];

    drawPdfHeader(pdf, `${reportTitleBase}: ${heading}`, reportContext, logoDataUrl);

    const series: PdfSeriesPoint[] = last12Months.map((m) => {
      const ms = monthSums.get(m) || emptyMonthSums();
      const def = isCustomer ? ms.customerDefective : ms.supplierDefective;
      const del = isCustomer ? ms.customerDeliveries : ms.supplierDeliveries;
      const ppm = del > 0 ? (def / del) * 1_000_000 : 0;
      return { label: monthLabelShort(m), value: ppm };
    });

    drawBarWithTrendLineChart(
      pdf,
      `R12M ${heading} monthly values with trend`,
      series,
      movingAverage(series, 3),
      10,
      24,
      pageWidth - 20,
      52,
      barColor,
      trendColor,
      "PPM",
      { highlightLabel: reportMonthLabelShort }
    );

    const tableY = 82;
    const tableH = pageHeight - tableY - 10;
    const halfW = (pageWidth - 24) / 2;

    const reportMs = monthSums.get(reportMonthKey) || emptyMonthSums();
    const trendRows: Array<Array<string | number>> = last12Months.slice(-8).map((m) => {
      const ms = monthSums.get(m) || emptyMonthSums();
      const def = isCustomer ? ms.customerDefective : ms.supplierDefective;
      const del = isCustomer ? ms.customerDeliveries : ms.supplierDeliveries;
      const ppm = del > 0 ? (def / del) * 1_000_000 : 0;
      return [
        monthLabelShort(m),
        formatGermanNumber(ppm, 0),
        formatGermanNumber(def, 0),
        formatGermanNumber(del, 0),
      ];
    });
    const totalDef = isCustomer ? totals.customerDefective : totals.supplierDefective;
    const totalDel = isCustomer ? totals.customerDeliveries : totals.supplierDeliveries;
    const totalPpm = totalDel > 0 ? (totalDef / totalDel) * 1_000_000 : 0;
    trendRows.push([
      "TOTAL R12M",
      formatGermanNumber(totalPpm, 0),
      formatGermanNumber(totalDef, 0),
      formatGermanNumber(totalDel, 0),
    ]);
    const reportDef = isCustomer ? reportMs.customerDefective : reportMs.supplierDefective;
    const reportDel = isCustomer ? reportMs.customerDeliveries : reportMs.supplierDeliveries;
    const reportPpm = reportDel > 0 ? (reportDef / reportDel) * 1_000_000 : 0;
    trendRows.push([
      `Reported month (${reportMonthLabelShort})`,
      formatGermanNumber(reportPpm, 0),
      formatGermanNumber(reportDef, 0),
      formatGermanNumber(reportDel, 0),
    ]);

    drawPdfTable(
      pdf,
      `R12M ${heading} Monthly Trend Analysis - All Sites`,
      ["Month", "PPM", "Defective", "Deliveries"],
      trendRows,
      10,
      tableY,
      halfW,
      tableH,
      { firstColRatio: 0.4 }
    );

    const siteCodes = Array.from(monthlyByPlant.keys()).sort();
    const siteRows: Array<Array<string | number>> = siteCodes.slice(0, 14).map((code) => {
      const map = monthlyByPlant.get(code) || new Map<string, MonthSums>();
      let def = 0;
      let del = 0;
      last12Months.forEach((m) => {
        const ms = map.get(m);
        if (!ms) return;
        def += isCustomer ? ms.customerDefective : ms.supplierDefective;
        del += isCustomer ? ms.customerDeliveries : ms.supplierDeliveries;
      });
      const ppm = del > 0 ? (def / del) * 1_000_000 : 0;
      return [
        formatPlantLabel(code, plantsByCode),
        formatGermanNumber(def, 0),
        formatGermanNumber(del, 0),
        formatGermanNumber(ppm, 0),
      ];
    });
    siteRows.push([
      "TOTAL",
      formatGermanNumber(totalDef, 0),
      formatGermanNumber(totalDel, 0),
      formatGermanNumber(totalPpm, 0),
    ]);
    drawPdfTable(
      pdf,
      `${heading} - Site Contribution per Month`,
      ["Site", "Defective", "Deliveries", "PPM"],
      siteRows,
      10 + halfW + 4,
      tableY,
      halfW,
      tableH
    );
  }

  if (sectionSet.has("customer-ppm")) renderPpmPage("customer");
  if (sectionSet.has("supplier-ppm")) renderPpmPage("supplier");

  // ====== Plant Pages: 6 charts (3x2) plus reported-month table and remarks card ======
  if (sectionSet.has("plant-pages")) {
    for (const code of payload.plantCodes) {
      if (!isFirstPage) pdf.addPage();
      isFirstPage = false;
      const label = formatPlantLabel(code, plantsByCode);
      drawPdfHeader(
        pdf,
        `${reportTitleBase}: ${label}`,
        reportContext,
        logoDataUrl
      );

      const map = monthlyByPlant.get(code) || new Map<string, MonthSums>();
      const months = last12Months;

      function buildSeries(getValue: (ms: MonthSums) => number): PdfSeriesPoint[] {
        return months.map((m) => {
          const ms = map.get(m);
          return { label: monthLabelShort(m), value: ms ? getValue(ms) : 0 };
        });
      }

      const customerComplaintsSeries = buildSeries((ms) => ms.customerComplaints);
      const supplierComplaintsSeries = buildSeries((ms) => ms.supplierComplaints);
      const customerDefectiveSeries = buildSeries((ms) => ms.customerDefective);
      const supplierDefectiveSeries = buildSeries((ms) => ms.supplierDefective);
      const customerPpmSeries: PdfSeriesPoint[] = months.map((m) => {
        const ms = map.get(m);
        const def = ms?.customerDefective || 0;
        const del = ms?.customerDeliveries || 0;
        return { label: monthLabelShort(m), value: del > 0 ? (def / del) * 1_000_000 : 0 };
      });
      const supplierPpmSeries: PdfSeriesPoint[] = months.map((m) => {
        const ms = map.get(m);
        const def = ms?.supplierDefective || 0;
        const del = ms?.supplierDeliveries || 0;
        return { label: monthLabelShort(m), value: del > 0 ? (def / del) * 1_000_000 : 0 };
      });

      // 3x2 grid of charts (compact so we have clear room for tables + remarks card)
      const left = 10;
      const gap = 4;
      const chartW = (pageWidth - 2 * left - 2 * gap) / 3;
      const chartH = 44;
      const row1Y = 24;
      const row2Y = row1Y + chartH + 4;

      drawSimpleBarChart(
        pdf,
        "Customer Complaints (Q1)",
        customerComplaintsSeries,
        left,
        row1Y,
        chartW,
        chartH,
        [6, 182, 212],
        "Notifications",
        [],
        { highlightLabel: reportMonthLabelShort }
      );
      drawSimpleBarChart(
        pdf,
        "Customer Defective Parts",
        customerDefectiveSeries,
        left + chartW + gap,
        row1Y,
        chartW,
        chartH,
        [244, 67, 54],
        "Defective parts",
        [],
        { highlightLabel: reportMonthLabelShort }
      );
      drawBarWithTrendLineChart(
        pdf,
        "Customer PPM",
        customerPpmSeries,
        movingAverage(customerPpmSeries, 3),
        left + 2 * (chartW + gap),
        row1Y,
        chartW,
        chartH,
        [6, 182, 212],
        [76, 175, 80],
        "PPM",
        { highlightLabel: reportMonthLabelShort }
      );

      drawSimpleBarChart(
        pdf,
        "Supplier Complaints (Q2)",
        supplierComplaintsSeries,
        left,
        row2Y,
        chartW,
        chartH,
        [20, 184, 166],
        "Notifications",
        [],
        { highlightLabel: reportMonthLabelShort }
      );
      drawSimpleBarChart(
        pdf,
        "Supplier Defective Parts",
        supplierDefectiveSeries,
        left + chartW + gap,
        row2Y,
        chartW,
        chartH,
        [244, 67, 54],
        "Defective parts",
        [],
        { highlightLabel: reportMonthLabelShort }
      );
      drawBarWithTrendLineChart(
        pdf,
        "Supplier PPM",
        supplierPpmSeries,
        movingAverage(supplierPpmSeries, 3),
        left + 2 * (chartW + gap),
        row2Y,
        chartW,
        chartH,
        [20, 184, 166],
        [76, 175, 80],
        "PPM",
        { highlightLabel: reportMonthLabelShort }
      );

      // Plant aggregates: reported month + R12M
      const reportMs = map.get(reportMonthKey) || emptyMonthSums();
      const r12 = months.reduce((acc, m) => {
        const ms = map.get(m);
        if (!ms) return acc;
        acc.customerComplaints += ms.customerComplaints;
        acc.supplierComplaints += ms.supplierComplaints;
        acc.internalComplaints += ms.internalComplaints;
        acc.customerDefective += ms.customerDefective;
        acc.supplierDefective += ms.supplierDefective;
        acc.customerDeliveries += ms.customerDeliveries;
        acc.supplierDeliveries += ms.supplierDeliveries;
        return acc;
      }, emptyMonthSums());

      const reportCustomerPpm =
        reportMs.customerDeliveries > 0
          ? (reportMs.customerDefective / reportMs.customerDeliveries) * 1_000_000
          : 0;
      const reportSupplierPpm =
        reportMs.supplierDeliveries > 0
          ? (reportMs.supplierDefective / reportMs.supplierDeliveries) * 1_000_000
          : 0;
      const r12CustomerPpm =
        r12.customerDeliveries > 0
          ? (r12.customerDefective / r12.customerDeliveries) * 1_000_000
          : 0;
      const r12SupplierPpm =
        r12.supplierDeliveries > 0
          ? (r12.supplierDefective / r12.supplierDeliveries) * 1_000_000
          : 0;

      // Two compact side-by-side tables (Customer / Supplier) instead of one tall table.
      const tableY = row2Y + chartH + 4;
      const tableH = 42;
      const halfW = (pageWidth - 24) / 2;
      const reportedHeader = `${reportMonthLabelShort} (reported)`;

      drawPdfTable(
        pdf,
        `Customer KPIs: ${reportMonthLabelLong} vs Last 12 months`,
        ["Metric", reportedHeader, "Last 12 months"],
        [
          [
            "Complaints (Q1)",
            formatGermanNumber(reportMs.customerComplaints, 0),
            formatGermanNumber(r12.customerComplaints, 0),
          ],
          [
            "Defective Parts",
            formatGermanNumber(reportMs.customerDefective, 0),
            formatGermanNumber(r12.customerDefective, 0),
          ],
          [
            "Deliveries",
            formatGermanNumber(reportMs.customerDeliveries, 0),
            formatGermanNumber(r12.customerDeliveries, 0),
          ],
          [
            "PPM",
            formatGermanNumber(reportCustomerPpm, 0),
            formatGermanNumber(r12CustomerPpm, 0),
          ],
        ],
        10,
        tableY,
        halfW,
        tableH,
        { firstColRatio: 0.42 }
      );

      drawPdfTable(
        pdf,
        `Supplier KPIs: ${reportMonthLabelLong} vs Last 12 months`,
        ["Metric", reportedHeader, "Last 12 months"],
        [
          [
            "Complaints (Q2)",
            formatGermanNumber(reportMs.supplierComplaints, 0),
            formatGermanNumber(r12.supplierComplaints, 0),
          ],
          [
            "Defective Parts",
            formatGermanNumber(reportMs.supplierDefective, 0),
            formatGermanNumber(r12.supplierDefective, 0),
          ],
          [
            "Deliveries",
            formatGermanNumber(reportMs.supplierDeliveries, 0),
            formatGermanNumber(r12.supplierDeliveries, 0),
          ],
          [
            "PPM",
            formatGermanNumber(reportSupplierPpm, 0),
            formatGermanNumber(r12SupplierPpm, 0),
          ],
        ],
        10 + halfW + 4,
        tableY,
        halfW,
        tableH,
        { firstColRatio: 0.42 }
      );

      // Remarks rendered as a dedicated card below the tables (always visible,
      // with "No remarks." as the default body when nothing was entered for the plant).
      const remarkText = (payload.plantRemarks?.[code] || "").trim() || "No remarks.";
      const remarksY = tableY + tableH + 4;
      const remarksH = pageHeight - remarksY - 10;
      if (remarksH > 12) {
        drawRemarksCard(
          pdf,
          "Remarks / Top topics",
          remarkText,
          10,
          remarksY,
          pageWidth - 20,
          remarksH
        );
      }
    }
  }

  if (isFirstPage) {
    throw new Error("Nothing to export. Select at least one section in the configuration.");
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  pdf.save(`Management_Summary_${reportMonthKey}_${stamp}.pdf`);
}
