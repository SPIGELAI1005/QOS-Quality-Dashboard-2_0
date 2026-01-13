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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [filterByPlant, setFilterByPlant] = useState<string>("all");
  const [filterByUnit, setFilterByUnit] = useState<string>("all");
  const [filterByType, setFilterByType] = useState<string>("all");

  const conversionStatus = summary.conversionStatus.complaints || [];

  const allComplaints = useMemo(() => {
    // Use edited complaints if available, otherwise reconstruct from minimal stored data
    const base: any[] = summary.processedData.complaints || summary.rawData.complaints || [];
    
    // Reconstruct full complaints from minimal stored data + conversion status
    const fullComplaints = base.map((c: any) => {
      // If complaint is already full (has all required fields), return as is
      if ('category' in c && 'plant' in c && 'source' in c && 'defectiveParts' in c) {
        return c as Complaint;
      }
      
      // Otherwise, reconstruct from minimal data + conversion status
      const status = conversionStatus.find(s => s.complaintId === c.id);
      const notificationType = c.notificationType || status?.notificationType || status?.notificationNumber?.match(/^Q[123]/)?.[0] || 'Q1';
      
      // Determine category from notification type
      let category: any = 'CustomerComplaint';
      if (notificationType === 'Q2') category = 'SupplierComplaint';
      else if (notificationType === 'Q3') category = 'InternalComplaint';
      
      return {
        id: c.id,
        notificationNumber: c.notificationNumber || status?.notificationNumber || '',
        notificationType: notificationType as any,
        category,
        plant: c.plant || c.siteCode || status?.siteCode || '',
        siteCode: c.siteCode || status?.siteCode || '',
        siteName: c.siteName,
        createdOn: typeof c.createdOn === 'string' ? new Date(c.createdOn) : (c.createdOn || new Date()),
        defectiveParts: status?.originalValue || c.defectiveParts || 0,
        source: 'Import' as any,
        unitOfMeasure: status?.originalUnit || c.unitOfMeasure || 'PC',
        materialDescription: status?.materialDescription || c.materialDescription || '',
        materialNumber: (c as any).materialNumber,
        conversion: status?.convertedValue ? {
          originalValue: status.originalValue,
          originalUnit: status.originalUnit,
          convertedValue: status.convertedValue,
          wasConverted: true,
          materialDescription: status.materialDescription,
        } : undefined,
      } as Complaint;
    });
    
    const edited = Array.from(editedComplaints.values());
    const editedIds = new Set(edited.map(c => c.id));
    const unchanged = fullComplaints.filter(c => !editedIds.has(c.id));
    return [...unchanged, ...edited];
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
    if (filterByPlant !== "all") {
      filtered = filtered.filter(c => c.siteCode === filterByPlant);
    }
    
    // Filter by unit of measure
    if (filterByUnit !== "all") {
      filtered = filtered.filter(c => (c.unitOfMeasure || "PC") === filterByUnit);
    }
    
    // Filter by notification type
    if (filterByType !== "all") {
      filtered = filtered.filter(c => c.notificationType === filterByType);
    }
    
    return filtered;
  }, [allComplaints, conversionStatus, filterByIssues, filterByPlant, filterByUnit, filterByType]);

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
    const updatedSummary: UploadSummaryEntry = {
      ...summary,
      processedData: {
        ...summary.processedData,
        complaints: complaints,
      },
      changeHistory: [...summary.changeHistory, ...pendingChanges],
      summary: {
        ...summary.summary,
        recordsCorrected: summary.summary.recordsCorrected + pendingChanges.length,
        recordsUnchanged: summary.summary.totalRecords - (summary.summary.recordsCorrected + pendingChanges.length),
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
            <Select value={filterByPlant} onValueChange={setFilterByPlant}>
              <SelectTrigger id="filter-plant" className="h-9">
                <SelectValue placeholder="All plants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plants</SelectItem>
                {availablePlants.filter(plant => plant && plant.trim() !== "").map((plant) => (
                  <SelectItem key={plant} value={plant}>
                    {plant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Unit of Measure */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-unit" className="text-xs text-muted-foreground">Unit of Measure</Label>
            <Select value={filterByUnit} onValueChange={setFilterByUnit}>
              <SelectTrigger id="filter-unit" className="h-9">
                <SelectValue placeholder="All units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                {availableUnits.filter(unit => unit && unit.trim() !== "").map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Notification Type */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-type" className="text-xs text-muted-foreground">Notification Type</Label>
            <Select value={filterByType} onValueChange={setFilterByType}>
              <SelectTrigger id="filter-type" className="h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {availableTypes.filter(type => type && type.trim() !== "").map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(filterByIssues || filterByPlant !== "all" || filterByUnit !== "all" || filterByType !== "all") && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Showing {complaints.length} of {allComplaints.length} records
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterByIssues(false);
                setFilterByPlant("all");
                setFilterByUnit("all");
                setFilterByType("all");
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

