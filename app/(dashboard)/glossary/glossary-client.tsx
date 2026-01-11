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
import { useTranslation } from "@/lib/i18n/useTranslation";

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
  category: string; // Translated category name
  categoryKey: "Navigation" | "Data Sources" | "Notifications" | "Metrics" | "Charts & Views" | "AI" | "General"; // Original key for filtering
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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<string | undefined>(undefined);
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  const faqs = useMemo(
    () => [
      {
        q: t.glossary.faqs.howToUpload.q,
        a: t.glossary.faqs.howToUpload.a,
      },
      {
        q: t.glossary.faqs.sourceOfTruth.q,
        a: t.glossary.faqs.sourceOfTruth.a,
      },
      {
        q: t.glossary.faqs.customerPpmCalculation.q,
        a: t.glossary.faqs.customerPpmCalculation.a,
      },
      {
        q: t.glossary.faqs.supplierPpmCalculation.q,
        a: t.glossary.faqs.supplierPpmCalculation.a,
      },
      {
        q: t.glossary.faqs.q1q2q3Meaning.q,
        a: t.glossary.faqs.q1q2q3Meaning.a,
      },
      {
        q: t.glossary.faqs.d1d2d3Meaning.q,
        a: t.glossary.faqs.d1d2d3Meaning.a,
      },
      {
        q: t.glossary.faqs.p1p2p3Meaning.q,
        a: t.glossary.faqs.p1p2p3Meaning.a,
      },
      {
        q: t.glossary.faqs.ytdLookback.q,
        a: t.glossary.faqs.ytdLookback.a,
      },
      {
        q: t.glossary.faqs.plantFiltering.q,
        a: t.glossary.faqs.plantFiltering.a,
      },
      {
        q: t.glossary.faqs.plantNamesEnrichment.q,
        a: t.glossary.faqs.plantNamesEnrichment.a,
      },
      {
        q: t.glossary.faqs.fixedYAxis.q,
        a: t.glossary.faqs.fixedYAxis.a,
      },
      {
        q: t.glossary.faqs.aiSummaryError.q,
        a: t.glossary.faqs.aiSummaryError.a,
      },
      {
        q: t.glossary.faqs.aiSummaryPlantLabels.q,
        a: t.glossary.faqs.aiSummaryPlantLabels.a,
      },
      {
        q: t.glossary.faqs.dataLineage.q,
        a: t.glossary.faqs.dataLineage.a,
      },
      {
        q: t.glossary.faqs.reportIssue.q,
        a: t.glossary.faqs.reportIssue.a,
      },
    ],
    [t]
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
      { category: t.glossary.categories.navigation, categoryKey: "Navigation", term: t.glossary.termsList.navigation.qosEtDashboard.term, definition: t.glossary.termsList.navigation.qosEtDashboard.definition },
      { category: t.glossary.categories.navigation, categoryKey: "Navigation", term: t.glossary.termsList.navigation.customerPerformance.term, definition: t.glossary.termsList.navigation.customerPerformance.definition },
      { category: t.glossary.categories.navigation, categoryKey: "Navigation", term: t.glossary.termsList.navigation.supplierPerformance.term, definition: t.glossary.termsList.navigation.supplierPerformance.definition },
      { category: t.glossary.categories.navigation, categoryKey: "Navigation", term: t.glossary.termsList.navigation.uploadData.term, definition: t.glossary.termsList.navigation.uploadData.definition },
      { category: t.glossary.categories.navigation, categoryKey: "Navigation", term: t.glossary.termsList.navigation.dataLineage.term, definition: t.glossary.termsList.navigation.dataLineage.definition },

      { category: t.glossary.categories.dataSources, categoryKey: "Data Sources", term: t.glossary.termsList.dataSources.complaintsExtract.term, definition: t.glossary.termsList.dataSources.complaintsExtract.definition },
      { category: t.glossary.categories.dataSources, categoryKey: "Data Sources", term: t.glossary.termsList.dataSources.outboundDeliveries.term, definition: t.glossary.termsList.dataSources.outboundDeliveries.definition },
      { category: t.glossary.categories.dataSources, categoryKey: "Data Sources", term: t.glossary.termsList.dataSources.inboundDeliveries.term, definition: t.glossary.termsList.dataSources.inboundDeliveries.definition },
      { category: t.glossary.categories.dataSources, categoryKey: "Data Sources", term: t.glossary.termsList.dataSources.plantMasterData.term, definition: t.glossary.termsList.dataSources.plantMasterData.definition },
      { category: t.glossary.categories.dataSources, categoryKey: "Data Sources", term: t.glossary.termsList.dataSources.ppapExtracts.term, definition: t.glossary.termsList.dataSources.ppapExtracts.definition },
      { category: t.glossary.categories.dataSources, categoryKey: "Data Sources", term: t.glossary.termsList.dataSources.deviationsExtracts.term, definition: t.glossary.termsList.dataSources.deviationsExtracts.definition },

      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.notificationNumber.term, definition: t.glossary.termsList.notifications.notificationNumber.definition },
      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.notificationType.term, definition: t.glossary.termsList.notifications.notificationType.definition },
      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.q1.term, definition: t.glossary.termsList.notifications.q1.definition },
      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.q2.term, definition: t.glossary.termsList.notifications.q2.definition },
      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.q3.term, definition: t.glossary.termsList.notifications.q3.definition },
      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.d1d2d3.term, definition: t.glossary.termsList.notifications.d1d2d3.definition },
      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.p1p2p3.term, definition: t.glossary.termsList.notifications.p1p2p3.definition },
      { category: t.glossary.categories.notifications, categoryKey: "Notifications", term: t.glossary.termsList.notifications.nocoOsno.term, definition: t.glossary.termsList.notifications.nocoOsno.definition },

      { category: t.glossary.categories.metrics, categoryKey: "Metrics", term: t.glossary.termsList.metrics.ppm.term, definition: t.glossary.termsList.metrics.ppm.definition },
      { category: t.glossary.categories.metrics, categoryKey: "Metrics", term: t.glossary.termsList.metrics.customerPpm.term, definition: t.glossary.termsList.metrics.customerPpm.definition },
      { category: t.glossary.categories.metrics, categoryKey: "Metrics", term: t.glossary.termsList.metrics.supplierPpm.term, definition: t.glossary.termsList.metrics.supplierPpm.definition },
      { category: t.glossary.categories.metrics, categoryKey: "Metrics", term: t.glossary.termsList.metrics.defectiveParts.term, definition: t.glossary.termsList.metrics.defectiveParts.definition },
      { category: t.glossary.categories.metrics, categoryKey: "Metrics", term: t.glossary.termsList.metrics.deliveries.term, definition: t.glossary.termsList.metrics.deliveries.definition },
      { category: t.glossary.categories.metrics, categoryKey: "Metrics", term: t.glossary.termsList.metrics.globalPpm.term, definition: t.glossary.termsList.metrics.globalPpm.definition },
      { category: t.glossary.categories.metrics, categoryKey: "Metrics", term: t.glossary.termsList.metrics.lookbackWindow.term, definition: t.glossary.termsList.metrics.lookbackWindow.definition },

      { category: t.glossary.categories.chartsViews, categoryKey: "Charts & Views", term: t.glossary.termsList.chartsViews.notificationsByMonth.term, definition: t.glossary.termsList.chartsViews.notificationsByMonth.definition },
      { category: t.glossary.categories.chartsViews, categoryKey: "Charts & Views", term: t.glossary.termsList.chartsViews.defectsByMonth.term, definition: t.glossary.termsList.chartsViews.defectsByMonth.definition },
      { category: t.glossary.categories.chartsViews, categoryKey: "Charts & Views", term: t.glossary.termsList.chartsViews.legendClickFilter.term, definition: t.glossary.termsList.chartsViews.legendClickFilter.definition },
      { category: t.glossary.categories.chartsViews, categoryKey: "Charts & Views", term: t.glossary.termsList.chartsViews.fixedYAxis.term, definition: t.glossary.termsList.chartsViews.fixedYAxis.definition },

      { category: t.glossary.categories.ai, categoryKey: "AI", term: t.glossary.termsList.ai.aiSummary.term, definition: t.glossary.termsList.ai.aiSummary.definition },
      { category: t.glossary.categories.ai, categoryKey: "AI", term: t.glossary.termsList.ai.aiManagementSummary.term, definition: t.glossary.termsList.ai.aiManagementSummary.definition },
      { category: t.glossary.categories.ai, categoryKey: "AI", term: t.glossary.termsList.ai.providerApiKey.term, definition: t.glossary.termsList.ai.providerApiKey.definition },

      { category: t.glossary.categories.general, categoryKey: "General", term: t.glossary.termsList.general.sitePlantCode.term, definition: t.glossary.termsList.general.sitePlantCode.definition },
      { category: t.glossary.categories.general, categoryKey: "General", term: t.glossary.termsList.general.uploadHistory.term, definition: t.glossary.termsList.general.uploadHistory.definition },
      { category: t.glossary.categories.general, categoryKey: "General", term: t.glossary.termsList.general.manualEntry.term, definition: t.glossary.termsList.general.manualEntry.definition },
    ],
    [t]
  );

  const filteredGlossary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter((g) => `${g.term}\n${g.definition}\n${g.category}\n${g.categoryKey}`.toLowerCase().includes(q));
  }, [glossary, searchQuery]);

  const glossaryByCategory = useMemo(() => {
    const map = new Map<string, GlossaryItem[]>();
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
                <h2 className="text-2xl font-bold tracking-tight">{t.glossary.title}</h2>
              </div>
              <p className="text-muted-foreground">
                {t.glossary.subtitle}
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <Badge variant="secondary" className="bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30">
                  {t.glossary.faqsCount}
                </Badge>
                <Badge variant="secondary" className="bg-muted/50">
                  {t.glossary.fullGlossary}
                </Badge>
                <Badge variant="secondary" className="bg-muted/50">
                  {t.glossary.contactSupport}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={() => (typeof window !== "undefined" ? window.location.assign("/upload") : undefined)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t.glossary.goToUpload}
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
            {t.glossary.faqTab}
          </TabsTrigger>
          <TabsTrigger
            value="glossary"
            className="text-base font-semibold px-4 data-[state=active]:bg-[#00FF88] data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {t.glossary.glossaryTab}
          </TabsTrigger>
        </TabsList>
          <div className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.glossary.searchPlaceholder}
              className="w-[260px]"
            />
          </div>
        </div>

        <TabsContent value="faq" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
              <CardHeader>
                <CardTitle>{t.glossary.faqTitle}</CardTitle>
                <CardDescription>{t.glossary.faqDescription}</CardDescription>
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
                            title={t.glossary.copyLink}
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
                  <CardTitle>{t.glossary.datasetHealth}</CardTitle>
                  <CardDescription>
                    {t.glossary.datasetHealthDescription.replace("{{days}}", datasetHealth.staleDays.toString())}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {datasetHealth.rows.map((r) => (
                    <div key={r.key} className="flex items-start justify-between gap-3 rounded-md border border-border/60 p-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium capitalize">{r.key}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.lastSuccessIso ? `${t.glossary.lastSuccess}: ${formatWhen(r.lastSuccessIso)}` : t.glossary.noSuccessfulUpload}
                        </div>
                        {typeof r.records === "number" && (
                          <div className="text-xs text-muted-foreground">{t.glossary.records}: {r.records}</div>
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
                        {r.lastSuccessIso ? (r.stale ? t.glossary.stale : t.glossary.ok) : t.glossary.missing}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card-glow overflow-hidden" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    {t.glossary.qmTriangle}
                  </CardTitle>
                  <CardDescription>{t.glossary.qmTriangleDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/10">
                    <Image
                      src="/Media/QM ET Triangle.png"
                      alt={t.glossary.qmTriangle}
                      width={1200}
                      height={800}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {t.glossary.qmTriangleTip}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    {t.glossary.contact}
                  </CardTitle>
                  <CardDescription>{t.glossary.contactDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.glossary.issueTitle}</div>
                    <Input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} placeholder={t.glossary.issueTitlePlaceholder} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.glossary.remark}</div>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder={t.glossary.remarkPlaceholder}
                      className={cn(
                        "min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div><span className="font-medium text-foreground">{t.glossary.page}:</span> {pageUrl || "—"}</div>
                    <div><span className="font-medium text-foreground">{t.glossary.lastSuccessfulUpload}:</span> {lastSuccessfulUpload ? formatWhen(lastSuccessfulUpload.uploadedAtIso) : "—"}</div>
                  </div>
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadDiagnostics}
                      className="w-full border-[#00FF88]/30 hover:bg-[#00FF88]/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t.glossary.downloadDiagnostics}
                    </Button>
                    <a href={contactHref}>
                      <Button className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-semibold">
                        <Mail className="h-4 w-4 mr-2" />
                        {t.glossary.contactEmail}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card id="improvement-ideas" className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle>{t.glossary.improvementIdeas}</CardTitle>
              <CardDescription>{t.glossary.improvementIdeasDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.glossary.ideaTitle}</div>
                  <Input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder={t.glossary.ideaTitlePlaceholder} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.glossary.ideaDetails}</div>
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder={t.glossary.ideaDetailsPlaceholder}
                  className={cn(
                    "min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                />
              </div>
              <a href={improvementIdeaHref}>
                <Button className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-semibold">
                  <Mail className="h-4 w-4 mr-2" />
                  {t.glossary.sendIdea}
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card id="how-to-read-charts" className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle>{t.glossary.howToReadCharts.title}</CardTitle>
              <CardDescription>{t.glossary.howToReadCharts.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div id="how-to-notifications-by-month-plant">
                <div className="font-medium text-foreground">{t.glossary.howToReadCharts.notificationsByMonth.title}</div>
                <div>{t.glossary.howToReadCharts.notificationsByMonth.description}</div>
              </div>
              <div id="how-to-defects-by-month-plant">
                <div className="font-medium text-foreground">{t.glossary.howToReadCharts.defectsByMonth.title}</div>
                <div>{t.glossary.howToReadCharts.defectsByMonth.description}</div>
              </div>
              <div id="how-to-ppm-trend">
                <div className="font-medium text-foreground">{t.glossary.howToReadCharts.ppmTrend.title}</div>
                <div>{t.glossary.howToReadCharts.ppmTrend.description}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glossary" className="space-y-6">
          <Card className="glass-card-glow" style={{ borderColor: "#9E9E9E", borderWidth: "2px" }}>
            <CardHeader>
              <CardTitle>{t.glossary.glossaryTab} ({t.glossary.fullGlossary})</CardTitle>
              <CardDescription>{t.glossary.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Array.from(glossaryByCategory.entries()) as Array<[string, GlossaryItem[]]>).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30">
                      {category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{items.length} {t.glossary.terms}</span>
                  </div>
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[260px]">{t.glossary.term}</TableHead>
                          <TableHead>{t.glossary.definition}</TableHead>
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

