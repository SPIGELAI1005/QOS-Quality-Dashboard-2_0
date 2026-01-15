# Changelog

All notable changes to the QOS ET Quality Report project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

