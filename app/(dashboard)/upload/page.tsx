"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { MonthlySiteKpi } from "@/lib/domain/types";
import * as XLSX from "xlsx";
import { ROLE_CHANGED_EVENT, ROLE_STORAGE_KEY, type RoleKey } from "@/lib/auth/roles";
import { dispatchKpiDataUpdated } from "@/lib/data/events";
import { UploadSummaryTable } from "@/components/upload/upload-summary-table";
import { ChangeHistoryPanel } from "@/components/upload/change-history-panel";
import type { UploadSummaryEntry, ChangeHistoryEntry } from "@/lib/data/uploadSummary";
import { saveUploadSummary, loadUploadSummary, saveChangeHistory, loadChangeHistory } from "@/lib/data/uploadSummary";
import { applyComplaintCorrections, applyDeliveryCorrections } from "@/lib/data/correctedData";
import type { Complaint } from "@/lib/domain/types";

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
}

interface PlantData {
  code: string;
  name: string;
  city?: string;
  location?: string;
  abbreviation?: string;
  country?: string;
}

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

export default function UploadPage() {
  const { t } = useTranslation();
  const router = useRouter();
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

  // Check if complaints and deliveries are successfully uploaded
  const complaintsUploaded = useMemo(
    () => progressBySection.complaints.status === "success" && complaintsFiles.length > 0,
    [progressBySection.complaints.status, complaintsFiles.length]
  );
  const deliveriesUploaded = useMemo(
    () => progressBySection.deliveries.status === "success" && deliveriesFiles.length > 0,
    [progressBySection.deliveries.status, deliveriesFiles.length]
  );
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
  const [manualDraft, setManualDraft] = useState<{
    month: string;
    siteCode: string;
    siteLocation: string;
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
  }>({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    siteCode: "",
    siteLocation: "",
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
      // Check total file size and implement chunked uploads for large payloads
      const MAX_FILES_PER_BATCH = 3; // Upload max 3 files at a time to avoid 413 errors
      const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4MB limit per batch (conservative for Vercel Hobby)
      
      let totalSize = files.reduce((sum, f) => sum + f.size, 0);
      let needsChunking = files.length > MAX_FILES_PER_BATCH || totalSize > MAX_TOTAL_SIZE;
      
      let allResults: any = {
        complaints: [],
        deliveries: [],
        plants: [],
        ppaps: [],
        deviations: [],
        errors: [],
      };
      
      if (needsChunking && files.length > MAX_FILES_PER_BATCH) {
        // Upload files in batches
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
            // Calculate progress: previous batches + current batch progress
            const baseProgress = (batchIndex / batches.length) * 100;
            const batchProgress = (pct / batches.length);
            setProgressBySection((p) => ({ ...p, [section]: { percent: Math.round(baseProgress + batchProgress), status: "uploading" } }));
          };
          
          const batchData = await postFormDataWithProgress<any>("/api/upload", formData, batchProgress);
          
          // Merge results
          if (batchData.complaints) allResults.complaints.push(...(batchData.complaints || []));
          if (batchData.deliveries) allResults.deliveries.push(...(batchData.deliveries || []));
          if (batchData.plants) allResults.plants.push(...(batchData.plants || []));
          if (batchData.ppaps) allResults.ppaps.push(...(batchData.ppaps || []));
          if (batchData.deviations) allResults.deviations.push(...(batchData.deviations || []));
          if (batchData.errors) allResults.errors.push(...(batchData.errors || []));
        }
      } else {
        // Single batch upload
        const formData = new FormData();
        formData.append("fileType", section);
        files.forEach((f) => formData.append("files", f));
        const data = await postFormDataWithProgress<any>("/api/upload", formData, (pct) => {
          setProgressBySection((p) => ({ ...p, [section]: { percent: pct, status: "uploading" } }));
        });
        
        // Copy results
        if (data.complaints) allResults.complaints = data.complaints;
        if (data.deliveries) allResults.deliveries = data.deliveries;
        if (data.plants) allResults.plants = data.plants;
        if (data.ppaps) allResults.ppaps = data.ppaps;
        if (data.deviations) allResults.deviations = data.deviations;
        if (data.errors) allResults.errors = data.errors;
      }
      
      setProgressBySection((p) => ({ ...p, [section]: { percent: 100, status: "success" } }));
      setUploadedFileNamesBySection((p) => ({ ...p, [section]: files.map((f) => f.name) }));
      
      // Use merged results
      const data = allResults;

      const summary: Record<string, string | number> = { files: files.length };
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

        // Create upload summary with conversion status
        const complaints = items as Complaint[];
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

      // Create and save upload summary for complaints
      if (section === "complaints" && conversionStatus.length > 0) {
        const complaints = Array.isArray(data?.complaints) ? (data.complaints as Complaint[]) : [];
        const uploadSummary: UploadSummaryEntry = {
          id: entry.id,
          uploadedAtIso: entry.uploadedAtIso,
          section: "complaints",
          files: entry.files,
          rawData: { complaints },
          processedData: { complaints },
          conversionStatus: { complaints: conversionStatus },
          changeHistory: [],
          summary: {
            totalRecords: complaints.length,
            recordsWithIssues: conversionStatus.filter(s => s.status === "failed" || s.status === "needs_attention").length,
            recordsCorrected: 0,
            recordsUnchanged: complaints.length,
          },
        };

        saveUploadSummary(uploadSummary);
        setUploadSummaries(prev => new Map(prev).set(entry.id, uploadSummary));
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

  async function recalculateKpis() {
    setErrors((prev) => ({ ...prev, complaints: null, deliveries: null }));
    if (complaintsFiles.length === 0 || deliveriesFiles.length === 0) {
      setErrors((prev) => ({
        ...prev,
        deliveries: "To calculate KPIs, please upload at least one complaints file and one deliveries file.",
      }));
      return;
    }
    
    setCalculatingKpis(true);
    setKpiCalculationProgress({ percent: 0, status: "calculating" });
    
    try {
      const formData = new FormData();
      complaintsFiles.forEach((f) => formData.append("complaintsFiles", f));
      deliveriesFiles.forEach((f) => formData.append("deliveryFiles", f));
      
      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<UploadKpisResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload-kpis");
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            // Upload progress: 0-50%
            const uploadPercent = Math.round((e.loaded / e.total) * 50);
            setKpiCalculationProgress({ percent: uploadPercent, status: "calculating" });
          }
        };
        
        xhr.onload = () => {
          try {
            // Processing progress: 50-100%
            setKpiCalculationProgress({ percent: 75, status: "calculating" });
            
            const contentType = xhr.getResponseHeader("content-type") || "";
            if (!contentType.includes("application/json")) {
              reject(new Error(`KPI calculation failed: Server returned non-JSON response (HTTP ${xhr.status}). This may indicate a timeout or server error.`));
              return;
            }
            
            const json = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            if (xhr.status >= 200 && xhr.status < 300) {
              setKpiCalculationProgress({ percent: 100, status: "success" });
              resolve(json as UploadKpisResponse);
            } else {
              reject(new Error(json?.error || `KPI calculation failed (HTTP ${xhr.status})`));
            }
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "Unknown error";
            reject(new Error(`KPI calculation failed: ${errorMsg}`));
          }
        };
        
        xhr.onerror = () => reject(new Error("KPI calculation failed: network error"));
        xhr.send(formData);
      });

      setKpisResult(result);
      if (typeof window !== "undefined") {
        localStorage.setItem("qos-et-kpis", JSON.stringify(result.monthlySiteKpis));
        localStorage.setItem("qos-et-global-ppm", JSON.stringify(result.globalPpm));
        localStorage.setItem("qos-et-upload-kpis-result", JSON.stringify(result));
        // Notify other components that KPI data has been updated
        dispatchKpiDataUpdated();
      }

      const entry: UploadHistoryEntry = {
        id: makeId("kpis"),
        uploadedAtIso: new Date().toISOString(),
        section: "deliveries",
        files: [
          ...complaintsFiles.map((f) => ({ name: f.name, size: f.size })),
          ...deliveriesFiles.map((f) => ({ name: f.name, size: f.size })),
        ],
        summary: {
          totalComplaints: result.summary.totalComplaints,
          totalDeliveries: result.summary.totalDeliveries,
          siteMonthCombinations: result.summary.siteMonthCombinations,
        },
        usedIn: ["QOS ET Dashboard", "Customer Performance", "Supplier Performance", "AI Management Summary"],
        success: true,
        notes: "KPIs calculated and stored in localStorage as qos-et-kpis / qos-et-global-ppm",
      };
      persistHistory([entry, ...history]);
    } catch (e) {
      setKpiCalculationProgress({ percent: 0, status: "error" });
      setErrors((prev) => ({ ...prev, deliveries: e instanceof Error ? e.message : "Failed to calculate KPIs." }));
      const entry: UploadHistoryEntry = {
        id: makeId("kpis_error"),
        uploadedAtIso: new Date().toISOString(),
        section: "deliveries",
        files: [
          ...complaintsFiles.map((f) => ({ name: f.name, size: f.size })),
          ...deliveriesFiles.map((f) => ({ name: f.name, size: f.size })),
        ],
        summary: { note: "KPI calculation failed" },
        usedIn: ["QOS ET Dashboard", "Customer Performance", "Supplier Performance", "AI Management Summary"],
        success: false,
        notes: e instanceof Error ? e.message : "Failed to calculate KPIs.",
      };
      persistHistory([entry, ...history]);
    } finally {
      setCalculatingKpis(false);
    }
  }

  function mergeManualIntoKpis(manual: ManualKpiEntry[]) {
    if (typeof window === "undefined") return;
    const existing = safeJsonParse<MonthlySiteKpi[]>(localStorage.getItem("qos-et-kpis")) || [];
    const byKey = new Map(existing.map((k) => [`${k.month}__${k.siteCode}`, k] as const));
    for (const m of manual) byKey.set(`${m.month}__${m.siteCode}`, m);
    const merged = Array.from(byKey.values()).sort((a, b) => a.month.localeCompare(b.month) || a.siteCode.localeCompare(b.siteCode));
    localStorage.setItem("qos-et-kpis", JSON.stringify(merged));
  }

  function addManualEntry() {
    const site = manualDraft.siteCode.trim();
    if (!/^\d{3}$/.test(site)) return;
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
  }

  function exportManualAndHistoryToExcel() {
    const wb = XLSX.utils.book_new();
    const historyRows = history.map((h) => ({
      uploadedAt: h.uploadedAtIso,
      section: h.section,
      success: h.success ? "yes" : "no",
      files: h.files.map((f) => f.name).join("; "),
      summary: JSON.stringify(h.summary),
      usedIn: h.usedIn.join("; "),
      notes: h.notes || "",
    }));
    const manualRows = manualEntries.map((m) => ({
      month: m.month,
      plant: m.siteCode,
      cityLocation: m.siteName || "",
      customerComplaintsQ1: m.customerComplaintsQ1,
      supplierComplaintsQ2: m.supplierComplaintsQ2,
      internalComplaintsQ3: m.internalComplaintsQ3,
      customerDefectiveParts: m.customerDefectiveParts,
      supplierDefectiveParts: m.supplierDefectiveParts,
      internalDefectiveParts: m.internalDefectiveParts,
      customerDeliveries: m.customerDeliveries,
      supplierDeliveries: m.supplierDeliveries,
      ppapInProgress: m.ppapP?.inProgress ?? 0,
      ppapCompleted: m.ppapP?.completed ?? 0,
      deviationsD: m.deviationsD,
      deviationsInProgress: m.deviationsInProgress ?? 0,
      deviationsCompleted: m.deviationsCompleted ?? 0,
      auditInternalSystem: m.auditInternalSystem ?? 0,
      auditCertification: m.auditCertification ?? 0,
      auditProcess: m.auditProcess ?? 0,
      auditProduct: m.auditProduct ?? 0,
      poorQualityCosts: m.poorQualityCosts ?? 0,
      warrantyCosts: m.warrantyCosts ?? 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historyRows), "UploadHistory");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(manualRows), "ManualKpis");
    XLSX.writeFile(wb, `qos-et-manual-and-history_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

      <Tabs defaultValue="files">
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
          <Button variant="outline" onClick={exportManualAndHistoryToExcel}>
            <Download className="h-4 w-4 mr-2" />
            {t.upload.exportExcel}
          </Button>
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
                    <CardTitle className="text-base">{sectionMeta[section].title}</CardTitle>
                    <CardDescription>{sectionMeta[section].help}</CardDescription>
        </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                <Input
                  type="file"
                        accept=".xlsx,.xls,.XLSX,.XLS"
                        multiple
                        onChange={(e) => onSelectFiles(section, Array.from(e.target.files || []))}
                        disabled={uploading[section]}
                      />
                      <Button
                        onClick={() => uploadSection(section, files)}
                        disabled={uploading[section] || files.length === 0}
                      >
                        {uploading[section] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t.upload.uploading}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {t.upload.uploadButton}
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                        <span>{files.length} {t.upload.filesSelected}</span>
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
                      <span className="font-medium text-foreground">{t.upload.complaints}:</span> {formatGermanInt(kpisResult.summary.totalComplaints)}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{t.upload.deliveries}:</span> {formatGermanInt(kpisResult.summary.totalDeliveries)}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{t.upload.siteMonthKpis}:</span> {formatGermanInt(kpisResult.summary.siteMonthCombinations)}
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

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>{t.upload.customerComplaintsQ1}</Label>
                  <Input type="number" value={manualDraft.customerComplaintsQ1} onChange={(e) => setManualDraft((p) => ({ ...p, customerComplaintsQ1: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.supplierComplaintsQ2}</Label>
                  <Input type="number" value={manualDraft.supplierComplaintsQ2} onChange={(e) => setManualDraft((p) => ({ ...p, supplierComplaintsQ2: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.internalComplaintsQ3}</Label>
                  <Input type="number" value={manualDraft.internalComplaintsQ3} onChange={(e) => setManualDraft((p) => ({ ...p, internalComplaintsQ3: Number(e.target.value) }))} />
                </div>

                <div className="space-y-1.5">
                  <Label>{t.upload.customerDefectiveParts}</Label>
                  <Input type="number" value={manualDraft.customerDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, customerDefectiveParts: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.supplierDefectiveParts}</Label>
                  <Input type="number" value={manualDraft.supplierDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, supplierDefectiveParts: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.internalDefectiveParts}</Label>
                  <Input type="number" value={manualDraft.internalDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, internalDefectiveParts: Number(e.target.value) }))} />
                </div>

                <div className="space-y-1.5">
                  <Label>{t.upload.outboundDeliveries}</Label>
                  <Input type="number" value={manualDraft.customerDeliveries} onChange={(e) => setManualDraft((p) => ({ ...p, customerDeliveries: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.inboundDeliveries}</Label>
                  <Input type="number" value={manualDraft.supplierDeliveries} onChange={(e) => setManualDraft((p) => ({ ...p, supplierDeliveries: Number(e.target.value) }))} />
            </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t.upload.ppapsInProgress}</Label>
                  <Input
                    type="number"
                    value={manualDraft.ppapInProgress}
                    onChange={(e) => setManualDraft((p) => ({ ...p, ppapInProgress: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.ppapsCompleted}</Label>
                  <Input
                    type="number"
                    value={manualDraft.ppapCompleted}
                    onChange={(e) => setManualDraft((p) => ({ ...p, ppapCompleted: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.deviationsInProgress}</Label>
                  <Input
                    type="number"
                    value={manualDraft.deviationsInProgress}
                    onChange={(e) => setManualDraft((p) => ({ ...p, deviationsInProgress: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.deviationsCompleted}</Label>
                  <Input
                    type="number"
                    value={manualDraft.deviationsCompleted}
                    onChange={(e) => setManualDraft((p) => ({ ...p, deviationsCompleted: Number(e.target.value) }))}
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
                  <Input type="number" value={manualDraft.auditInternalSystem} onChange={(e) => setManualDraft((p) => ({ ...p, auditInternalSystem: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.auditsCertification}</Label>
                  <Input type="number" value={manualDraft.auditCertification} onChange={(e) => setManualDraft((p) => ({ ...p, auditCertification: Number(e.target.value) }))} />
                      </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.auditsProcess}</Label>
                  <Input type="number" value={manualDraft.auditProcess} onChange={(e) => setManualDraft((p) => ({ ...p, auditProcess: Number(e.target.value) }))} />
                    </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.auditsProduct}</Label>
                  <Input type="number" value={manualDraft.auditProduct} onChange={(e) => setManualDraft((p) => ({ ...p, auditProduct: Number(e.target.value) }))} />
                </div>
            </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t.upload.poorQualityCosts}</Label>
                  <Input type="number" value={manualDraft.poorQualityCosts} onChange={(e) => setManualDraft((p) => ({ ...p, poorQualityCosts: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.upload.warrantyCosts}</Label>
                  <Input type="number" value={manualDraft.warrantyCosts} onChange={(e) => setManualDraft((p) => ({ ...p, warrantyCosts: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={addManualEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.upload.addEntry}
                </Button>
                <p className="text-xs text-muted-foreground">{t.upload.plantMustBe3Digits}</p>
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
          {Array.from(uploadSummaries.values()).some(s => s.changeHistory.length > 0) && (
            <ChangeHistoryPanel
              changes={Array.from(uploadSummaries.values()).flatMap(s => s.changeHistory)}
            />
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
