"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
  GitBranch,
  Info,
  Layers,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { getDatasetHealth, getDatasetHealthSummary, type UploadSectionKey } from "@/lib/data/datasetHealth";

import type { UploadHistoryEntry } from "@/lib/data/datasetHealth";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("de-DE");
  } catch {
    return iso;
  }
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function DataLineageClient() {
  const [history, setHistory] = useState<UploadHistoryEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = safeJsonParse<UploadHistoryEntry[]>(localStorage.getItem("qos-et-upload-history"));
    if (stored) setHistory(stored);
  }, []);

  const datasets = useMemo(() => {
    const items: Array<{
      key: UploadSectionKey;
      title: string;
      description: string;
      sourcePatterns: string[];
      parserOrApi: string[];
      outputs: string[];
      usedIn: Array<{ page: string; charts: string[] }>;
      status: { lastUploadIso: string | null; lastSuccessIso: string | null; lastFiles: string[]; hasAny: boolean; healthStatus?: "ok" | "missing" | "stale" };
    }> = [
      {
        key: "complaints",
        title: "Customer & Supplier Complaints",
        description: "Q1/Q2/Q3 notifications, defective parts, and complaint metadata.",
        sourcePatterns: ["Q Cockpit QOS ET_Complaints_Parts_PPM_PS4.XLSX", "Q Cockpit QOS ET_Complaints_Parts_*.XLSX"],
        parserOrApi: ["lib/excel/parseComplaints.ts", "app/api/upload-kpis/route.ts", "app/api/upload-all-files/route.ts"],
        outputs: ["Q1/Q2/Q3 complaint counts", "Defective parts (customer/supplier/internal)", "Conversions (ML/M/M2 → PC where applicable)"],
        usedIn: [
          {
            page: "QOS ET Dashboard",
            charts: [
              "YTD Total Number of Notifications by Month and Plant",
              "YTD Number of Notifications by Month and Notification Type",
              "Defects & PPM related charts/tables",
            ],
          },
          { page: "Customer Performance", charts: ["Customer notifications/defects/PPM tables & charts"] },
          { page: "Supplier Performance", charts: ["Supplier notifications/defects/PPM tables & charts"] },
          { page: "Poor Quality Costs", charts: ["Internal notifications/defects (Q3 placeholders + chart logic)"] },
          { page: "AI Management Summary", charts: ["AI insights computed from KPI dataset"] },
        ],
        status: { lastUploadIso: null, lastSuccessIso: null, lastFiles: [], hasAny: false },
      },
      {
        key: "deliveries",
        title: "Customer & Supplier Deliveries",
        description: "Outbound (customer deliveries) and Inbound (supplier deliveries) used for PPM denominators and delivery charts.",
        sourcePatterns: ["Outbound *_PS4.XLSX", "Inbound *_PS4.XLSX"],
        parserOrApi: ["lib/excel/parseDeliveries.ts", "app/api/upload-kpis/route.ts", "lib/data/kpis-dashboard.ts"],
        outputs: ["Customer deliveries quantity", "Supplier deliveries quantity", "Monthly deliveries by plant"],
        usedIn: [
          { page: "QOS ET Dashboard", charts: ["Customer Deliveries by Site", "Supplier Deliveries by Site", "PPM denominators"] },
          { page: "Customer Performance", charts: ["Customer deliveries donut charts + PPM"] },
          { page: "Supplier Performance", charts: ["Supplier deliveries donut charts + PPM"] },
        ],
        status: { lastUploadIso: null, lastSuccessIso: null, lastFiles: [], hasAny: false },
      },
      {
        key: "plants",
        title: "Plant Overview (Master Data)",
        description: "Plant code → city/location/name mapping used across filters, legends, and AI prompts.",
        sourcePatterns: ["Webasto ET Plants .xlsx"],
        parserOrApi: ["lib/excel/parsePlants.ts", "lib/data/plants.ts", "app/api/plants/route.ts"],
        outputs: ["Plant list", "Code→City/Location mapping", "Legend labels + AI plant references"],
        usedIn: [
          { page: "All KPI pages", charts: ["Legends and labels show plant code + location"] },
          { page: "AI Summary (Dashboard & Management Summary)", charts: ["AI instructed to mention location with plant code"] },
        ],
        status: { lastUploadIso: null, lastSuccessIso: null, lastFiles: [], hasAny: false },
      },
      {
        key: "ppap",
        title: "PPAP Notification Files",
        description: "P1/P2/P3 PPAP notifications with status merged from a status extract.",
        sourcePatterns: ["PPAP P Notif_PS4.XLSX", "PPAP P Notif_STATUS_PS4.XLSX"],
        parserOrApi: ["lib/excel/parsePPAP.ts", "lib/data/ppaps.ts", "app/api/ppaps/route.ts"],
        outputs: ["PPAP counts by plant/month", "PPAP status: In Progress vs Completed", "PPAP charts + AI summary payload"],
        usedIn: [
          { page: "PPAPs Overview", charts: ["YTD P Notifications by Month and Plant", "Closed vs. In Progress stacked chart"] },
        ],
        status: { lastUploadIso: null, lastSuccessIso: null, lastFiles: [], hasAny: false },
      },
      {
        key: "deviations",
        title: "Deviation Notifications Files",
        description: "D1/D2/D3 deviations with status merged from a status extract.",
        sourcePatterns: ["Deviations Notifications_PS4.XLSX", "Deviations Notifications_STATUS_PS4.XLSX"],
        parserOrApi: ["lib/excel/parseDeviations.ts", "lib/data/deviations.ts", "app/api/deviations/route.ts"],
        outputs: ["Deviation counts by plant/month", "Deviation status: In Progress vs Completed", "Deviation charts + AI summary payload"],
        usedIn: [
          { page: "Deviations Overview", charts: ["YTD D Notifications by Month and Plant", "Closed vs. In Progress stacked chart"] },
        ],
        status: { lastUploadIso: null, lastSuccessIso: null, lastFiles: [], hasAny: false },
      },
      {
        key: "audit",
        title: "Audit Management Files",
        description: "Audit datasets are tracked for traceability; chart parsing is under construction.",
        sourcePatterns: ["(TBD)"],
        parserOrApi: ["Upload history only (no parser yet)"],
        outputs: ["(Placeholder) audit metrics, findings, actions"],
        usedIn: [{ page: "Audit Management", charts: ["Placeholders until a data source is connected"] }],
        status: { lastUploadIso: null, lastSuccessIso: null, lastFiles: [], hasAny: false },
      },
    ];

    const bySection = new Map<UploadSectionKey, UploadHistoryEntry[]>();
    for (const h of history) {
      const list = bySection.get(h.section) || [];
      list.push(h);
      bySection.set(h.section, list);
    }

    // Get health summary for all datasets
    const healthSummary = getDatasetHealthSummary(history, 30);

    for (const d of items) {
      const list = bySection.get(d.key) || [];
      const last = list[0] || null;
      const lastSuccess = list.find((x) => x.success) || null;
      const health = healthSummary[d.key];
      
      d.status = {
        lastUploadIso: last?.uploadedAtIso || null,
        lastSuccessIso: lastSuccess?.uploadedAtIso || null,
        lastFiles: last?.files?.map((f) => f.name) || [],
        hasAny: list.length > 0,
        healthStatus: health.status, // Add health status
      };
    }

    return items;
  }, [history]);

  const totals = useMemo(() => {
    const sources = datasets.length;
    const pages = new Set(datasets.flatMap((d) => d.usedIn.map((u) => u.page))).size;
    const lastSuccess = history.find((h) => h.success) || null;
    return { sources, pages, lastSuccess };
  }, [datasets, history]);

  return (
    <div className="space-y-6">
      <Card className="glass-card-glow overflow-hidden" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight">Data Lineage</h2>
              </div>
              <p className="text-muted-foreground">
                A clear overview of <span className="text-foreground font-medium">what data is used</span>,{" "}
                <span className="text-foreground font-medium">how it’s processed</span>, and{" "}
                <span className="text-foreground font-medium">where it appears</span>.
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <Badge variant="secondary" className="bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30">
                  {totals.sources} data sources
                </Badge>
                <Badge variant="secondary" className="bg-muted/50">
                  {totals.pages} pages
                </Badge>
                <Badge variant="secondary" className="bg-muted/50">
                  {totals.lastSuccess ? `Last successful upload: ${formatWhen(totals.lastSuccess.uploadedAtIso)}` : "No upload history yet"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => (typeof window !== "undefined" ? window.location.assign("/upload") : undefined)}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Go to Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="catalog">
        <TabsList className="h-12 p-1.5 bg-muted/60 border border-border/60">
          <TabsTrigger
            value="catalog"
            className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            Data Catalog
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            End-to-End Flow
          </TabsTrigger>
          <TabsTrigger
            value="storage"
            className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            Storage & Outputs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {datasets.map((d) => {
              const healthStatus = d.status.healthStatus || (d.status.lastSuccessIso ? "ok" : "missing");
              const isOk = healthStatus === "ok";
              const isStale = healthStatus === "stale";
              const isMissing = healthStatus === "missing";
              
              return (
                <Card key={d.key} className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {d.key === "plants" ? (
                            <Database className="h-4 w-4 text-muted-foreground" />
                          ) : d.key === "audit" ? (
                            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                          )}
                          {d.title}
                        </CardTitle>
                        <CardDescription>{d.description}</CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border flex items-center gap-1.5",
                          isOk
                            ? "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30"
                            : isStale
                            ? "bg-[#FF8A00]/15 text-[#FF8A00] border-[#FF8A00]/30"
                            : "bg-muted/50 text-muted-foreground border-border/50"
                        )}
                      >
                        {isOk ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            OK
                          </>
                        ) : isStale ? (
                          <>
                            <AlertCircle className="h-3.5 w-3.5" />
                            Stale
                          </>
                        ) : d.key === "audit" ? (
                          "Under Construction"
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5" />
                            Missing
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {d.status.lastSuccessIso
                            ? `Last success: ${formatWhen(d.status.lastSuccessIso)}`
                            : d.status.lastUploadIso
                            ? `Last attempt: ${formatWhen(d.status.lastUploadIso)}`
                            : "No uploads recorded"}
                        </span>
                      </div>
                      {d.status.lastFiles.length > 0 && (
                        <div className="truncate">
                          <span className="font-medium text-foreground">Latest files:</span> {d.status.lastFiles.join("; ")}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {d.usedIn.slice(0, 3).map((u) => (
                        <Badge key={u.page} variant="secondary" className="bg-muted/50">
                          {u.page}
                        </Badge>
                      ))}
                      {d.usedIn.length > 3 && (
                        <Badge variant="secondary" className="bg-muted/50">
                          +{d.usedIn.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                Detailed Lineage (Source → Processing → Pages/Charts)
              </CardTitle>
              <CardDescription>Expand each dataset to see exactly where it is used.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {datasets.map((d) => (
                  <AccordionItem key={d.key} value={d.key}>
                    <AccordionTrigger className="no-underline hover:no-underline">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="font-semibold">{d.title}</div>
                        <Badge variant="secondary" className="bg-muted/50">
                          {d.key}
                        </Badge>
                        {d.status.lastSuccessIso && (
                          <Badge variant="secondary" className="bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Ready
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="bg-muted/20 border border-border/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              Source files
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground space-y-1">
                            {d.sourcePatterns.map((p) => (
                              <div key={p} className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <span className="break-words">{p}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="bg-muted/20 border border-border/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              Parsing / APIs
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground space-y-1">
                            {d.parserOrApi.map((p) => (
                              <div key={p} className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">{p}</code>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="bg-muted/20 border border-border/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              Outputs
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground space-y-1">
                            {d.outputs.map((o) => (
                              <div key={o} className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <span className="break-words">{o}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Page</TableHead>
                              <TableHead>Charts / Usage</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {d.usedIn.map((u) => (
                              <TableRow key={u.page}>
                                <TableCell className="font-medium">{u.page}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  <div className="flex flex-wrap gap-2">
                                    {u.charts.slice(0, 6).map((c) => (
                                      <Badge key={c} variant="secondary" className="bg-muted/50">
                                        {c}
                                      </Badge>
                                    ))}
                                    {u.charts.length > 6 && (
                                      <Badge variant="secondary" className="bg-muted/50">
                                        +{u.charts.length - 6} more
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              {
                title: "1) Sources",
                icon: FileSpreadsheet,
                text: "Excel extracts + manual form entries",
                items: ["Complaints", "Deliveries", "Plants", "PPAP", "Deviations", "Audits (TBD)"],
              },
              {
                title: "2) Parsing",
                icon: Database,
                text: "Header detection, date parsing, plant normalization",
                items: ["parseComplaints", "parseDeliveries", "parsePlants", "parsePPAP", "parseDeviations"],
              },
              {
                title: "3) KPIs",
                icon: TrendingUp,
                text: "Monthly aggregation + PPM computation",
                items: ["monthlySiteKpis", "globalPpm", "PPM formulas", "Defects totals"],
              },
              {
                title: "4) Consumption",
                icon: Sparkles,
                text: "Charts, tables, legends, and AI summaries",
                items: ["Dashboard pages", "AI Summary", "Export/History", "Plant labels (code + city)"],
              },
            ].map((step, idx) => (
              <Card key={idx} className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.text}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {step.items.map((i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5" />
                      <span className="break-words">{i}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                KPI formulas (high-level)
              </CardTitle>
              <CardDescription>Used across Dashboard / Customer / Supplier views.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>
                <Badge variant="secondary" className="bg-muted/50">
                  Customer PPM
                </Badge>{" "}
                = (Customer Defective Parts / Customer Deliveries) × 1,000,000
              </div>
              <div>
                <Badge variant="secondary" className="bg-muted/50">
                  Supplier PPM
                </Badge>{" "}
                = (Supplier Defective Parts / Supplier Deliveries) × 1,000,000
              </div>
              <div className="text-xs text-muted-foreground">
                Note: Unit conversions (ML/M/M2 → PC) are applied where available before PPM calculation.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                Storage Layers & Outputs
              </CardTitle>
              <CardDescription>What is stored and consumed at runtime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="bg-muted/20 border border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      Browser localStorage (client)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div>
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">qos-et-kpis</code> — MonthlySiteKpi[] (main dataset)
                    </div>
                    <div>
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">qos-et-global-ppm</code> — global PPM values
                    </div>
                    <div>
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">qos-et-upload-history</code> — upload/change history
                    </div>
                    <div>
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">qos-et-manual-kpis</code> — manual template entries
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20 border border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      Attachments folder (server)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div>
                      Reads Excel files from{" "}
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">/attachments</code>
                    </div>
                    <div>
                      Server KPI loader:{" "}
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">lib/data/kpis-dashboard.ts</code>
                    </div>
                    <div>
                      PPAP:{" "}
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">lib/data/ppaps.ts</code>
                    </div>
                    <div>
                      Deviations:{" "}
                      <code className="text-xs bg-muted/40 border border-border/60 px-2 py-0.5 rounded">lib/data/deviations.ts</code>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/20 border border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    Data quality notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5" />
                    <span>Plant labels are standardized using the official plant list (code + city/location).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5" />
                    <span>Uploads are logged to enable traceability: what was uploaded, when, and where it is used.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 mt-0.5" />
                    <span>Audit / cost datasets are placeholders until official sources are connected.</span>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

