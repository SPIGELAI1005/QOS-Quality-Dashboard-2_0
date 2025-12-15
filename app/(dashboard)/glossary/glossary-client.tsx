"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ExternalLink, HelpCircle, Mail, Sparkles, ListChecks, BookOpen, Link2, Download, Check } from "lucide-react";

type UploadSectionKey = "complaints" | "deliveries" | "ppap" | "deviations" | "audit" | "plants";

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

interface GlossaryItem {
  term: string;
  definition: string;
  category:
    | "Navigation"
    | "Data Sources"
    | "Notifications"
    | "Metrics"
    | "Charts & Views"
    | "AI"
    | "General";
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("de-DE");
  } catch {
    return iso;
  }
}

function buildMailtoHref(args: { to: string; subject: string; body: string }): string {
  const q = new URLSearchParams();
  q.set("subject", args.subject);
  q.set("body", args.body);
  return `mailto:${args.to}?${q.toString()}`;
}

export function GlossaryClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<string | undefined>(undefined);
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  const faqs = useMemo(
    () => [
      {
        q: "Where do I upload the data files used by the dashboards?",
        a: "Go to Upload Data. Use the structured upload sections (Complaints, Deliveries, PPAP, Deviations, Plants). After upload, you can calculate KPIs and the report pages will read from the KPI dataset.",
      },
      {
        q: "Which files are the source of truth for complaints and PPM?",
        a: "Complaints and defective parts are taken from the Q Cockpit complaints extract. Deliveries are taken from Outbound (customer deliveries) and Inbound (supplier deliveries) files. PPM is derived from defective parts and deliveries.",
      },
      {
        q: "How is Customer PPM calculated?",
        a: "Customer PPM = (Customer Defective Parts / Customer Deliveries) × 1,000,000 for the selected plants and time window.",
      },
      {
        q: "How is Supplier PPM calculated?",
        a: "Supplier PPM = (Supplier Defective Parts / Supplier Deliveries) × 1,000,000 for the selected plants and time window.",
      },
      {
        q: "What do Q1, Q2, and Q3 mean?",
        a: "Q1 = Customer complaints, Q2 = Supplier complaints, Q3 = Internal complaints. They represent different notification categories and drive different charts/metrics.",
      },
      {
        q: "What do D1, D2, D3 represent on the Deviations page?",
        a: "D1/D2/D3 are deviation notification types. The Deviations Overview page shows counts by month and plant, and a status view (Closed vs In Progress).",
      },
      {
        q: "What do P1, P2, P3 represent on the PPAPs page?",
        a: "P1/P2/P3 are PPAP notification types. The PPAPs Overview page shows PPAP counts by month/plant and a status view (Closed vs In Progress).",
      },
      {
        q: "Why do charts show a 12-month lookback even when the page says YTD?",
        a: "The selector uses a 12-month lookback ending at the selected month/year to provide a consistent trend window across pages. The page title keeps “YTD //” for consistency with the dashboard naming.",
      },
      {
        q: "How does plant filtering work?",
        a: "The global filter panel (right sidebar) filters most content. Some charts also support local chart-only filtering via clicking on the legend (it affects only that chart).",
      },
      {
        q: "Why do some legends show plant code plus city/location?",
        a: "Plant names are enriched from the official Plant Overview file so users can recognize sites by city/location (e.g., “410 (Fenton)”).",
      },
      {
        q: "What does “Fixed Y-axis scale” mean on certain charts?",
        a: "When a chart supports local filtering by plant, the Y-axis max is computed from the unfiltered dataset to prevent the scale from changing after selecting a plant.",
      },
      {
        q: "Why does the AI Summary sometimes show an error?",
        a: "AI Summary depends on the configured AI provider/key and the current filtered dataset. If the provider rejects the request (API key, rate limit, network), the UI shows a structured explanation and suggested fixes.",
      },
      {
        q: "Does AI Summary use the same plant labels as the dashboard?",
        a: "Yes. The AI prompt is instructed to mention plant code and city/location when referencing a site, based on the official plant list.",
      },
      {
        q: "What is the Data Lineage page for?",
        a: "It documents which data sources feed which parsers/APIs, what outputs are produced, and where those outputs are used (pages/charts). It also reflects last upload timestamps from Upload History when available.",
      },
      {
        q: "How do I report an issue?",
        a: "Use the Contact button on this page. It opens an email with a template including issue title and helpful context (page, timestamp, last uploads).",
      },
    ],
    []
  );

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return faqs.map((f, idx) => ({ ...f, id: `faq-${idx}` }));
    return faqs
      .map((f, idx) => ({ ...f, id: `faq-${idx}` }))
      .filter((f) => `${f.q}\n${f.a}`.toLowerCase().includes(q));
  }, [faqs, searchQuery]);

  const glossary = useMemo<GlossaryItem[]>(
    () => [
      { category: "Navigation", term: "QOS ET Dashboard", definition: "Main dashboard aggregating customer/supplier/internal metrics and charts across the selected time window." },
      { category: "Navigation", term: "Customer Performance", definition: "Customer-only view (Q1 + customer deliveries/PPM) with customer-related charts and tables." },
      { category: "Navigation", term: "Supplier Performance", definition: "Supplier-only view (Q2 + supplier deliveries/PPM) with supplier-related charts and tables." },
      { category: "Navigation", term: "Upload Data", definition: "Structured file upload and manual entry page. Also provides KPI recalculation and change history." },
      { category: "Navigation", term: "Data Lineage", definition: "Catalog view that maps data sources → processing → outputs → pages/charts." },

      { category: "Data Sources", term: "Complaints extract (Q Cockpit)", definition: "Excel export containing quality notifications (Q1/Q2/Q3) including defective parts and plant references." },
      { category: "Data Sources", term: "Outbound deliveries files", definition: "Excel extracts containing customer deliveries by plant/date. Used as denominator for Customer PPM." },
      { category: "Data Sources", term: "Inbound deliveries files", definition: "Excel extracts containing supplier deliveries by plant/date. Used as denominator for Supplier PPM." },
      { category: "Data Sources", term: "Plant master data (Webasto ET Plants)", definition: "Official plant code-to-location mapping used across filters, legends, and AI prompts." },
      { category: "Data Sources", term: "PPAP base + status extracts", definition: "Two Excel files: a notification list + a status list used to classify PPAP status." },
      { category: "Data Sources", term: "Deviations base + status extracts", definition: "Two Excel files: a deviation notification list + a status list used to classify deviation status." },

      { category: "Notifications", term: "Notification Number", definition: "Unique identifier for each SAP quality notification." },
      { category: "Notifications", term: "Notification Type", definition: "SAP notification classification: Q1/Q2/Q3 (complaints), D1/D2/D3 (deviations), P1/P2/P3 (PPAP)." },
      { category: "Notifications", term: "Q1 (Customer Complaint)", definition: "Customer-originated quality notifications; contributes to customer complaints and Customer PPM." },
      { category: "Notifications", term: "Q2 (Supplier Complaint)", definition: "Supplier-related quality notifications; contributes to supplier complaints and Supplier PPM." },
      { category: "Notifications", term: "Q3 (Internal Complaint)", definition: "Internal quality notifications; used in internal complaint reporting (e.g., Poor Quality Costs placeholders)." },
      { category: "Notifications", term: "D1/D2/D3 (Deviation)", definition: "Deviation notifications representing exceptions or approvals. Reported on Deviations Overview." },
      { category: "Notifications", term: "P1/P2/P3 (PPAP)", definition: "PPAP notifications representing approval process states. Reported on PPAPs Overview." },
      { category: "Notifications", term: "NOCO / OSNO", definition: "SAP system-status tokens used to infer status (NOCO ≈ Completed, OSNO ≈ In Progress)." },

      { category: "Metrics", term: "PPM (Parts Per Million)", definition: "Quality metric: (Defective Parts / Total Deliveries) × 1,000,000. Lower is better." },
      { category: "Metrics", term: "Customer PPM", definition: "PPM computed from Q1 defective parts and customer deliveries (Outbound)." },
      { category: "Metrics", term: "Supplier PPM", definition: "PPM computed from Q2 defective parts and supplier deliveries (Inbound)." },
      { category: "Metrics", term: "Defective Parts", definition: "Quantity of non-conforming parts recorded in a notification. Used in PPM." },
      { category: "Metrics", term: "Deliveries", definition: "Total delivered quantity used as PPM denominator (customer outbound / supplier inbound)." },
      { category: "Metrics", term: "Global PPM", definition: "Overall PPM aggregated across all selected plants/months." },
      { category: "Metrics", term: "12-month lookback window", definition: "A rolling window ending at the selected month/year used for consistent trend visuals." },

      { category: "Charts & Views", term: "YTD Total Number of Notifications by Month and Plant", definition: "Stacked bar chart showing complaint counts per month split by plant." },
      { category: "Charts & Views", term: "YTD Total Number of Defects by Month and Plant", definition: "Bar chart showing defective parts by month and plant (customer vs supplier)." },
      { category: "Charts & Views", term: "Legend click filter", definition: "Chart-local filter triggered by clicking a plant badge in the legend; does not affect other charts." },
      { category: "Charts & Views", term: "Fixed Y-axis domain", definition: "Y-axis max computed from unfiltered data so scale remains stable after local filtering." },

      { category: "AI", term: "AI Summary", definition: "LLM-generated narrative summary of filtered KPIs with trends, risks, and recommended actions." },
      { category: "AI", term: "AI Management Summary", definition: "Central page that summarizes KPIs and highlights anomalies and actions (German number formatting, plant labels included)." },
      { category: "AI", term: "Provider / API key", definition: "Configured LLM backend (e.g., OpenAI-compatible or Anthropic) used by the AI Summary API route." },

      { category: "General", term: "Site / Plant Code", definition: "3-digit code identifying a manufacturing site (e.g., 145, 235, 410). Displayed with city/location when available." },
      { category: "General", term: "Upload History", definition: "Persistent log of file uploads/manual entries including timestamps, summaries, and where data is used." },
      { category: "General", term: "Manual Entry (Template)", definition: "Form-based entry of monthly values per plant. Stored and merged into the KPI dataset for reporting." },
    ],
    []
  );

  const filteredGlossary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter((g) => `${g.term}\n${g.definition}\n${g.category}`.toLowerCase().includes(q));
  }, [glossary, searchQuery]);

  const glossaryByCategory = useMemo(() => {
    const map = new Map<GlossaryItem["category"], GlossaryItem[]>();
    for (const item of filteredGlossary) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    for (const [k, v] of map.entries()) map.set(k, v.sort((a, b) => a.term.localeCompare(b.term)));
    return map;
  }, [filteredGlossary]);

  const [issueTitle, setIssueTitle] = useState("");
  const [remark, setRemark] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [history, setHistory] = useState<UploadHistoryEntry[]>([]);
  const [pageUrl, setPageUrl] = useState<string>("");
  const [kpisSummary, setKpisSummary] = useState<{ totalComplaints?: number; totalDeliveries?: number; siteMonthCombinations?: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPageUrl(window.location.href);
    const stored = safeJsonParse<UploadHistoryEntry[]>(localStorage.getItem("qos-et-upload-history"));
    if (stored) setHistory(stored);

    const kpis = safeJsonParse<any>(localStorage.getItem("qos-et-upload-kpis-result"));
    if (kpis?.summary) setKpisSummary(kpis.summary);

    // Deep-link support: open a specific FAQ when URL has #faq-N
    const hash = window.location.hash?.replace("#", "");
    if (hash && /^faq-\d+$/.test(hash)) setOpenFaq(hash);
  }, []);

  const lastSuccessfulUpload = useMemo(() => {
    return history.find((h) => h.success) || null;
  }, [history]);

  const datasetHealth = useMemo(() => {
    const now = Date.now();
    const staleDays = 30;
    const bySection = new Map<UploadSectionKey, UploadHistoryEntry[]>();
    for (const h of history) {
      const list = bySection.get(h.section) || [];
      list.push(h);
      bySection.set(h.section, list);
    }

    function lastSuccess(section: UploadSectionKey): UploadHistoryEntry | null {
      const list = bySection.get(section) || [];
      return list.find((x) => x.success) || null;
    }

    function isStale(iso: string | null): boolean {
      if (!iso) return true;
      const t = new Date(iso).getTime();
      if (!Number.isFinite(t)) return true;
      const days = (now - t) / (1000 * 60 * 60 * 24);
      return days > staleDays;
    }

    const rows = (["plants", "complaints", "deliveries", "ppap", "deviations", "audit"] as UploadSectionKey[]).map((k) => {
      const last = lastSuccess(k);
      const records =
        typeof last?.summary?.records === "number"
          ? last.summary.records
          : typeof last?.summary?.totalComplaints === "number"
          ? last.summary.totalComplaints
          : undefined;
      return {
        key: k,
        lastSuccessIso: last?.uploadedAtIso || null,
        stale: isStale(last?.uploadedAtIso || null),
        records,
        files: last?.files?.map((f) => f.name) || [],
      };
    });

    return { rows, staleDays };
  }, [history]);

  const diagnosticsJson = useMemo(() => {
    return {
      generatedAt: new Date().toISOString(),
      pageUrl,
      lastSuccessfulUpload: lastSuccessfulUpload?.uploadedAtIso || null,
      uploadHistoryPreview: history.slice(0, 10),
      kpisSummary: kpisSummary || null,
    };
  }, [pageUrl, lastSuccessfulUpload, history, kpisSummary]);

  function downloadDiagnostics() {
    if (typeof window === "undefined") return;
    const blob = new Blob([JSON.stringify(diagnosticsJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qos-et-diagnostics_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const contactHref = useMemo(() => {
    const subject = `QOS ET Report – Remark: ${issueTitle || "(please add title)"}`;
    const body = [
      "Hello,",
      "",
      "Please find my remark/issue below:",
      "",
      `Title: ${issueTitle || ""}`,
      "",
      `Remark:`,
      `${remark || ""}`,
      "",
      "Diagnostics attachment (optional):",
      "- Please download the diagnostics JSON from the FAQ & Glossary page and attach it to this email.",
      "",
      "Context:",
      `- Page: ${pageUrl || ""}`,
      `- Timestamp: ${new Date().toLocaleString("de-DE")}`,
      `- Last successful upload: ${lastSuccessfulUpload ? formatWhen(lastSuccessfulUpload.uploadedAtIso) : "N/A"}`,
      "",
      "Thanks,",
    ].join("\n");
    return buildMailtoHref({
      to: "george.neacsu@webasto.com",
      subject,
      body,
    });
  }, [issueTitle, remark, pageUrl, lastSuccessfulUpload]);

  const improvementIdeaHref = useMemo(() => {
    const subject = `QOS ET Report – Improvement Idea: ${ideaTitle || "(please add title)"}`;
    const body = [
      "Hello,",
      "",
      "Improvement idea:",
      "",
      `Title: ${ideaTitle || ""}`,
      "",
      `Idea:`,
      `${ideaText || ""}`,
      "",
      "Context:",
      `- Page: ${pageUrl || ""}`,
      `- Timestamp: ${new Date().toLocaleString("de-DE")}`,
      "",
      "Thanks,",
    ].join("\n");
    return buildMailtoHref({ to: "george.neacsu@webasto.com", subject, body });
  }, [ideaTitle, ideaText, pageUrl]);

  return (
    <div className="space-y-6">
      <Card className="glass-card-glow overflow-hidden" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight">FAQ & Glossary</h2>
              </div>
              <p className="text-muted-foreground">
                Quick answers on navigation and calculations, plus a complete glossary of terms used across the report.
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <Badge variant="secondary" className="bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30">
                  15 FAQs
                </Badge>
                <Badge variant="secondary" className="bg-muted/50">
                  Full glossary (no collapsing)
                </Badge>
                <Badge variant="secondary" className="bg-muted/50">
                  Contact support
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={() => (typeof window !== "undefined" ? window.location.assign("/upload") : undefined)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Upload Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="faq">
        <div className="flex items-center justify-between gap-4 flex-wrap">
        <TabsList className="h-12 p-1.5 bg-muted/60 border border-border/60">
          <TabsTrigger
            value="faq"
            className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            <ListChecks className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger
            value="glossary"
            className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Glossary
          </TabsTrigger>
        </TabsList>
          <div className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQ + Glossary…"
              className="w-[260px]"
            />
          </div>
        </div>

        <TabsContent value="faq" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Focused on navigation, data sources, and how metrics/charts are calculated.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" value={openFaq} onValueChange={setOpenFaq}>
                  {filteredFaqs.map((f) => (
                    <AccordionItem key={f.id} value={f.id} id={f.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-start justify-between gap-3 w-full">
                          <span className="flex-1">{f.q}</span>
                          <button
                            type="button"
                            className="ml-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                            title="Copy link to this FAQ"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = `${window.location.origin}/glossary#${f.id}`;
                              navigator.clipboard?.writeText(url);
                              setCopiedFaqId(f.id);
                              setTimeout(() => setCopiedFaqId(null), 1200);
                            }}
                          >
                            {copiedFaqId === f.id ? (
                              <Check className="h-4 w-4 text-[#00FF88]" />
                            ) : (
                              <Link2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm text-muted-foreground leading-relaxed">{f.a}</div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardHeader>
                  <CardTitle>Dataset Health</CardTitle>
                  <CardDescription>
                    Live status from Upload History. A dataset is considered stale after {datasetHealth.staleDays} days.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {datasetHealth.rows.map((r) => (
                    <div key={r.key} className="flex items-start justify-between gap-3 rounded-md border border-border/60 p-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium capitalize">{r.key}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.lastSuccessIso ? `Last success: ${formatWhen(r.lastSuccessIso)}` : "No successful upload yet"}
                        </div>
                        {typeof r.records === "number" && (
                          <div className="text-xs text-muted-foreground">Records: {r.records}</div>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border",
                          r.lastSuccessIso && !r.stale
                            ? "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30"
                            : r.lastSuccessIso && r.stale
                            ? "bg-[#FF8A00]/15 text-[#FF8A00] border-[#FF8A00]/30"
                            : "bg-muted/50 text-muted-foreground border-border/50"
                        )}
                      >
                        {r.lastSuccessIso ? (r.stale ? "Stale" : "OK") : "Missing"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card-glow overflow-hidden" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    QM ET Triangle
                  </CardTitle>
                  <CardDescription>How the report is built and structured.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/10">
                    <Image
                      src="/Media/QM ET Triangle.png"
                      alt="QM ET Triangle"
                      width={1200}
                      height={800}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Tip: If a chart looks wrong, check data lineage (sources → parsing → KPIs → charts) and the upload history.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    Contact
                  </CardTitle>
                  <CardDescription>Open an email with an issue title, remark, and basic context.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue title</div>
                    <Input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} placeholder="e.g., Deviations chart shows 0 records" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remark / description</div>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Steps to reproduce, what you expected, what you saw…"
                      className={cn(
                        "min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><span className="font-medium text-foreground">Page:</span> {pageUrl || "—"}</div>
                    <div><span className="font-medium text-foreground">Last successful upload:</span> {lastSuccessfulUpload ? formatWhen(lastSuccessfulUpload.uploadedAtIso) : "—"}</div>
                  </div>
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadDiagnostics}
                      className="w-full border-[#00FF88]/30 hover:bg-[#00FF88]/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download diagnostics JSON
                    </Button>
                    <a href={contactHref}>
                      <Button className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-semibold">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact (Email)
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card id="improvement-ideas" className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle>Improvement Ideas</CardTitle>
              <CardDescription>Short form to capture suggestions and send them by email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Idea title</div>
                  <Input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="e.g., Add search + deep links across FAQ" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Idea details</div>
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="Describe the improvement and why it helps…"
                  className={cn(
                    "min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                />
              </div>
              <a href={improvementIdeaHref}>
                <Button className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-semibold">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Improvement Idea
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card id="how-to-read-charts" className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle>How to read key charts</CardTitle>
              <CardDescription>These anchors are referenced by the “How to read this chart” tooltips in the dashboards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div id="how-to-notifications-by-month-plant">
                <div className="font-medium text-foreground">YTD Total Number of Notifications by Month and Plant</div>
                <div>Stacked bars: each color = plant, bar height = total notifications for that month. Clicking a plant in the legend filters only this chart.</div>
              </div>
              <div id="how-to-defects-by-month-plant">
                <div className="font-medium text-foreground">YTD Total Number of Defects by Month and Plant</div>
                <div>Shows defective parts, split by plant. If the chart offers a defect type selector, it switches Customer vs Supplier defective parts.</div>
              </div>
              <div id="how-to-ppm-trend">
                <div className="font-medium text-foreground">YTD Cumulative PPM Trend</div>
                <div>Line trend of cumulative PPM across the lookback window. PPM uses defective parts as numerator and deliveries as denominator.</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glossary" className="space-y-6">
          <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle>Glossary (Complete)</CardTitle>
              <CardDescription>All terms are visible at once (no collapsing), grouped by category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Array.from(glossaryByCategory.entries()) as Array<[GlossaryItem["category"], GlossaryItem[]]>).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30">
                      {category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{items.length} terms</span>
                  </div>
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[260px]">Term</TableHead>
                          <TableHead>Definition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((g) => (
                          <TableRow key={`${category}-${g.term}`}>
                            <TableCell className="font-medium align-top">{g.term}</TableCell>
                            <TableCell className="text-muted-foreground align-top">{g.definition}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

