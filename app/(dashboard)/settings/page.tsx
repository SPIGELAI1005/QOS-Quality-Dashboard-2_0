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
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function SettingsPage() {
  const { t } = useTranslation();
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
        <h2 className="text-2xl font-bold tracking-tight">{t.settings.title}</h2>
        <p className="text-muted-foreground">
          {t.settings.subtitle}
        </p>
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai">{t.settings.aiConfigurationTab}</TabsTrigger>
          <TabsTrigger value="mappings">{t.settings.columnMappingsTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.aiConfiguration}</CardTitle>
              <CardDescription>
                {t.settings.aiConfigurationDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">{t.settings.environmentVariablesRequired}</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-background px-1 rounded">AI_API_KEY</code> - {t.settings.aiApiKeyDescription}</li>
                  <li><code className="bg-background px-1 rounded">AI_PROVIDER</code> - {t.settings.aiProviderDescription}</li>
                  <li><code className="bg-background px-1 rounded">AI_MODEL</code> - {t.settings.aiModelDescription}</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  {t.settings.apiKeyNote}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.columnMappings}</CardTitle>
              <CardDescription>
                {t.settings.columnMappingsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t.settings.complaintFileMappings}</h4>
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
                          placeholder={t.settings.commaSeparatedColumnNames}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {values.length} {t.settings.mappingsConfigured}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">{t.settings.deliveryFileMappings}</h4>
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
                          placeholder={t.settings.commaSeparatedColumnNames}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {Array.isArray(values) ? values.length : 0} {t.settings.mappingsConfigured}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button onClick={handleSaveMappings}>
                    {saved ? t.settings.saved : t.settings.saveMappings}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setComplaintMapping(DEFAULT_COMPLAINT_COLUMN_MAPPING);
                      setDeliveryMapping(DEFAULT_DELIVERY_COLUMN_MAPPING);
                    }}
                  >
                    {t.settings.resetToDefaults}
                  </Button>
                  {saved && (
                    <span className="text-sm text-success">{t.settings.mappingsSaved}</span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {t.settings.mappingsNote}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

