"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MANAGEMENT_SUMMARY_SECTION_GROUPS } from "@/lib/management-summary/section-catalog";
import {
  DEFAULT_EXPORT_SECTION_IDS,
  getRecommendedManagementSummaryTitle,
  getReportMonthInfo,
} from "@/lib/management-summary/constants";
import type { ManagementSummaryExportPayload } from "@/lib/management-summary/types";
import { generateManagementSummaryPdf } from "./pdf-generator";

interface PlantRow {
  code: string;
  name: string;
  location?: string;
}

function readStoredPlantFilters(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("qos-et-filters");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { selectedPlants?: string[] };
    return Array.isArray(parsed.selectedPlants) ? parsed.selectedPlants : [];
  } catch {
    return [];
  }
}

export function ManagementSummaryClient() {
  const router = useRouter();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [defaultLogoDataUrl, setDefaultLogoDataUrl] = useState<string | null>(null);
  const reportMonth = useMemo(() => getReportMonthInfo(), []);
  const recommendedTitle = useMemo(
    () => getRecommendedManagementSummaryTitle(reportMonth.monthLong, reportMonth.year),
    [reportMonth]
  );
  const [title, setTitle] = useState(recommendedTitle);
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(new Set());
  const [plantRemarks, setPlantRemarks] = useState<Record<string, string>>({});
  const [sectionIds, setSectionIds] = useState<Set<string>>(new Set(DEFAULT_EXPORT_SECTION_IDS));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    MANAGEMENT_SUMMARY_SECTION_GROUPS.forEach((g) => {
      init[g.pageHref] = g.pageHref === "/dashboard";
    });
    return init;
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Default app logo (same as sidebar).
    fetch("/Media/QM ET Triangle.png")
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Failed to read logo file."));
            reader.onload = () => resolve(String(reader.result || ""));
            reader.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => setDefaultLogoDataUrl(dataUrl))
      .catch(() => setDefaultLogoDataUrl(null));
  }, []);

  useEffect(() => {
    fetch("/api/plants")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        const list = Array.isArray(data?.plants) ? data.plants : [];
        setPlants(
          list.map((p: { code: string; name?: string; location?: string; city?: string }) => ({
            code: String(p.code),
            name: String(p.name || p.code),
            location: p.location || p.city,
          }))
        );
      })
      .catch(() => setPlants([]))
      .finally(() => setPlantsLoading(false));
  }, []);

  useEffect(() => {
    const fromFilters = readStoredPlantFilters();
    if (fromFilters.length > 0) {
      setSelectedPlants(new Set(fromFilters));
    }
  }, []);

  const sortedPlants = useMemo(() => [...plants].sort((a, b) => a.code.localeCompare(b.code)), [plants]);

  const togglePlant = useCallback((code: string) => {
    setSelectedPlants((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const toggleSection = useCallback((id: string, exportable: boolean) => {
    if (!exportable) return;
    setSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllExportable = useCallback(() => {
    const ids = new Set<string>();
    MANAGEMENT_SUMMARY_SECTION_GROUPS.forEach((g) =>
      g.sections.forEach((s) => {
        if (s.exportable) ids.add(s.id);
      })
    );
    setSectionIds(ids);
  }, []);

  const resetForm = useCallback(() => {
    setTitle(recommendedTitle);
    const fromFilters = readStoredPlantFilters();
    setSelectedPlants(fromFilters.length > 0 ? new Set(fromFilters) : new Set());
    setPlantRemarks({});
    setSectionIds(new Set(DEFAULT_EXPORT_SECTION_IDS));
    setSubmitError(null);
  }, [recommendedTitle]);

  const onSelectLogoFile = useCallback((file: File | null) => {
    if (!file) return;
    const isSupported = /image\/(png|jpeg|jpg)/i.test(file.type) || /\.(png|jpe?g)$/i.test(file.name);
    if (!isSupported) {
      setSubmitError("Please upload a PNG or JPG logo image.");
      return;
    }
    setSubmitError(null);
    const reader = new FileReader();
    reader.onerror = () => setSubmitError("Failed to read the selected image file.");
    reader.onload = () => setLogoDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }, []);

  const createReport = useCallback(async () => {
    setSubmitError(null);
    setPdfStatus("idle");
    setPdfStatusMessage(null);
    const codes = Array.from(selectedPlants).sort();
    if (codes.length === 0) {
      setSubmitError("Select at least one plant for the summary.");
      return;
    }
    const exportableSelected = MANAGEMENT_SUMMARY_SECTION_GROUPS.flatMap((g) =>
      g.sections.filter((s) => s.exportable && sectionIds.has(s.id)).map((s) => s.id)
    );
    if (exportableSelected.length === 0) {
      setSubmitError("Select at least one chart or table section to include.");
      return;
    }

    const remarks: Record<string, string> = {};
    for (const code of codes) {
      const text = (plantRemarks[code] || "").trim();
      if (text) remarks[code] = text;
    }

    const resolvedLogo = (logoDataUrl || defaultLogoDataUrl || undefined) as string | undefined;

    const payload: ManagementSummaryExportPayload = {
      version: 1,
      title: title.trim() || recommendedTitle,
      logoDataUrl: resolvedLogo,
      plantCodes: codes,
      plantRemarks: remarks,
      sectionIds: exportableSelected,
      reportMonthKey: reportMonth.key,
    };

    setSubmitting(true);
    try {
      setPdfStatus("generating");
      setPdfStatusMessage("Building PDF… this can take a few seconds for multiple plants.");
      await generateManagementSummaryPdf(payload);
      setPdfStatus("success");
      setPdfStatusMessage("PDF downloaded.");
    } catch (e) {
      setPdfStatus("error");
      setPdfStatusMessage(e instanceof Error ? e.message : "Could not generate PDF.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }, [selectedPlants, sectionIds, plantRemarks, title, recommendedTitle, logoDataUrl, defaultLogoDataUrl, reportMonth.key]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-16 px-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Management summary</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Configure the report title, plants, optional remarks per plant, and which dashboard sections to publish.
            The PDF uses the same rolling period and metrics as the dashboard after plant filters are applied.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={resetForm} className="border-border">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting || plantsLoading}
            onClick={createReport}
            className="bg-[#00FF88] text-black hover:bg-[#00FF88]/90 font-semibold border border-[#00FF88]"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Create report
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      {pdfStatus !== "idle" ? (
        <div
          className={cn(
            "rounded-md border px-4 py-3 text-sm flex flex-col gap-1",
            pdfStatus === "generating" && "border-[#00FF88]/40 bg-[#00FF88]/10",
            pdfStatus === "success" && "border-[#00FF88]/30 bg-[#00FF88]/5",
            pdfStatus === "error" && "border-destructive/50 bg-destructive/10"
          )}
          role="status"
          aria-live="polite"
        >
          <div className="font-medium text-foreground">
            {pdfStatus === "generating" ? "Creating PDF…" : pdfStatus === "success" ? "PDF created" : "PDF failed"}
          </div>
          {pdfStatusMessage ? <div className="text-xs text-muted-foreground">{pdfStatusMessage}</div> : null}
        </div>
      ) : null}

      <Card className="border-border/80 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report title</CardTitle>
          <CardDescription>
            Suggested title: <span className="text-foreground/90">{recommendedTitle}</span>. You can edit it below.
            <br />
            Reporting month is the previous closed month (<span className="text-foreground/90">{reportMonth.label}</span>);
            tables show this month&apos;s values alongside the trailing 12-month totals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="ms-title" className="sr-only">
            Title
          </Label>
          <Input
            id="ms-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-2xl bg-background/50 border-border"
            placeholder={recommendedTitle}
          />
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>
            Optional. Upload a PNG/JPG logo for the PDF header. If you don’t upload one, the app logo is used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="ms-logo">Logo image</Label>
              <Input
                id="ms-logo"
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                onChange={(e) => onSelectLogoFile(e.target.files?.[0] ?? null)}
                className="max-w-md bg-background/50 border-border"
              />
              <p className="text-xs text-muted-foreground">Recommended: transparent PNG, wide aspect ratio.</p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">Preview</div>
              <div className="h-10 w-[180px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoDataUrl || defaultLogoDataUrl || ""}
                  alt="Logo preview"
                  className="max-h-10 max-w-[180px] object-contain"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plants & remarks</CardTitle>
          <CardDescription>
            Select the plants to include. Optional comments, remarks, or top topics appear on a final PDF page for each
            plant with text entered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plantsLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading plants…
            </p>
          ) : sortedPlants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No plants found. Check that plant data is available.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] sm:max-h-[520px] overflow-y-auto pr-1 rounded-md border border-border/60 bg-muted/20 p-3">
              {sortedPlants.map((p) => {
                const checked = selectedPlants.has(p.code);
                return (
                  <div key={p.code} className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`plant-${p.code}`}
                        checked={checked}
                        onCheckedChange={() => togglePlant(p.code)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`plant-${p.code}`} className="font-medium cursor-pointer text-foreground">
                          {p.code} {p.name}
                        </Label>
                        {p.location ? (
                          <p className="text-xs text-muted-foreground truncate">{p.location}</p>
                        ) : null}
                      </div>
                    </div>
                    {checked ? (
                      <div className="pl-7 space-y-1">
                        <Label htmlFor={`remark-${p.code}`} className="text-xs text-muted-foreground">
                          Comments / remarks / top topics (optional)
                        </Label>
                        <Textarea
                          id={`remark-${p.code}`}
                          value={plantRemarks[p.code] || ""}
                          onChange={(e) =>
                            setPlantRemarks((prev) => ({
                              ...prev,
                              [p.code]: e.target.value,
                            }))
                          }
                          placeholder="e.g. Key escalations, actions, or focus topics for this site…"
                          className="min-h-[72px] text-sm bg-background/60 border-border resize-y"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Charts & tables</CardTitle>
            <CardDescription>
              Choose what to publish. Dashboard sections are available today; other modules are shown for visibility and
              will be enabled when export is extended.
            </CardDescription>
          </div>
          <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={selectAllExportable}>
            Select all available
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {MANAGEMENT_SUMMARY_SECTION_GROUPS.map((group) => (
            <Collapsible
              key={group.pageHref}
              open={openGroups[group.pageHref] ?? false}
              onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [group.pageHref]: open }))}
              className="rounded-lg border border-border/60 bg-muted/10"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/30 rounded-lg transition-colors">
                <div>
                  <div className="text-sm font-medium text-foreground">{group.pageLabel}</div>
                  <div className="text-xs text-muted-foreground font-mono">{group.pageHref}</div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    openGroups[group.pageHref] ? "rotate-180" : ""
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/50 px-4 py-3 space-y-3">
                  {group.sections.map((section) => {
                    const checked = sectionIds.has(section.id);
                    return (
                      <div
                        key={section.id}
                        className={cn(
                          "flex gap-3 rounded-md p-2 -mx-2",
                          section.exportable ? "" : "opacity-60"
                        )}
                      >
                        <Checkbox
                          id={`sec-${section.id}`}
                          checked={checked && section.exportable}
                          disabled={!section.exportable}
                          onCheckedChange={() => toggleSection(section.id, section.exportable)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`sec-${section.id}`}
                            className={cn(
                              "text-sm font-medium",
                              section.exportable ? "cursor-pointer" : "cursor-not-allowed"
                            )}
                          >
                            {section.label}
                            {!section.exportable ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">(coming soon)</span>
                            ) : null}
                          </Label>
                          {section.description ? (
                            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
