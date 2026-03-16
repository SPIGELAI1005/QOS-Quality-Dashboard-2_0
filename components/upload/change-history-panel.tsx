"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Filter, X } from "lucide-react";
import type { ChangeHistoryEntry } from "@/lib/data/uploadSummary";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as XLSX from "xlsx";
// Format date helper (avoiding date-fns dependency)
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

interface ChangeHistoryPanelProps {
  changes: ChangeHistoryEntry[];
}

export function ChangeHistoryPanel({ changes }: ChangeHistoryPanelProps) {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterChangeType, setFilterChangeType] = useState<string>("all");
  const [filterRecordId, setFilterRecordId] = useState<string>("");
  const [filterEditor, setFilterEditor] = useState<string>("");

  const filteredChanges = useMemo(() => {
    return changes.filter(change => {
      if (filterType !== "all" && change.recordType !== filterType) return false;
      if (filterChangeType !== "all" && change.changeType !== filterChangeType) return false;
      if (filterRecordId && !change.recordId.toLowerCase().includes(filterRecordId.toLowerCase())) return false;
      if (filterEditor && !change.editor.toLowerCase().includes(filterEditor.toLowerCase())) return false;
      return true;
    });
  }, [changes, filterType, filterChangeType, filterRecordId, filterEditor]);

  const formatTimestamp = (iso: string): string => {
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

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const rows = filteredChanges.map(change => ({
      "Date & Time": formatTimestamp(change.timestamp),
      "Recorded By": change.editor,
      "Record ID": change.recordId,
      "Record Type": change.recordType.replace("_", " "),
      Field: change.field,
      "Old Value": typeof change.oldValue === "object" ? JSON.stringify(change.oldValue) : String(change.oldValue || ""),
      "New Value": typeof change.newValue === "object" ? JSON.stringify(change.newValue) : String(change.newValue || ""),
      Reason: change.reason || "",
      "Change Type": change.changeType.replace("_", " "),
      "One-Pager Link": change.onePagerLink || "",
      "Affected Metrics": change.affectedMetrics.metrics.join("; "),
      "Affected Visualizations": change.affectedMetrics.visualizations.join("; "),
      "Affected Pages": change.affectedMetrics.pages.join("; "),
      "Affected Calculations": change.affectedMetrics.calculations.join("; "),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Change History");
    XLSX.writeFile(wb, `change-history_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterChangeType("all");
    setFilterRecordId("");
    setFilterEditor("");
  };

  const changeTypeLabel = (key: string): string => {
    const map: Record<string, string> = {
      conversion: t.upload.changeTypeConversion,
      manual_edit: t.upload.changeTypeManualEdit,
      correction: t.upload.changeTypeCorrection,
      bulk_action: t.upload.changeTypeBulkAction,
      new_entry: t.upload.changeTypeNewEntry,
      file_upload: t.upload.changeTypeFileUpload,
      duplicate: t.upload.changeTypeDuplicate,
    };
    return map[key] ?? key.replace("_", " ");
  };

  const recordTypeLabel = (key: string): string => {
    const map: Record<string, string> = {
      complaint: t.upload.recordTypeComplaint,
      delivery: t.upload.recordTypeDelivery,
      ppap: t.upload.recordTypePpap,
      deviation: t.upload.recordTypeDeviation,
    };
    return map[key] ?? key.replace("_", " ");
  };

  const getSummaryValue = (change: ChangeHistoryEntry, key: string): number | null => {
    const detailsSummary = (change.dataDetails as any)?.summary;
    if (detailsSummary && typeof detailsSummary[key] === "number") return detailsSummary[key];
    if (change.newValue && typeof change.newValue === "object" && typeof (change.newValue as any)[key] === "number") {
      return (change.newValue as any)[key];
    }
    return null;
  };

  const getAllFieldDescription = (change: ChangeHistoryEntry): string => {
    if (change.changeType === "file_upload") {
      const uploadedFiles: string[] = Array.isArray((change.dataDetails as any)?.files)
        ? (change.dataDetails as any).files.map((f: any) => f?.name).filter(Boolean)
        : [];
      const records = getSummaryValue(change, "records");
      const duplicates = getSummaryValue(change, "duplicateRecords");
      const section = recordTypeLabel(change.recordType);

      const parts: string[] = [`Uploaded file data for ${section}.`];
      if (uploadedFiles.length > 0) parts.push(`Files: ${uploadedFiles.join(", ")}.`);
      if (records !== null) parts.push(`Parsed records: ${records.toLocaleString("de-DE")}.`);
      if (duplicates !== null && duplicates > 0) {
        parts.push(`Duplicate records ignored: ${duplicates.toLocaleString("de-DE")}.`);
      }
      return parts.join(" ");
    }

    if (change.recordType === "manual_entry" || change.changeType === "new_entry") {
      return "A complete manual KPI entry was added from the Enter Data form.";
    }

    return "Multiple fields were updated in a single action.";
  };

  const getWhyThisMatters = (change: ChangeHistoryEntry): string => {
    const metricCount = change.affectedMetrics.metrics.length;
    const pageCount = change.affectedMetrics.pages.length;
    const vizCount = change.affectedMetrics.visualizations.length;

    if (metricCount === 0 && pageCount === 0 && vizCount === 0) {
      return "This update is recorded for auditability and may affect downstream reporting.";
    }

    const metricsPreview =
      metricCount > 0 ? change.affectedMetrics.metrics.slice(0, 2).join(", ") : "";
    const pagesPreview =
      pageCount > 0 ? change.affectedMetrics.pages.slice(0, 2).join(", ") : "";

    if (change.changeType === "file_upload") {
      return `This can update KPI calculations and dashboard outputs (${metricsPreview || "quality metrics"}) across ${
        pagesPreview || "related pages"
      }.`;
    }

    if (change.changeType === "conversion" || change.field === "defectiveParts" || change.field === "unitOfMeasure") {
      return `This directly affects PPM/defect-related KPIs and charts (${metricsPreview || "PPM metrics"}).`;
    }

    return `This can change reported values in charts/tables across ${pagesPreview || "the affected pages"}.`;
  };

  if (changes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
          <CardDescription>No changes have been recorded yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.upload.changeHistory}</CardTitle>
            <CardDescription>
              {t.upload.historyDescription}
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t.upload.exportButton}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end p-4 bg-muted/30 rounded-md">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t.upload.filtersLabel}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.upload.recordTypeLabel}</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.upload.recordTypeAll}</SelectItem>
                <SelectItem value="complaint">{t.upload.recordTypeComplaint}</SelectItem>
                <SelectItem value="delivery">{t.upload.recordTypeDelivery}</SelectItem>
                <SelectItem value="ppap">{t.upload.recordTypePpap}</SelectItem>
                <SelectItem value="deviation">{t.upload.recordTypeDeviation}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.upload.changeTypeLabel}</Label>
            <Select value={filterChangeType} onValueChange={setFilterChangeType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.upload.changeTypeAll}</SelectItem>
                <SelectItem value="conversion">{t.upload.changeTypeConversion}</SelectItem>
                <SelectItem value="manual_edit">{t.upload.changeTypeManualEdit}</SelectItem>
                <SelectItem value="correction">{t.upload.changeTypeCorrection}</SelectItem>
                <SelectItem value="bulk_action">{t.upload.changeTypeBulkAction}</SelectItem>
                <SelectItem value="new_entry">{t.upload.changeTypeNewEntry}</SelectItem>
                <SelectItem value="file_upload">{t.upload.changeTypeFileUpload}</SelectItem>
                <SelectItem value="duplicate">{t.upload.changeTypeDuplicate}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.upload.recordIdLabel}</Label>
            <Input
              placeholder={t.upload.filterByIdPlaceholder}
              value={filterRecordId}
              onChange={(e) => setFilterRecordId(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.upload.recordedBy}</Label>
            <Input
              placeholder={t.upload.filterByEditorPlaceholder}
              value={filterEditor}
              onChange={(e) => setFilterEditor(e.target.value)}
              className="w-[120px]"
            />
          </div>
          <Button onClick={clearFilters} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            {t.upload.clearFiltersButton}
          </Button>
        </div>

        {/* Changes List */}
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {t.upload.showingXOfYChanges
              .replace("{count}", String(filteredChanges.length))
              .replace("{total}", String(changes.length))
              .replace(" (s)", changes.length !== 1 ? "s" : "")
              .replace("(en)", changes.length !== 1 ? "en" : "")
              .replace("/he", changes.length !== 1 ? "he" : "")}
          </div>
          {filteredChanges.map((change, index) => (
            <div
              key={`${change.id}-${change.timestamp}-${change.recordId}-${index}`}
              className="border rounded-md p-4 space-y-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline">{recordTypeLabel(change.recordType)}</Badge>
                    <Badge
                      variant={
                        change.changeType === "conversion" || change.changeType === "new_entry" || change.changeType === "file_upload"
                          ? "default"
                          : change.changeType === "manual_edit"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {changeTypeLabel(change.changeType)}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {formatDate(new Date(change.timestamp))}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">{t.upload.recordedBy}</span>{" "}
                      <span className="font-semibold text-foreground">{change.editor}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t.upload.recordIdLabel}</span>{" "}
                      <span className="font-mono text-xs">{change.recordId}</span>
                    </div>
                    {change.field !== "all" && (
                      <div>
                        <span className="font-medium">{t.upload.fieldLabel}</span> {change.field}
                      </div>
                    )}
                    {change.field === "all" ? (
                      <div>
                        <span className="font-medium">What happened:</span>{" "}
                        <span className="text-muted-foreground">{getAllFieldDescription(change)}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">Change:</span>{" "}
                        <span className="text-muted-foreground">
                          {typeof change.oldValue === "number"
                            ? change.oldValue.toLocaleString("de-DE")
                            : change.oldValue !== null && change.oldValue !== undefined
                            ? String(change.oldValue)
                            : "N/A"}
                        </span>{" "}
                        →{" "}
                        <span className="font-medium">
                          {typeof change.newValue === "number"
                            ? change.newValue.toLocaleString("de-DE")
                            : typeof change.newValue === "object"
                            ? JSON.stringify(change.newValue)
                            : String(change.newValue)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Why this matters:</span>{" "}
                      <span className="text-muted-foreground">{getWhyThisMatters(change)}</span>
                    </div>
                    {change.reason && (
                      <div>
                        <span className="font-medium">{t.upload.reasonLabel}</span> {change.reason}
                      </div>
                    )}
                    {change.onePagerLink && (
                      <div>
                        <span className="font-medium">One-Pager Link:</span>{" "}
                        <a
                          href={change.onePagerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {change.onePagerLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Affected Metrics & Visualizations */}
              <div className="pt-2 border-t space-y-2">
                <div className="text-xs font-medium text-muted-foreground">{t.upload.impactLabel}</div>
                {change.affectedMetrics.metrics.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">{t.upload.metricsLabel}</span>{" "}
                    {change.affectedMetrics.metrics.join(", ")}
                  </div>
                )}
                {change.affectedMetrics.visualizations.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">{t.upload.visualizationsLabel}</span>{" "}
                    {change.affectedMetrics.visualizations.slice(0, 3).join(", ")}
                    {change.affectedMetrics.visualizations.length > 3 && (
                      <span className="text-muted-foreground">
                        {" "}
                        +{change.affectedMetrics.visualizations.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                {change.affectedMetrics.pages.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">{t.upload.pagesLabel}</span>{" "}
                    {change.affectedMetrics.pages.join(", ")}
                  </div>
                )}
                {change.affectedMetrics.calculations.length > 0 && (
                  <div className="text-xs text-muted-foreground italic">
                    {change.affectedMetrics.calculations[0]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

