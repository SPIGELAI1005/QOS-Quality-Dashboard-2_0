# Memory Bank — QOS ET Quality Report

**Last Updated**: 2026-05-07  
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
  - `qos-et-manual-kpis`: manual KPI entries (template) — **deduped by `(month, siteCode)`, latest entry wins (2026-05-07)**
  - UI state: `qos-et-language`, `qos-et-role`, `qos-et-sidebar-collapsed`, `qos-et-filters-collapsed`
- **sessionStorage (Management Summary)**:
  - `qos-et-management-summary-export`: legacy handoff payload for the Chrome-safe dashboard fallback (`?msExport=1`). The primary flow is fully client-side on `/management-summary`.

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

## Recent critical implementation decisions (2026-05-07)

### Management Summary report builder

- New page **`/management-summary`** replaces the dashboard's instant "Export Management Summary" PDF with a full configuration form (title, logo, plants, per-plant remarks, section selection).
- PDF is generated **client-side** in `components/management-summary/pdf-generator.ts` (uses `jsPDF`); the page does not redirect — a status banner reports progress/success/error.
- **Reporting-month policy**: helper `getReportMonthInfo()` in `lib/management-summary/constants.ts` returns the **previous calendar month** relative to today. Example: a report created in May ⇒ April. The payload carries `reportMonthKey` (`YYYY-MM`) so the same period is used by every page in the PDF, every chart highlights this month's bar, and the filename includes it: `Management_Summary_2026-04_20260507.pdf`.
- Trailing 12 months are computed by `buildLast12MonthsEnding(reportMonthKey)` so the PDF is consistent regardless of what the latest available data month is.
- **Plant pages** are **3×2 charts + two compact comparison tables + remarks card**:
  - Row 1: Customer Complaints (Q1), Customer Defective Parts, Customer PPM (bars + 3-month moving-average trend)
  - Row 2: Supplier Complaints (Q2), Supplier Defective Parts, Supplier PPM (bars + 3-month moving-average trend)
  - Chart titles do not repeat the plant code (the page header already shows it).
  - Reported-month bar is highlighted on every chart.
  - Two side-by-side comparison tables (Customer / Supplier) with rows: Complaints, Defective Parts, Deliveries, PPM and columns `Metric | <Reported Month> | Last 12 months`.
  - Remarks rendered as a separate **card** (`drawRemarksCard`, same chrome as tables) so it never overlaps the comparison tables; long remarks are truncated with an ellipsis indicator.
- **Notifications & Defects PDF page**: the per-plant legend was intentionally **removed** from the `Notifications by Month` and `Defects by Month` charts because the bars represent monthly totals (no per-site distribution rendered). The third chart, `Notifications by Type`, is rendered with `drawStackedBarChart`: each monthly bar is split into Q1 (Customer), Q2 (Supplier), and Q3 (Internal) segments matching the legend colours, so the bars actually visualise the type breakdown.
- **No em-dashes in PDF or UI strings**: titles use a colon (`…April 2026: Notifications & Defects`), the recommended report title is `Management Summary QOS ET Report <Month> <Year>`, and chart titles use natural phrasing (e.g. `R12M Customer PPM monthly values with trend`). When generating new copy in this codebase do NOT introduce em-dashes (`—`); prefer colons, parentheses, or natural sentences.
- **Remarks / Top topics card** is rendered on every plant page; if the user did not enter a remark for that plant, the card body reads `No remarks.` so the section is always visible and clearly intentional.
- **Bar value labels** in `drawSimpleBarChart` / `drawBarWithTrendLineChart` are always drawn above each bar (`barTop − 1.3 mm`) with 8 mm of plot-area headroom reserved so tall bars never push the label inside the bar; trend lines use the same headroom so they align with bar tops.
- **Customer/Supplier PPM PDF pages** include: full-width bar+trend chart, Monthly Trend Analysis table (last 8 months + R12M total + reported-month row), Site Contribution per Month table (all selected plants + total).
- Default app logo is loaded from `/Media/QM ET Triangle.png`; users can override via file input on `/management-summary`. Logo data is carried as a base64 data URL on the payload (`logoDataUrl`).
- Section catalog (`lib/management-summary/section-catalog.ts`) drives the form checklist and which sections are rendered: `executive`, `chart-notifications-month`, `chart-defects-month`, `chart-notifications-type`, `customer-ppm`, `supplier-ppm`, `plant-pages`.

### Manual upload latest-wins

- Manual entries (`qos-et-manual-kpis`) are now deduped by `(month, siteCode)` before KPI recalculation; the **most recent** entry wins. `updatedAtIso` is stamped on every entry to allow ordering.
- Fixes a regression where the first manual entry for a given month/plant could persist instead of the latest, producing wrong KPI/PPM values on the dashboard.

---

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

