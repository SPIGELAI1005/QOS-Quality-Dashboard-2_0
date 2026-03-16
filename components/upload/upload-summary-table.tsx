"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CheckCircle2, Edit, X, Save, AlertCircle, Filter } from "lucide-react";
import type { Complaint } from "@/lib/domain/types";
import type { UploadSummaryEntry, ChangeHistoryEntry } from "@/lib/data/uploadSummary";
import { ComplaintRowEditor } from "./complaint-row-editor";
import { cn } from "@/lib/utils";

interface UploadSummaryTableProps {
  summary: UploadSummaryEntry;
  onSave: (summary: UploadSummaryEntry, changes: ChangeHistoryEntry[]) => void;
  editorRole: boolean;
}

export function UploadSummaryTable({ summary, onSave, editorRole }: UploadSummaryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedComplaints, setEditedComplaints] = useState<Map<string, Complaint>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<ChangeHistoryEntry[]>([]);
  
  // Filter states
  const [filterByIssues, setFilterByIssues] = useState<boolean>(false);
  const [filterByPlant, setFilterByPlant] = useState<string[]>([]);
  const [filterByUnit, setFilterByUnit] = useState<string[]>([]);
  const [filterByType, setFilterByType] = useState<string[]>([]);

  const conversionStatus = summary.conversionStatus.complaints || [];

  const allComplaints = useMemo(() => {
    const rawBase: any[] = summary.rawData.complaints || [];
    const correctedBase: any[] = summary.processedData.complaints || [];

    function reconstructComplaint(c: any): Complaint {
      // If complaint is already full (has all required fields), normalize date and return
      if ("category" in c && "plant" in c && "source" in c && "defectiveParts" in c) {
        return {
          ...(c as Complaint),
          createdOn: typeof c.createdOn === "string" ? new Date(c.createdOn) : (c.createdOn || new Date()),
        };
      }

      // Reconstruct from minimal data + conversion status
      const status = conversionStatus.find((s) => s.complaintId === c.id);
      const notificationType =
        c.notificationType || status?.notificationType || status?.notificationNumber?.match(/^Q[123]/)?.[0] || "Q1";

      let category: any = "CustomerComplaint";
      if (notificationType === "Q2") category = "SupplierComplaint";
      else if (notificationType === "Q3") category = "InternalComplaint";

      return {
        id: c.id,
        notificationNumber: c.notificationNumber || status?.notificationNumber || "",
        notificationType: notificationType as any,
        category,
        plant: c.plant || c.siteCode || status?.siteCode || "",
        siteCode: c.siteCode || status?.siteCode || "",
        siteName: c.siteName,
        createdOn: typeof c.createdOn === "string" ? new Date(c.createdOn) : (c.createdOn || new Date()),
        defectiveParts: status?.originalValue ?? c.defectiveParts ?? 0,
        source: "Import" as any,
        unitOfMeasure: status?.originalUnit || c.unitOfMeasure || "PC",
        materialDescription: status?.materialDescription || c.materialDescription || "",
        materialNumber: (c as any).materialNumber,
        conversion: status?.convertedValue
          ? {
              originalValue: status.originalValue,
              originalUnit: status.originalUnit,
              convertedValue: status.convertedValue,
              wasConverted: true,
              materialDescription: status.materialDescription,
            }
          : undefined,
      } as Complaint;
    }

    const combinedById = new Map<string, Complaint>();
    rawBase.forEach((item) => {
      const reconstructed = reconstructComplaint(item);
      combinedById.set(reconstructed.id, reconstructed);
    });

    // Corrected values from processed data override raw reconstructed values
    correctedBase.forEach((item) => {
      const reconstructed = reconstructComplaint(item);
      combinedById.set(reconstructed.id, reconstructed);
    });

    // Unsaved edits from current session override both
    editedComplaints.forEach((item) => combinedById.set(item.id, item));

    return Array.from(combinedById.values());
  }, [summary, editedComplaints, conversionStatus]);
  
  // Get unique values for filters (filter out empty strings)
  const availablePlants = useMemo(() => {
    return Array.from(new Set(allComplaints.map(c => c.siteCode).filter(s => s && s.trim() !== ""))).sort();
  }, [allComplaints]);
  
  const availableUnits = useMemo(() => {
    return Array.from(new Set(allComplaints.map(c => c.unitOfMeasure || "PC").filter(u => u && u.trim() !== ""))).sort();
  }, [allComplaints]);
  
  const availableTypes = useMemo(() => {
    return Array.from(new Set(allComplaints.map(c => c.notificationType).filter(t => t && t.trim() !== ""))).sort();
  }, [allComplaints]);

  const unitFilterLabel = useMemo(() => {
    if (filterByUnit.length === 0) return "All units";
    if (filterByUnit.length === 1) return filterByUnit[0];
    return `${filterByUnit.length} units selected`;
  }, [filterByUnit]);

  const plantFilterLabel = useMemo(() => {
    if (filterByPlant.length === 0) return "All plants";
    if (filterByPlant.length === 1) return filterByPlant[0];
    return `${filterByPlant.length} plants selected`;
  }, [filterByPlant]);

  const typeFilterLabel = useMemo(() => {
    if (filterByType.length === 0) return "All types";
    if (filterByType.length === 1) return filterByType[0];
    return `${filterByType.length} types selected`;
  }, [filterByType]);

  // Filter complaints based on filter criteria
  const complaints = useMemo(() => {
    let filtered = allComplaints;
    
    // Filter by issues
    if (filterByIssues) {
      filtered = filtered.filter(c => {
        const status = conversionStatus.find(s => s.complaintId === c.id);
        return status?.status === "failed" || status?.status === "needs_attention";
      });
    }
    
    // Filter by plant
    if (filterByPlant.length > 0) {
      filtered = filtered.filter(c => filterByPlant.includes(c.siteCode));
    }
    
    // Filter by unit of measure
    if (filterByUnit.length > 0) {
      filtered = filtered.filter(c => filterByUnit.includes(c.unitOfMeasure || "PC"));
    }
    
    // Filter by notification type
    if (filterByType.length > 0) {
      filtered = filtered.filter(c => filterByType.includes(c.notificationType));
    }
    
    return filtered;
  }, [allComplaints, conversionStatus, filterByIssues, filterByPlant, filterByUnit, filterByType]);

  function toggleUnitFilter(unit: string) {
    setFilterByUnit((previous) =>
      previous.includes(unit) ? previous.filter((value) => value !== unit) : [...previous, unit]
    );
  }

  function togglePlantFilter(plant: string) {
    setFilterByPlant((previous) =>
      previous.includes(plant) ? previous.filter((value) => value !== plant) : [...previous, plant]
    );
  }

  function toggleTypeFilter(type: string) {
    setFilterByType((previous) =>
      previous.includes(type) ? previous.filter((value) => value !== type) : [...previous, type]
    );
  }

  const handleEdit = (complaint: Complaint) => {
    setEditingId(complaint.id);
  };

  const handleSaveEdit = (complaint: Complaint, change: ChangeHistoryEntry) => {
    setEditedComplaints(prev => {
      const next = new Map(prev);
      next.set(complaint.id, complaint);
      return next;
    });
    setPendingChanges(prev => [...prev, change]);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveAll = () => {
    const existingProcessedMap = new Map((summary.processedData.complaints || []).map((item: any) => [item.id, item as Complaint]));
    editedComplaints.forEach((item) => existingProcessedMap.set(item.id, item));
    const mergedProcessedComplaints = Array.from(existingProcessedMap.values());
    const mergedChangeHistory = [...summary.changeHistory, ...pendingChanges];
    const correctedComplaintIds = new Set(
      mergedChangeHistory.filter((change) => change.recordType === "complaint").map((change) => change.recordId)
    );

    const updatedSummary: UploadSummaryEntry = {
      ...summary,
      processedData: {
        ...summary.processedData,
        complaints: mergedProcessedComplaints,
      },
      changeHistory: mergedChangeHistory,
      summary: {
        ...summary.summary,
        recordsCorrected: correctedComplaintIds.size,
        recordsUnchanged: Math.max(summary.summary.totalRecords - correctedComplaintIds.size, 0),
      },
    };
    onSave(updatedSummary, pendingChanges);
    setPendingChanges([]);
    setEditedComplaints(new Map());
  };

  const getStatusBadge = (complaint: Complaint) => {
    const status = conversionStatus.find(s => s.complaintId === complaint.id);
    if (!status) {
      return <Badge variant="secondary">N/A</Badge>;
    }

    switch (status.status) {
      case "converted":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Converted
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-600 dark:bg-red-500 text-white font-semibold border-2 border-red-700 dark:border-red-400">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "needs_attention":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Attention
          </Badge>
        );
      default:
        return <Badge variant="secondary">Not Applicable</Badge>;
    }
  };

  const hasIssues = (complaint: Complaint) => {
    const status = conversionStatus.find(s => s.complaintId === complaint.id);
    return status?.status === "failed" || status?.status === "needs_attention";
  };

  if (complaints.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No complaints data available for this upload.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingChanges.length > 0 && editorRole && (
        <div className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-md">
          <div className="text-sm text-muted-foreground">
            {pendingChanges.length} change{pendingChanges.length !== 1 ? "s" : ""} pending
          </div>
          <Button onClick={handleSaveAll} size="sm" className="bg-[#00FF88] hover:bg-[#00FF88]/90 text-black">
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      )}

      {/* Filter Section */}
      <div className="rounded-md border p-4 space-y-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter by Issues */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="filter-issues"
              checked={filterByIssues}
              onChange={(e) => setFilterByIssues(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="filter-issues" className="text-sm cursor-pointer">
              Show only records with issues
            </Label>
          </div>

          {/* Filter by Plant */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-plant" className="text-xs text-muted-foreground">Plant</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="filter-plant" type="button" variant="outline" className="h-9 w-full justify-between font-normal">
                  <span className="truncate">{plantFilterLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[260px] p-2 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => setFilterByPlant([])}
                >
                  All plants
                </Button>
                {availablePlants.filter(plant => plant && plant.trim() !== "").map((plant) => (
                  <label key={plant} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={filterByPlant.includes(plant)}
                      onCheckedChange={() => togglePlantFilter(plant)}
                    />
                    <span>{plant}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Filter by Unit of Measure */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-unit" className="text-xs text-muted-foreground">Unit of Measure</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="filter-unit" type="button" variant="outline" className="h-9 w-full justify-between font-normal">
                  <span className="truncate">{unitFilterLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[260px] p-2 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => setFilterByUnit([])}
                >
                  All units
                </Button>
                {availableUnits.filter(unit => unit && unit.trim() !== "").map((unit) => (
                  <label key={unit} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={filterByUnit.includes(unit)}
                      onCheckedChange={() => toggleUnitFilter(unit)}
                    />
                    <span>{unit}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Filter by Notification Type */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-type" className="text-xs text-muted-foreground">Notification Type</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="filter-type" type="button" variant="outline" className="h-9 w-full justify-between font-normal">
                  <span className="truncate">{typeFilterLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[260px] p-2 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => setFilterByType([])}
                >
                  All types
                </Button>
                {availableTypes.filter(type => type && type.trim() !== "").map((type) => (
                  <label key={type} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={filterByType.includes(type)}
                      onCheckedChange={() => toggleTypeFilter(type)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {(filterByIssues || filterByPlant.length > 0 || filterByUnit.length > 0 || filterByType.length > 0) && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Showing {complaints.length} of {allComplaints.length} records
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterByIssues(false);
                setFilterByPlant([]);
                setFilterByUnit([]);
                setFilterByType([]);
              }}
              className="h-7 text-xs"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead>Notification #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Original Value</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Converted Value</TableHead>
              <TableHead>Converted Unit</TableHead>
              <TableHead>Material Number</TableHead>
              <TableHead>Material Description</TableHead>
              {editorRole && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint) => {
              const status = conversionStatus.find(s => s.complaintId === complaint.id);
              const isEditing = editingId === complaint.id;
              const hasIssue = hasIssues(complaint);

              if (isEditing) {
                return (
                  <TableRow key={complaint.id}>
                    <TableCell colSpan={editorRole ? 12 : 11}>
                      <ComplaintRowEditor
                        complaint={complaint}
                        status={status}
                        onSave={(c, change) => handleSaveEdit(c, change)}
                        onCancel={handleCancelEdit}
                      />
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow
                  key={complaint.id}
                  className={cn(
                    hasIssue && "bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-l-amber-500"
                  )}
                >
                  <TableCell>{getStatusBadge(complaint)}</TableCell>
                  <TableCell className="font-mono text-sm">{complaint.notificationNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{complaint.notificationType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{complaint.siteCode}</div>
                    {complaint.siteName && (
                      <div className="text-xs text-muted-foreground">{complaint.siteName}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(complaint.createdOn).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {status?.originalValue.toLocaleString("de-DE") || complaint.defectiveParts.toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {/* Show PC if conversion was made, otherwise show original unit */}
                      {complaint.conversion?.wasConverted ? "PC" : (complaint.unitOfMeasure || "PC")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {/* Show converted value if conversion exists, otherwise show current defectiveParts (which may be converted) */}
                    {complaint.conversion?.convertedValue !== undefined
                      ? complaint.conversion.convertedValue.toLocaleString("de-DE", { maximumFractionDigits: 2 })
                      : status?.convertedValue !== undefined
                      ? status.convertedValue.toLocaleString("de-DE", { maximumFractionDigits: 2 })
                      : complaint.defectiveParts.toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {/* Show PC if conversion was made, otherwise show "-" */}
                      {complaint.conversion?.wasConverted ? "PC" : (status?.convertedValue !== undefined ? "PC" : "-")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {complaint.materialNumber || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {complaint.materialDescription || "-"}
                  </TableCell>
                  {editorRole && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(complaint)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {complaints.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            Total records: {complaints.length} | Records with issues:{" "}
            {conversionStatus.filter(s => s.status === "failed" || s.status === "needs_attention").length} | 
            Records corrected: {summary.summary.recordsCorrected}
          </div>
          {hasIssues(complaints[0]) && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Rows highlighted in yellow/orange have conversion issues and may need manual correction.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

