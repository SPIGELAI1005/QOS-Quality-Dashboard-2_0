# Memory Bank — QOS ET Quality Report

**Last Updated**: 2026-03-16  
**Purpose**: Fast, accurate context for continuing development and recovery.

---

## Product intent (what this app is)

QOS ET Quality Report is a Next.js dashboard for **manufacturing quality KPIs** (complaints/notifications, deliveries, PPM) with **AI-assisted analysis** (AI Summary + I AM Q). It is designed for multi-site, monthly reporting with incremental uploads.

---

## Core user workflows

### 1) Upload → KPIs → Dashboard update

- Users upload Excel files on `/upload` per category (complaints, deliveries, plants, etc.)
- After uploads, KPIs are calculated and stored for consumption by all pages
- KPI changes are broadcast via a custom event so charts/pages refresh immediately

### 2) Filter by PLANT + time

- The right-side filter panel supports **multi-select plants** and date filtering.
- **Individual Plants** options come only from **Webasto ET Plants.xlsx** (no synthetic plants from KPI data).
- Empty plant selection means **“all plants”** (no plant filter applied).

- **Period mode**: Dashboard and related pages (PPAPs, Deviations, Cost Poor Quality, Audit Management, Warranties Costs) have a **12 Months Back (12MB)** / **Year to Date (YTD)** toggle; metrics and charts respect the selected mode and month/year.

### 3) AI Management Summary (`/ai-summary`)

- Uses filtered KPI data + displayed tile metrics (when available)
- Produces: Summary, Trends, Risks/Anomalies, Opportunities, Recommended Actions
- Backend guarantees **≥ 3 recommended actions** (monitoring actions if performance is stable).

---

## Data sources & storage (authoritative)

### Excel inputs

- **Complaints/Notifications**: Q1/Q2/Q3 (and D*/P* on dedicated pages)
- **Deliveries**: inbound/outbound deliveries (Supplier/Customer)
- **Plants master**: “Webasto ET Plants.xlsx” provides plant metadata (city, abbreviations, country)

### Browser persistence

- **IndexedDB (large datasets)**:
  - DB: `qos-et-datasets`
  - Stores: `complaints`, `deliveries`
  - Reason: avoids `localStorage` quota errors for large uploads
- **localStorage (small state + KPIs)**:
  - `qos-et-kpis`: aggregated monthly KPIs (array of `MonthlySiteKpi`)
  - `qos-et-global-ppm`: global PPM object
  - `qos-et-upload-history`: audit log of uploads
  - `qos-et-upload-summary-{uploadId}` / `qos-et-change-history-{uploadId}`
  - `qos-et-manual-kpis`: manual KPI entries (template)
  - UI state: `qos-et-language`, `qos-et-role`, `qos-et-sidebar-collapsed`, `qos-et-filters-collapsed`

### Cross-component update signal

- Event: `qos-et-kpi-data-updated`
- Dispatched after KPI calculation so Dashboard + other pages refresh automatically.

---

## Key backend endpoints

- `GET /api/plants`: plant master data (used for abbreviations/city/country across UI + AI prompts)
- `POST /api/upload`: parse uploaded files (by type)
- `POST /api/ai/interpret-kpis`: AI insights for AI Summary page (includes validation + minimum actions)

---

## Recent critical implementation decisions (2026-02-02)

- **Layout / ChunkLoadError**: Root layout splits client shell; ThemeProvider + Toaster live in `theme-and-toaster.tsx` (dynamically imported). Fallback UI with Retry on ChunkLoadError.
- **Period mode**: Dashboard and five related pages have **12 Months Back (12MB)** vs **Year to Date (YTD)** toggle; metrics and charts filter by selected mode and month/year; titles update (YTD/12MB).
- **Upload duplicates**: New uploads **merge** with existing data; duplicates are **deduped by record id** before persist (no full clear of IndexedDB). Change type `duplicate` and `duplicateRecords` count in upload summary; Change History panel has Duplicate filter.
- **Plant filter**: Individual Plants options come **only from Webasto ET Plants.xlsx**; selected plants are cleaned when they drop out of the list; SAP P01 quick access uses plants data; plant 210 (Manisa) in PLANT_COLORS.
- **i18n**: Period mode labels, YTD subtitle, “duplicates”, Change History panel (filters, types, labels), dashboard filter warning, and month names are fully translated (en/de/it).

## Recent critical implementation decisions (2026-03-16)

- **Manual form Excel import**: Enter Data form now supports template-driven import from Excel by reading **field label cell + right-adjacent value cell**; imported values are shown in the form for review before Add Entry.
- **Template mapping coverage**: Label aliases were expanded to match `QOS_ET_Manual_Data_Entry_Form_v01_2026.xlsx` variants (including multi-line and prefixed labels like `Nr. of ...`, `Total Quantity ...`, and `(template)` suffixes).
- **Import validation panel**: Enter Data now shows required imported fields count and missing required fields list, giving immediate completeness feedback after upload.
- **Large file resilience**: For files >2MB, upload uses **client-side parse + chunked JSON upload** to reduce Vercel payload/timeout failures; small files still use multipart upload.
- **Large file transparency**: Upload cards now show a badge when large-file mode is active so users understand behavior differences.
- **PPAP naming standardization in UI**: PPAP filter labels now reflect business naming (`P1 - Customer PPAP`, `P2 - Supplier PPAP`) and remove unnecessary `P3` option in filter UI.
- **Cross-theme chart readability**: Recharts label/axis text now uses theme-aware colors (plus stronger global SVG overrides) to keep text readable when switching between dark and light mode without white-text regressions.
- **PPM export unification**: Dashboard site-contribution export now generates one Excel workbook with two tabs (`Customer PPM`, `Supplier PPM`) and rolling 12-month structure aligned to reference reporting format.
- **Mailto reliability**: AI summary and glossary mailto builders now encode subject/body with `encodeURIComponent`, preventing `+` characters between words in email clients.
- **Regression safety net**: Added a dedicated unit test for `buildMailtoLink` to ensure future refactors do not reintroduce `+` in mailto body text.
- **Glossary hydration compliance**: Fixed invalid nested interactive structure (`button` inside `button`) in FAQ accordion by using a keyboard-accessible non-button element for copy-link action.
- **Terminology refresh (EN/DE/IT)**: FAQ and glossary definitions were updated to reflect current PPAP/Deviation naming (`P1/P2`, `D1/D2/D3` semantics).

## Recent critical implementation decisions (2026-01-17)

- Switched parsed uploads storage from `localStorage` to **IndexedDB** to prevent quota errors.
- Upload UI uses a custom **Step 1: Select data** / **Step 2: Upload** control (native file input hidden).
- PLANT filter now supports **true multi-select** toggling.
- AI backend ensures **recommendedActions length ≥ 3**, including monitoring/governance actions when stable.

---

## Troubleshooting quick hits

- **Upload fails with quota error**: ensure running version includes IndexedDB storage. If needed, clear IndexedDB `qos-et-datasets`.
- **Dashboard doesn’t reflect uploads**: verify KPIs exist in `localStorage` (`qos-et-kpis`) and the `qos-et-kpi-data-updated` event is dispatched after recalculation.
- **Mailto button does nothing**: Windows may not have a default `mailto:` handler; also keep mailto bodies short (URL length limits).

