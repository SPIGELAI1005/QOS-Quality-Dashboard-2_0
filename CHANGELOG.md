# Changelog

All notable changes to the QOS ET Quality Report project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - 2026-05-07 (PDF refinements)
**Type**: Changed

**Description**: Management Summary PDF visual refinements based on first review

**Details**:
- **Global KPIs page (`Notifications & Defects`)**: removed the per-plant legend from `R12M Total Number of Notifications by Month` and `R12M Total Number of Defects by Month` since the bars show monthly totals, not per-plant distribution. Chart titles updated accordingly. The Q1/Q2/Q3 notification-type legend is kept on the third chart because it is not site-based.
- **Bar value labels always above the bar**: bars in `drawSimpleBarChart` and `drawBarWithTrendLineChart` now reserve 8mm of plot headroom and the value text is drawn at `barTop − 1.3 mm`. The previous fallback that pushed labels inside the bar when it was tall is removed; trend-line projection scales to the same headroom so the line still aligns with bar tops.
- **Plant page layout overhaul**:
  - 6 charts shrunk from 50mm to 44mm in height to free up vertical space.
  - Removed redundant `— <plant code>` suffix from each chart title (the page header already shows the plant); titles now read `Customer Complaints (Q1)`, `Customer Defective Parts`, `Customer PPM`, etc.
  - One tall metric table replaced with **two compact side-by-side tables** (Customer / Supplier), each showing `Metric | <Reported Month> | Last 12 months` for Complaints, Defective Parts, Deliveries, PPM.
  - **Remarks rendered as a dedicated card** (`drawRemarksCard`) below the tables instead of bare text overlapping the table. The card uses the same chrome as the other tables (rounded border, header rule, title, body) and gracefully truncates with `…` if the remarks exceed the available height.

**Files Modified**:
- `components/management-summary/pdf-generator.ts` — bar/label fix, plant-page layout, `drawRemarksCard`, removal of plant legend on global charts

**Breaking Changes**: None

---

### Added - 2026-05-07
**Type**: Added

**Description**: Management Summary report builder (`/management-summary`) with comprehensive PDF export, customizable plant pages, and reporting-month policy

**Details**:
- **Configuration page (`/management-summary`)**:
  - New route launched from the dashboard "Export Management Summary" button.
  - Form fields: report title (with recommended default), optional logo upload (defaults to app sidebar logo), multi-select plants, per-plant Comments / Remarks / Top Topics, and per-section selection (executive overview, notifications & defects, customer/supplier PPM, plant pages).
  - In-page generation status banner replaces the previous redirect-to-dashboard flow; the user stays on `/management-summary` while the PDF builds.
  - Responsive layout (`max-w-5xl` container, scrollable plant list capped at `60vh`/`520px`).
- **Reporting-month policy (May → April)**:
  - New helper `getReportMonthInfo()` (in `lib/management-summary/constants.ts`) returns the **previous calendar month** relative to today (e.g. a report created in May 2026 = April 2026).
  - `ManagementSummaryExportPayload` now carries `reportMonthKey` (`YYYY-MM`); the PDF generator anchors the trailing 12 months on this key, highlights the bar for the reported month, and filenames use this key (`Management_Summary_2026-04_20260507.pdf`).
  - Title input description on `/management-summary` shows the resolved reporting month so the user understands the period.
- **Comprehensive client-side PDF (`components/management-summary/pdf-generator.ts`)**:
  - Page 1 — Executive overview: 4 customer + 4 supplier KPI cards and Executive Context table (Reporting month, Selected Sites X of Y, Period Mode R12M, Sections).
  - Page 2 — Notifications & Defects: total notifications, total defective parts, and notifications by type (Q1/Q2/Q3) bar charts with top‑8 plant legend or type legend; bar values shown above each bar; X-axis labels rendered for every month, rotated 45°; reported-month bar highlighted.
  - Page 3 — Customer PPM: full-width bar+trend chart, Monthly Trend Analysis table (last 8 months + R12M total + reported-month row), and Site Contribution table with totals.
  - Page 4 — Supplier PPM: same structure as Customer PPM.
  - Plant pages (one per selected plant) — **redesigned 3×2 chart grid**:
    - Row 1: Customer Complaints, Customer Defective Parts, Customer PPM (bars + 3-month trend line)
    - Row 2: Supplier Complaints, Supplier Defective Parts, Supplier PPM (bars + 3-month trend line)
    - Reported-month bar highlighted on every plant chart.
    - Comparison table per plant: `Metric | <Reported Month> | Last 12 months` covering Customer/Supplier complaints, defective parts, deliveries, and PPM.
    - Optional `Remarks / Top topics` block beneath the table when a remark is entered for the plant.
  - Logo support in the page header (uploaded logo overrides the default app logo).
  - Subtitle on every page reads: `Rolling 12 Months ending <Month YYYY> | N "Selected Sites"`.
- **Manual upload latest-wins** (carried from earlier in this Unreleased cycle):
  - Manual KPI entries on `/upload` are now deduped by `(month, siteCode)` so the **most recent entry overwrites older duplicates** before KPIs/PPM are recalculated, fixing a regression where the first manual entry could persist instead of the latest one.

**Files Modified / Added**:
- `app/(dashboard)/management-summary/page.tsx` (new) — route shell that renders the client form
- `components/management-summary/management-summary-client.tsx` (new) — configuration form, logo upload, status banner, payload assembly
- `components/management-summary/pdf-generator.ts` (new) — full client-side PDF builder (executive, notifications/defects, customer & supplier PPM, plant pages)
- `lib/management-summary/types.ts` (new) — `ManagementSummaryExportPayload` (incl. `logoDataUrl`, `reportMonthKey`)
- `lib/management-summary/constants.ts` (new) — exportable section ids, default payload, recommended-title helper, `getReportMonthInfo`
- `lib/management-summary/section-catalog.ts` (new) + `section-catalog.types.ts` (new) — grouped section catalog used by the configuration UI
- `app/(dashboard)/dashboard/dashboard-client.tsx` — Export Management Summary button now navigates to `/management-summary`; legacy export remains as Chrome-safe fallback for `?msExport=1`
- `app/(dashboard)/upload/page.tsx` — `dedupeManualEntries` (latest-wins) for `qos-et-manual-kpis`; manual entries timestamp via `updatedAtIso`

**Breaking Changes**: None — the previous "instant export" button is preserved as a fallback; the new flow is opt-in via the configuration page.

---

### Fixed - 2026-03-16
**Type**: Fixed

**Description**: PPAP/Deviation nomenclature, theme contrast, export parity, and glossary/email reliability updates

**Details**:
- **PPAP filter alignment**:
  - PPAP notification filter now uses `P1 - Customer PPAP` and `P2 - Supplier PPAP`
  - Removed `P3` option from PPAP filter UI where not needed
- **Chart/table contrast in light mode**:
  - Added stronger Recharts theme-aware overrides in global styles
  - Replaced hardcoded white label/axis colors in key dashboard chart components with theme variables to avoid white text on light backgrounds and post-hydration flicker
- **Upload Enter Data form alignment**:
  - Added explicit fields for `P1`, `P2`, `D1`, `D2`, `D3` in manual entry
  - Updated data mapping/export labels to match customer/supplier/internal terminology
  - Improved form layout so D1/D2/D3 share one row and P1/P2 have consistent width
- **Dashboard PPM export parity**:
  - Export now creates one combined workbook with two sheets: `Customer PPM` and `Supplier PPM`
  - Sheet structure aligned with reference format and rolling 12-month overview
- **AI Management/Glossary mailto encoding**:
  - Mailto links now use `encodeURIComponent` for subject/body so spaces remain `%20` (no `+` insertion)
  - Added safeguard unit test to prevent regressions on `+` encoding in mailto body text
- **Glossary hydration/accessibility fix**:
  - Removed nested button pattern in FAQ trigger area to resolve hydration warning (`<button>` inside `<button>`)
  - Replaced copy-link trigger with keyboard-accessible non-button element semantics
- **FAQ/Glossary content refresh**:
  - Updated EN/DE/IT FAQ and glossary text for revised PPAP/Deviation naming

**Files Modified / Added**:
- `app/(dashboard)/ppaps/ppaps-client.tsx` - PPAP filter options and labels updated to P1/P2 naming
- `app/(dashboard)/dashboard/dashboard-client.tsx` - Theme-aware chart axis/label colors + combined PPM workbook export
- `app/globals.css` - Recharts light/dark contrast overrides
- `app/(dashboard)/upload/page.tsx` - Enter Data fields/model/export updates for P1/P2 and D1/D2/D3 + layout changes
- `lib/utils/email-composer.ts` - Mailto query encoding via encodeURIComponent
- `lib/utils/__tests__/email-composer.test.ts` - New regression test for mailto plus-sign prevention
- `lib/i18n/translations.ts` - FAQ/glossary terminology updates (EN/DE/IT)
- `app/(dashboard)/glossary/glossary-client.tsx` - Mailto encoding update + nested button hydration fix

**Breaking Changes**: None

---

### Added - 2026-03-16
**Type**: Added

**Description**: Enter Data form supports Excel template import with field-label mapping and validation feedback

**Details**:
- Added Excel import for manual data entry (`/upload` → Enter Data):
  - Reads field labels from a cell and takes the value from the immediate right cell
  - Supports current template labels from `QOS_ET_Manual_Data_Entry_Form_v01_2026.xlsx`
  - Populates form values for user review before clicking **Add Entry**
- Added import validation panel:
  - Shows required imported field count (`x/total`)
  - Shows missing required fields list
  - Shows success message when all required fields are present
- Added contextual UI behavior:
  - `Upload Excel Into Form` button appears in top-right toolbar next to Export
  - Button is shown only when Enter Data tab is active
  - Added badge in upload cards when large-file mode is active

**Files Modified / Added**:
- `app/(dashboard)/upload/page.tsx` - Manual form Excel import, template label mapping, validation panel, tab-aware button visibility, large-file mode badge

**Breaking Changes**: None

---

### Changed - 2026-03-16
**Type**: Changed

**Description**: Large file upload path now uses client-side parse + chunked JSON upload with multipart fallback

**Details**:
- For large files (>2MB), upload now:
  - Parses Excel client-side
  - Splits parsed records into JSON chunks
  - Uploads chunks via a dedicated API endpoint to reduce 413/timeouts on Vercel
- For small files, existing multipart upload flow remains unchanged
- Parsers were made isomorphic (`Uint8Array | ArrayBuffer`) so they can run in browser and server contexts

**Files Modified / Added**:
- `app/(dashboard)/upload/page.tsx` - Large-file detection, client parsing path, chunked JSON upload, fallback logic
- `app/api/upload-json-chunk/route.ts` - New chunk ingestion endpoint
- `lib/excel/parseComplaints.ts` - Browser/server compatible parser input
- `lib/excel/parseDeliveries.ts` - Browser/server compatible parser input
- `lib/excel/parsePlants.ts` - Browser/server compatible parser input
- `lib/excel/parsePPAP.ts` - Browser/server compatible parser input
- `lib/excel/parseDeviations.ts` - Browser/server compatible parser input

**Breaking Changes**: None

---

### Fixed - 2026-02-02
**Type**: Fixed

**Description**: ChunkLoadError on layout – split ThemeProvider into smaller chunks

**Details**:
- **ChunkLoadError**: Refactored root layout to avoid large client chunk in the critical path
  - New `components/layout-client-shell.tsx` dynamically imports theme and toaster
  - New `components/theme-and-toaster.tsx` holds ThemeProvider + Toaster (loaded on demand)
  - Fallback UI with "Retry" button when ChunkLoadError occurs
- **Impact**: Reduces risk of ChunkLoadError when loading the app; users can retry if a chunk fails

**Files Modified / Added**:
- `app/layout.tsx` – Dynamic import of layout client shell
- `components/layout-client-shell.tsx` – New; dynamic import of theme-and-toaster
- `components/theme-and-toaster.tsx` – New; ThemeProvider + Toaster

**Breaking Changes**: None

---

### Fixed - 2026-02-02
**Type**: Fixed

**Description**: Dashboard metrics vs upload summary consistency + plant filter alignment

**Details**:
- **Dashboard vs upload**: Metric tiles now reflect upload summary when no plant filter is applied (full KPI dataset used for “all plants”); KPI recalculation runs when at least one of complaints or deliveries exists (partial uploads supported); manual KPI merge triggers dashboard refresh via `dispatchKpiDataUpdated()`; dashboard listens for `visibilitychange` to refresh when tab becomes visible
- **Plant filter**: “Individual Plants” shows only plants from Webasto ET Plants.xlsx; dynamically added plants from KPI data (e.g. synthetic “7 (7)”) removed; selected plants are cleaned when they drop out of the official list; plant 210 (Manisa) added to PLANT_COLORS; SAP P01 quick access uses `getSapP01PlantCodes` from plants data for consistency
- **YTD vs 12MB**: Metric tiles and charts respect selected period mode (12 Months Back or Year to Date) and selected month/year; YTD = January through selected month of selected year

**Files Modified**:
- `app/(dashboard)/upload/page.tsx` – KPI merge/refresh, partial-upload KPI calc
- `app/(dashboard)/dashboard/dashboard-client.tsx` – All-plants totals, YTD filtering, visibility refresh
- `components/dashboard/filter-panel.tsx` – Plants from Excel only, cleanup, SAP P01, plant 210 color

**Breaking Changes**: None

---

### Changed - 2026-02-02
**Type**: Changed

**Description**: Upload duplicate handling – merge and dedupe by id (no full clear)

**Details**:
- **Behavior**: New uploads merge with existing data; duplicates are removed by record `id` before persisting (no clearing of IndexedDB stores before upsert)
- **Change history**: New change type `duplicate`; upload summary and `ChangeHistoryEntry` include `duplicateRecords` count
- **UI**: Upload summary shows “X duplicates” badge when applicable; Change History panel has “Duplicate” filter option

**Files Modified**:
- `app/(dashboard)/upload/page.tsx` – `dedupeById` helper, duplicate tracking, badge
- `lib/data/uploadSummary.ts` – `duplicateRecords`, changeType `duplicate`
- `lib/data/datasets-idb.ts` – (no clear before upsert)
- `components/upload/change-history-panel.tsx` – Duplicate filter option

**Breaking Changes**: None

---

### Added - 2026-02-02
**Type**: Added

**Description**: Period mode toggle (12 Months Back / Year to Date) across dashboard and related pages

**Details**:
- **Toggle**: Select between “12 Months Back (12MB)” and “Year to Date (YTD)” on Dashboard, PPAPs, Deviations, Cost Poor Quality, Audit Management, Warranties Costs
- **Filtering**: Metrics and charts use 12-month lookback or YTD (January through selected month of selected year) according to selected mode
- **Titles**: Page and chart titles update dynamically (e.g. “YTD” vs “12MB” in headings)

**Files Modified**:
- `app/(dashboard)/dashboard/dashboard-client.tsx` – periodMode state, toggle, YTD/12MB filtering
- `app/(dashboard)/ppaps/ppaps-client.tsx` – periodMode, toggle, filtering
- `app/(dashboard)/deviations/deviations-client.tsx` – periodMode, toggle, filtering
- `app/(dashboard)/cost-poor-quality/cost-poor-quality-client.tsx` – periodMode, toggle, filtering
- `app/(dashboard)/audit-management/audit-management-client.tsx` – periodMode, toggle, filtering
- `app/(dashboard)/warranties-costs/warranties-costs-client.tsx` – periodMode, toggle, filtering

**Breaking Changes**: None

---

### Added - 2026-02-02
**Type**: Added

**Description**: Full i18n for period mode, Change History, filter warning, and related UI

**Details**:
- **Common**: `periodMode12mb`, `periodModeYtd`, `showingYtdFromJanuary` (en/de/it)
- **Dashboard**: Filter warning strings (`filterWarningTitle`, `filterWarningDescription`, `filterWarningReset`, etc.) (en/de/it)
- **Upload**: `duplicates`, `noChangesRecorded`, and Change History panel keys (filters, record/change types, placeholders, buttons, “Showing X of Y changes”, labels) (en/de/it)
- **Pages**: Dashboard, PPAPs, Deviations, Audit Management, Cost Poor Quality, Warranties Costs use `t.common.periodMode12mb`, `t.common.periodModeYtd`, `t.common.showingYtdFromJanuary` and `t.common.months` for YTD subtitle and month names
- **Change History panel**: Uses `useTranslation` and `t.upload.*` for all visible strings (title, description, filters, change/record type labels, export, etc.)

**Files Modified**:
- `lib/i18n/translations.ts` – New keys in interface and en/de/it
- `app/(dashboard)/dashboard/dashboard-client.tsx` – Period and filter warning translations
- `app/(dashboard)/ppaps/ppaps-client.tsx`, `deviations-client.tsx`, `audit-management-client.tsx`, `cost-poor-quality-client.tsx`, `warranties-costs-client.tsx` – Period and month translations
- `app/(dashboard)/upload/page.tsx` – `t.upload.duplicates`
- `components/upload/change-history-panel.tsx` – Full translation usage via `useTranslation`

**Breaking Changes**: None

---

### Fixed - 2026-01-17
**Type**: Fixed

**Description**: Upload stability + AI Summary completeness improvements

**Details**:
- **Upload quota fix**: Prevented `localStorage` quota errors by moving large parsed datasets to **IndexedDB**
  - Stores parsed complaints/deliveries in IndexedDB database `qos-et-datasets` (stores: `complaints`, `deliveries`)
  - Removes legacy localStorage keys (`qos-et-complaints-parsed`, `qos-et-deliveries-parsed`) to avoid repeated failures
- **Upload UX**:
  - Replaced native file input control with a custom translated “Step 1: Select data” button (native input hidden)
  - Added “Step 2: Upload” labeling for a clear workflow
- **KPI summary label fix**: Removed duplicate “:” in “Latest KPI Calculation” (e.g., “Complaints:” now renders once, not “Complaints::”)
- **AI Summary**:
  - Fixed parsing edge cases that produced numeric-only “site” labels (e.g., “41”, “14”) by restricting site parsing to 3-digit plant codes
  - Improved clarity by surfacing the selected period in the AI Insights header
- **Plant filter**: PLANT selection now supports true multi-select toggling (no forced single-select behavior)

**Files Modified / Added**:
- `app/(dashboard)/upload/page.tsx` - Upload UI steps + IndexedDB-backed incremental uploads + KPI label fix
- `lib/data/datasets-idb.ts` - New IndexedDB dataset storage utility
- `components/dashboard/filter-panel.tsx` - True multi-select plant toggling
- `components/dashboard/ai-insights-panel.tsx` - AI Summary parsing/clarity improvements

**Breaking Changes**: None

**Migration Notes**:
- Old localStorage dataset keys are automatically removed on load (migration to IndexedDB).

---

### Added - 2026-01-17
**Type**: Added

**Description**: AI backend guarantees rich recommended actions

**Details**:
- `/api/ai/interpret-kpis` now guarantees **at least 3 recommended actions** when AI is active
  - Includes “monitoring/governance” actions (cadence, alerts, data completeness checks) when performance is stable

**Files Modified**:
- `app/api/ai/interpret-kpis/route.ts`

**Breaking Changes**: None

---

### Fixed - 2026-01-15
**Type**: Fixed

**Description**: Critical Data Accumulation Fix - File Uploads Now Merge Instead of Replace

**Details**:
- **Data Accumulation**: Fixed critical issue where file uploads were replacing existing data instead of merging
  - Modified `recalculateKpis()` function to merge new upload data with existing data
  - Uses Map-based merging by month+site combination key (`${month}__${siteCode}`)
  - Preserves all previously uploaded months when new data is uploaded
  - Allows incremental monthly uploads from multiple locations (e.g., 23 plants uploading monthly)
  - Data is sorted by month and site code for consistent display
- **Impact**: Users can now upload data for February, then March, and both months will be preserved and displayed
- **Storage**: Data accumulates in `localStorage` as `qos-et-kpis` with all months and sites

**Files Modified**:
- `app/(dashboard)/upload/page.tsx` - Updated `recalculateKpis()` to merge data instead of replacing

**Breaking Changes**: None

**Migration Notes**: 
- Existing data in localStorage will be preserved
- New uploads will merge with existing data automatically
- No manual migration required

---

### Added - 2026-01-15
**Type**: Added

**Description**: Enhanced Change History with Professional Information Display and Excel Export

**Details**:
- **Change History Enhancement**: 
  - Added "Recorded By" field prominently displayed (name of person who made the change)
  - Enhanced timestamp display with date and hour (including seconds)
  - Added "One-Pager Link" display as clickable link when available
  - Improved formatting for different change types (new_entry, file_upload, manual_edit, etc.)
  - Added filter options for "Manual Entry" and "File Upload" record types
  - Better handling of "all" field changes (complete form entries or file uploads)
- **Change History for File Uploads**: 
  - Creates change history entries when files are uploaded
  - Records editor name (based on role: Admin, Editor, or System)
  - Includes timestamp with date and hour
  - Tracks which files were uploaded and what data was changed
  - Stores file information in `dataDetails`
- **Change History for Manual Form Entries**: 
  - Creates comprehensive change history entries when manual form data is submitted
  - Records the name of the person who entered the data (`recordedBy`)
  - Includes timestamp with date and hour
  - Captures all entered data fields
  - Stores the one-pager link if provided
  - Links to one-pager documents
- **Excel Export Enhancement**: 
  - Added "Export Form Data to Excel" button on the manual form
  - Exports three sheets: Upload History, Manual Form Entries, and Change History
  - Includes formatted timestamps (date and hour) in all exports
  - Includes one-pager links in the export
  - Professional column headers with proper formatting

**Files Modified**:
- `lib/data/uploadSummary.ts` - Extended `ChangeHistoryEntry` interface with `onePagerLink`, `dataDetails`, and new record/change types
- `app/(dashboard)/upload/page.tsx` - Added change history creation for file uploads and manual entries, enhanced Excel export
- `components/upload/change-history-panel.tsx` - Enhanced display with better formatting, one-pager links, and improved export

**Components Affected**:
- Upload Page - Change history now shows comprehensive information
- Change History Panel - Enhanced display and export functionality
- Manual Form - Excel export button added

**Features Added/Modified**:
- Change history tracking for file uploads
- Change history tracking for manual form entries
- Professional change history display
- Excel export for form data and change history

**Breaking Changes**: None

---

### Added - 2026-01-15
**Type**: Added

**Description**: Manual Form Entry Fields - Recorded By and One-Pager Link

**Details**:
- **Recorded By Field**: 
  - Added mandatory field for the name of the person who records data manually
  - Validation ensures field is not empty before submission
  - Stored in `ManualKpiEntry` interface and persisted to localStorage
  - Included in Excel exports
- **One-Pager Link Field**: 
  - Added optional field for link to one-pager folder/document
  - Empty by default, generates link when provided
  - Includes external link button to open the link in new tab
  - Stored in `ManualKpiEntry` interface and persisted to localStorage
  - Included in Excel exports and change history

**Files Modified**:
- `app/(dashboard)/upload/page.tsx` - Added fields to manual form, updated validation and export
- `lib/i18n/translations.ts` - Added translation keys for new fields

**Components Affected**:
- Upload Page - Manual Form Entry section

**Features Added/Modified**:
- Mandatory "Recorded By" field with validation
- Optional "Link to OnePager" field with external link button

**Breaking Changes**: None

---

### Fixed - 2026-01-15
**Type**: Fixed

**Description**: Numeric Input Validation - Prevent Negative Values

**Details**:
- **Input Validation**: 
  - Added `min="0"` attribute to all numeric input fields in manual form
  - Updated onChange handlers to use `Math.max(0, Number(value) || 0)` to prevent negative values
  - Applied to all 18 numeric fields (complaints, defective parts, deliveries, PPAP, deviations, audits, costs)
  - Ensures values cannot go below 0, even if user types negative numbers

**Files Modified**:
- `app/(dashboard)/upload/page.tsx` - Updated all numeric Input components

**Components Affected**:
- Upload Page - Manual Form Entry section

**Features Added/Modified**:
- Numeric input validation for all form fields

**Breaking Changes**: None

---

### Added - 2026-01-15
**Type**: Added

**Description**: I AM Q Button on Data Lineage Page and WOWFLOW Tab Rename

**Details**:
- **I AM Q Integration**: 
  - Added I AM Q button to Data Lineage page header
  - Added I AM Q button to Data Catalog tab
  - Added I AM Q button to WOWFLOW tab (formerly "End-to-End Flow")
  - Added I AM Q button to Storage & Outputs tab
  - Each button provides context-specific information about that section
- **WOWFLOW Tab**: 
  - Renamed "End-to-End Flow" tab to "WOWFLOW"
  - Enhanced content with detailed explanations about data used and scope across the app
  - Added introductory card explaining data flow and scope
  - Enhanced each flow step (Sources, Parsing, KPIs, Consumption) with detailed explanations
- **I AM Q Context**: 
  - Provides information about Data Catalog linkage
  - Explains WOWFLOW (end-to-end data flow)
  - Describes Storage & Outputs mechanisms

**Files Modified**:
- `app/(dashboard)/data-lineage/data-lineage-client.tsx` - Added I AM Q buttons, renamed tab, enhanced content

**Components Affected**:
- Data Lineage Page - All tabs now have I AM Q integration
- WOWFLOW Tab - Enhanced with detailed explanations

**Features Added/Modified**:
- I AM Q integration on Data Lineage page
- WOWFLOW tab with enhanced content
- Context-aware AI assistance for data lineage

**Breaking Changes**: None

---

### Added - 2026-01-12
**Type**: Added

**Description**: Upload Summary Table with Editor Capabilities and Change History Tracking

**Details**:
- **Upload Summary Table**: New tab on upload page showing all imported data in table format
  - Displays all complaints with conversion status (Converted, Failed, Needs Attention, Not Applicable)
  - Highlights rows with conversion issues (yellow/orange background)
  - Shows original values, units, converted values, and material descriptions
  - Editor-only inline editing capabilities
  - Real-time unit conversion using client-side logic
  - Manual override for converted values
- **Change History Tracking**: Comprehensive change tracking system
  - Tracks all manual corrections and conversions
  - Records field changes (old value → new value)
  - Tracks affected metrics (Customer Complaints, Supplier PPM, etc.)
  - Tracks affected visualizations (Dashboard tiles, charts, etc.)
  - Tracks affected pages (/dashboard, /complaints, /ppm, etc.)
  - Tracks affected calculations (PPM formulas, YTD calculations, etc.)
  - Optional reason field for changes
  - Timestamp and editor identifier
  - Change type classification (conversion, manual_edit, correction, bulk_action)
- **Change History Panel**: Filterable change history display
  - Filter by record type, change type, record ID, editor
  - Export to Excel functionality
  - Shows impact analysis for each change
  - Displays affected metrics, visualizations, pages, and calculations
- **Data Storage**: Extended upload history with summary data
  - Stores raw imported data
  - Stores processed data (after editor corrections)
  - Stores conversion status for each record
  - Links summaries to upload history entries
  - Persists to localStorage with change history

**Files Modified**:
- `app/(dashboard)/upload/page.tsx` - Added Upload Summary tab, integrated summary table and change history
- `lib/data/uploadSummary.ts` - New file with upload summary types and utilities
- `lib/data/correctedData.ts` - New file with utilities for applying corrections
- `lib/utils/unitConversion.ts` - New file with client-side unit conversion logic
- `components/upload/upload-summary-table.tsx` - New component for displaying upload summary
- `components/upload/complaint-row-editor.tsx` - New component for inline editing
- `components/upload/change-history-panel.tsx` - New component for change history display
- `components/ui/textarea.tsx` - New UI component for text areas

**Components Affected**:
- Upload Page - New "Upload Summary" tab with table and change history
- Upload Summary Table - Displays imported data with conversion status
- Complaint Row Editor - Inline editing with real-time conversion
- Change History Panel - Filterable change history with impact analysis

**Features Added/Modified**:
- Upload summary table - Review and correct imported data
- Change history tracking - Full audit trail of all corrections
- Impact analysis - Shows which metrics/visualizations are affected by changes
- Editor capabilities - Only editors can make corrections
- Unit conversion editor - Real-time conversion with manual override

**Breaking Changes**: None

**Migration Notes**:
- Existing uploads will not have summaries until new uploads are made
- Change history starts from the date of implementation
- No migration required for existing data

---

### Fixed - 2026-01-12
**Type**: Fixed

**Description**: AI Summary and I AM Q now use filtered data and handle empty data cases

**Details**:
- **AI Summary Data Validation**: AI Summary now validates filtered data before generating
  - Checks for meaningful data (non-zero values) before generating summaries
  - Validates selected plants have data
  - Clearly states when no data is available for selected plants/period
  - Does not invent data or reference plants not in filtered context
  - Uses only filtered data (selected plants, date ranges, notification types)
- **I AM Q Data Context**: I AM Q now uses filtered data and presents in professional management style
  - Uses filtered KPIs from dashboard context
  - Validates for empty data and reports honestly
  - Presents analysis in professional management style with structured format:
    - Executive Summary
    - Key Trends & Performance
    - Risk Assessment & Anomalies
    - Management Recommendations
    - Action Items
  - References only filtered data (selected plants, date ranges, etc.)
- **AI Management Summary**: Already uses filtered data correctly, now validates for empty data
- **Professional Presentation**: All AI features present information in management-ready format

**Files Modified**:
- `app/api/ai/interpret-kpis/route.ts` - Added data validation and empty data handling
- `lib/iamq/systemPrompt.ts` - Updated to use filtered data and professional management style
- `app/(dashboard)/dashboard/dashboard-client.tsx` - Added data validation before AI Summary generation

**Components Affected**:
- AI Summary (Dashboard) - Now validates data and handles empty cases
- AI Management Summary - Validates for empty data
- I AM Q - Uses filtered data and professional presentation

**Features Added/Modified**:
- Data validation - AI features check for meaningful data before generating
- Empty data handling - Clear messages when no data is available
- Professional presentation - Management-ready format for all AI outputs
- Filtered data usage - All AI features use only filtered/selected data

**Breaking Changes**: None

**Migration Notes**: None

---

### Improved - 2026-01-12
**Type**: Improved

**Description**: Home page optimized for light mode with theme-aware styling

**Details**:
- **Theme Detection**: Added theme detection using `useTheme` hook
- **Information Tiles**: Optimized for both light and dark modes
  - Light mode: Higher opacity backgrounds (90% instead of 35%) for better visibility on white
  - Light mode: Darker green color (#00AA00 instead of #00FF00) for better contrast
  - Light mode: Stronger borders and shadows for definition
  - Dark mode: Keeps original bright green styling
- **Title Text**: Adapts color based on theme (darker green in light mode)
- **Generate Button**: More opaque background in light mode for better visibility
- **Footer**: Theme-aware colors
- **Dark Overlay**: Only shows in dark mode (removed in light mode for cleaner look)

**Files Modified**:
- `app/page.tsx` - Added theme detection and conditional styling for light/dark modes

**Components Affected**:
- Home Page - Information tiles now look great in both light and dark modes

**Features Added/Modified**:
- Light mode optimization - Better contrast and visibility on white backgrounds
- Theme-aware styling - All elements adapt to current theme
- Improved readability - Text and borders are clearly visible in both modes

**Breaking Changes**: None

**Migration Notes**: None

---

### Added - 2026-01-11
**Type**: Added

**Description**: Enhanced I AM Q with dashboard data analysis and starter prompts

**Details**:
- **Dashboard Data Analysis**: I AM Q now analyzes actual dashboard data (monthlySiteKpis) like AI Summary
  - Full access to KPI data: trends, site comparison, anomaly detection
  - Provides actionable recommendations based on actual data
  - Can identify top performers and sites needing attention
  - References specific site codes, months, and PPM values
  - Includes plant locations (e.g., "Site 145 (Vienna)")
  - Distinguishes between Customer PPM and Supplier PPM
- **Starter Prompts**: Added 15 clickable starter questions for users
  - Shows 10 prompts initially with "Show more..." button
  - Remaining 5 prompts revealed when "Show more..." is clicked
  - Questions cover: trends, PPM analysis, recommendations, chart interpretation, data health
  - Auto-sends question when clicked
- **Enhanced System Prompt**: Updated to enable data-driven recommendations
  - Analyzes trends over time (month-over-month)
  - Compares sites (best vs worst performers)
  - Identifies anomalies and spikes
  - Provides specific, actionable improvement suggestions
  - Uses Quality Management terminology (containment, root cause analysis, corrective actions)

**Files Modified**:
- `lib/iamq/contextBuilder.ts` - Added support for monthlySiteKpis, globalPpm, selectedSites, selectedMonths
- `lib/iamq/systemPrompt.ts` - Added data analysis mode with recommendations and hints
- `components/iamq/iamq-chat-panel.tsx` - Added starter prompts with expandable UI, fixed TypeScript onClick handler
- `app/(dashboard)/dashboard/dashboard-client.tsx` - Passes full KPI data to I AM Q

**Components Affected**:
- I AM Q Chat Panel - Now shows starter prompts and analyzes dashboard data
- I AM Q Context Builder - Includes full KPI dataset for deep analysis
- Dashboard Client - Provides filtered KPIs to I AM Q

**Features Added/Modified**:
- Dashboard data analysis - I AM Q can now analyze actual KPI trends and provide recommendations
- Starter prompts - 15 pre-written questions with expandable UI
- Enhanced recommendations - Data-driven suggestions based on actual metrics

**Breaking Changes**: None

**Migration Notes**:
- No migration required - existing I AM Q functionality remains unchanged
- Starter prompts appear automatically when chat panel is empty
- Dashboard data analysis works automatically when monthlySiteKpis are available

---

### Added - 2026-01-11
**Type**: Added

**Description**: Multi-provider AI support for I AM Q and comprehensive testing infrastructure

**Details**:
- **Multi-Provider Support**: Extended I AM Q to support both OpenAI and Anthropic providers
  - Provider selection via `AI_PROVIDER` environment variable (`openai` or `anthropic`)
  - Provider-specific API key support: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (with `AI_API_KEY` as fallback)
  - Both providers support streaming responses with normalized text chunk format
  - Anthropic client now uses native system message support
  - Clear error messages indicating which environment variables are required
- **Testing Infrastructure**: Added comprehensive testing for I AM Q endpoint
  - Vitest unit tests (`app/api/iamq/__tests__/route.test.ts`) with mocked dependencies
  - Smoke test script (`scripts/test-iamq.ts`) for manual HTTP-based testing
  - Tests cover: missing API keys, unsupported providers, validation errors, success responses, context support
  - Tests work without requiring real API keys (graceful error handling)
  - Added `npm run test:iamq` script for easy smoke testing

**Files Modified**:
- `app/api/iamq/route.ts` - Enhanced provider detection and API key resolution
- `lib/ai/client.ts` - Added streaming support for Anthropic, improved provider handling
- `app/api/iamq/__tests__/route.test.ts` - New Vitest test suite
- `scripts/test-iamq.ts` - New smoke test script
- `package.json` - Added `test:iamq` script

**Components Affected**:
- I AM Q API route - Now supports multiple AI providers seamlessly
- LLM Client - Unified interface for OpenAI and Anthropic with streaming support

**Features Added/Modified**:
- Multi-provider AI support - Switch between OpenAI and Anthropic via environment variables
- Streaming responses - Both providers return token-by-token streaming
- Testing infrastructure - Unit tests and smoke tests for API stability

**Breaking Changes**: None

**Migration Notes**:
- To use Anthropic: Set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY=sk-ant-...` in `.env.local`
- To use OpenAI: Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` in `.env.local`
- Generic `AI_API_KEY` works as fallback for both providers
- Run tests with: `npm test -- app/api/iamq/__tests__/route.test.ts` or `npm run test:iamq`

---

### Fixed - 2026-01-11
**Type**: Fixed

**Description**: Fixed dashboard sparkline charts, tooltip z-index, filter panel PS4 selection, and UI improvements

**Details**:
- **Sparkline Charts**: Fixed sparkline data calculation to use selected month/year instead of current date, ensuring charts display correctly based on user's date selection
- **Tooltip Z-Index**: Fixed metric info tooltips z-index to z-[9999] to bring them in front of metric tiles for better visibility
- **SAP PS4 Filter**: Fixed filterBySapPS4 to select ALL PS4 plants from plantsData (all 12 PS4 sites: 131, 135, 145, 175, 180, 195, 200, 205, 211, 235, 410, 411) regardless of data availability, not just plants with data
- **Quick Access Filter Indicators**: Added visual indication for quick access filter buttons (SAP PS4 Sites, SAP P01 Sites, AX Sites, Automotive, Aftermarket) - buttons now show highlighted state (variant="default") when their filter is active
- **Selected Plant Text Color**: Fixed selected plant text color to be black in both light and dark modes for better readability against colored selection backgrounds

**Files Modified**:
- `app/(dashboard)/dashboard/dashboard-client.tsx` - Updated sparkline data calculation to use selectedMonth/selectedYear, added z-[9999] to TooltipContent
- `components/dashboard/filter-panel.tsx` - Fixed filterBySapPS4 to use getSapPS4PlantCodes from plantsData, added visual state indicators for quick access buttons, fixed selected plant text color

**Components Affected**:
- DashboardClient - Sparkline charts now use selected date range
- FilterPanel - PS4 filter selects all PS4 plants, quick access buttons show active state
- MetricTile - Info tooltips now appear in front of tiles

**Features Added/Modified**:
- Dashboard sparkline charts - Now respect user's selected month/year
- Filter panel quick access buttons - Visual feedback when filter is active
- Plant filter selection - All PS4 plants selected regardless of data availability

**Breaking Changes**: None

**Migration Notes**: None

---

### Added - 2026-01-11
**Type**: Added

**Description**: Complete internationalization (i18n) support with full German and Italian translations across all pages

**Details**:
- Implemented comprehensive translation system with support for **English (en), German (de), and Italian (it)**
- Created `lib/i18n/translations.ts` with structured translation keys for all UI elements
- Added `lib/i18n/useTranslation.ts` hook for accessing translations throughout the app
- **Settings Page** fully translated:
  - AI Configuration tab (title, description, environment variables info)
  - Column Mappings tab (title, description, complaint/delivery file mappings)
  - All buttons, placeholders, and helper text
- **Glossary/FAQ Page** fully translated:
  - All 15 FAQ questions and answers translated
  - All 30+ glossary terms and definitions translated
  - "How to read key charts" section translated
  - Search placeholder, tab labels, category names
- **Dashboard Page** fully translated:
  - All chart titles and descriptions
  - Tooltip texts ("How to read this chart", "Reset to show all plants")
  - Filter labels (Notification Types, Defect Types, period selectors)
  - Table headers (Month, PPM, Change, Defective, Deliveries, TOTAL)
  - Excel export headers
  - Chart legends and data keys (Actual PPM, Month Avg Target, Closed, In Progress)
- **All other pages** translated:
  - Home page (intro content, titles, buttons)
  - Upload page (all sections, labels, buttons)
  - AI Summary page (titles, descriptions, error messages)
  - Complaints page (titles, chart labels, table headers)
  - PPM page (titles, descriptions, legend items)
  - Deviations page (titles, status labels, chart descriptions)
  - PPAPs page (titles, status labels, chart descriptions)
  - Audit Management page (titles, descriptions, labels)
- **Navigation & UI** translated:
  - TopBar (header title, language selector, theme labels, role labels)
  - Sidebar (all navigation items, collapse button labels)
  - Filter Panel (all filter labels, button texts, placeholders)
  - Role Access Dialog (title, description, role labels, password placeholders, error messages)

**Files Added**:
- `lib/i18n/translations.ts` - Complete translation definitions for en/de/it
- `lib/i18n/useTranslation.ts` - React hook for translation access

**Files Modified**:
- `app/(dashboard)/settings/page.tsx` - Added translation support
- `app/(dashboard)/glossary/glossary-client.tsx` - Updated to use translation keys
- `app/(dashboard)/dashboard/dashboard-client.tsx` - All strings translated
- `app/(dashboard)/deviations/deviations-client.tsx` - Chart data keys and tooltips translated
- `app/(dashboard)/ppaps/ppaps-client.tsx` - Chart data keys and tooltips translated
- `app/page.tsx` - Home page content translated
- `components/layout/topbar.tsx` - Header text and labels translated
- `components/layout/sidebar.tsx` - Navigation items translated
- `components/dashboard/filter-panel.tsx` - Filter labels translated
- `components/auth/role-access-dialog.tsx` - Dialog content translated
- All other dashboard pages (upload, ai-summary, complaints, ppm, audit-management) - Fully translated

**Language Switching**:
- Language selector in header (TopBar) allows switching between English, German, and Italian
- Language preference persisted in `localStorage`
- All content updates dynamically when language changes
- HTML `lang` attribute updated automatically

**Breaking Changes**: None

---

### Added - 2026-01-06
**Type**: Added

**Description**: Added simple role-based access (Reader/Editor/Admin) with role login popup and protected upload/editing features

**Details**:
- Added a lightweight role system stored in `localStorage` (no email/SSO):
  - **Reader** (default) – no password, read-only access
  - **Editor** – password required (`Edit`)
  - **Admin** – password required (`QOSET`)
- Home page (`/`) now shows a **role login popup** after the intro video ends (last frame), before navigating to `/dashboard`
- Header (TopBar) now provides a **role switch dropdown** under the user control; Editor/Admin selections trigger the password popup
- Enforced Reader restrictions:
  - **Upload Data** navigation is hidden for Reader
  - `/upload` is blocked for Reader (Access Denied screen)
- Role popup uses a portal to `document.body` so it is always centered with a blurred backdrop on every page (prevents clipping/positioning issues)

**Files Added**:
- `lib/auth/roles.ts`
- `components/auth/role-access-dialog.tsx`

**Files Modified**:
- `app/page.tsx`
- `components/layout/topbar.tsx`
- `components/layout/sidebar.tsx`
- `app/(dashboard)/upload/page.tsx`

**Breaking Changes**: None

---

### Changed - 2026-01-06
**Type**: Changed

**Description**: Improved responsiveness and added collapsible side panels to maximize usable screen space

**Details**:
- Added **collapse/expand controls**:
  - Left sidebar menu collapses into an icon rail (state persisted)
  - Right filter panel can be hidden/shown (state persisted)
- Improved UX with **smoother animations** for panel hide/show (width transition + fade/slide)
- Improved responsive reflow across dashboard pages:
  - Main layouts switch to side-by-side at `lg` and stack on smaller screens
  - Fixed hard-coded `grid-cols-4` blocks to be responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- Ensured charts/layout re-measure correctly after panel toggles (dispatch resize)

**Files Modified**:
- `components/layout/sidebar.tsx`
- `components/dashboard/filter-panel.tsx`
- `app/(dashboard)/dashboard/dashboard-client.tsx`
- `app/(dashboard)/ppm/ppm-client.tsx`
- `app/(dashboard)/complaints/complaints-client.tsx`
- `app/(dashboard)/ai-summary/ai-summary-client.tsx`
- `app/(dashboard)/audit-management/audit-management-client.tsx`
- `app/(dashboard)/cost-poor-quality/cost-poor-quality-client.tsx`
- `app/(dashboard)/deviations/deviations-client.tsx`
- `app/(dashboard)/ppaps/ppaps-client.tsx`
- `app/(dashboard)/warranties-costs/warranties-costs-client.tsx`

**Breaking Changes**: None

---

### Added - 2025-12-14
**Type**: Added

**Description**: Rebuilt `/glossary` into a professional FAQ & Glossary hub with live search, deep links, dataset health, diagnostics export, and dashboard chart help tooltips

**Details**:
- Replaced the previous glossary-only page with a Tabs-based **FAQ & Glossary** experience
- Added **15 FAQ** entries focused on navigation, data sources, and KPI/chart calculations
- Added a **complete, non-collapsing glossary** grouped by category (table layout)
- Added a **real-time search bar** that filters both FAQ and Glossary
- Added **FAQ deep links**:
  - “Copy link to this FAQ” per item (e.g., `/glossary#faq-3`)
  - Auto-open the matching FAQ when landing with `#faq-N`
- Added **QM ET Triangle** visual reference using `public/Media/QM ET Triangle.png`
- Added **Dataset Health** panel sourced from Upload History (`qos-et-upload-history`), including stale highlighting
- Added **Report Issue diagnostics workflow**:
  - Download a diagnostics JSON and attach it to the Contact email
  - Diagnostics include page URL, timestamp, upload history preview, and KPI summary when available
- Added **Improvement Ideas** short form with email send action
- Added “How to read this chart” **tooltip links** on key dashboard charts, linking to specific anchors on `/glossary`

**Files Modified**:
- `app/(dashboard)/glossary/glossary-client.tsx`
  - Implemented Tabs UI, search, FAQ deep links, dataset health, diagnostics export, and improvement ideas form
  - Added “How to read key charts” anchor sections
- `components/ui/tooltip.tsx`
  - Added Shadcn-style Tooltip wrapper (Radix Tooltip) for consistent UI tooltips
- `app/(dashboard)/dashboard/dashboard-client.tsx`
  - Added “How to read this chart” tooltips linking to `/glossary#how-to-*` anchors

**Breaking Changes**: None

---

### Changed - 2025-01-XX
**Type**: Changed

**Description**: Enhanced home page feature boxes with improved styling, animations, and content updates

**Details**:
- Increased feature box sizes to 100% width of their containers (with max-width constraint)
- Moved feature boxes 10% more towards center (from 25% to 35% positioning) to create subtle overlap with video
- Added glass shine effect with diagonal green highlight animation on hover
- Reduced glass shine animation speed to 75% (1333ms duration)
- Increased title font size by 25% (from text-xl to text-2xl)
- Reduced description font size by 5% (from text-base to text-[0.95rem])
- Added line breaks to all feature box titles for better visual hierarchy
- Updated all feature box descriptions with improved wording and added periods

**Files Modified**:
- `app/page.tsx`
  - Updated feature box container widths and positioning
  - Added glass shine effect with diagonal green highlight animation
  - Updated font sizes for titles and descriptions
  - Added line breaks to titles
  - Updated description text content

**Components Affected**:
- Home page feature boxes (Real-Time PPM Tracking, Comprehensive Analysis, AI-Powered Insights, Quality AI-ssurance)

**Visual Changes**:
- Feature boxes now use 100% width with max-width constraint
- Boxes positioned closer to center (35% from edges instead of 25%)
- Glass shine effect sweeps diagonally across boxes on hover with green highlight
- Titles display on two lines for better readability
- All descriptions end with periods for consistency

**Content Changes**:
- "Real-Time PPM Tracking" title split across two lines
- "Comprehensive Analysis" title split across two lines
- "AI-Powered Insights" title split across two lines
- "Quality Assurance" → "Quality AI-ssurance" (title split, renamed to emphasize AI)
- Updated descriptions:
  - "Monitor Parts Per Million and defects related metrics across all sites with instant updates."
  - "Deep insights into customer, supplier, and internal quality performance."
  - "Get actionable recommendations powered by advanced machine data interpretation."
  - "Comprehensive quality control and assurance across all operations using AI."

**Breaking Changes**: None

**Migration Notes**: None

---

### Added - 2025-01-XX
**Type**: Added

**Description**: Added click-to-scroll functionality for Customer PPM and Supplier PPM metric tiles

**Details**:
- Clicking "Customer PPM" metric tile now scrolls to "YTD Cumulative Customer PPM Trend - All Sites" chart
- Clicking "Supplier PPM" metric tile now scrolls to "YTD Cumulative Supplier PPM Trend - All Sites" chart
- Both use smooth scrolling with refs attached to the respective chart Card components

**Files Modified**:
- `app/(dashboard)/dashboard/dashboard-client.tsx`
  - Added `customerPpmTrendChartRef` and `supplierPpmTrendChartRef` refs
  - Added `onClick` handlers to Customer PPM and Supplier PPM MetricTile components
  - Attached refs to respective chart Card components

**Components Affected**:
- MetricTile (Customer PPM, Supplier PPM) - Added onClick handlers
- Card (Customer PPM Trend Chart, Supplier PPM Trend Chart) - Added ref attributes

**Breaking Changes**: None

---

### Changed - 2025-01-XX
**Type**: Changed

**Description**: Updated AI Management Summary Page to display plants with location/city matching dashboard format

**Details**:
- AI Summary page now loads plant data from official "Webasto ET Plants.xlsx" file via `/api/plants` endpoint
- All plant references in AI insights now display with location (e.g., "145 (Vienna)" instead of just "145")
- Filter panel on AI Summary page matches the dashboard's filter panel format
- Plant data is passed to AIInsightsPanel component for consistent formatting

**Files Modified**:
- `app/(dashboard)/ai-summary/ai-summary-client.tsx`
  - Added `PlantData` interface
  - Added `plantsData` state and `useEffect` to load from `/api/plants`
  - Passed `plantsData` prop to `AIInsightsPanel`
- `components/dashboard/ai-insights-panel.tsx`
  - Added `PlantData` interface and `plantsData` prop to `AIInsightsPanelProps`
  - Added `formatSiteName` helper function using `useCallback` to format site codes with city/location
  - Updated all UI displays (Top Performers, Needs Attention, Anomalies, Key Findings) to use formatted site names

**Components Affected**:
- AISummaryClient - Now loads and passes plant data
- AIInsightsPanel - Now formats all plant references with location

**Features Modified**:
- Plant display in AI insights - All plant codes now show with location
- Filter panel - Uses same plant data source as dashboard

**Breaking Changes**: None

---

### Changed - 2025-01-XX
**Type**: Changed

**Description**: Updated number formatting in AI Summary Page to use German locale (comma for decimal, dot for thousands)

**Details**:
- All numbers in AI Summary Page now display in German format (e.g., "1.234,56" instead of "1,234.56")
- Added `parseAndFormatNumber` helper function to handle both US and German number formats from AI responses
- Updated all number displays in Top Performers, Needs Attention, Anomalies, and descriptions

**Files Modified**:
- `components/dashboard/ai-insights-panel.tsx`
  - Added `parseAndFormatNumber` helper function to parse and format number strings
  - Updated `parseTopPerformers` to use `parseAndFormatNumber` instead of `.replace('.', ',')`
  - Updated `parseNeedsAttention` to use proper German formatting
  - Updated `generateTopPerformersFromData` to use `formatGermanNumber`
  - Updated `generateNeedsAttentionFromData` to use `formatGermanNumber`

**Components Affected**:
- AIInsightsPanel - All number displays now use German formatting

**Features Modified**:
- Number formatting - Consistent German locale formatting throughout AI Summary

**Breaking Changes**: None

---

### Fixed - 2025-01-XX
**Type**: Fixed

**Description**: Fixed plant display in Detected Anomalies and Recommended Actions sections to show only plant code with location

**Details**:
- Removed descriptive text like "(TT EVO - Wire Harness - Connector Broken)" from plant references
- Anomaly titles now show only formatted plant name (e.g., "410 (Fenton)" instead of "Site 410 (TT EVO - Wire Harness - Connector Broken)")
- Recommended Actions titles, descriptions, and expected impact now format all site references consistently
- Added `formatSiteReferences` helper function to consistently format site references in text

**Files Modified**:
- `components/dashboard/ai-insights-panel.tsx`
  - Updated anomaly title formatting to extract site code and replace entire title with formatted site name
  - Added site reference formatting in Recommended Actions section (title, description, expectedImpact)
  - Fixed syntax error with closing parentheses in Recommended Actions map function

**Components Affected**:
- AIInsightsPanel - Detected Anomalies section
- AIInsightsPanel - Recommended Actions section

**Features Modified**:
- Plant display in anomalies - Shows only "410 (Fenton)" format
- Plant display in actions - Shows only "410 (Fenton)" format in all text

**Breaking Changes**: None

---

### Changed - 2025-01-XX
**Type**: Changed

**Description**: Improved metric tile alignment and layout structure for better visual consistency

**Additional Change**: Updated metric titles to display on 2 lines with "Customer" or "Supplier" always on the top line

**Additional Change**: Updated Supplier Defective Parts information text to clarify unit conversion process (ML/M to PC conversions based on delivery unit calculations)

**Additional Change**: Moved info button to appear at the end of the title text for Customer Defective Parts and Supplier Defective Parts metrics

**Additional Change**: Replaced Supplier Selected Sites metric with AI Summary metric that automatically generates a brief summary based on filter selection when page loads/refreshes

**Files Modified**:
- `app/(dashboard)/dashboard/dashboard-client.tsx` - Restructured MetricTile component layout

**Components Affected**:
- MetricTile - Reorganized internal layout structure

**Features Modified**:
- Metric card layout - Changed from side-by-side layout to vertical stacked layout:
  - Title and icon now in top row (title left, icon right)
  - Value displayed below title
  - Change percentage displayed below value (instead of top-right)
  - Sparkline chart displayed below change percentage
  - Description/subtitle at bottom

**Visual Changes**:
- All metric cards now have consistent vertical alignment
- Labels like "Q1 notifications", "Parts shipped", "Q1 defective" are now aligned at the bottom
- Change percentage badges are now positioned under the value for better readability
- Improved visual hierarchy and consistency across all metric tiles

**Breaking Changes**: None

**Migration Notes**: None

---

### Added - 2025-01-XX (Post-Crash Recovery)
- **Git Repository**: Initialized git repository for version control
- **Missing Dashboard Pages**: Created all missing pages referenced in sidebar navigation:
  - `/ai-summary` - AI Management Summary page with insights panel
  - `/complaints` - Number of Complaints (Q1, Q2, Q3) with charts and tables
  - `/deviations` - Number of Deviations with trend analysis
  - `/ppaps` - Number of PPAPs with status breakdown
  - `/ppm` - PPM per ET Site with site-by-site analysis
  - `/customer-ppm-global` - Global Customer PPM view
  - `/supplier-ppm-global` - Global Supplier PPM view
  - `/data-lineage` - Data lineage documentation page
  - `/glossary` - Glossary of terms and metrics
- **Documentation System**: Created comprehensive documentation:
  - `CHANGELOG.md` - This file, tracking all changes
  - `PROJECT_STATE.md` - Complete application state documentation
  - `RECOVERY_GUIDE.md` - Recovery and rebuild instructions
- **Git Configuration**: Updated `.gitignore` to exclude temporary Excel files (`~$*`)

### Known Issues
- Settings page column mappings not persisted to localStorage (TODO exists)
- Column mapping configuration not loaded from user settings (TODO exists)

---

## Change Tracking Template

For each change, document:

### Date: YYYY-MM-DD HH:MM
**Type**: [Added|Changed|Fixed|Removed|Security]

**Description**: Brief description of what changed

**Files Modified**:
- `path/to/file1.tsx` - What changed in this file
- `path/to/file2.ts` - What changed in this file

**Components Affected**:
- ComponentName - What changed

**Features Added/Modified**:
- Feature name - Description

**Charts/Tables Added/Modified**:
- Chart/Table name - Description

**API Changes**:
- Endpoint: `/api/endpoint` - What changed

**Breaking Changes**: None (or list them)

**Migration Notes**: None (or instructions)

**Screenshots/References**: (if applicable)

---

## Example Entry Format

### Date: 2025-01-15 14:30
**Type**: Added

**Description**: Added complaints page with filtering and chart visualization

**Files Modified**:
- `app/(dashboard)/complaints/page.tsx` - Created page component
- `app/(dashboard)/complaints/complaints-client.tsx` - Created client component with:
  - Data loading from localStorage
  - Filter panel integration
  - Bar chart for complaints trend
  - Detailed table with Q1, Q2, Q3 breakdown
  - Summary cards showing totals

**Components Affected**:
- FilterPanel - Used for site/month filtering
- ComplaintsPerMonthChart - Bar chart visualization

**Features Added/Modified**:
- Complaints tracking page - Full page dedicated to viewing complaint metrics

**Charts/Tables Added/Modified**:
- Complaints Trend Chart - Bar chart showing Q1, Q2, Q3 by month
- Complaints by Site and Month Table - Detailed breakdown table

**API Changes**: None

**Breaking Changes**: None

**Migration Notes**: None

---

## Important Notes

- **ALWAYS** update this changelog when making changes
- **ALWAYS** commit changes to git with descriptive messages
- **ALWAYS** document new components, charts, tables, and features
- **ALWAYS** note any breaking changes or migration requirements
- Take screenshots of new UI features when possible
- Document any configuration changes or environment variable updates

