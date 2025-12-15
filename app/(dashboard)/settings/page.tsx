"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_COMPLAINT_COLUMN_MAPPING,
  DEFAULT_DELIVERY_COLUMN_MAPPING,
  type ComplaintColumnMapping,
  type DeliveryColumnMapping,
} from "@/lib/config/columnMappings";

export default function SettingsPage() {
  const [complaintMapping, setComplaintMapping] = useState<ComplaintColumnMapping>(
    DEFAULT_COMPLAINT_COLUMN_MAPPING
  );
  const [deliveryMapping, setDeliveryMapping] = useState<DeliveryColumnMapping>(
    DEFAULT_DELIVERY_COLUMN_MAPPING
  );
  const [saved, setSaved] = useState(false);

  const handleSaveMappings = () => {
    // TODO: Save to localStorage or backend
    // For now, just show confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    console.log("Column mappings:", { complaintMapping, deliveryMapping });
  };

  const updateComplaintMapping = (
    field: keyof ComplaintColumnMapping,
    value: string[]
  ) => {
    setComplaintMapping((prev) => ({ ...prev, [field]: value }));
  };

  const updateDeliveryMapping = (
    field: keyof DeliveryColumnMapping,
    value: string[]
  ) => {
    setDeliveryMapping((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="mappings">Column Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure AI insights API keys (set in environment variables)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Environment Variables Required:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-background px-1 rounded">AI_API_KEY</code> - Your LLM API key</li>
                  <li><code className="bg-background px-1 rounded">AI_PROVIDER</code> - "openai" or "anthropic" (optional, defaults to "openai")</li>
                  <li><code className="bg-background px-1 rounded">AI_MODEL</code> - Model name override (optional)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  Note: API keys are configured server-side in <code>.env.local</code> for security.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Column Mappings</CardTitle>
              <CardDescription>
                Customize how Excel column names map to internal fields
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Complaint File Mappings</h4>
                  <div className="space-y-3">
                    {Object.entries(complaintMapping).map(([field, values]) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs font-medium capitalize">
                          {field.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <Input
                          value={values.join(", ")}
                          onChange={(e) => {
                            const newValues = e.target.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter((v) => v.length > 0);
                            updateComplaintMapping(field as keyof ComplaintColumnMapping, newValues);
                          }}
                          placeholder="Comma-separated column names"
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {values.length} mapping(s) configured
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Delivery File Mappings</h4>
                  <div className="space-y-3">
                    {Object.entries(deliveryMapping).map(([field, values]) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs font-medium capitalize">
                          {field.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <Input
                          value={Array.isArray(values) ? values.join(", ") : ""}
                          onChange={(e) => {
                            const newValues = e.target.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter((v) => v.length > 0);
                            updateDeliveryMapping(field as keyof DeliveryColumnMapping, newValues);
                          }}
                          placeholder="Comma-separated column names"
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {Array.isArray(values) ? values.length : 0} mapping(s) configured
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button onClick={handleSaveMappings}>
                    {saved ? "Saved!" : "Save Mappings"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setComplaintMapping(DEFAULT_COMPLAINT_COLUMN_MAPPING);
                      setDeliveryMapping(DEFAULT_DELIVERY_COLUMN_MAPPING);
                    }}
                  >
                    Reset to Defaults
                  </Button>
                  {saved && (
                    <span className="text-sm text-success">Mappings saved!</span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Note: Custom mappings are currently stored in browser memory. Full persistence coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

