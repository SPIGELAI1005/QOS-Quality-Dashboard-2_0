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
            <CardTitle>Change History</CardTitle>
            <CardDescription>
              Track all manual corrections and conversions made to uploaded data
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end p-4 bg-muted/30 rounded-md">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Record Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="complaint">Complaints</SelectItem>
                <SelectItem value="delivery">Deliveries</SelectItem>
                <SelectItem value="ppap">PPAP</SelectItem>
                <SelectItem value="deviation">Deviations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Change Type</Label>
            <Select value={filterChangeType} onValueChange={setFilterChangeType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Changes</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
                <SelectItem value="manual_edit">Manual Edit</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="bulk_action">Bulk Action</SelectItem>
                <SelectItem value="new_entry">New Entry</SelectItem>
                <SelectItem value="file_upload">File Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Record ID</Label>
            <Input
              placeholder="Filter by ID..."
              value={filterRecordId}
              onChange={(e) => setFilterRecordId(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Editor</Label>
            <Input
              placeholder="Filter by editor..."
              value={filterEditor}
              onChange={(e) => setFilterEditor(e.target.value)}
              className="w-[120px]"
            />
          </div>
          <Button onClick={clearFilters} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Changes List */}
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Showing {filteredChanges.length} of {changes.length} change{changes.length !== 1 ? "s" : ""}
          </div>
          {filteredChanges.map((change) => (
            <div
              key={change.id}
              className="border rounded-md p-4 space-y-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline">{change.recordType.replace("_", " ")}</Badge>
                    <Badge
                      variant={
                        change.changeType === "conversion" || change.changeType === "new_entry" || change.changeType === "file_upload"
                          ? "default"
                          : change.changeType === "manual_edit"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {change.changeType.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {formatDate(new Date(change.timestamp))}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Recorded By:</span>{" "}
                      <span className="font-semibold text-foreground">{change.editor}</span>
                    </div>
                    <div>
                      <span className="font-medium">Record ID:</span>{" "}
                      <span className="font-mono text-xs">{change.recordId}</span>
                    </div>
                    {change.field !== "all" && (
                      <div>
                        <span className="font-medium">Field:</span> {change.field}
                      </div>
                    )}
                    {change.field === "all" ? (
                      <div>
                        <span className="font-medium">Data Added/Changed:</span>{" "}
                        <span className="text-muted-foreground">
                          {change.recordType === "manual_entry" 
                            ? "Complete manual form entry with all KPI fields"
                            : change.recordType === "file_upload"
                            ? `File upload: ${change.dataDetails?.files?.map((f: any) => f.name).join(", ") || "Multiple files"}`
                            : "Multiple fields"}
                        </span>
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
                    {change.reason && (
                      <div>
                        <span className="font-medium">Reason:</span> {change.reason}
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
                <div className="text-xs font-medium text-muted-foreground">Impact:</div>
                {change.affectedMetrics.metrics.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">Metrics:</span>{" "}
                    {change.affectedMetrics.metrics.join(", ")}
                  </div>
                )}
                {change.affectedMetrics.visualizations.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">Visualizations:</span>{" "}
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
                    <span className="font-medium">Pages:</span>{" "}
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

