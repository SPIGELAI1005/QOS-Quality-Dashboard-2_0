# QOS ET Quality Report - Complete Project State Documentation

**Last Updated**: 2025-12-14  
**Version**: 1.0.1  
**Status**: Active Development

This document provides a complete snapshot of the application state, including all pages, components, features, charts, tables, and functionality. Use this document to rebuild the application if data is lost.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Pages & Routes](#pages--routes)
5. [Components](#components)
6. [Charts & Visualizations](#charts--visualizations)
7. [Tables & Data Display](#tables--data-display)
8. [API Endpoints](#api-endpoints)
9. [Data Models & Types](#data-models--types)
10. [Configuration](#configuration)
11. [Features & Functionality](#features--functionality)
12. [Styling & Theming](#styling--theming)
13. [Dependencies](#dependencies)

---

## Application Overview

**Purpose**: Web application for analyzing manufacturing quality data from SAP S/4HANA exports. Processes Excel files containing complaint notifications and delivery data to generate comprehensive quality KPIs and AI-powered insights.

**Key Capabilities**:
- Track Quality Metrics (Q1, Q2, Q3, Deviations, PPAP)
- Calculate PPM (Parts Per Million) metrics
- Visualize trends with interactive charts
- Generate AI-powered insights and recommendations
- Flexible Excel file import with automatic column detection

---

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Shadcn UI
- **Charts**: Recharts
- **Excel Parsing**: SheetJS (xlsx)
- **Testing**: Vitest
- **Package Manager**: pnpm (based on pnpm-lock.yaml)

---

## Project Structure

```
QOS ET Report/
├── app/
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── ai-summary/          # AI Management Summary
│   │   ├── complaints/          # Complaints page
│   │   ├── customer-ppm-global/ # Global Customer PPM
│   │   ├── dashboard/           # Main dashboard
│   │   ├── data-lineage/        # Data lineage documentation
│   │   ├── deviations/          # Deviations page
│   │   ├── executive/           # Executive Summary
│   │   ├── glossary/            # Glossary page
│   │   ├── ppaps/               # PPAPs page
│   │   ├── ppm/                 # PPM per Site
│   │   ├── settings/            # Settings page
│   │   ├── supplier-ppm-global/ # Global Supplier PPM
│   │   ├── upload/              # Upload & Report page
│   │   └── layout.tsx           # Dashboard layout
│   ├── api/                     # API routes
│   │   ├── ai/
│   │   │   └── interpret-kpis/  # AI insights endpoint
│   │   ├── kpi/
│   │   │   └── calculate/       # KPI calculation endpoint
│   │   ├── plants/              # Plants data endpoint
│   │   ├── test-route/          # Test endpoint
│   │   ├── upload/              # File upload endpoint
│   │   ├── upload-all-files/    # Process all files from attachments
│   │   └── upload-kpis/         # Upload and calculate KPIs
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── attachments/                 # Excel files folder
├── components/
│   ├── charts/                  # Chart components
│   ├── dashboard/               # Dashboard-specific components
│   ├── layout/                  # Layout components
│   └── ui/                      # Shadcn UI components
├── lib/
│   ├── ai/                      # AI/LLM client
│   ├── config/                  # Configuration files
│   ├── data/                    # Data files
│   ├── domain/                  # Domain models & business logic
│   ├── excel/                   # Excel parsing utilities
│   └── utils/                   # Utility functions
├── public/                      # Static assets
├── scripts/                     # Utility scripts
├── .gitignore                   # Git ignore rules
├── CHANGELOG.md                 # Change log
├── components.json              # Shadcn UI config
├── next.config.ts               # Next.js config
├── package.json                 # Dependencies
├── PROJECT_STATE.md             # This file
├── README.md                     # Project README
├── RECOVERY_GUIDE.md            # Recovery instructions
├── tailwind.config.ts           # Tailwind config
└── tsconfig.json                # TypeScript config
```

---

## Pages & Routes

### 1. Home Page (`/`)
- **File**: `app/page.tsx`
- **Description**: Landing page
- **Features**: Welcome screen, navigation to dashboard

### 2. Main Dashboard (`/dashboard`)
- **Files**: 
  - `app/(dashboard)/dashboard/page.tsx`
  - `app/(dashboard)/dashboard/dashboard-client.tsx`
- **Description**: Main dashboard with comprehensive KPI overview
- **Features**:
  - Global PPM summary cards
  - Filter panel (plants, complaint types, notification types, date range)
  - Multiple chart visualizations
  - KPI tables
  - AI insights panel
- **Charts**: 
  - Notifications by month and plant
  - Notifications by type
  - PPM trends
  - Pie charts for distribution
- **Tables**: Monthly site KPIs table

### 3. Executive Summary (`/executive`)
- **Files**:
  - `app/(dashboard)/executive/page.tsx`
  - `app/(dashboard)/executive/executive-client.tsx`
- **Description**: High-level executive dashboard with summary metrics
- **Features**:
  - Summary metric tiles with trends
  - Consolidated charts with tabs
  - Drill-down capabilities
  - Download functionality
- **Charts**: Multiple chart types with tabbed interface

### 4. AI Management Summary (`/ai-summary`)
- **Files**:
  - `app/(dashboard)/ai-summary/page.tsx`
  - `app/(dashboard)/ai-summary/ai-summary-client.tsx`
- **Description**: AI-powered insights and recommendations
- **Features**:
  - AI insights panel
  - Trend analysis
  - Anomaly detection
  - Actionable recommendations
- **Components**: AIInsightsPanel

### 5. Complaints Page (`/complaints`)
- **Files**:
  - `app/(dashboard)/complaints/page.tsx`
  - `app/(dashboard)/complaints/complaints-client.tsx`
- **Description**: Detailed view of complaints (Q1, Q2, Q3)
- **Features**:
  - Filter panel
  - Summary cards (Total, Q1, Q2, Q3)
  - Complaints trend chart
  - Detailed table by site and month
- **Charts**: 
  - Bar chart: Complaints Trend (Q1, Q2, Q3 by month)
- **Tables**: 
  - Complaints by Site and Month (Month, Site Code, Site Name, Q1, Q2, Q3, Total)

### 6. Deviations Page (`/deviations`)
- **Files**:
  - `app/(dashboard)/deviations/page.tsx`
  - `app/(dashboard)/deviations/deviations-client.tsx`
- **Description**: View deviations (D1, D2, D3)
- **Features**:
  - Filter panel
  - Total deviations card
  - Deviations trend chart
  - Detailed table by site and month
- **Charts**: 
  - Bar chart: Deviations Trend (by month)
- **Tables**: 
  - Deviations by Site and Month (Month, Site Code, Site Name, Deviations)

### 7. PPAPs Page (`/ppaps`)
- **Files**:
  - `app/(dashboard)/ppaps/page.tsx`
  - `app/(dashboard)/ppaps/ppaps-client.tsx`
- **Description**: View PPAP status (P1, P2, P3)
- **Features**:
  - Filter panel
  - Summary cards (Total, In Progress, Completed)
  - PPAP trend chart
  - Detailed table by site and month
- **Charts**: 
  - Bar chart: PPAP Trend (In Progress, Completed by month)
- **Tables**: 
  - PPAPs by Site and Month (Month, Site Code, Site Name, In Progress, Completed, Total)

### 8. PPM per Site (`/ppm`)
- **Files**:
  - `app/(dashboard)/ppm/page.tsx`
  - `app/(dashboard)/ppm/ppm-client.tsx`
- **Description**: PPM metrics by site
- **Features**:
  - Filter panel
  - PPM trend chart by site
  - Detailed table by site and month
- **Charts**: 
  - Line chart: PPM Trend by Site (Customer and Supplier PPM per site)
- **Tables**: 
  - PPM by Site and Month (Month, Site Code, Site Name, Customer PPM, Supplier PPM)

### 9. Customer PPM Global (`/customer-ppm-global`)
- **Files**:
  - `app/(dashboard)/customer-ppm-global/page.tsx`
  - `app/(dashboard)/customer-ppm-global/customer-ppm-global-client.tsx`
- **Description**: Global customer PPM view
- **Features**:
  - Global customer PPM card
  - Global customer PPM trend chart
- **Charts**: 
  - Line chart: Global Customer PPM Trend (by month)

### 10. Supplier PPM Global (`/supplier-ppm-global`)
- **Files**:
  - `app/(dashboard)/supplier-ppm-global/page.tsx`
  - `app/(dashboard)/supplier-ppm-global/supplier-ppm-global-client.tsx`
- **Description**: Global supplier PPM view
- **Features**:
  - Global supplier PPM card
  - Global supplier PPM trend chart
- **Charts**: 
  - Line chart: Global Supplier PPM Trend (by month)

### 11. Upload & Report (`/upload`)
- **Files**: `app/(dashboard)/upload/page.tsx`
- **Description**: File upload and KPI calculation page
- **Features**:
  - File upload form (complaints, deliveries, other data)
  - "Process All Files from Attachments" button
  - Progress indicator
  - Global PPM summary
  - Filters (months, sites)
  - Charts (complaints per month, PPM per month)
  - AI insights panel
  - KPI table
- **Charts**: 
  - ComplaintsPerMonthChart
  - PpmPerMonthChart
- **Tables**: 
  - Monthly Site KPIs table

### 12. Data Lineage (`/data-lineage`)
- **Files**:
  - `app/(dashboard)/data-lineage/page.tsx`
  - `app/(dashboard)/data-lineage/data-lineage-client.tsx`
- **Description**: Documentation of data flow
- **Features**:
  - Source files information
  - Data processing steps
  - KPI calculations explanation
  - Reports & dashboards overview
  - Data flow diagram

### 13. Glossary (`/glossary`)
- **Files**:
  - `app/(dashboard)/glossary/page.tsx`
  - `app/(dashboard)/glossary/glossary-client.tsx`
- **Description**: FAQ & Glossary hub (navigation + calculations + definitions)
- **Features**:
  - Tabs UI:
    - FAQ: 15 curated Q&As (navigation, data sources, KPI/chart calculations)
    - Glossary: complete glossary (no collapsing), grouped by category in tables
  - Real-time search bar filtering both FAQ + Glossary
  - FAQ deep links:
    - Per-FAQ “copy link” button generates `/glossary#faq-N`
    - Visiting `/glossary#faq-N` auto-opens the matching FAQ item
  - “QM ET Triangle” image integrated (`public/Media/QM ET Triangle.png`)
  - Dataset Health panel (live from Upload History, stale highlighting)
  - Contact card:
    - Issue title + remark fields
    - Mailto button to `george.neacsu@webasto.com` with context prefilled
    - Diagnostics JSON download (user can attach to email)
  - Improvement Ideas short form with email send button
  - “How to read key charts” anchor sections used by dashboard chart tooltips (links from charts → `/glossary#how-to-*`)

### 14. Settings (`/settings`)
- **Files**: `app/(dashboard)/settings/page.tsx`
- **Description**: Application settings and configuration
- **Features**:
  - Column mappings configuration (Complaints, Deliveries)
  - Tabs interface
  - Save functionality (TODO: persist to localStorage)
- **Status**: Column mappings not yet persisted (TODO exists)

---

## Components

### Layout Components

#### Sidebar (`components/layout/sidebar.tsx`)
- **Type**: Client Component
- **Description**: Navigation sidebar with all dashboard routes
- **Features**:
  - Active route highlighting
  - Icons for each route
  - Responsive design
- **Routes**: 13 navigation items (Dashboard, Executive, AI Summary, Complaints, Deviations, PPAPs, PPM, Customer PPM Global, Supplier PPM Global, Upload, Data Lineage, Glossary, Settings)

#### TopBar (`components/layout/topbar.tsx`)
- **Type**: Client Component
- **Description**: Top navigation bar
- **Features**: Application title display

### Dashboard Components

#### FileUpload (`components/dashboard/file-upload.tsx`)
- **Type**: Client Component
- **Description**: File upload component
- **Props**: 
  - `onComplaintsLoaded`
  - `onDeliveriesLoaded`
  - `onPlantsLoaded`

#### FilterPanel (`components/dashboard/filter-panel.tsx`)
- **Type**: Client Component
- **Description**: Advanced filtering panel
- **Features**:
  - Plant selection
  - Complaint type selection
  - Notification type selection
  - Date range picker
- **Props**:
  - `filters`: FilterState
  - `onFiltersChange`: Function
  - `monthlySiteKpis`: MonthlySiteKpi[]

#### KpiFilters (`components/dashboard/kpi-filters.tsx`)
- **Type**: Client Component
- **Description**: KPI filtering component
- **Features**: Month and site filtering

#### KpiCharts (`components/dashboard/kpi-charts.tsx`)
- **Type**: Client Component
- **Description**: KPI chart visualizations
- **Props**:
  - `monthlyData`
  - `selectedSites`

#### KpiTable (`components/dashboard/kpi-table.tsx`)
- **Type**: Client Component
- **Description**: KPI data table
- **Props**:
  - `monthlyData`
  - `selectedSites`

#### AIInsights (`components/dashboard/ai-insights.tsx`)
- **Type**: Client Component
- **Description**: AI insights display component

#### AIInsightsPanel (`components/dashboard/ai-insights-panel.tsx`)
- **Type**: Client Component
- **Description**: Panel for AI-powered insights
- **Props**:
  - `monthlySiteKpis`: MonthlySiteKpi[]
  - `globalPpm`: { customerPpm, supplierPpm }
  - `selectedSites`: string[]
  - `selectedMonths`: string[]
- **Features**:
  - Generate AI insights button
  - Loading states
  - Insights display

### Chart Components

#### ComplaintsPerMonthChart (`components/charts/complaints-per-month-chart.tsx`)
- **Type**: Client Component
- **Description**: Bar chart showing complaints per month
- **Props**:
  - `data`: MonthlySiteKpi[]
  - `selectedSites`: string[]
- **Chart Type**: Bar Chart (Recharts)
- **Data**: Q1, Q2, Q3 complaints grouped by month

#### PpmPerMonthChart (`components/charts/ppm-per-month-chart.tsx`)
- **Type**: Client Component
- **Description**: Line chart showing PPM trends
- **Props**:
  - `data`: MonthlySiteKpi[]
  - `selectedSites`: string[]
- **Chart Type**: Line Chart (Recharts)
- **Data**: Customer and Supplier PPM by month

### UI Components (Shadcn)

All UI components from Shadcn UI:
- Accordion
- Badge
- Button
- Calendar
- Card
- Checkbox
- Input
- Label
- Popover
- Progress
- Select
- Table
- Tabs
- Tooltip

---

## Charts & Visualizations

### Chart Library: Recharts

### Chart Types Used:

1. **Bar Charts**:
   - Complaints Trend (Q1, Q2, Q3 by month)
   - Deviations Trend (by month)
   - PPAP Trend (In Progress, Completed by month)
   - Notifications by month and plant
   - Notifications by type

2. **Line Charts**:
   - PPM Trend by Site (Customer and Supplier)
   - Global Customer PPM Trend
   - Global Supplier PPM Trend
   - PPM per Month

3. **Pie Charts**:
   - Distribution charts (various metrics)

### Chart Features:
- Responsive design
- Tooltips
- Legends
- Cartesian grids
- Custom colors (from `lib/utils/chartColors.ts`)
- Animations

### Color System:
- Defined in `lib/utils/chartColors.ts`
- Plant-specific colors
- Notification type colors
- Chart animation utilities

---

## Tables & Data Display

### Table Components:

1. **Monthly Site KPIs Table**:
   - Columns: Month, Site Code, Site Name, Q1, Q2, Q3, Deviations, PPAP In Progress, PPAP Completed, Customer PPM, Supplier PPM
   - Used in: Dashboard, Upload page

2. **Complaints Table**:
   - Columns: Month, Site Code, Site Name, Q1, Q2, Q3, Total
   - Used in: Complaints page

3. **Deviations Table**:
   - Columns: Month, Site Code, Site Name, Deviations
   - Used in: Deviations page

4. **PPAPs Table**:
   - Columns: Month, Site Code, Site Name, In Progress, Completed, Total
   - Used in: PPAPs page

5. **PPM Table**:
   - Columns: Month, Site Code, Site Name, Customer PPM, Supplier PPM
   - Used in: PPM page

### Table Features:
- Responsive design
- Sorting capabilities
- Filtering integration
- Empty state handling
- Hover effects

---

## API Endpoints

### 1. `/api/upload-kpis` (POST)
- **File**: `app/api/upload-kpis/route.ts`
- **Description**: Upload files and calculate KPIs
- **Request**: FormData with complaintsFile and deliveryFiles
- **Response**: 
  ```typescript
  {
    monthlySiteKpis: MonthlySiteKpi[],
    globalPpm: { customerPpm: number | null, supplierPpm: number | null },
    summary: {
      totalComplaints: number,
      totalDeliveries: number,
      siteMonthCombinations: number,
      deliveryFileErrors?: string[]
    }
  }
  ```

### 2. `/api/upload-all-files` (POST)
- **File**: `app/api/upload-all-files/route.ts`
- **Description**: Process all Excel files from attachments folder
- **Request**: None (reads from attachments folder)
- **Response**: Same as `/api/upload-kpis`
- **Features**: 
  - Scans attachments folder
  - Detects file types automatically
  - Processes all files
  - Max duration: 120 seconds

### 3. `/api/ai/interpret-kpis` (POST)
- **File**: `app/api/ai/interpret-kpis/route.ts`
- **Description**: Generate AI insights from KPI data
- **Request**: 
  ```typescript
  {
    monthlySiteKpis: MonthlySiteKpi[],
    globalPpm: { customerPpm: number | null, supplierPpm: number | null }
  }
  ```
- **Response**: AI insights object

### 4. `/api/kpi/calculate` (POST)
- **File**: `app/api/kpi/calculate/route.ts`
- **Description**: Calculate KPIs from data
- **Request**: KPI calculation parameters
- **Response**: Calculated KPIs

### 5. `/api/plants` (GET)
- **File**: `app/api/plants/route.ts`
- **Description**: Get plant/site data
- **Response**: Plant data array

### 6. `/api/upload` (POST)
- **File**: `app/api/upload/route.ts`
- **Description**: File upload endpoint
- **Request**: FormData with files
- **Response**: Upload confirmation

### 7. `/api/test-route` (GET)
- **File**: `app/api/test-route/route.ts`
- **Description**: Test endpoint

---

## Data Models & Types

### Core Types (`lib/domain/types.ts`)

#### MonthlySiteKpi
```typescript
interface MonthlySiteKpi {
  month: string;                    // Format: "YYYY-MM"
  siteCode: string;                 // Plant/site code
  siteName?: string;                // Plant/site name
  customerComplaintsQ1: number;     // Q1 complaints count
  supplierComplaintsQ2: number;     // Q2 complaints count
  internalComplaintsQ3: number;     // Q3 complaints count
  deviationsD: number;              // Total deviations
  ppapP: {
    inProgress: number;              // PPAP in progress
    completed: number;               // PPAP completed
  };
  customerPpm: number | null;       // Customer PPM
  supplierPpm: number | null;       // Supplier PPM
}
```

#### NotificationType
```typescript
type NotificationType = "Q1" | "Q2" | "Q3" | "D1" | "D2" | "D3" | "P1" | "P2" | "P3" | "Other";
```

#### Complaint
```typescript
interface Complaint {
  notificationNumber: string;
  notificationType: NotificationType;
  createdDate: Date;
  plantCode?: string;
  siteCode?: string;
  siteName?: string;
  defectiveParts?: number;
}
```

#### Delivery
```typescript
interface Delivery {
  plantCode: string;
  siteCode: string;
  date: Date;
  quantity: number;
  direction: "Customer" | "Supplier";
  siteName?: string;
}
```

### Column Mappings (`lib/config/columnMappings.ts`)

#### ComplaintColumnMapping
```typescript
interface ComplaintColumnMapping {
  notificationNumber: string[];
  notificationType: string[];
  createdDate: string[];
  plantCode: string[];
  siteCode: string[];
  siteName: string[];
  defectiveParts: string[];
}
```

#### DeliveryColumnMapping
```typescript
interface DeliveryColumnMapping {
  plantCode: string[];
  siteCode: string[];
  date: string[];
  quantity: string[];
  direction: string[];
  siteName: string[];
}
```

---

## Configuration

### Environment Variables (`.env.local`)
- `AI_API_KEY`: API key for AI provider
- `AI_PROVIDER`: "openai" or "anthropic"
- `AI_MODEL`: Optional model override
- `AI_BASE_URL`: Optional custom endpoint URL

### Column Mappings
- Default mappings defined in `lib/config/columnMappings.ts`
- Supports multiple column name variations
- Case-insensitive matching
- Partial name matching
- German term support (Werk, Menge, Erstellt, etc.)

### File Detection
- Automatic file type detection based on filename
- Patterns:
  - Complaints: "complaint", "q cockpit", "qos", "deviation", "ppap", "notif"
  - Deliveries: "outbound", "inbound", "delivery"
  - Plants: "plant", "webasto"

---

## Features & Functionality

### Data Processing
1. **Excel File Parsing**:
   - Supports .xlsx and .xls formats
   - Automatic column detection
   - Flexible column mapping
   - Date parsing and validation
   - Plant code normalization

2. **KPI Calculations**:
   - Complaint counts (Q1, Q2, Q3)
   - Deviation counts (D1, D2, D3)
   - PPAP status (P1, P2, P3)
   - Customer PPM = (Q1 Defective Parts / Customer Deliveries) × 1,000,000
   - Supplier PPM = (Q2 Defective Parts / Supplier Deliveries) × 1,000,000
   - Monthly aggregation per site

3. **Data Storage**:
   - localStorage for KPIs (`qos-et-kpis`)
   - localStorage for global PPM (`qos-et-global-ppm`)

### Filtering & Search
- Plant/site filtering
- Month filtering
- Complaint type filtering
- Notification type filtering
- Date range filtering

### AI Features
- LLM client interface (`lib/ai/client.ts`)
- Support for multiple providers (OpenAI, Anthropic)
- AI insights generation
- Trend analysis
- Anomaly detection
- Actionable recommendations

### File Upload
- Single file upload
- Multiple file upload
- "Process All Files" from attachments folder
- Progress indicators
- Error handling
- File type validation

---

## Styling & Theming

### Framework: Tailwind CSS

### Theme Support:
- Light mode (default)
- Dark mode support (via next-themes)

### Color Scheme:
- Primary colors defined in Tailwind config
- Chart colors in `lib/utils/chartColors.ts`
- Plant-specific color mapping
- Notification type color mapping

### Responsive Design:
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Responsive charts and tables
- Adaptive layouts

---

## Dependencies

### Production Dependencies (from package.json):
- next: ^15.0.0
- react: ^18.3.1
- react-dom: ^18.3.1
- recharts: ^2.15.4
- xlsx: ^0.18.5
- zod: ^3.25.76
- tailwindcss: ^3.4.17
- @radix-ui/*: Multiple UI component libraries
- lucide-react: ^0.462.0
- date-fns: ^3.6.0
- And many more...

### Development Dependencies:
- typescript: ^5.9.3
- vitest: ^2.1.8
- eslint: ^9.32.0
- @types/*: Type definitions

---

## Known Issues & TODOs

1. **Settings Persistence**: Column mappings not saved to localStorage (TODO in `app/(dashboard)/settings/page.tsx`)
2. **Column Mapping Loading**: Not loaded from user settings (TODO in `lib/config/columnMappings.ts`)

---

## Recovery Information

If this project needs to be rebuilt:
1. Refer to `RECOVERY_GUIDE.md` for step-by-step instructions
2. Use `CHANGELOG.md` to track what was changed and when
3. Reference this document for complete application state
4. Check git history for code changes
5. Review component files for implementation details

---

**Document Maintenance**: This document should be updated whenever significant changes are made to the application structure, features, or components.

