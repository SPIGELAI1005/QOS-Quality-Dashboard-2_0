"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileSpreadsheet, X, CheckCircle2, ExternalLink, Plus, History, Download, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import * as XLSX from "xlsx";

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
        const json = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        if (xhr.status >= 200 && xhr.status < 300) resolve(json as T);
        else reject(new Error(json?.error || `Upload failed (HTTP ${xhr.status})`));
      } catch (e) {
        reject(new Error("Upload failed: invalid server response"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.send(formData);
  });
}

export default function UploadPage() {
  const router = useRouter();
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
  const [uploadedFileNamesBySection, setUploadedFileNamesBySection] = useState<Record<UploadSectionKey, string[]>>({
    complaints: [],
    deliveries: [],
    ppap: [],
    deviations: [],
    audit: [],
    plants: [],
  });

  const [manualEntries, setManualEntries] = useState<ManualKpiEntry[]>([]);
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
        title: "Customer & Supplier Complaints Files",
        help: "Upload complaint notifications (Q1/Q2/Q3). Multiple files supported.",
        usedIn: [
          "QOS ET Dashboard",
          "Customer Performance",
          "Supplier Performance",
          "Poor Quality Costs (Internal)",
        ],
      },
      deliveries: {
        title: "Customer & Supplier Deliveries Files",
        help: "Upload Outbound* (customer deliveries) and Inbound* (supplier deliveries). Multiple files supported.",
        usedIn: ["QOS ET Dashboard", "Customer Performance", "Supplier Performance"],
      },
      ppap: {
        title: "PPAP Notification Files",
        help: "Upload PPAP base + status extracts. Multiple files supported.",
        usedIn: ["PPAPs Overview"],
      },
      deviations: {
        title: "Deviation Notifications Files",
        help: "Upload Deviations base + status extracts. Multiple files supported.",
        usedIn: ["Deviations Overview"],
      },
      audit: {
        title: "Audit Management Files",
        help: "Upload audit source files (placeholder until parsing is implemented). Multiple files supported.",
        usedIn: ["Audit Management"],
      },
      plants: {
        title: "Plant Overview Files",
        help: "Upload the official plants list (e.g. Webasto ET Plants .xlsx). Multiple files supported.",
        usedIn: ["All pages (plant names/locations, legends, AI prompts)"],
      },
    } satisfies Record<UploadSectionKey, { title: string; help: string; usedIn: string[] }>;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedHistory = safeJsonParse<UploadHistoryEntry[]>(localStorage.getItem("qos-et-upload-history"));
    if (storedHistory) setHistory(storedHistory);

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
      const formData = new FormData();
      formData.append("fileType", section);
      files.forEach((f) => formData.append("files", f));
      const data = await postFormDataWithProgress<any>("/api/upload", formData, (pct) => {
        setProgressBySection((p) => ({ ...p, [section]: { percent: pct, status: "uploading" } }));
      });
      setProgressBySection((p) => ({ ...p, [section]: { percent: 100, status: "success" } }));
      setUploadedFileNamesBySection((p) => ({ ...p, [section]: files.map((f) => f.name) }));

      const summary: Record<string, string | number> = { files: files.length };
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
    try {
      const formData = new FormData();
      complaintsFiles.forEach((f) => formData.append("complaintsFiles", f));
      deliveriesFiles.forEach((f) => formData.append("deliveryFiles", f));
      const res = await fetch("/api/upload-kpis", { method: "POST", body: formData });
      const json = (await res.json()) as UploadKpisResponse & { error?: string };
      if (!res.ok) throw new Error(json?.error || `KPI calculation failed (HTTP ${res.status})`);

      setKpisResult(json);
      if (typeof window !== "undefined") {
        localStorage.setItem("qos-et-kpis", JSON.stringify(json.monthlySiteKpis));
        localStorage.setItem("qos-et-global-ppm", JSON.stringify(json.globalPpm));
        localStorage.setItem("qos-et-upload-kpis-result", JSON.stringify(json));
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
          totalComplaints: json.summary.totalComplaints,
          totalDeliveries: json.summary.totalDeliveries,
          siteMonthCombinations: json.summary.siteMonthCombinations,
        },
        usedIn: ["QOS ET Dashboard", "Customer Performance", "Supplier Performance", "AI Management Summary"],
        success: true,
        notes: "KPIs calculated and stored in localStorage as qos-et-kpis / qos-et-global-ppm",
      };
      persistHistory([entry, ...history]);
    } catch (e) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Data</h2>
        <p className="text-muted-foreground">Structured upload + manual entry for the charts and KPI pages.</p>
      </div>

      <Tabs defaultValue="files">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="h-12 p-1.5 bg-muted/60 border border-border/60">
            <TabsTrigger
              value="files"
              className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              Upload Files
            </TabsTrigger>
            <TabsTrigger
              value="form"
              className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              Enter Data (Form)
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              Change History
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={exportManualAndHistoryToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export (Excel)
          </Button>
        </div>

        <TabsContent value="files" className="space-y-6">
      <Card>
        <CardHeader>
              <CardTitle>Structured Upload</CardTitle>
              <CardDescription>Upload files by category so the correct pages/charts can be built reliably.</CardDescription>
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
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                        <span>{files.length} file(s)</span>
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
                              ? "Uploading…"
                              : progressBySection[section].status === "success"
                              ? "Upload completed"
                              : "Upload failed"}
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
                      <span className="text-xs text-muted-foreground">Used in:</span>
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
              <CardTitle>Recalculate KPIs (Complaints + Deliveries)</CardTitle>
              <CardDescription>When both categories are uploaded, compute KPIs and update the dashboard dataset.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={recalculateKpis} disabled={complaintsFiles.length === 0 || deliveriesFiles.length === 0}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Calculate KPIs
              </Button>
              {kpisResult && (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">Latest KPI Calculation</div>
                  <div>Complaints: {formatGermanInt(kpisResult.summary.totalComplaints)}</div>
                  <div>Deliveries: {formatGermanInt(kpisResult.summary.totalDeliveries)}</div>
                  <div>Site-month KPIs: {formatGermanInt(kpisResult.summary.siteMonthCombinations)}</div>
                  <Separator className="my-2" />
                  <Button onClick={() => router.push("/dashboard")} className="bg-[#00FF00] hover:bg-[#00FF00]/90 text-black font-semibold">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open QOS ET Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Data Entry (Template)</CardTitle>
              <CardDescription>
                Enter monthly values per plant. These entries are persisted and merged into the local KPI dataset (`qos-et-kpis`).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Plant (3-digit)</Label>
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
                  <Label>City/Location</Label>
                  <Input
                    value={manualDraft.siteLocation}
                    onChange={(e) => setManualDraft((p) => ({ ...p, siteLocation: e.target.value }))}
                    placeholder="Fenton"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Month</Label>
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
                        return out;
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
                  <Label>Customer Complaints (Q1)</Label>
                  <Input type="number" value={manualDraft.customerComplaintsQ1} onChange={(e) => setManualDraft((p) => ({ ...p, customerComplaintsQ1: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Supplier Complaints (Q2)</Label>
                  <Input type="number" value={manualDraft.supplierComplaintsQ2} onChange={(e) => setManualDraft((p) => ({ ...p, supplierComplaintsQ2: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Internal Complaints (Q3)</Label>
                  <Input type="number" value={manualDraft.internalComplaintsQ3} onChange={(e) => setManualDraft((p) => ({ ...p, internalComplaintsQ3: Number(e.target.value) }))} />
                </div>

                <div className="space-y-1.5">
                  <Label>Customer Defective Parts</Label>
                  <Input type="number" value={manualDraft.customerDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, customerDefectiveParts: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Supplier Defective Parts</Label>
                  <Input type="number" value={manualDraft.supplierDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, supplierDefectiveParts: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Internal Defective Parts</Label>
                  <Input type="number" value={manualDraft.internalDefectiveParts} onChange={(e) => setManualDraft((p) => ({ ...p, internalDefectiveParts: Number(e.target.value) }))} />
                </div>

                <div className="space-y-1.5">
                  <Label>Outbound Deliveries (Customer)</Label>
                  <Input type="number" value={manualDraft.customerDeliveries} onChange={(e) => setManualDraft((p) => ({ ...p, customerDeliveries: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Inbound Deliveries (Supplier)</Label>
                  <Input type="number" value={manualDraft.supplierDeliveries} onChange={(e) => setManualDraft((p) => ({ ...p, supplierDeliveries: Number(e.target.value) }))} />
            </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>PPAPs In Progress</Label>
                  <Input
                    type="number"
                    value={manualDraft.ppapInProgress}
                    onChange={(e) => setManualDraft((p) => ({ ...p, ppapInProgress: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>PPAPs Completed</Label>
                  <Input
                    type="number"
                    value={manualDraft.ppapCompleted}
                    onChange={(e) => setManualDraft((p) => ({ ...p, ppapCompleted: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Deviations In Progress</Label>
                  <Input
                    type="number"
                    value={manualDraft.deviationsInProgress}
                    onChange={(e) => setManualDraft((p) => ({ ...p, deviationsInProgress: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Deviations Completed</Label>
                  <Input
                    type="number"
                    value={manualDraft.deviationsCompleted}
                    onChange={(e) => setManualDraft((p) => ({ ...p, deviationsCompleted: Number(e.target.value) }))}
                  />
                </div>
                <div className="md:col-span-2 text-xs text-muted-foreground">
                  Deviations total used by KPIs = In Progress + Completed.
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Audits: Internal System</Label>
                  <Input type="number" value={manualDraft.auditInternalSystem} onChange={(e) => setManualDraft((p) => ({ ...p, auditInternalSystem: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Audits: Certification</Label>
                  <Input type="number" value={manualDraft.auditCertification} onChange={(e) => setManualDraft((p) => ({ ...p, auditCertification: Number(e.target.value) }))} />
                      </div>
                <div className="space-y-1.5">
                  <Label>Audits: Process</Label>
                  <Input type="number" value={manualDraft.auditProcess} onChange={(e) => setManualDraft((p) => ({ ...p, auditProcess: Number(e.target.value) }))} />
                    </div>
                <div className="space-y-1.5">
                  <Label>Audits: Product</Label>
                  <Input type="number" value={manualDraft.auditProduct} onChange={(e) => setManualDraft((p) => ({ ...p, auditProduct: Number(e.target.value) }))} />
                </div>
            </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Poor Quality Costs (template)</Label>
                  <Input type="number" value={manualDraft.poorQualityCosts} onChange={(e) => setManualDraft((p) => ({ ...p, poorQualityCosts: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Warranty Costs (template)</Label>
                  <Input type="number" value={manualDraft.warrantyCosts} onChange={(e) => setManualDraft((p) => ({ ...p, warrantyCosts: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={addManualEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
                <p className="text-xs text-muted-foreground">Plant must be a 3-digit code (e.g., 410).</p>
                  </div>

              {manualEntries.length > 0 && (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium mb-2">Manual Entries ({manualEntries.length})</div>
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
                      <div className="text-xs text-muted-foreground">Showing first 10 entries. Export to Excel to view all.</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Change History
              </CardTitle>
              <CardDescription>Every upload and manual entry is logged with timestamp, record counts, and usage references.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet.</p>
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
                        <div><span className="font-medium text-foreground">Files:</span> {h.files.map((f) => f.name).join("; ")}</div>
                        <div><span className="font-medium text-foreground">Summary:</span> {JSON.stringify(h.summary)}</div>
                        <div><span className="font-medium text-foreground">Used in:</span> {h.usedIn.join("; ")}</div>
                        {h.notes && <div><span className="font-medium text-foreground">Notes:</span> {h.notes}</div>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
