"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import type { Complaint, Delivery, Plant } from "@/lib/domain/types";

interface FileUploadProps {
  onComplaintsLoaded: (complaints: Complaint[]) => void;
  onDeliveriesLoaded: (deliveries: Delivery[]) => void;
  onPlantsLoaded: (plants: Plant[]) => void;
}

export function FileUpload({
  onComplaintsLoaded,
  onDeliveriesLoaded,
  onPlantsLoaded,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadedFiles((prev) => [...prev, ...files]);

    try {
      // Determine file type based on filename
      const complaintsFiles: File[] = [];
      const deliveriesFiles: File[] = [];
      const plantsFiles: File[] = [];

      for (const file of files) {
        const name = file.name.toLowerCase();
        if (
          name.includes("complaint") ||
          name.includes("q cockpit") ||
          name.includes("qos") ||
          name.includes("deviation") ||
          name.includes("ppap") ||
          name.includes("notif")
        ) {
          complaintsFiles.push(file);
        } else if (
          name.includes("outbound") ||
          name.includes("inbound") ||
          name.includes("delivery")
        ) {
          deliveriesFiles.push(file);
        } else if (name.includes("plant") || name.includes("webasto")) {
          plantsFiles.push(file);
        } else {
          // Default: try to parse as complaints if uncertain
          complaintsFiles.push(file);
        }
      }

      // Upload complaints
      if (complaintsFiles.length > 0) {
        const formData = new FormData();
        formData.append("fileType", "complaints");
        complaintsFiles.forEach((file) => formData.append("files", file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.complaints) {
            onComplaintsLoaded(data.complaints as Complaint[]);
          }
        }
      }

      // Upload deliveries
      if (deliveriesFiles.length > 0) {
        const formData = new FormData();
        formData.append("fileType", "deliveries");
        deliveriesFiles.forEach((file) => formData.append("files", file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.deliveries) {
            onDeliveriesLoaded(data.deliveries as Delivery[]);
          }
        }
      }

      // Upload plants
      if (plantsFiles.length > 0) {
        const formData = new FormData();
        formData.append("fileType", "plants");
        plantsFiles.forEach((file) => formData.append("files", file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.plants) {
            onPlantsLoaded(data.plants as Plant[]);
          }
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Excel Files</CardTitle>
        <CardDescription>
          Upload complaint notifications, delivery data, and plant information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="file-upload">
              <Button asChild disabled={uploading}>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Select Files"}
                </span>
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded Files:</p>
              <div className="space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

