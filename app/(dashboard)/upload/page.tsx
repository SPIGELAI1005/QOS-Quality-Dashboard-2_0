"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileSpreadsheet, X, CheckCircle2, ExternalLink, Plus, History, Download, Check, Table2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Delivery, MonthlySiteKpi } from "@/lib/domain/types";
import { calculateGlobalPPM, calculateMonthlySiteKpis } from "@/lib/domain/kpi";
import { getAllComplaints, getAllDeliveries, getDatasetCounts, upsertComplaints, upsertDeliveries } from "@/lib/data/datasets-idb";
import { createComplaints, listComplaints } from "@/lib/api/complaints";
import { useApiMode } from "@/lib/hooks/useApiMode";
import type { CreateComplaintInput } from "@/lib/repo/types";
import * as XLSX from "xlsx";
import { ROLE_CHANGED_EVENT, ROLE_STORAGE_KEY, type RoleKey } from "@/lib/auth/roles";
import { dispatchKpiDataUpdated } from "@/lib/data/events";
import { UploadSummaryTable } from "@/components/upload/upload-summary-table";
import { ChangeHistoryPanel } from "@/components/upload/change-history-panel";
import type { UploadSummaryEntry, ChangeHistoryEntry } from "@/lib/data/uploadSummary";
import { getAffectedMetricsForComplaint, getAffectedMetricsForDelivery, saveUploadSummary, loadUploadSummary, saveChangeHistory, loadChangeHistory, getAllUploadSummaries } from "@/lib/data/uploadSummary";
import { applyComplaintCorrections, applyDeliveryCorrections } from "@/lib/data/correctedData";
import type { Complaint } from "@/lib/domain/types";
import { parseComplaints } from "@/lib/excel/parseComplaints";
import { parseDeliveries } from "@/lib/excel/parseDeliveries";
import { parsePlants } from "@/lib/excel/parsePlants";
import { parsePPAP } from "@/lib/excel/parsePPAP";
import { parseDeviations } from "@/lib/excel/parseDeviations";

type UploadSectionKey =
  | "complaints"
  | "deliveries"
  | "ppap"
  | "deviations"
  | "audit"
  | "plants";

interface UploadHistoryEntry {
  id: string;
  uploadedAtIso: string;
  section: UploadSectionKey;
  files: { name: string; size: number }[];
  summary: Record<string, string | number>;
  usedIn: string[];
  success: boolean;
  notes?: string;
}

interface UploadKpisResponse {
  monthlySiteKpis: MonthlySiteKpi[];
  globalPpm: { customerPpm: number | null; supplierPpm: number | null };
  summary: {
    totalComplaints: number;
    totalDeliveries: number;
    siteMonthCombinations: number;
    deliveryFileErrors?: string[];
  };
}

interface ManualKpiEntry extends MonthlySiteKpi {
  // Extra placeholders for templates not yet supported by KPIs/pages
  auditInternalSystem?: number;
  auditCertification?: number;
  auditProcess?: number;
  auditProduct?: number;
  deviationsInProgress?: number;
  deviationsCompleted?: number;
  poorQualityCosts?: number;
  warrantyCosts?: number;
  recordedBy?: string;
  onePagerLink?: string;
}

interface PlantData {
  code: string;
  name: string;
  city?: string;
  location?: string;
  abbreviation?: string;
  abbreviationCity?: string;
  abbreviationCountry?: string;
  country?: string;
}

interface ManualDraft {
  month: string;
  siteCode: string;
  siteLocation: string;
  recordedBy: string;
  onePagerLink: string;
  customerComplaintsQ1: number;
  supplierComplaintsQ2: number;
  internalComplaintsQ3: number;
  customerDefectiveParts: number;
  supplierDefectiveParts: number;
  internalDefectiveParts: number;
  customerDeliveries: number;
  supplierDeliveries: number;
  ppapInProgress: number;
  ppapCompleted: number;
  deviationsInProgress: number;
  deviationsCompleted: number;
  auditInternalSystem: number;
  auditCertification: number;
  auditProcess: number;
  auditProduct: number;
  poorQualityCosts: number;
  warrantyCosts: number;
}

const MANUAL_DRAFT_LABEL_ALIASES: Record<keyof ManualDraft, string[]> = {
  month: ["month", "reportmonth"],
  siteCode: ["plant", "plantcode", "site", "sitecode", "plant3digit"],
  siteLocation: ["citylocation", "location", "city", "sitelocation", "sitename"],
  recordedBy: ["nameofpersonrecordingdata", "recordedby", "personrecordingdata", "name"],
  onePagerLink: ["linktoonepager", "onepagerlink", "onepager", "linktoonepagertop13topicspermonth"],
  customerComplaintsQ1: ["customercomplaintsq1", "q1", "customercomplaints", "nrofcustomercomplaintsq1"],
  supplierComplaintsQ2: ["suppliercomplaintsq2", "q2", "suppliercomplaints", "nrofsuppliercomplaintsq2"],
  internalComplaintsQ3: ["internalcomplaintsq3", "q3", "internalcomplaints", "nrofinternalcomplaintsq3"],
  customerDefectiveParts: ["customerdefectiveparts"],
  supplierDefectiveParts: ["supplierdefectiveparts"],
  internalDefectiveParts: ["internaldefectiveparts"],
  customerDeliveries: ["outbounddeliveries", "customerdeliveries", "totalquantityoutbounddeliveriescustomer"],
  supplierDeliveries: ["inbounddeliveries", "supplierdeliveries", "totalquantityinbounddeliveriessupplier"],
  ppapInProgress: ["ppapsinprogress", "ppapinprogress", "nrofppapsinprogress"],
  ppapCompleted: ["ppapscompleted", "ppapcompleted", "nrofppapscompleted"],
  deviationsInProgress: ["deviationsinprogress", "nrofdeviationsinprogress"],
  deviationsCompleted: ["deviationscompleted", "nrofdeviationscompleted"],
  auditInternalSystem: ["auditsinternalsystem", "auditinternalsystem", "auditsinternalsystemexcutedduringthemonth"],
  auditCertification: ["auditscertification", "auditcertification", "auditscertificationexcutedduringthemonth"],
  auditProcess: ["auditsprocess", "auditprocess", "auditsprocessexcutedduringthemonth"],
  auditProduct: ["auditsproduct", "auditproduct", "auditsproductexcutedduringthemonth"],
  poorQualityCosts: ["poorqualitycosts", "poorqualitycoststemplatecostestimationformonth"],
  warrantyCosts: ["warrantycosts", "warrantycoststemplatecostestimationformonth"],
};

const MANUAL_DRAFT_NUMERIC_FIELDS = new Set<keyof ManualDraft>([
  "customerComplaintsQ1",
  "supplierComplaintsQ2",
  "internalComplaintsQ3",
  "customerDefectiveParts",
  "supplierDefectiveParts",
  "internalDefectiveParts",
  "customerDeliveries",
  "supplierDeliveries",
  "ppapInProgress",
  "ppapCompleted",
  "deviationsInProgress",
  "deviationsCompleted",
  "auditInternalSystem",
  "auditCertification",
  "auditProcess",
  "auditProduct",
  "poorQualityCosts",
  "warrantyCosts",
]);

const MANUAL_UPLOAD_REQUIRED_FIELDS: Array<keyof ManualDraft> = [
  "month",
  "siteCode",
  "recordedBy",
  "customerComplaintsQ1",
  "supplierComplaintsQ2",
  "internalComplaintsQ3",
  "customerDefectiveParts",
  "supplierDefectiveParts",
  "internalDefectiveParts",
  "customerDeliveries",
  "supplierDeliveries",
  "ppapInProgress",
  "ppapCompleted",
  "deviationsInProgress",
  "deviationsCompleted",
  "auditInternalSystem",
  "auditCertification",
  "auditProcess",
  "auditProduct",
  "poorQualityCosts",
  "warrantyCosts",
];

const MANUAL_DRAFT_FIELD_LABELS: Record<keyof ManualDraft, string> = {
  month: "Month",
  siteCode: "Plant (3-digit)",
  siteLocation: "City/Location",
  recordedBy: "Name of Person Recording Data",
  onePagerLink: "Link to OnePager",
  customerComplaintsQ1: "Customer Complaints (Q1)",
  supplierComplaintsQ2: "Supplier Complaints (Q2)",
  internalComplaintsQ3: "Internal Complaints (Q3)",
  customerDefectiveParts: "Customer Defective Parts",
  supplierDefectiveParts: "Supplier Defective Parts",
  internalDefectiveParts: "Internal Defective Parts",
  customerDeliveries: "Outbound Deliveries (Customer)",
  supplierDeliveries: "Inbound Deliveries (Supplier)",
  ppapInProgress: "PPAPs In Progress",
  ppapCompleted: "PPAPs Completed",
  deviationsInProgress: "Deviations In Progress",
  deviationsCompleted: "Deviations Completed",
  auditInternalSystem: "Audit Internal System",
  auditCertification: "Audit Certification",
  auditProcess: "Audit Process",
  auditProduct: "Audit Product",
  poorQualityCosts: "Poor Quality Costs",
  warrantyCosts: "Warranty Costs",
};

const MANUAL_DRAFT_FIELD_BY_LABEL = new Map<string, keyof ManualDraft>(
  Object.entries(MANUAL_DRAFT_LABEL_ALIASES).flatMap(([field, aliases]) =>
    aliases.map((alias) => [alias, field as keyof ManualDraft] as const)
  )
);

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatGermanInt(value: number): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value);
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeManualUploadLabel(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseManualUploadMonth(value: unknown): string | null {
  if (typeof value === "number") {
    const dateInfo = XLSX.SSF.parse_date_code(value);
    if (!dateInfo) return null;
    return `${dateInfo.y}-${String(dateInfo.m).padStart(2, "0")}`;
  }
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/[/.]/g, "-");
  const directMatch = normalized.match(/^(\d{4})-(\d{1,2})$/);
  if (directMatch) {
    return `${directMatch[1]}-${String(Number(directMatch[2])).padStart(2, "0")}`;
  }
  const parsedDate = new Date(raw);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
}

function parseManualUploadFieldValue(field: keyof ManualDraft, value: unknown): ManualDraft[keyof ManualDraft] | null {
  if (value === undefined || value === null || value === "") return null;
  if (field === "month") return parseManualUploadMonth(value);
  if (field === "siteCode") return String(value).trim().replace(/\.0$/, "");
  if (MANUAL_DRAFT_NUMERIC_FIELDS.has(field)) {
    const numericValue =
      typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
    if (!Number.isFinite(numericValue)) return null;
    return Math.max(0, numericValue);
  }
  return String(value).trim();
}

function extractManualDraftFromWorkbook(workbook: XLSX.WorkBook): Partial<ManualDraft> {
  const extracted: Partial<ManualDraft> = {};
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet?.["!ref"]) continue;
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row += 1) {
      for (let col = range.s.c; col < range.e.c; col += 1) {
        const labelCell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (!labelCell?.v) continue;
        const normalizedLabel = normalizeManualUploadLabel(labelCell.v);
        const field = MANUAL_DRAFT_FIELD_BY_LABEL.get(normalizedLabel);
        if (!field) continue;
        const valueCell = sheet[XLSX.utils.encode_cell({ r: row, c: col + 1 })];
        if (!valueCell) continue;
        const parsedValue = parseManualUploadFieldValue(field, valueCell.v);
        if (parsedValue === null) continue;
        extracted[field] = parsedValue as never;
      }
    }
  }
  return extracted;
}

function reviveComplaint(raw: any): Complaint {
  return {
    ...raw,
    createdOn: raw?.createdOn ? new Date(raw.createdOn) : new Date(""),
  } as Complaint;
}

function reviveDelivery(raw: any): Delivery {
  return {
    ...raw,
    date: raw?.date ? new Date(raw.date) : new Date(""),
  } as Delivery;
}

function getDeliveryLogicalKey(delivery: Delivery): string {
  const site = String(delivery.siteCode || delivery.plant || "").trim();
  const kind = String(delivery.kind || "").trim();
  const d = delivery.date instanceof Date ? delivery.date : new Date(delivery.date);
  if (Number.isNaN(d.getTime())) return `${site}||${kind}||invalid-date`;
  const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${site}||${kind}||${monthKey}`;
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-px w-full bg-border ${className || ""}`} />;
}

async function postFormDataWithProgress<T>(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
      onProgress(pct);
    };

    xhr.onload = () => {
      try {
        // Handle HTTP 413 (Payload Too Large) specifically
        if (xhr.status === 413) {
          reject(new Error("Upload failed: File size too large (HTTP 413). The system will automatically split large uploads into smaller batches. Please try again."));
          return;
        }
        
        // Check if response is HTML (error page) instead of JSON
        const contentType = xhr.getResponseHeader("content-type") || "";
        const responseText = xhr.responseText || "";
        
        if (!contentType.includes("application/json")) {
          // Try to extract error message from HTML if possible
          const errorMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                            responseText.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                            responseText.match(/Request Error|Error|Timeout/i);
          const errorMsg = errorMatch ? errorMatch[1] || errorMatch[0] : "Server returned non-JSON response";
          reject(new Error(`Upload failed: ${errorMsg} (HTTP ${xhr.status})`));
          return;
        }
        
        const json = responseText ? JSON.parse(responseText) : {};
        if (xhr.status >= 200 && xhr.status < 300) resolve(json as T);
        else reject(new Error(json?.error || `Upload failed (HTTP ${xhr.status})`));
      } catch (e) {
        // Better error message for JSON parse errors
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        if (errorMsg.includes("Unexpected token")) {
          reject(new Error("Upload failed: Server returned invalid response (possibly a timeout or error page). Please try again with smaller files or check server logs."));
        } else {
          reject(new Error(`Upload failed: ${errorMsg}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.send(formData);
  });
}

const LARGE_FILE_THRESHOLD_BYTES = 2 * 1024 * 1024;
const JSON_CHUNK_RECORD_COUNT = 500;

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0 || items.length === 0) return items.length ? [items] : [];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function postJsonChunk<T>(section: UploadSectionKey, chunk: T[], chunkIndex: number, totalChunks: number): Promise<T[]> {
  const response = await fetch("/api/upload-json-chunk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileType: section,
      chunkIndex,
      totalChunks,
      records: chunk,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Chunk upload failed (HTTP ${response.status})`);
  }
  const records = Array.isArray(payload?.records) ? (payload.records as T[]) : [];
  return records;
}

export default function UploadPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const apiMode = useApiMode();
  const [role, setRole] = useState<RoleKey>("reader");
  const [hasRoleLoaded, setHasRoleLoaded] = useState(false);
  const [uploading, setUploading] = useState<Record<UploadSectionKey, boolean>>({
    complaints: false,
    deliveries: false,
    ppap: false,
    deviations: false,
    audit: false,
    plants: false,
  });
  const [errors, setErrors] = useState<Record<UploadSectionKey, string | null>>({
    complaints: null,
    deliveries: null,
    ppap: null,
    deviations: null,
    audit: null,
    plants: null,
  });

  const [complaintsFiles, setComplaintsFiles] = useState<File[]>([]);
  const [deliveriesFiles, setDeliveriesFiles] = useState<File[]>([]);
  const [ppapFiles, setPpapFiles] = useState<File[]>([]);
  const [deviationFiles, setDeviationFiles] = useState<File[]>([]);
  const [auditFiles, setAuditFiles] = useState<File[]>([]);
  const [plantsFiles, setPlantsFiles] = useState<File[]>([]);

  const [history, setHistory] = useState<UploadHistoryEntry[]>([]);
  const [kpisResult, setKpisResult] = useState<UploadKpisResponse | null>(null);
  const [plantsData, setPlantsData] = useState<PlantData[]>([]);
  const [calculatingKpis, setCalculatingKpis] = useState(false);
  const [kpiCalculationProgress, setKpiCalculationProgress] = useState<{ percent: number; status: "idle" | "calculating" | "success" | "error" }>({
    percent: 0,
    status: "idle",
  });
  const [storedParsedCounts, setStoredParsedCounts] = useState<{ complaints: number; deliveries: number }>({
    complaints: 0,
    deliveries: 0,
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [progressBySection, setProgressBySection] = useState<
    Record<UploadSectionKey, { percent: number; status: "idle" | "uploading" | "success" | "error" }>
  >({
    complaints: { percent: 0, status: "idle" },
    deliveries: { percent: 0, status: "idle" },
    ppap: { percent: 0, status: "idle" },
    deviations: { percent: 0, status: "idle" },
    audit: { percent: 0, status: "idle" },
    plants: { percent: 0, status: "idle" },
  });

  // Consider a section "uploaded" if we have parsed data stored (supports incremental uploads)
  const complaintsUploaded = useMemo(() => storedParsedCounts.complaints > 0, [storedParsedCounts.complaints]);
  const deliveriesUploaded = useMemo(() => storedParsedCounts.deliveries > 0, [storedParsedCounts.deliveries]);
  const canCalculate = useMemo(
    () => complaintsUploaded && deliveriesUploaded && !calculatingKpis,
    [complaintsUploaded, deliveriesUploaded, calculatingKpis]
  );
  const [uploadedFileNamesBySection, setUploadedFileNamesBySection] = useState<Record<UploadSectionKey, string[]>>({
    complaints: [],
    deliveries: [],
    ppap: [],
    deviations: [],
    audit: [],
    plants: [],
  });

  const [manualEntries, setManualEntries] = useState<ManualKpiEntry[]>([]);
  const [uploadSummaries, setUploadSummaries] = useState<Map<string, UploadSummaryEntry>>(new Map());
  const [manualDraft, setManualDraft] = useState<ManualDraft>({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    siteCode: "",
    siteLocation: "",
    recordedBy: "",
    onePagerLink: "",
    customerComplaintsQ1: 0,
    supplierComplaintsQ2: 0,
    internalComplaintsQ3: 0,
    customerDefectiveParts: 0,
    supplierDefectiveParts: 0,
    internalDefectiveParts: 0,
    customerDeliveries: 0,
    supplierDeliveries: 0,
    ppapInProgress: 0,
    ppapCompleted: 0,
    deviationsInProgress: 0,
    deviationsCompleted: 0,
    auditInternalSystem: 0,
    auditCertification: 0,
    auditProcess: 0,
    auditProduct: 0,
    poorQualityCosts: 0,
    warrantyCosts: 0,
  });
  const manualUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [manualUploadFileName, setManualUploadFileName] = useState("");
  const [manualUploadMessage, setManualUploadMessage] = useState<string | null>(null);
  const [manualUploadError, setManualUploadError] = useState<string | null>(null);
  const [manualUploadImportedRequiredFields, setManualUploadImportedRequiredFields] = useState<Array<keyof ManualDraft>>([]);
  const [manualUploadMissingRequiredFields, setManualUploadMissingRequiredFields] = useState<Array<keyof ManualDraft>>([]);
  const [activeUploadTab, setActiveUploadTab] = useState("files");

  const sectionMeta = useMemo(() => {
    return {
      complaints: {
        title: t.upload.complaintsTitle,
        help: t.upload.complaintsHelp,
        usedIn: [
          t.sidebar.dashboard,
          t.sidebar.customerPerformance,
          t.sidebar.supplierPerformance,
          t.sidebar.poorQualityCosts,
        ],
      },
      deliveries: {
        title: t.upload.deliveriesTitle,
        help: t.upload.deliveriesHelp,
        usedIn: [t.sidebar.dashboard, t.sidebar.customerPerformance, t.sidebar.supplierPerformance],
      },
      ppap: {
        title: t.upload.ppapTitle,
        help: t.upload.ppapHelp,
        usedIn: [t.sidebar.ppapsOverview],
      },
      deviations: {
        title: t.upload.deviationsTitle,
        help: t.upload.deviationsHelp,
        usedIn: [t.sidebar.deviationsOverview],
      },
      audit: {
        title: t.upload.auditTitle,
        help: t.upload.auditHelp,
        usedIn: [t.sidebar.auditManagement],
      },
      plants: {
        title: t.upload.plantsTitle,
        help: t.upload.plantsHelp,
        usedIn: ["All pages (plant names/locations, legends, AI prompts)"],
      },
    } satisfies Record<UploadSectionKey, { title: string; help: string; usedIn: string[] }>;
  }, [t]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedHistory = safeJsonParse<UploadHistoryEntry[]>(localStorage.getItem("qos-et-upload-history"));
    if (storedHistory) {
      setHistory(storedHistory);
      // Load upload summaries for all history entries
      const summaries = new Map<string, UploadSummaryEntry>();
      storedHistory.forEach(entry => {
        const summary = loadUploadSummary(entry.id);
        if (summary) summaries.set(entry.id, summary);
      });
      setUploadSummaries(summaries);
    }

    const storedManual = safeJsonParse<ManualKpiEntry[]>(localStorage.getItem("qos-et-manual-kpis"));
    if (storedManual) setManualEntries(storedManual);

    const storedKpis = safeJsonParse<UploadKpisResponse>(localStorage.getItem("qos-et-upload-kpis-result"));
    if (storedKpis) setKpisResult(storedKpis);

    // Migration: remove old localStorage dataset keys to avoid quota issues
    try {
      localStorage.removeItem("qos-et-complaints-parsed");
      localStorage.removeItem("qos-et-deliveries-parsed");
    } catch {}

    // Load counts from IndexedDB (large storage)
    getDatasetCounts()
      .then((counts) => {
        setStoredParsedCounts(counts);
        setProgressBySection((p) => ({
          ...p,
          complaints: counts.complaints > 0 ? { percent: 100, status: "success" } : p.complaints,
          deliveries: counts.deliveries > 0 ? { percent: 100, status: "success" } : p.deliveries,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (Array.isArray(data?.plants)) setPlantsData(data.plants);
      })
      .catch(() => {});
  }, []);

  function persistHistory(next: UploadHistoryEntry[]) {
    setHistory(next);
    if (typeof window !== "undefined") localStorage.setItem("qos-et-upload-history", JSON.stringify(next));
  }

  function persistManual(next: ManualKpiEntry[]) {
    setManualEntries(next);
    if (typeof window !== "undefined") localStorage.setItem("qos-et-manual-kpis", JSON.stringify(next));
  }

  function onSelectFiles(section: UploadSectionKey, files: File[]) {
    if (section === "complaints") setComplaintsFiles((prev) => [...prev, ...files]);
    if (section === "deliveries") setDeliveriesFiles((prev) => [...prev, ...files]);
    if (section === "ppap") setPpapFiles((prev) => [...prev, ...files]);
    if (section === "deviations") setDeviationFiles((prev) => [...prev, ...files]);
    if (section === "audit") setAuditFiles((prev) => [...prev, ...files]);
    if (section === "plants") setPlantsFiles((prev) => [...prev, ...files]);
  }

  function removeFile(section: UploadSectionKey, index: number) {
    if (section === "complaints") setComplaintsFiles((prev) => prev.filter((_, i) => i !== index));
    if (section === "deliveries") setDeliveriesFiles((prev) => prev.filter((_, i) => i !== index));
    if (section === "ppap") setPpapFiles((prev) => prev.filter((_, i) => i !== index));
    if (section === "deviations") setDeviationFiles((prev) => prev.filter((_, i) => i !== index));
    if (section === "audit") setAuditFiles((prev) => prev.filter((_, i) => i !== index));
    if (section === "plants") setPlantsFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadSection(section: UploadSectionKey, files: File[]) {
    setErrors((prev) => ({ ...prev, [section]: null }));
    if (files.length === 0) {
      setErrors((prev) => ({ ...prev, [section]: "Please add at least one file." }));
      return;
    }

    // Audit is placeholder-only for now
    if (section === "audit") {
      setProgressBySection((p) => ({ ...p, [section]: { percent: 100, status: "success" } }));
      setUploadedFileNamesBySection((p) => ({ ...p, [section]: files.map((f) => f.name) }));
      const entry: UploadHistoryEntry = {
        id: makeId("audit"),
        uploadedAtIso: new Date().toISOString(),
        section,
        files: files.map((f) => ({ name: f.name, size: f.size })),
        summary: { files: files.length, note: "No parser yet" },
        usedIn: sectionMeta.audit.usedIn,
        success: true,
        notes: "Audit parsing is under construction. Files recorded for traceability only.",
      };
      persistHistory([entry, ...history]);
      return;
    }

    setUploading((prev) => ({ ...prev, [section]: true }));
    setProgressBySection((p) => ({ ...p, [section]: { percent: 0, status: "uploading" } }));
    try {
      const MAX_FILES_PER_BATCH = 3;
      const MAX_TOTAL_SIZE = 4 * 1024 * 1024;
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const needsMultipartChunking = files.length > MAX_FILES_PER_BATCH || totalSize > MAX_TOTAL_SIZE;
      const hasLargeFile = files.some((file) => file.size > LARGE_FILE_THRESHOLD_BYTES);

      let allResults: any = {
        complaints: [],
        deliveries: [],
        plants: [],
        ppaps: [],
        deviations: [],
        errors: [],
      };

      if (hasLargeFile) {
        const parsedBySection: Record<UploadSectionKey, unknown[]> = {
          complaints: [],
          deliveries: [],
          plants: [],
          ppap: [],
          deviations: [],
          audit: [],
        };

        for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
          const file = files[fileIndex];
          const arrayBuffer = await file.arrayBuffer();
          const binary = new Uint8Array(arrayBuffer);

          let parsed: unknown[] = [];
          if (section === "complaints") parsed = parseComplaints(binary);
          if (section === "deliveries") parsed = parseDeliveries(binary, undefined, file.name);
          if (section === "plants") parsed = parsePlants(binary);
          if (section === "ppap") parsed = parsePPAP(binary);
          if (section === "deviations") parsed = parseDeviations(binary);

          parsedBySection[section].push(...parsed);
          const parseProgress = Math.round(((fileIndex + 1) / files.length) * 40);
          setProgressBySection((p) => ({ ...p, [section]: { percent: parseProgress, status: "uploading" } }));
        }

        const sectionRecords = parsedBySection[section];
        const chunks = chunkArray(sectionRecords, JSON_CHUNK_RECORD_COUNT);
        const uploadedRecords: unknown[] = [];

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          const uploadedChunk = await postJsonChunk(section, chunks[chunkIndex], chunkIndex + 1, chunks.length);
          uploadedRecords.push(...uploadedChunk);
          const uploadProgress = 40 + Math.round(((chunkIndex + 1) / Math.max(1, chunks.length)) * 60);
          setProgressBySection((p) => ({ ...p, [section]: { percent: uploadProgress, status: "uploading" } }));
        }

        if (section === "complaints") allResults.complaints = uploadedRecords;
        if (section === "deliveries") allResults.deliveries = uploadedRecords;
        if (section === "plants") allResults.plants = uploadedRecords;
        if (section === "ppap") allResults.ppaps = uploadedRecords;
        if (section === "deviations") allResults.deviations = uploadedRecords;
      } else {
        if (needsMultipartChunking && files.length > MAX_FILES_PER_BATCH) {
          const batches: File[][] = [];
          for (let i = 0; i < files.length; i += MAX_FILES_PER_BATCH) {
            batches.push(files.slice(i, i + MAX_FILES_PER_BATCH));
          }

          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const formData = new FormData();
            formData.append("fileType", section);
            batch.forEach((f) => formData.append("files", f));

            const batchProgress = (pct: number) => {
              const baseProgress = (batchIndex / batches.length) * 100;
              const partialProgress = pct / batches.length;
              setProgressBySection((p) => ({ ...p, [section]: { percent: Math.round(baseProgress + partialProgress), status: "uploading" } }));
            };

            const batchData = await postFormDataWithProgress<any>("/api/upload", formData, batchProgress);
            if (batchData.complaints) allResults.complaints.push(...(batchData.complaints || []));
            if (batchData.deliveries) allResults.deliveries.push(...(batchData.deliveries || []));
            if (batchData.plants) allResults.plants.push(...(batchData.plants || []));
            if (batchData.ppaps) allResults.ppaps.push(...(batchData.ppaps || []));
            if (batchData.deviations) allResults.deviations.push(...(batchData.deviations || []));
            if (batchData.errors) allResults.errors.push(...(batchData.errors || []));
          }
        } else {
          const formData = new FormData();
          formData.append("fileType", section);
          files.forEach((f) => formData.append("files", f));
          const data = await postFormDataWithProgress<any>("/api/upload", formData, (pct) => {
            setProgressBySection((p) => ({ ...p, [section]: { percent: pct, status: "uploading" } }));
          });

          if (data.complaints) allResults.complaints = data.complaints;
          if (data.deliveries) allResults.deliveries = data.deliveries;
          if (data.plants) allResults.plants = data.plants;
          if (data.ppaps) allResults.ppaps = data.ppaps;
          if (data.deviations) allResults.deviations = data.deviations;
          if (data.errors) allResults.errors = data.errors;
        }
      }

      setProgressBySection((p) => ({ ...p, [section]: { percent: 100, status: "success" } }));
      setUploadedFileNamesBySection((p) => ({ ...p, [section]: files.map((f) => f.name) }));
      
      // Use merged results
      const data = allResults;

      const summary: Record<string, string | number> = { files: files.length };
      let dedupedComplaintsForSummary: Complaint[] = [];
      let duplicateComplaintsCount = 0;
      
      // Declare uploadChangeHistory early so it can be used in duplicate handling
      const uploadChangeHistory: ChangeHistoryEntry[] = [];
      
      let conversionStatus: Array<{
        complaintId: string;
        notificationNumber: string;
        status: "converted" | "failed" | "needs_attention" | "not_applicable";
        originalValue: number;
        originalUnit: string;
        convertedValue?: number;
        error?: string;
        materialDescription?: string;
      }> = [];
      
      if (section === "complaints") {
        const items = Array.isArray(data?.complaints) ? data.complaints : [];
        const totalDefects = items.reduce((sum: number, c: any) => sum + (Number(c?.defectiveParts) || 0), 0);
        const q1 = items.filter((c: any) => c?.notificationType === "Q1").length;
        const q2 = items.filter((c: any) => c?.notificationType === "Q2").length;
        const q3 = items.filter((c: any) => c?.notificationType === "Q3").length;
        summary.records = items.length;
        summary.q1 = q1;
        summary.q2 = q2;
        summary.q3 = q3;
        summary.totalDefectiveParts = totalDefects;

        // Dedupe against existing complaints (collaborative uploads)
        const revived = (items as any[]).filter((x) => x?.id).map(reviveComplaint);
        let existingComplaintIds = new Set<string>();
        try {
          if (apiMode.isApiMode) {
            const apiComplaints = await listComplaints();
            existingComplaintIds = new Set(apiComplaints.map((c) => c.id));
          } else {
            existingComplaintIds = new Set((await getAllComplaints()).map((c) => c.id));
          }
        } catch {
          existingComplaintIds = new Set((await getAllComplaints()).map((c) => c.id));
        }
        const { deduped: dedupedComplaints, duplicates: duplicateComplaints } = dedupeById(revived, existingComplaintIds);
        summary.duplicateRecords = duplicateComplaints.length;
        dedupedComplaintsForSummary = dedupedComplaints;
        duplicateComplaintsCount = duplicateComplaints.length;
        if (duplicateComplaints.length > 0) {
          duplicateComplaints.forEach((c) => {
            uploadChangeHistory.push({
              id: makeId("duplicate_complaint"),
              timestamp: new Date().toISOString(),
              editor: role || "Unknown",
              recordId: c.id,
              recordType: "complaint",
              field: "duplicate",
              oldValue: null,
              newValue: { id: c.id, notificationNumber: c.notificationNumber, siteCode: c.siteCode },
              changeType: "duplicate",
              affectedMetrics: getAffectedMetricsForComplaint(c, "notificationType"),
              reason: "Duplicate complaint ignored",
            });
          });
        }

        // Persist parsed complaints via API or IndexedDB fallback (deduped)
        if (typeof window !== "undefined") {
          try {
            if (apiMode.isApiMode) {
              const complaintInputs: CreateComplaintInput[] = dedupedComplaints.map((c) => ({
                id: c.id,
                notificationNumber: c.notificationNumber,
                notificationType: c.notificationType,
                category: c.category,
                plant: c.plant,
                siteCode: c.siteCode,
                siteName: c.siteName,
                createdOn: c.createdOn,
                defectiveParts: c.defectiveParts,
                source: c.source,
                unitOfMeasure: c.unitOfMeasure,
                materialDescription: c.materialDescription,
                materialNumber: c.materialNumber,
                conversionJson: c.conversion ? JSON.stringify(c.conversion) : undefined,
              }));
              await createComplaints(complaintInputs);
              const apiComplaints = await listComplaints();
              setStoredParsedCounts({ complaints: apiComplaints.length, deliveries: storedParsedCounts.deliveries });
            } else {
              await upsertComplaints(dedupedComplaints);
              const counts = await getDatasetCounts();
              setStoredParsedCounts(counts);
            }
            setProgressBySection((p) => ({ ...p, complaints: { percent: 100, status: "success" } }));
          } catch (err) {
            console.error("[Upload] Failed to save complaints:", err);
            try {
              await upsertComplaints(dedupedComplaints);
              const counts = await getDatasetCounts();
              setStoredParsedCounts(counts);
              setProgressBySection((p) => ({ ...p, complaints: { percent: 100, status: "success" } }));
              setErrors((prev) => ({ ...prev, complaints: "Saved to local storage (API unavailable)" }));
            } catch {
              setProgressBySection((p) => ({ ...p, complaints: { percent: 0, status: "error" } }));
              setErrors((prev) => ({ ...prev, complaints: err instanceof Error ? err.message : "Failed to save complaints" }));
            }
          }
        }

        // Create upload summary with conversion status
        const complaints = dedupedComplaints as Complaint[];
        conversionStatus = complaints.map(c => {
          // Determine conversion status
          let status: "converted" | "failed" | "needs_attention" | "not_applicable";
          let error: string | undefined;
          
          if (!c.unitOfMeasure || c.unitOfMeasure.toUpperCase() === "PC") {
            status = "not_applicable";
          } else if (c.conversion?.wasConverted) {
            status = "converted";
          } else {
            // Conversion was attempted but failed
            status = "failed";
            error = `Could not convert ${c.defectiveParts} ${c.unitOfMeasure} to PC. Using original value.`;
          }
          
          return {
            complaintId: c.id,
            notificationNumber: c.notificationNumber,
            status,
            originalValue: c.defectiveParts,
            originalUnit: c.unitOfMeasure || "PC",
            convertedValue: c.conversion?.convertedValue,
            error,
            materialDescription: c.materialDescription,
            siteCode: c.siteCode,
            notificationType: c.notificationType,
          };
        });
      }
      if (section === "deliveries") {
        const items = Array.isArray(data?.deliveries) ? data.deliveries : [];
        const totalQty = items.reduce((sum: number, d: any) => sum + (Number(d?.quantity) || 0), 0);
        const custQty = items.filter((d: any) => d?.kind === "Customer").reduce((sum: number, d: any) => sum + (Number(d?.quantity) || 0), 0);
        const supQty = items.filter((d: any) => d?.kind === "Supplier").reduce((sum: number, d: any) => sum + (Number(d?.quantity) || 0), 0);
        summary.records = items.length;
        summary.totalQuantity = totalQty;
        summary.customerQuantity = custQty;
        summary.supplierQuantity = supQty;

        // Persist parsed deliveries in IndexedDB (deduped)
        if (typeof window !== "undefined") {
          const revived = (items as any[]).filter((x) => x?.id).map(reviveDelivery);
          const existingDeliveries = await getAllDeliveries();
          const seenDeliveryKeys = new Set(existingDeliveries.map(getDeliveryLogicalKey));
          const deduped: Delivery[] = [];
          const duplicates: Delivery[] = [];
          for (const d of revived) {
            const key = getDeliveryLogicalKey(d);
            if (seenDeliveryKeys.has(key)) {
              duplicates.push(d);
              continue;
            }
            seenDeliveryKeys.add(key);
            deduped.push(d);
          }
          summary.duplicateRecords = duplicates.length;
          if (duplicates.length > 0) {
            duplicates.forEach((d) => {
              uploadChangeHistory.push({
                id: makeId("duplicate_delivery"),
                timestamp: new Date().toISOString(),
                editor: role || "Unknown",
                recordId: d.id,
                recordType: "delivery",
                field: "duplicate",
                oldValue: null,
                newValue: { id: d.id, siteCode: d.siteCode, date: d.date, kind: d.kind, quantity: d.quantity },
                changeType: "duplicate",
                affectedMetrics: getAffectedMetricsForDelivery(d, "quantity"),
                reason: "Duplicate delivery ignored",
              });
            });
          }
          await upsertDeliveries(deduped);
          const counts = await getDatasetCounts();
          setStoredParsedCounts(counts);
          setProgressBySection((p) => ({ ...p, deliveries: { percent: 100, status: "success" } }));
        }
      }
      if (section === "ppap") {
        const items = Array.isArray(data?.ppaps) ? data.ppaps : [];
        summary.records = items.length;
      }
      if (section === "deviations") {
        const items = Array.isArray(data?.deviations) ? data.deviations : [];
        summary.records = items.length;
      }
      if (section === "plants") {
        const items = Array.isArray(data?.plants) ? data.plants : [];
        summary.records = items.length;
      }

      const entry: UploadHistoryEntry = {
        id: makeId(section),
        uploadedAtIso: new Date().toISOString(),
        section,
        files: files.map((f) => ({ name: f.name, size: f.size })),
        summary,
        usedIn: sectionMeta[section].usedIn,
        success: true,
        notes: Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors.join(" | ") : undefined,
      };

      persistHistory([entry, ...history]);

      // Add change history entry for file upload (uploadChangeHistory was declared earlier)
      uploadChangeHistory.push({
        id: makeId("upload_change"),
        timestamp: entry.uploadedAtIso,
        editor: role === "admin" ? "Admin" : role === "editor" ? "Editor" : "System",
        recordId: entry.id,
        recordType:
          section === "complaints"
            ? "complaint"
            : section === "deliveries"
              ? "delivery"
              : section === "ppap"
                ? "ppap"
                : section === "deviations"
                  ? "deviation"
                  : "file_upload",
        field: "all",
        oldValue: null,
        newValue: summary,
        reason: `File upload: ${files.map((f) => f.name).join(", ")}`,
        changeType: "file_upload",
        affectedMetrics: {
          metrics: sectionMeta[section].usedIn,
          visualizations: sectionMeta[section].usedIn,
          pages: sectionMeta[section].usedIn,
          calculations: [],
        },
        dataDetails: {
          files: files.map((f) => ({ name: f.name, size: f.size })),
          section,
          summary,
        },
      });

      // Create and save upload summary for complaints
      if (section === "complaints" && conversionStatus.length > 0) {
        const complaints = dedupedComplaintsForSummary.length > 0
          ? dedupedComplaintsForSummary
          : Array.isArray(data?.complaints)
            ? (data.complaints as Complaint[])
            : [];
        const uploadSummary: UploadSummaryEntry = {
          id: entry.id,
          uploadedAtIso: entry.uploadedAtIso,
          section: "complaints",
          files: entry.files,
          rawData: { complaints },
          processedData: { complaints },
          conversionStatus: { complaints: conversionStatus },
          changeHistory: uploadChangeHistory,
          summary: {
            totalRecords: complaints.length,
            recordsWithIssues: conversionStatus.filter(s => s.status === "failed" || s.status === "needs_attention").length,
            recordsCorrected: 0,
            recordsUnchanged: complaints.length,
            duplicateRecords: duplicateComplaintsCount,
          },
        };

        saveUploadSummary(uploadSummary);
        saveChangeHistory(entry.id, uploadChangeHistory);
        setUploadSummaries(prev => new Map(prev).set(entry.id, uploadSummary));
      } else {
        // For other sections, save change history separately
        saveChangeHistory(entry.id, uploadChangeHistory);
      }

      // Auto-calculate KPIs in the background after complaints/deliveries uploads
      if (section === "complaints" || section === "deliveries") {
        void calculateKpisFromStoredData({ writeHistory: false });
      }
    } catch (e) {
      setProgressBySection((p) => ({ ...p, [section]: { percent: p[section].percent, status: "error" } }));
      setErrors((prev) => ({ ...prev, [section]: e instanceof Error ? e.message : "Upload failed." }));
      const entry: UploadHistoryEntry = {
        id: makeId(`${section}_error`),
        uploadedAtIso: new Date().toISOString(),
        section,
        files: files.map((f) => ({ name: f.name, size: f.size })),
        summary: { files: files.length },
        usedIn: sectionMeta[section].usedIn,
        success: false,
        notes: e instanceof Error ? e.message : "Upload failed.",
      };
      persistHistory([entry, ...history]);
    } finally {
      setUploading((prev) => ({ ...prev, [section]: false }));
    }
  }

  function dedupeById<T extends { id: string }>(items: T[], existingIds: Set<string>) {
    const seen = new Set(existingIds);
    const deduped: T[] = [];
    const duplicates: T[] = [];
    for (const item of items) {
      const id = item?.id;
      if (!id) continue;
      if (seen.has(id)) {
        duplicates.push(item);
        continue;
      }
      seen.add(id);
      deduped.push(item);
    }
    return { deduped, duplicates };
  }

  async function calculateKpisFromStoredData(options: { writeHistory: boolean }) {
    if (typeof window === "undefined") return;
    const counts = await getDatasetCounts().catch(() => ({ complaints: 0, deliveries: 0 }));
    if (counts.complaints === 0 && counts.deliveries === 0) {
      return;
    }
    // Run recalc when at least one dataset exists so KPIs (and plant list) include all sites from deliveries/complaints.

    setCalculatingKpis(true);
    setKpiCalculationProgress({ percent: 10, status: "calculating" });

    try {
      // Read from API or IndexedDB fallback
      let complaints: Complaint[];
      let deliveries: Delivery[];
      
      if (apiMode.isApiMode) {
        try {
          const apiComplaints = await listComplaints();
          complaints = apiComplaints.map((c) => ({
            ...c,
            createdOn: c.createdOn instanceof Date ? c.createdOn : new Date(c.createdOn),
          }));
        } catch (err) {
          console.warn("[KPI Calc] API failed, falling back to IndexedDB:", err);
          const complaintsRaw = await getAllComplaints();
          complaints = complaintsRaw.map(reviveComplaint);
        }
      } else {
        const complaintsRaw = await getAllComplaints();
        complaints = complaintsRaw.map(reviveComplaint);
      }

      // Deliveries from IndexedDB (not migrated to API yet)
      const deliveriesRaw = await getAllDeliveries();
      deliveries = deliveriesRaw.map(reviveDelivery);

      setKpiCalculationProgress({ percent: 60, status: "calculating" });

      const monthlySiteKpis = calculateMonthlySiteKpis(complaints, deliveries);
      const globalPpm = calculateGlobalPPM(complaints, deliveries);

      const result: UploadKpisResponse = {
        monthlySiteKpis,
        globalPpm,
        summary: {
          totalComplaints: complaints.length,
          totalDeliveries: deliveries.length,
          siteMonthCombinations: monthlySiteKpis.length,
        },
      };

      setKpisResult(result);
      localStorage.setItem("qos-et-kpis", JSON.stringify(monthlySiteKpis));
      localStorage.setItem("qos-et-global-ppm", JSON.stringify(globalPpm));
      localStorage.setItem("qos-et-upload-kpis-result", JSON.stringify(result));
      dispatchKpiDataUpdated();

      setKpiCalculationProgress({ percent: 100, status: "success" });

      if (options.writeHistory) {
        const entry: UploadHistoryEntry = {
          id: makeId("kpis"),
          uploadedAtIso: new Date().toISOString(),
          section: "deliveries",
          files: [],
          summary: {
            totalComplaints: result.summary.totalComplaints,
            totalDeliveries: result.summary.totalDeliveries,
            siteMonthCombinations: result.summary.siteMonthCombinations,
          },
          usedIn: ["QOS ET Dashboard", "Customer Performance", "Supplier Performance", "AI Management Summary"],
          success: true,
          notes: "KPIs calculated from stored uploads and stored in localStorage as qos-et-kpis / qos-et-global-ppm",
        };
        persistHistory([entry, ...history]);
      }
    } catch (e) {
      setKpiCalculationProgress({ percent: 0, status: "error" });
      if (options.writeHistory) {
        setErrors((prev) => ({ ...prev, deliveries: e instanceof Error ? e.message : "Failed to calculate KPIs." }));
      }
    } finally {
      setCalculatingKpis(false);
    }
  }

  async function recalculateKpis() {
    setErrors((prev) => ({ ...prev, complaints: null, deliveries: null }));
    if (typeof window === "undefined") return;
    const counts = await getDatasetCounts().catch(() => ({ complaints: 0, deliveries: 0 }));
    if (counts.complaints === 0 && counts.deliveries === 0) {
      setErrors((prev) => ({
        ...prev,
        deliveries: "To calculate KPIs, please upload at least one complaints file or one deliveries file.",
      }));
      return;
    }

    await calculateKpisFromStoredData({ writeHistory: true });
  }

  function mergeManualIntoKpis(manual: ManualKpiEntry[]) {
    if (typeof window === "undefined") return;
    const existing = safeJsonParse<MonthlySiteKpi[]>(localStorage.getItem("qos-et-kpis")) || [];
    const byKey = new Map(existing.map((k) => [`${k.month}__${k.siteCode}`, k] as const));
    for (const m of manual) byKey.set(`${m.month}__${m.siteCode}`, m);
    const merged = Array.from(byKey.values()).sort((a, b) => a.month.localeCompare(b.month) || a.siteCode.localeCompare(b.siteCode));
    localStorage.setItem("qos-et-kpis", JSON.stringify(merged));
    dispatchKpiDataUpdated();
  }

  function addManualEntry() {
    const site = manualDraft.siteCode.trim();
    if (!/^\d{3}$/.test(site)) return;
    if (!manualDraft.recordedBy.trim()) {
      // Show validation error - could use a toast or inline error
      return;
    }
    const deviationsTotal = (manualDraft.deviationsInProgress || 0) + (manualDraft.deviationsCompleted || 0);
    const entry: ManualKpiEntry = {
      month: manualDraft.month,
      siteCode: site,
      siteName: manualDraft.siteLocation?.trim() ? manualDraft.siteLocation.trim() : undefined,
      customerComplaintsQ1: manualDraft.customerComplaintsQ1,
      supplierComplaintsQ2: manualDraft.supplierComplaintsQ2,
      internalComplaintsQ3: manualDraft.internalComplaintsQ3,
      deviationsD: deviationsTotal,
      ppapP: { inProgress: manualDraft.ppapInProgress, completed: manualDraft.ppapCompleted },
      customerPpm: null,
      supplierPpm: null,
      customerDeliveries: manualDraft.customerDeliveries,
      supplierDeliveries: manualDraft.supplierDeliveries,
      customerDefectiveParts: manualDraft.customerDefectiveParts,
      supplierDefectiveParts: manualDraft.supplierDefectiveParts,
      internalDefectiveParts: manualDraft.internalDefectiveParts,
      auditInternalSystem: manualDraft.auditInternalSystem,
      auditCertification: manualDraft.auditCertification,
      auditProcess: manualDraft.auditProcess,
      auditProduct: manualDraft.auditProduct,
      deviationsInProgress: manualDraft.deviationsInProgress,
      deviationsCompleted: manualDraft.deviationsCompleted,
      poorQualityCosts: manualDraft.poorQualityCosts,
      warrantyCosts: manualDraft.warrantyCosts,
      recordedBy: manualDraft.recordedBy.trim(),
      onePagerLink: manualDraft.onePagerLink.trim() || undefined,
    };
    const next = [entry, ...manualEntries];
    persistManual(next);
    mergeManualIntoKpis(next);
    const historyEntry: UploadHistoryEntry = {
      id: makeId("manual"),
      uploadedAtIso: new Date().toISOString(),
      section: "complaints",
      files: [{ name: "Manual Form Entry", size: 0 }],
      summary: { month: entry.month, plant: entry.siteCode },
      usedIn: ["All KPI pages using qos-et-kpis (local)"],
      success: true,
      notes: "Manual KPI entry merged into qos-et-kpis",
    };
    persistHistory([historyEntry, ...history]);

    // Create comprehensive change history entry for manual form entry
    const timestamp = historyEntry.uploadedAtIso;
    const manualChangeHistory: ChangeHistoryEntry = {
      id: makeId("manual_change"),
      timestamp,
      editor: entry.recordedBy || "Unknown",
      recordId: `manual_${entry.month}_${entry.siteCode}`,
      recordType: "manual_entry",
      field: "all",
      oldValue: null,
      newValue: {
        month: entry.month,
        siteCode: entry.siteCode,
        siteName: entry.siteName,
        customerComplaintsQ1: entry.customerComplaintsQ1,
        supplierComplaintsQ2: entry.supplierComplaintsQ2,
        internalComplaintsQ3: entry.internalComplaintsQ3,
        customerDefectiveParts: entry.customerDefectiveParts,
        supplierDefectiveParts: entry.supplierDefectiveParts,
        internalDefectiveParts: entry.internalDefectiveParts,
        customerDeliveries: entry.customerDeliveries,
        supplierDeliveries: entry.supplierDeliveries,
        ppapInProgress: entry.ppapP?.inProgress || 0,
        ppapCompleted: entry.ppapP?.completed || 0,
        deviationsInProgress: entry.deviationsInProgress || 0,
        deviationsCompleted: entry.deviationsCompleted || 0,
        auditInternalSystem: entry.auditInternalSystem || 0,
        auditCertification: entry.auditCertification || 0,
        auditProcess: entry.auditProcess || 0,
        auditProduct: entry.auditProduct || 0,
        poorQualityCosts: entry.poorQualityCosts || 0,
        warrantyCosts: entry.warrantyCosts || 0,
      },
      reason: "Manual data entry via form",
      changeType: "new_entry",
      affectedMetrics: {
        metrics: [
          "Customer Complaints (Q1)",
          "Supplier Complaints (Q2)",
          "Internal Complaints (Q3)",
          "Customer Defective Parts",
          "Supplier Defective Parts",
          "Internal Defective Parts",
          "Customer Deliveries",
          "Supplier Deliveries",
          "PPAP In Progress",
          "PPAP Completed",
          "Deviations",
          "Audit Metrics",
          "Poor Quality Costs",
          "Warranty Costs",
        ],
        visualizations: [
          "Dashboard - All Metric Tiles",
          "Customer Performance Charts",
          "Supplier Performance Charts",
          "PPAP Charts",
          "Deviation Charts",
          "Audit Management Charts",
          "Cost Poor Quality Charts",
          "Warranty Costs Charts",
        ],
        pages: [
          "/dashboard",
          "/customer-performance",
          "/supplier-performance",
          "/ppaps",
          "/deviations",
          "/audit-management",
          "/cost-poor-quality",
          "/warranties-costs",
          "/ai-summary",
        ],
        calculations: [
          "Customer PPM = (Customer Defective Parts / Customer Deliveries) * 1,000,000",
          "Supplier PPM = (Supplier Defective Parts / Supplier Deliveries) * 1,000,000",
        ],
      },
      onePagerLink: entry.onePagerLink,
      dataDetails: {
        recordedBy: entry.recordedBy,
        onePagerLink: entry.onePagerLink,
        entryType: "manual_form",
      },
    };

    // Save change history for manual entry
    saveChangeHistory(historyEntry.id, [manualChangeHistory]);
    
    // Also add to any existing upload summary's change history if applicable
    const allSummaries = getAllUploadSummaries();
    if (allSummaries.length > 0) {
      // Add to the most recent summary or create a new one for manual entries
      const latestSummary = allSummaries[0];
      if (latestSummary) {
        latestSummary.changeHistory.push(manualChangeHistory);
        saveUploadSummary(latestSummary);
        setUploadSummaries(prev => new Map(prev).set(latestSummary.id, latestSummary));
      }
    }
  }

  async function uploadManualTemplate(file: File | null) {
    setManualUploadError(null);
    setManualUploadMessage(null);
    setManualUploadImportedRequiredFields([]);
    setManualUploadMissingRequiredFields([]);
    if (!file) return;

    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: "array", cellDates: false });
      const importedValues = extractManualDraftFromWorkbook(workbook);
      const importedKeys = Object.keys(importedValues) as Array<keyof ManualDraft>;
      const importedKeySet = new Set(importedKeys);

      if (importedKeys.length === 0) {
        throw new Error("No recognized field labels were found in the Excel file.");
      }

      const populatedRequired = MANUAL_UPLOAD_REQUIRED_FIELDS.filter((field) => importedKeySet.has(field));
      const missingRequired = MANUAL_UPLOAD_REQUIRED_FIELDS.filter((field) => !importedKeySet.has(field));
      setManualUploadImportedRequiredFields(populatedRequired);
      setManualUploadMissingRequiredFields(missingRequired);

      setManualDraft((previousDraft) => {
        const mergedDraft: ManualDraft = { ...previousDraft, ...importedValues };
        const trimmedSiteCode = mergedDraft.siteCode.trim();
        if (!mergedDraft.siteLocation.trim() && /^\d{3}$/.test(trimmedSiteCode)) {
          const plant = plantsData.find((item) => item.code === trimmedSiteCode);
          const autoLocation =
            plant?.location || plant?.city || plant?.abbreviation || plant?.country || plant?.name || "";
          mergedDraft.siteLocation = autoLocation;
        }
        return mergedDraft;
      });

      setManualUploadFileName(file.name);
      setManualUploadMessage(
        `Imported ${importedKeys.length} field value(s) from ${file.name}. Please review and then click Add Entry.`
      );
    } catch (error) {
      setManualUploadError(error instanceof Error ? error.message : "Failed to import Excel file.");
    } finally {
      if (manualUploadInputRef.current) manualUploadInputRef.current.value = "";
    }
  }

  function exportManualAndHistoryToExcel() {
    const wb = XLSX.utils.book_new();
    
    // Format timestamp helper
    const formatTimestamp = (iso: string) => {
      try {
        const date = new Date(iso);
        return new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(date);
      } catch {
        return iso;
      }
    };

    const historyRows = history.map((h) => ({
      "Upload Date & Time": formatTimestamp(h.uploadedAtIso),
      Section: h.section,
      Success: h.success ? "Yes" : "No",
      Files: h.files.map((f) => f.name).join("; "),
      Summary: JSON.stringify(h.summary),
      "Used In": h.usedIn.join("; "),
      Notes: h.notes || "",
    }));
    
    const manualRows = manualEntries.map((m) => ({
      "Entry Date & Time": m.recordedBy ? formatTimestamp(new Date().toISOString()) : "", // We don't store timestamp in manual entries, so use current time
      Month: m.month,
      Plant: m.siteCode,
      "City/Location": m.siteName || "",
      "Recorded By": m.recordedBy || "",
      "Link to OnePager": m.onePagerLink || "",
      "Customer Complaints (Q1)": m.customerComplaintsQ1,
      "Supplier Complaints (Q2)": m.supplierComplaintsQ2,
      "Internal Complaints (Q3)": m.internalComplaintsQ3,
      "Customer Defective Parts": m.customerDefectiveParts,
      "Supplier Defective Parts": m.supplierDefectiveParts,
      "Internal Defective Parts": m.internalDefectiveParts,
      "Customer Deliveries": m.customerDeliveries,
      "Supplier Deliveries": m.supplierDeliveries,
      "PPAP In Progress": m.ppapP?.inProgress ?? 0,
      "PPAP Completed": m.ppapP?.completed ?? 0,
      "Deviations Total": m.deviationsD,
      "Deviations In Progress": m.deviationsInProgress ?? 0,
      "Deviations Completed": m.deviationsCompleted ?? 0,
      "Audit Internal System": m.auditInternalSystem ?? 0,
      "Audit Certification": m.auditCertification ?? 0,
      "Audit Process": m.auditProcess ?? 0,
      "Audit Product": m.auditProduct ?? 0,
      "Poor Quality Costs": m.poorQualityCosts ?? 0,
      "Warranty Costs": m.warrantyCosts ?? 0,
    }));

    // Get all change history entries
    const allChangeHistory: ChangeHistoryEntry[] = [];
    Array.from(uploadSummaries.values()).forEach(summary => {
      allChangeHistory.push(...summary.changeHistory);
    });
    // Also get change history from manual entries
    history.forEach(h => {
      const changes = loadChangeHistory(h.id);
      allChangeHistory.push(...changes);
    });

    const changeHistoryRows = allChangeHistory.map((change) => ({
      "Date & Time": formatTimestamp(change.timestamp),
      "Recorded By": change.editor,
      "Record ID": change.recordId,
      "Record Type": change.recordType,
      Field: change.field,
      "Old Value": typeof change.oldValue === "object" ? JSON.stringify(change.oldValue) : String(change.oldValue || ""),
      "New Value": typeof change.newValue === "object" ? JSON.stringify(change.newValue) : String(change.newValue || ""),
      Reason: change.reason || "",
      "Change Type": change.changeType,
      "One-Pager Link": change.onePagerLink || "",
      "Affected Metrics": change.affectedMetrics.metrics.join("; "),
      "Affected Visualizations": change.affectedMetrics.visualizations.join("; "),
      "Affected Pages": change.affectedMetrics.pages.join("; "),
      "Affected Calculations": change.affectedMetrics.calculations.join("; "),
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historyRows), "Upload History");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(manualRows), "Manual Form Entries");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changeHistoryRows), "Change History");
    XLSX.writeFile(wb, `qos-et-data-export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  useEffect(() => {
    const loadRole = () => {
      const storedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as RoleKey | null) || "reader";
      setRole(storedRole);
      setHasRoleLoaded(true);
    };
    loadRole();
    const onRoleChanged = () => loadRole();
    window.addEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
    return () => window.removeEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
  }, []);

  if (!hasRoleLoaded) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.upload.title}</CardTitle>
            <CardDescription>{t.common.loading}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Preparing access permissions…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "reader") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.upload.accessDenied}</CardTitle>
            <CardDescription>
              {t.upload.accessDeniedDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t.upload.switchToEditor}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                {t.upload.backToDashboard}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.upload.title}</h2>
        <p className="text-muted-foreground">{t.upload.description}</p>
      </div>

      <input
        ref={manualUploadInputRef}
        type="file"
        accept=".xlsx,.xls,.XLSX,.XLS"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          void uploadManualTemplate(file);
        }}
      />

      <Tabs defaultValue="files" value={activeUploadTab} onValueChange={setActiveUploadTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="h-12 p-1.5 bg-muted/60 border border-border/60">
            <TabsTrigger
              value="files"
              className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              {t.upload.uploadFiles}
            </TabsTrigger>
            <TabsTrigger
              value="form"
              className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              {t.upload.enterData}
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              <Table2 className="h-4 w-4 mr-2" />
              Upload Summary
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              {t.upload.changeHistory}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {activeUploadTab === "form" && (
              <Button type="button" variant="outline" onClick={() => manualUploadInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel Into Form
              </Button>
            )}
            <Button variant="outline" onClick={exportManualAndHistoryToExcel}>
              <Download className="h-4 w-4 mr-2" />
              {t.upload.exportExcel}
            </Button>
          </div>
        </div>

        <TabsContent value="files" className="space-y-6">
      <Card>
        <CardHeader>
              <CardTitle>{t.upload.structuredUpload}</CardTitle>
              <CardDescription>{t.upload.structuredUploadDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(
                [
                  ["complaints", complaintsFiles],
                  ["deliveries", deliveriesFiles],
                  ["ppap", ppapFiles],
                  ["deviations", deviationFiles],
                  ["audit", auditFiles],
                  ["plants", plantsFiles],
                ] as Array<[UploadSectionKey, File[]]>
              ).map(([section, files]) => (
                <Card key={section} className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <span>{sectionMeta[section].title}</span>
                      {files.some((file) => file.size > LARGE_FILE_THRESHOLD_BYTES) && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/60 text-amber-700 dark:text-amber-300">
                          Large file mode active (client parse + chunk upload)
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{sectionMeta[section].help}</CardDescription>
        </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Hidden native input (OS/browser decides dialog language). We render our own translated button. */}
                      <input
                        ref={(el) => {
                          fileInputRefs.current[section] = el;
                        }}
                        type="file"
                        accept=".xlsx,.xls,.XLSX,.XLS"
                        multiple
                        className="hidden"
                        onChange={(e) => onSelectFiles(section, Array.from(e.target.files || []))}
                        disabled={uploading[section]}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className={[
                          "justify-start",
                          "border-[#00FF88]/60",
                          "bg-[#00FF88]/10 hover:bg-[#00FF88]/15",
                          "text-foreground",
                          files.length === 0 ? "ring-1 ring-[#00FF88]/25" : "",
                        ].join(" ")}
                        onClick={() => fileInputRefs.current[section]?.click()}
                        disabled={uploading[section]}
                        title={t.upload.step1SelectData}
                      >
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00FF88] text-black text-xs font-bold">
                          1
                        </span>
                        {t.upload.step1SelectData}
                      </Button>

                      <Button
                        onClick={() => uploadSection(section, files)}
                        disabled={uploading[section] || files.length === 0}
                        title={t.upload.step2Upload}
                      >
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs font-bold">
                          2
                        </span>
                        {uploading[section] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t.upload.uploading}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {t.upload.step2Upload}
                          </>
                        )}
                      </Button>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>
                          {files.length} {t.upload.filesSelected}
                        </span>
                      </div>
                    </div>

                    {errors[section] && (
                      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errors[section]}</div>
                    )}

                    {/* Upload progress */}
                    {progressBySection[section].status !== "idle" && (
                      <div className="rounded-md bg-muted/40 border border-border/60 p-3">
                        <div className="flex items-center justify-between gap-3 text-sm mb-2">
                          <div className="text-muted-foreground">
                            {progressBySection[section].status === "uploading"
                              ? t.upload.uploading
                              : progressBySection[section].status === "success"
                              ? t.upload.uploadCompleted
                              : t.upload.uploadFailed}
                  </div>
                          <div
                            className="font-medium"
                            style={{
                              color:
                                progressBySection[section].status === "success"
                                  ? "#00FF88"
                                  : progressBySection[section].status === "uploading"
                                  ? "rgba(0,255,136,0.8)"
                                  : "#ef4444",
                            }}
                          >
                            {progressBySection[section].percent}%
              </div>
            </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full transition-all duration-300 ease-out"
                            style={{
                              width: `${Math.min(progressBySection[section].percent, 100)}%`,
                              backgroundColor:
                                progressBySection[section].status === "success"
                                  ? "#00FF88"
                                  : progressBySection[section].status === "uploading"
                                  ? "rgba(0,255,136,0.5)"
                                  : "#ef4444",
                            }}
                />
              </div>
                      </div>
                    )}

                    {files.length > 0 && (
                <div className="space-y-2">
                        {files.map((f, idx) => (
                          <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[520px]">{f.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({formatGermanInt(Math.round(f.size / 1024))} KB)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {uploadedFileNamesBySection[section].includes(f.name) && progressBySection[section].status === "success" && (
                                <Check className="h-4 w-4" style={{ color: "#00FF88" }} />
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(section, idx)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{t.upload.usedIn}</span>
                      {sectionMeta[section].usedIn.map((u) => (
                        <Badge key={u} variant="secondary">
                          {u}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle>{t.upload.recalculateKpis}</CardTitle>
              <CardDescription>{t.upload.recalculateKpisDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={recalculateKpis} 
                disabled={!canCalculate || calculatingKpis}
                className={
                  canCalculate && !calculatingKpis
                    ? "bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-semibold"
                    : ""
                }
              >
                {calculatingKpis ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.upload.calculatingKpis || "Calculating KPIs..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t.upload.calculateKpis}
                  </>
                )}
              </Button>
              
              {/* KPI Calculation Progress */}
              {kpiCalculationProgress.status !== "idle" && (
                <div className="rounded-md bg-muted/40 border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm mb-2">
                    <div className="text-muted-foreground">
                      {kpiCalculationProgress.status === "calculating"
                        ? t.upload.calculatingKpis || "Calculating KPIs..."
                        : kpiCalculationProgress.status === "success"
                        ? t.upload.calculationCompleted || "Calculation completed"
                        : t.upload.calculationFailed || "Calculation failed"}
                    </div>
                    <div
                      className="font-medium"
                      style={{
                        color:
                          kpiCalculationProgress.status === "success"
                            ? "#00FF88"
                            : kpiCalculationProgress.status === "calculating"
                            ? "rgba(0,255,136,0.8)"
                            : "#ef4444",
                      }}
                    >
                      {kpiCalculationProgress.percent}%
                    </div>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full transition-all duration-300 ease-out"
                      style={{
                        width: `${Math.min(kpiCalculationProgress.percent, 100)}%`,
                        backgroundColor:
                          kpiCalculationProgress.status === "success"
                            ? "#00FF88"
                            : kpiCalculationProgress.status === "calculating"
                            ? "rgba(0,255,136,0.8)"
                            : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* KPI Calculation Results */}
              {kpisResult && kpiCalculationProgress.status === "success" && (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" style={{ color: "#00FF88" }} />
                    {t.upload.latestKpiCalculation}
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">{t.upload.complaints}</span> {formatGermanInt(kpisResult.summary.totalComplaints)}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{t.upload.deliveries}</span> {formatGermanInt(kpisResult.summary.totalDeliveries)}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{t.upload.siteMonthKpis}</span> {formatGermanInt(kpisResult.summary.siteMonthCombinations)}
                    </div>
                    {kpisResult.globalPpm && (
                      <>
                        <Separator className="my-2" />
                        <div>
                          <span className="font-medium text-foreground">Customer PPM:</span>{" "}
                          {kpisResult.globalPpm.customerPpm !== null
                            ? formatGermanInt(Math.round(kpisResult.globalPpm.customerPpm))
                            : "N/A"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Supplier PPM:</span>{" "}
                          {kpisResult.globalPpm.supplierPpm !== null
                            ? formatGermanInt(Math.round(kpisResult.globalPpm.supplierPpm))
                            : "N/A"}
                        </div>
                      </>
                    )}
                  </div>
                  <Separator className="my-2" />
                  <Button onClick={() => router.push("/dashboard")} className="bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-semibold w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t.upload.openDashboard}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.upload.manualDataEntry}</CardTitle>
              <CardDescription>
                {t.upload.manualDataEntryDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-dashed border-border/70 p-3 space-y-2">
                {manualUploadFileName && (
                  <div className="text-xs text-muted-foreground">Loaded file: {manualUploadFileName}</div>
                )}
                {manualUploadMessage && (
                  <p className="text-xs" style={{ color: "#00FF88" }}>
                    {manualUploadMessage}
                  </p>
                )}
                {manualUploadError && <p className="text-xs text-destructive">{manualUploadError}</p>}
                {(manualUploadImportedRequiredFields.length > 0 || manualUploadMissingRequiredFields.length > 0) && (
                  <div className="rounded-md border border-border/60 bg-muted/30 p-2 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Required fields imported:{" "}
                      <span className="font-medium text-foreground">
                        {manualUploadImportedRequiredFields.length}/{MANUAL_UPLOAD_REQUIRED_FIELDS.length}
                      </span>
                    </div>
                    {manualUploadMissingRequiredFields.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {manualUploadMissingRequiredFields.map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {MANUAL_DRAFT_FIELD_LABELS[field]}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs" style={{ color: "#00FF88" }}>
                        All required fields were populated from the upload.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>{t.upload.plant}</Label>
                  <Input
                    value={manualDraft.siteCode}
                    onChange={(e) => {
                      const nextCode = e.target.value;
                      const trimmed = nextCode.trim();
                      const plant = /^\d{3}$/.test(trimmed) ? plantsData.find((p) => p.code === trimmed) : undefined;
                      const auto =
                        plant?.location || plant?.city || plant?.abbreviation || plant?.country || plant?.name || "";
                      setManualDraft((p) => ({
                        ...p,
                        siteCode: nextCode,
                        siteLocation: plant ? auto : p.siteLocation,
                      }));
                    }}
                    placeholder="410"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.cityLocation}</Label>
                  <Input
                    value={manualDraft.siteLocation}
                    onChange={(e) => setManualDraft((p) => ({ ...p, siteLocation: e.target.value }))}
                    placeholder="Fenton"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.month}</Label>
                  <Select value={manualDraft.month} onValueChange={(v) => setManualDraft((p) => ({ ...p, month: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const now = new Date();
                        const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
                        const out: string[] = [];
                        for (const y of years) for (let m = 1; m <= 12; m++) out.push(`${y}-${String(m).padStart(2, "0")}`);
                        return out.filter(m => m && m.trim() !== ""); // Filter out empty strings
                      })().map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="recordedBy">
                    Name of Person Recording Data <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="recordedBy"
                    value={manualDraft.recordedBy}
                    onChange={(e) => setManualDraft((p) => ({ ...p, recordedBy: e.target.value }))}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="onePagerLink">Link to OnePager</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="onePagerLink"
                      type="url"
                      value={manualDraft.onePagerLink}
                      onChange={(e) => setManualDraft((p) => ({ ...p, onePagerLink: e.target.value }))}
                      placeholder="https://..."
                    />
                    {manualDraft.onePagerLink && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(manualDraft.onePagerLink, '_blank')}
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Link to folder where one-pager will be stored</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>{t.upload.customerComplaintsQ1}</Label>
                  <Input type="number" min="0" value={manualDraft.customerComplaintsQ1} onChange={(e) => setManualDraft((p) => ({ ...p, customerComplaintsQ1: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.supplierComplaintsQ2}</Label>
                  <Input type="number" min="0" value={manualDraft.supplierComplaintsQ2} onChange={(e) => setManualDraft((p) => ({ ...p, supplierComplaintsQ2: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.internalComplaintsQ3}</Label>
                  <Input type="number" min="0" value={manualDraft.internalComplaintsQ3} onChange={(e) => setManualDraft((p) => ({ ...p, internalComplaintsQ3: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>

                <div className="space-y-1.5">
                  <Label>{t.upload.customerDefectiveParts}</Label>
                  <Input type="number" min="0" value={manualDraft.customerDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, customerDefectiveParts: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.supplierDefectiveParts}</Label>
                  <Input type="number" min="0" value={manualDraft.supplierDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, supplierDefectiveParts: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.internalDefectiveParts}</Label>
                  <Input type="number" min="0" value={manualDraft.internalDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, internalDefectiveParts: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>

                <div className="space-y-1.5">
                  <Label>{t.upload.outboundDeliveries}</Label>
                  <Input type="number" min="0" value={manualDraft.customerDeliveries} onChange={(e) => setManualDraft((p) => ({ ...p, customerDeliveries: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.inboundDeliveries}</Label>
                  <Input type="number" min="0" value={manualDraft.supplierDeliveries} onChange={(e) => setManualDraft((p) => ({ ...p, supplierDeliveries: Math.max(0, Number(e.target.value) || 0) }))} />
            </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t.upload.ppapsInProgress}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={manualDraft.ppapInProgress}
                    onChange={(e) => setManualDraft((p) => ({ ...p, ppapInProgress: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.ppapsCompleted}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={manualDraft.ppapCompleted}
                    onChange={(e) => setManualDraft((p) => ({ ...p, ppapCompleted: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.deviationsInProgress}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={manualDraft.deviationsInProgress}
                    onChange={(e) => setManualDraft((p) => ({ ...p, deviationsInProgress: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.deviationsCompleted}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={manualDraft.deviationsCompleted}
                    onChange={(e) => setManualDraft((p) => ({ ...p, deviationsCompleted: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
                <div className="md:col-span-2 text-xs text-muted-foreground">
                  {t.upload.deviationsTotalNote}
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>{t.upload.auditsInternalSystem}</Label>
                  <Input type="number" min="0" value={manualDraft.auditInternalSystem} onChange={(e) => setManualDraft((p) => ({ ...p, auditInternalSystem: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.auditsCertification}</Label>
                  <Input type="number" min="0" value={manualDraft.auditCertification} onChange={(e) => setManualDraft((p) => ({ ...p, auditCertification: Math.max(0, Number(e.target.value) || 0) }))} />
                      </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.auditsProcess}</Label>
                  <Input type="number" min="0" value={manualDraft.auditProcess} onChange={(e) => setManualDraft((p) => ({ ...p, auditProcess: Math.max(0, Number(e.target.value) || 0) }))} />
                    </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.auditsProduct}</Label>
                  <Input type="number" min="0" value={manualDraft.auditProduct} onChange={(e) => setManualDraft((p) => ({ ...p, auditProduct: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
            </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t.upload.poorQualityCosts}</Label>
                  <Input type="number" min="0" value={manualDraft.poorQualityCosts} onChange={(e) => setManualDraft((p) => ({ ...p, poorQualityCosts: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.warrantyCosts}</Label>
                  <Input type="number" min="0" value={manualDraft.warrantyCosts} onChange={(e) => setManualDraft((p) => ({ ...p, warrantyCosts: Math.max(0, Number(e.target.value) || 0) }))} />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button 
                  onClick={addManualEntry}
                  disabled={!manualDraft.recordedBy.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.upload.addEntry}
                </Button>
                <Button
                  variant="outline"
                  onClick={exportManualAndHistoryToExcel}
                  disabled={manualEntries.length === 0 && history.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Form Data to Excel
                </Button>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">{t.upload.plantMustBe3Digits}</p>
                  {!manualDraft.recordedBy.trim() && (
                    <p className="text-xs text-destructive">Name of person recording data is required</p>
                  )}
                </div>
              </div>

              {manualEntries.length > 0 && (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium mb-2">{t.upload.manualEntries} ({manualEntries.length})</div>
                  <div className="space-y-2">
                    {manualEntries.slice(0, 10).map((m, idx) => (
                      <div key={`${m.month}-${m.siteCode}-${idx}`} className="flex items-center justify-between">
                        <div className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {m.siteCode}
                            {m.siteName ? ` (${m.siteName})` : ""}
                          </span>{" "}
                          • {m.month} • Q1 {m.customerComplaintsQ1} • Q2 {m.supplierComplaintsQ2} • Q3 {m.internalComplaintsQ3}
                    </div>
                    </div>
                    ))}
                    {manualEntries.length > 10 && (
                      <div className="text-xs text-muted-foreground">{t.upload.showingFirst10}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Summary</CardTitle>
              <CardDescription>
                Review imported data and correct any conversion issues. Changes are tracked in the change history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from(uploadSummaries.values()).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upload summaries available. Upload files to see the summary table.
                </div>
              ) : (
                Array.from(uploadSummaries.values())
                  .sort((a, b) => new Date(b.uploadedAtIso).getTime() - new Date(a.uploadedAtIso).getTime())
                  .map((summary) => (
                    <div key={summary.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {sectionMeta[summary.section]?.title || summary.section}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Uploaded: {new Date(summary.uploadedAtIso).toLocaleString("de-DE")}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {summary.summary.totalRecords} records
                          {summary.summary.recordsWithIssues > 0 && (
                            <span className="ml-2 text-amber-600">
                              • {summary.summary.recordsWithIssues} with issues
                            </span>
                          )}
                          {summary.summary.duplicateRecords && summary.summary.duplicateRecords > 0 && (
                            <span className="ml-2 text-sky-600">
                              • {summary.summary.duplicateRecords} {t.upload.duplicates}
                            </span>
                          )}
                        </Badge>
                      </div>
                      <UploadSummaryTable
                        summary={summary}
                        onSave={(updatedSummary, changes) => {
                          saveUploadSummary(updatedSummary);
                          saveChangeHistory(updatedSummary.id, changes);
                          setUploadSummaries(prev => new Map(prev).set(updatedSummary.id, updatedSummary));
                        }}
                        editorRole={role === "editor"}
                      />
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t.upload.historyTitle}
              </CardTitle>
              <CardDescription>{t.upload.historyDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.upload.noHistory}</p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 30).map((h) => (
                    <div key={h.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                            {sectionMeta[h.section]?.title || h.section}
                            {h.success && <CheckCircle2 className="h-4 w-4" style={{ color: "#00FF88" }} />}
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(h.uploadedAtIso).toLocaleString("de-DE")}</div>
                        </div>
                        <Badge variant="secondary">{h.section}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div><span className="font-medium text-foreground">{t.upload.files}</span> {h.files.map((f) => f.name).join("; ")}</div>
                        <div><span className="font-medium text-foreground">{t.upload.summary}</span> {JSON.stringify(h.summary)}</div>
                        <div><span className="font-medium text-foreground">{t.upload.usedIn}</span> {h.usedIn.join("; ")}</div>
                        {h.notes && <div><span className="font-medium text-foreground">{t.upload.notes}</span> {h.notes}</div>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
        </CardContent>
      </Card>

          {/* Change History Panel */}
          {(() => {
            // Collect all change history entries from upload summaries
            const allChanges: ChangeHistoryEntry[] = [];
            Array.from(uploadSummaries.values()).forEach(summary => {
              allChanges.push(...summary.changeHistory);
            });
            // Also get change history from manual entries and file uploads
            history.forEach(h => {
              const changes = loadChangeHistory(h.id);
              allChanges.push(...changes);
            });
            
            // Sort by timestamp (newest first)
            const sortedChanges = allChanges.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            return sortedChanges.length > 0 ? (
              <ChangeHistoryPanel changes={sortedChanges} />
            ) : null;
          })()}
        </TabsContent>
      </Tabs>

    </div>
  );
}
