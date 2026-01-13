"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, AlertTriangle } from "lucide-react";
import type { Complaint } from "@/lib/domain/types";
import type { ChangeHistoryEntry } from "@/lib/data/uploadSummary";
import { getAffectedMetricsForComplaint } from "@/lib/data/uploadSummary";

interface ComplaintRowEditorProps {
  complaint: Complaint;
  status?: {
    complaintId: string;
    notificationNumber: string;
    status: "converted" | "failed" | "needs_attention" | "not_applicable";
    originalValue: number;
    originalUnit: string;
    convertedValue?: number;
    error?: string;
    materialDescription?: string;
  };
  onSave: (complaint: Complaint, change: ChangeHistoryEntry) => void;
  onCancel: () => void;
}

export function ComplaintRowEditor({
  complaint,
  status,
  onSave,
  onCancel,
}: ComplaintRowEditorProps) {
  const [defectiveParts, setDefectiveParts] = useState(complaint.defectiveParts.toString());
  const [unitOfMeasure, setUnitOfMeasure] = useState(complaint.unitOfMeasure || "PC");
  const [materialDescription, setMaterialDescription] = useState(complaint.materialDescription || "");
  const [reason, setReason] = useState("");
  const [conversionMadeBy, setConversionMadeBy] = useState("");
  const [convertedValue, setConvertedValue] = useState<number | null>(
    status?.convertedValue || null
  );
  const [conversionError, setConversionError] = useState<string | null>(status?.error || null);

  // Try to convert when unit or material description changes
  useEffect(() => {
    if (unitOfMeasure && unitOfMeasure.toUpperCase() === "PC") {
      const value = parseFloat(defectiveParts);
      setConvertedValue(isNaN(value) ? null : value);
      setConversionError(null);
    } else if (unitOfMeasure && unitOfMeasure.toUpperCase() !== "PC") {
      const value = parseFloat(defectiveParts);
      if (!isNaN(value) && value > 0) {
        // Import conversion utility
        import("@/lib/utils/unitConversion").then(({ convertToPCClient }) => {
          const result = convertToPCClient(value, unitOfMeasure, materialDescription);
          if (result) {
            setConvertedValue(result.convertedValue);
            setConversionError(result.error || null);
          } else {
            setConvertedValue(null);
            setConversionError("Unit conversion not supported for this unit type.");
          }
        }).catch(() => {
          setConvertedValue(null);
          setConversionError("Conversion utility not available.");
        });
      } else {
        setConvertedValue(null);
        setConversionError(null);
      }
    }
  }, [defectiveParts, unitOfMeasure, materialDescription]);

  const handleSave = () => {
    const newValue = parseFloat(defectiveParts);
    if (isNaN(newValue)) {
      alert("Please enter a valid number for defective parts");
      return;
    }

    // Validate mandatory "Conversion made by" field
    if (!conversionMadeBy || conversionMadeBy.trim() === "") {
      alert("Please enter the name of the person who made the conversion");
      return;
    }

    // If a conversion was made, use the converted value and set unit to PC
    const finalValue = convertedValue !== null ? convertedValue : newValue;
    const finalUnit = convertedValue !== null ? "PC" : (unitOfMeasure || undefined);
    
    const fieldChanged = complaint.defectiveParts !== finalValue ? "defectiveParts" : 
                        complaint.unitOfMeasure !== finalUnit ? "unitOfMeasure" : 
                        complaint.materialDescription !== materialDescription ? "materialDescription" : "other";

    const updatedComplaint: Complaint = {
      ...complaint,
      defectiveParts: finalValue, // Use converted value if available
      unitOfMeasure: finalUnit, // Set to PC if conversion was made
      materialDescription: materialDescription || undefined,
      conversion: convertedValue !== null && status && status.originalValue !== finalValue ? {
        originalValue: status.originalValue,
        originalUnit: status.originalUnit,
        convertedValue: finalValue,
        wasConverted: true,
        materialDescription: materialDescription || undefined,
      } : complaint.conversion,
    };

    const affectedMetrics = getAffectedMetricsForComplaint(updatedComplaint, fieldChanged);

    const change: ChangeHistoryEntry = {
      id: `change_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      editor: conversionMadeBy.trim(), // Use the conversion made by name
      recordId: complaint.id,
      recordType: "complaint",
      field: fieldChanged,
      oldValue: complaint.defectiveParts,
      newValue: finalValue,
      reason: reason || undefined,
      changeType: status?.status === "failed" ? "conversion" : "manual_edit",
      affectedMetrics,
    };

    onSave(updatedComplaint, change);
  };

  return (
    <div className="p-4 bg-muted/30 border border-border rounded-md space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-medium">Edit Complaint: {complaint.notificationNumber}</div>
          <div className="text-xs text-muted-foreground">
            Site: {complaint.siteCode} | Type: {complaint.notificationType}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="bg-[#00FF88] hover:bg-[#00FF88]/90 text-black">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={onCancel} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Defective Parts (Original)</Label>
          <Input
            type="number"
            value={defectiveParts}
            onChange={(e) => setDefectiveParts(e.target.value)}
            placeholder="Enter value"
          />
        </div>

        <div className="space-y-2">
          <Label>Unit of Measure</Label>
          <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PC">PC (Pieces)</SelectItem>
              <SelectItem value="ML">ML (Milliliters)</SelectItem>
              <SelectItem value="M">M (Meters)</SelectItem>
              <SelectItem value="M2">M2 (Square Meters)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2">
          <Label>Material Description</Label>
          <Textarea
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            placeholder="Enter material description (e.g., '600 ML' or 'L6100MM')"
            rows={2}
          />
          <div className="text-xs text-muted-foreground">
            For ML: Include bottle size (e.g., "600 ML"). For M: Include length (e.g., "L6100MM"). For M2: Include dimensions (e.g., "W1000MM H2000MM").
          </div>
        </div>

        {convertedValue !== null && (
          <div className="space-y-2">
            <Label>Converted Value (PC)</Label>
            <Input
              type="number"
              value={convertedValue.toFixed(2)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setConvertedValue(val);
              }}
              step="0.01"
            />
            <div className="text-xs text-muted-foreground">
              You can manually adjust the converted value if needed.
            </div>
          </div>
        )}

        {conversionError && (
          <div className="col-span-2 p-3 bg-red-500/20 dark:bg-red-500/30 border-2 border-red-500 dark:border-red-400 rounded-md text-sm font-medium text-red-700 dark:text-red-300">
            <span className="font-bold">Conversion Error:</span> {conversionError}
          </div>
        )}

        <div className="space-y-2 col-span-2">
          <Label>Reason for Change (Optional)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this change was made..."
            rows={2}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label>
            Conversion made by <span className="text-red-600 dark:text-red-400 font-bold">*</span>
          </Label>
          <Input
            type="text"
            value={conversionMadeBy}
            onChange={(e) => setConversionMadeBy(e.target.value)}
            placeholder="Enter your name"
            required
            className={!conversionMadeBy || conversionMadeBy.trim() === "" ? "border-2 border-red-500 dark:border-red-400 focus:border-red-600 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400" : ""}
          />
          <div className="text-xs text-muted-foreground">
            This field is required before saving the conversion.
          </div>
        </div>
      </div>

      {status?.status === "failed" && (
        <div className="p-4 bg-red-500/20 dark:bg-red-500/30 border-2 border-red-500 dark:border-red-400 rounded-md text-sm">
          <div className="font-bold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Conversion Failed
          </div>
          <div className="text-red-800 dark:text-red-200 font-medium">
            {status.error || "Could not convert to PC. Please provide material description or enter converted value manually."}
          </div>
        </div>
      )}
    </div>
  );
}

