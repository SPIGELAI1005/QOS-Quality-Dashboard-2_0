/**
 * User-driven Management Summary export configuration.
 */

export interface ManagementSummaryExportPayload {
  version: 1;
  /** Report title shown on PDF cover (user may override recommended default). */
  title: string;
  /** Optional logo image as data URL (PNG/JPEG). If omitted, app logo will be used. */
  logoDataUrl?: string;
  /** Plants included in the summary; synced to global filters before PDF generation. */
  plantCodes: string[];
  /** Optional remarks / top topics per plant code. */
  plantRemarks: Record<string, string>;
  /** Selected exportable section ids (see section-catalog). */
  sectionIds: string[];
  /**
   * Reporting month anchor in YYYY-MM (e.g. "2026-04"). Defaults to the previous
   * calendar month. The PDF aggregates the trailing 12 months ending at this key
   * and shows per-month values for this anchor as the "reported month".
   */
  reportMonthKey?: string;
}

export function isManagementSummaryPayload(value: unknown): value is ManagementSummaryExportPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as ManagementSummaryExportPayload;
  return (
    v.version === 1 &&
    typeof v.title === "string" &&
    (v.logoDataUrl === undefined || typeof v.logoDataUrl === "string") &&
    Array.isArray(v.plantCodes) &&
    typeof v.plantRemarks === "object" &&
    v.plantRemarks !== null &&
    Array.isArray(v.sectionIds) &&
    (v.reportMonthKey === undefined || typeof v.reportMonthKey === "string")
  );
}
