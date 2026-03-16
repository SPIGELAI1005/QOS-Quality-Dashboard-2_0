# Persistence Migration Plan: Browser Storage → Server-Side Postgres

**Last Updated**: 2026-03-16

## A) Inventory Table: All Persistence Touchpoints

| Touchpoint | File Path | Storage Key/Type | Description |
|------------|-----------|------------------|-------------|
| **IndexedDB - Complaints** | `lib/data/datasets-idb.ts` | IndexedDB: `qos-et-datasets.complaints` | Stores large parsed complaint datasets (avoids localStorage quota) |
| **IndexedDB - Deliveries** | `lib/data/datasets-idb.ts` | IndexedDB: `qos-et-datasets.deliveries` | Stores large parsed delivery datasets (avoids localStorage quota) |
| **localStorage - KPIs** | `app/(dashboard)/upload/page.tsx` (line 735) | `qos-et-kpis` | Array of `MonthlySiteKpi[]` - aggregated monthly KPIs per site |
| **localStorage - Global PPM** | `app/(dashboard)/upload/page.tsx` (line 736) | `qos-et-global-ppm` | `{ customerPpm: number \| null, supplierPpm: number \| null }` |
| **localStorage - Upload History** | `app/(dashboard)/upload/page.tsx` (line 392) | `qos-et-upload-history` | Array of `UploadHistoryEntry[]` - audit log of file uploads |
| **localStorage - Manual KPIs** | `app/(dashboard)/upload/page.tsx` (line 397) | `qos-et-manual-kpis` | Array of `ManualKpiEntry[]` - manually entered KPI data |
| **localStorage - Upload KPI Results** | `app/(dashboard)/upload/page.tsx` (line 737) | `qos-et-upload-kpis-result` | `UploadKpisResponse` - cached KPI calculation results |
| **localStorage - Upload Summary** | `lib/data/uploadSummary.ts` (line 318) | `qos-et-upload-summary-{uploadId}` | `UploadSummaryEntry` - detailed upload metadata per upload session |
| **localStorage - Change History** | `lib/data/uploadSummary.ts` (line 380) | `qos-et-change-history-{uploadId}` | `ChangeHistoryEntry[]` - audit trail of data corrections per upload |
| **localStorage - Filters** | `lib/hooks/useGlobalFilters.ts` (line 55) | `qos-et-filters` | `FilterState` - global filter preferences (plants, dates, complaint types) |
| **localStorage - Filters Collapsed** | `components/dashboard/filter-panel.tsx` (line 101) | `qos-et-filters-collapsed` | Boolean string - UI state for filter panel collapse |
| **localStorage - Role** | `lib/auth/roles.ts` (line 28) | `qos-et-role` | `RoleKey` ("reader" \| "editor" \| "admin") - user role preference |
| **localStorage - Language** | `lib/i18n/useTranslation.ts` (line 6) | `qos-et-language` | `LanguageKey` ("en" \| "de" \| "it") - UI language preference |
| **localStorage - Sidebar Collapsed** | `components/layout/sidebar.tsx` (line 85) | `qos-et-sidebar-collapsed` | Boolean string - UI state for sidebar collapse |
| **Hook - KPI Data** | `lib/data/useKpiData.ts` | Reads `qos-et-kpis`, `qos-et-global-ppm` | React hook that loads and listens for KPI data updates |
| **Hook - Global Filters** | `lib/hooks/useGlobalFilters.ts` | Reads/writes `qos-et-filters` | React hook with localStorage persistence for filter state |
| **Multiple Consumers - KPIs** | `app/(dashboard)/dashboard/dashboard-client.tsx` (line 471) | Reads `qos-et-kpis`, `qos-et-global-ppm` | Dashboard loads KPIs from localStorage on mount |
| **Multiple Consumers - KPIs** | `app/(dashboard)/ai-summary/ai-summary-client.tsx` (line 69) | Reads `qos-et-kpis`, `qos-et-global-ppm` | AI Summary page loads KPIs |
| **Multiple Consumers - KPIs** | `app/(dashboard)/complaints/complaints-client.tsx` (line 50) | Reads `qos-et-kpis` | Complaints page loads KPIs |
| **Multiple Consumers - KPIs** | `app/(dashboard)/ppm/ppm-client.tsx` (line 49) | Reads `qos-et-kpis` | PPM page loads KPIs |
| **Multiple Consumers - Upload History** | `app/(dashboard)/data-lineage/data-lineage-client.tsx` (line 63) | Reads `qos-et-upload-history` | Data lineage page loads upload history |
| **Multiple Consumers - Upload History** | `components/iamq/iamq-chat-panel.tsx` (line 507) | Reads `qos-et-upload-history` | IAMQ chat loads upload history for context |
| **Multiple Consumers - Upload History** | `app/(dashboard)/glossary/glossary-client.tsx` (line 244) | Reads `qos-et-upload-history` | Glossary page loads upload history |

---

## B) Entity List with Inferred Fields

### Core Domain Entities

#### 1. **Complaint** (from `lib/domain/types.ts`)
- **Primary Key**: `id` (string, format: `{plant}-{notificationNumber}`)
- **Fields**:
  - `id`: string
  - `notificationNumber`: string
  - `notificationType`: "Q1" | "Q2" | "Q3" | "D1" | "D2" | "D3" | "P1" | "P2" | "P3" | "Other"
  - `category`: NotificationCategory enum
  - `plant`: string
  - `siteCode`: string
  - `siteName`: string (optional)
  - `createdOn`: Date
  - `defectiveParts`: number
  - `source`: "SAP_S4" | "Manual" | "Import"
  - `unitOfMeasure`: string (optional, e.g., "PC", "ML")
  - `materialDescription`: string (optional)
  - `materialNumber`: string (optional)
  - `conversion`: UnitConversion (optional) - conversion metadata for ML/M/M2 to PC
- **Relationships**: 
  - Many-to-one with Plant (via `plant`/`siteCode`)
  - Used to calculate MonthlySiteKpi
- **Storage**: Currently IndexedDB (`qos-et-datasets.complaints`)

#### 2. **Delivery** (from `lib/domain/types.ts`)
- **Primary Key**: `id` (string, format: `{plant}-{siteCode}-{date}-{kind}`)
- **Fields**:
  - `id`: string
  - `plant`: string
  - `siteCode`: string
  - `siteName`: string (optional)
  - `date`: Date
  - `quantity`: number
  - `kind`: "Customer" | "Supplier"
- **Relationships**:
  - Many-to-one with Plant (via `plant`/`siteCode`)
  - Used to calculate MonthlySiteKpi
- **Storage**: Currently IndexedDB (`qos-et-datasets.deliveries`)

#### 3. **MonthlySiteKpi** (from `lib/domain/types.ts`)
- **Primary Key**: Composite (`month`, `siteCode`) - format: `YYYY-MM` + `siteCode`
- **Fields**:
  - `month`: string (format: "YYYY-MM")
  - `siteCode`: string
  - `siteName`: string (optional)
  - `customerComplaintsQ1`: number
  - `supplierComplaintsQ2`: number
  - `internalComplaintsQ3`: number
  - `deviationsD`: number
  - `ppapP`: { inProgress: number, completed: number }
  - `customerPpm`: number | null
  - `supplierPpm`: number | null
  - `customerDeliveries`: number
  - `supplierDeliveries`: number
  - `customerDefectiveParts`: number
  - `supplierDefectiveParts`: number
  - `internalDefectiveParts`: number
  - `customerConversions`: object (optional) - conversion metadata
  - `supplierConversions`: object (optional) - conversion metadata
- **Relationships**:
  - Many-to-one with Plant (via `siteCode`)
  - Aggregated from Complaints and Deliveries
- **Storage**: Currently localStorage (`qos-et-kpis`)

#### 4. **GlobalPpm** (inferred from usage)
- **Primary Key**: Single record (or computed on-demand)
- **Fields**:
  - `customerPpm`: number | null
  - `supplierPpm`: number | null
- **Relationships**: Computed from MonthlySiteKpi aggregation
- **Storage**: Currently localStorage (`qos-et-global-ppm`)

### Audit & Metadata Entities

#### 5. **UploadHistoryEntry** (from `lib/data/datasetHealth.ts` and `app/(dashboard)/upload/page.tsx`)
- **Primary Key**: `id` (string, generated: `{prefix}_{timestamp}_{random}`)
- **Fields**:
  - `id`: string
  - `uploadedAtIso`: string (ISO timestamp)
  - `section`: "complaints" | "deliveries" | "ppap" | "deviations" | "audit" | "plants"
  - `files`: Array<{ name: string, size: number }>
  - `summary`: Record<string, string | number> (optional)
  - `usedIn`: string[] (optional)
  - `success`: boolean
  - `notes`: string (optional)
- **Relationships**: One-to-many with UploadSummaryEntry
- **Storage**: Currently localStorage (`qos-et-upload-history`)

#### 6. **UploadSummaryEntry** (from `lib/data/uploadSummary.ts`)
- **Primary Key**: `id` (string, links to UploadHistoryEntry.id)
- **Fields**:
  - `id`: string (FK to UploadHistoryEntry)
  - `uploadedAtIso`: string
  - `section`: UploadSectionKey
  - `files`: Array<{ name: string, size: number }>
  - `rawData`: object (minimal metadata for complaints/deliveries)
  - `processedData`: object (minimal metadata after corrections)
  - `conversionStatus`: object (conversion metadata per record)
  - `changeHistory`: ChangeHistoryEntry[] (embedded)
  - `summary`: { totalRecords, recordsWithIssues, recordsCorrected, recordsUnchanged }
- **Relationships**: One-to-one with UploadHistoryEntry, one-to-many with ChangeHistoryEntry
- **Storage**: Currently localStorage (`qos-et-upload-summary-{uploadId}`)

#### 7. **ChangeHistoryEntry** (from `lib/data/uploadSummary.ts`)
- **Primary Key**: `id` (string)
- **Fields**:
  - `id`: string
  - `timestamp`: string (ISO)
  - `editor`: string (name of person)
  - `recordId`: string (complaint/delivery ID or manual entry identifier)
  - `recordType`: "complaint" | "delivery" | "ppap" | "deviation" | "manual_entry" | "file_upload"
  - `field`: string (field changed or "all" for new entries)
  - `oldValue`: any
  - `newValue`: any
  - `reason`: string (optional)
  - `changeType`: "conversion" | "manual_edit" | "correction" | "bulk_action" | "new_entry" | "file_upload"
  - `affectedMetrics`: AffectedMetrics object
  - `onePagerLink`: string (optional)
  - `dataDetails`: Record<string, any> (optional)
- **Relationships**: Many-to-one with UploadSummaryEntry (via uploadId)
- **Storage**: Currently localStorage (`qos-et-change-history-{uploadId}`)

#### 8. **ManualKpiEntry** (from `app/(dashboard)/upload/page.tsx`)
- **Primary Key**: Composite (`month`, `siteCode`) - extends MonthlySiteKpi
- **Fields**: All fields from MonthlySiteKpi plus:
  - `auditInternalSystem`: number (optional)
  - `auditCertification`: number (optional)
  - `auditProcess`: number (optional)
  - `auditProduct`: number (optional)
  - `deviationsInProgress`: number (optional)
  - `deviationsCompleted`: number (optional)
  - `poorQualityCosts`: number (optional)
  - `warrantyCosts`: number (optional)
  - `recordedBy`: string (optional)
  - `onePagerLink`: string (optional)
- **Relationships**: Merged into MonthlySiteKpi during calculation
- **Storage**: Currently localStorage (`qos-et-manual-kpis`)

### UI State Entities (May remain client-side or move to user preferences)

#### 9. **FilterState** (from `components/dashboard/filter-panel.tsx`)
- **Fields**:
  - `selectedPlants`: string[]
  - `selectedComplaintTypes`: string[]
  - `selectedNotificationTypes`: string[]
  - `dateFrom`: Date | null
  - `dateTo`: Date | null
- **Storage**: Currently localStorage (`qos-et-filters`)
- **Note**: Could remain client-side or move to user preferences table

#### 10. **User Preferences** (inferred from various localStorage keys)
- **Fields**:
  - `role`: "reader" | "editor" | "admin"
  - `language`: "en" | "de" | "it"
  - `sidebarCollapsed`: boolean
  - `filtersCollapsed`: boolean
- **Storage**: Currently multiple localStorage keys
- **Note**: Should consolidate into a single user preferences entity

---

## C) Proposed Target Architecture (Text Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Client Components (React)                                │  │
│  │  - Dashboard, Upload, AI Summary, etc.                    │  │
│  │  - Custom Hooks (useKpiData, useGlobalFilters)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            │ HTTP Requests                        │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js Route Handlers (API Routes)                     │  │
│  │  /api/kpis/*          - KPI CRUD operations               │  │
│  │  /api/complaints/*    - Complaint CRUD operations         │  │
│  │  /api/deliveries/*    - Delivery CRUD operations         │  │
│  │  /api/uploads/*       - Upload history & summaries        │  │
│  │  /api/changes/*       - Change history operations         │  │
│  │  /api/manual-kpis/*  - Manual KPI entries                │  │
│  │  /api/user-preferences/* - User preferences (optional)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma Client
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repository Layer (Abstraction)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Repository Interface (lib/repositories/interfaces.ts)   │  │
│  │  - IComplaintRepository                                   │  │
│  │  - IDeliveryRepository                                    │  │
│  │  - IKpiRepository                                         │  │
│  │  - IUploadRepository                                      │  │
│  │  - IChangeHistoryRepository                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            │ Implements                           │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Prisma Repository Implementation                         │  │
│  │  (lib/repositories/prisma/*.ts)                          │  │
│  │  - PrismaComplaintRepository                             │  │
│  │  - PrismaDeliveryRepository                              │  │
│  │  - PrismaKpiRepository                                   │  │
│  │  - PrismaUploadRepository                                │  │
│  │  - PrismaChangeHistoryRepository                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer (PostgreSQL)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                      │  │
│  │  - Supabase Postgres (via DATABASE_URL)                  │  │
│  │  - OR Azure Database for PostgreSQL (via DATABASE_URL)   │  │
│  │  - Portable: works with any Postgres provider            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Key Principles:
1. Frontend NEVER calls database directly (no supabase-js in browser)
2. All data access via Next.js Route Handlers (server-side only)
3. Repository pattern allows swapping storage backends
4. Single DATABASE_URL env var (works with Supabase or Azure Postgres)
5. Prisma as ORM (database-agnostic, can switch providers)
```

---

## D) Step-by-Step Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Install Dependencies
- [ ] Install Prisma: `pnpm add -D prisma @prisma/client`
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Configure `.env` with `DATABASE_URL` (Supabase or Azure Postgres connection string)

#### 1.2 Database Schema Design
- [ ] Create Prisma schema (`prisma/schema.prisma`) with tables:
  - `Complaint` (id, notificationNumber, notificationType, category, plant, siteCode, siteName, createdOn, defectiveParts, source, unitOfMeasure, materialDescription, materialNumber, conversionJson)
  - `Delivery` (id, plant, siteCode, siteName, date, quantity, kind)
  - `MonthlySiteKpi` (id, month, siteCode, siteName, customerComplaintsQ1, supplierComplaintsQ2, internalComplaintsQ3, deviationsD, ppapInProgress, ppapCompleted, customerPpm, supplierPpm, customerDeliveries, supplierDeliveries, customerDefectiveParts, supplierDefectiveParts, internalDefectiveParts, customerConversionsJson, supplierConversionsJson, createdAt, updatedAt)
  - `GlobalPpm` (id, customerPpm, supplierPpm, updatedAt) - single row or computed
  - `UploadHistory` (id, uploadedAtIso, section, filesJson, summaryJson, usedInJson, success, notes, createdAt)
  - `UploadSummary` (id, uploadHistoryId, uploadedAtIso, section, filesJson, rawDataJson, processedDataJson, conversionStatusJson, summaryJson, createdAt)
  - `ChangeHistory` (id, uploadSummaryId, timestamp, editor, recordId, recordType, field, oldValueJson, newValueJson, reason, changeType, affectedMetricsJson, onePagerLink, dataDetailsJson, createdAt)
  - `ManualKpiEntry` (id, month, siteCode, siteName, ...all MonthlySiteKpi fields plus extras, recordedBy, onePagerLink, createdAt, updatedAt)
  - `UserPreference` (id, userId?, role, language, sidebarCollapsed, filtersCollapsed, filtersJson, createdAt, updatedAt) - optional, for multi-user support

#### 1.3 Database Migration
- [ ] Run `npx prisma migrate dev --name init` to create initial migration
- [ ] Apply migration to production database
- [ ] Generate Prisma Client: `npx prisma generate`

**Acceptance Criteria:**
- ✅ Prisma schema defined with all entities
- ✅ Database tables created successfully
- ✅ Prisma Client generated and importable
- ✅ Can connect to database via `DATABASE_URL`

---

### Phase 2: Repository Layer (Week 1-2)

#### 2.1 Create Repository Interfaces
- [ ] Create `lib/repositories/interfaces.ts` with interfaces:
  - `IComplaintRepository` (findAll, findById, create, createMany, update, delete, count)
  - `IDeliveryRepository` (findAll, findById, create, createMany, update, delete, count)
  - `IKpiRepository` (findAll, findByMonth, findBySite, upsert, delete, getGlobalPpm, setGlobalPpm)
  - `IUploadRepository` (findAll, findById, create, update, delete)
  - `IChangeHistoryRepository` (findByUploadId, create, createMany, delete)
  - `IManualKpiRepository` (findAll, findByMonth, findBySite, upsert, delete)

#### 2.2 Implement Prisma Repositories
- [ ] Create `lib/repositories/prisma/complaint-repository.ts` implementing `IComplaintRepository`
- [ ] Create `lib/repositories/prisma/delivery-repository.ts` implementing `IDeliveryRepository`
- [ ] Create `lib/repositories/prisma/kpi-repository.ts` implementing `IKpiRepository`
- [ ] Create `lib/repositories/prisma/upload-repository.ts` implementing `IUploadRepository`
- [ ] Create `lib/repositories/prisma/change-history-repository.ts` implementing `IChangeHistoryRepository`
- [ ] Create `lib/repositories/prisma/manual-kpi-repository.ts` implementing `IManualKpiRepository`

#### 2.3 Create Repository Factory
- [ ] Create `lib/repositories/factory.ts` that exports repository instances
- [ ] Use singleton pattern to ensure single Prisma client instance

**Acceptance Criteria:**
- ✅ All repository interfaces defined
- ✅ All Prisma implementations complete
- ✅ Repository factory exports all repositories
- ✅ Unit tests pass for repository methods (optional but recommended)

---

### Phase 3: API Route Handlers (Week 2)

#### 3.1 Create API Routes Structure
- [ ] Create `app/api/complaints/route.ts` (GET all, POST create/many)
- [ ] Create `app/api/complaints/[id]/route.ts` (GET one, PUT update, DELETE)
- [ ] Create `app/api/deliveries/route.ts` (GET all, POST create/many)
- [ ] Create `app/api/deliveries/[id]/route.ts` (GET one, PUT update, DELETE)
- [ ] Create `app/api/kpis/route.ts` (GET all, POST upsert)
- [ ] Create `app/api/kpis/global-ppm/route.ts` (GET, POST)
- [ ] Create `app/api/kpis/[month]/[siteCode]/route.ts` (GET one, PUT, DELETE)
- [ ] Create `app/api/uploads/route.ts` (GET all, POST create)
- [ ] Create `app/api/uploads/[id]/route.ts` (GET one, PUT, DELETE)
- [ ] Create `app/api/uploads/[id]/summary/route.ts` (GET, POST)
- [ ] Create `app/api/changes/route.ts` (GET by uploadId, POST create/many)
- [ ] Create `app/api/manual-kpis/route.ts` (GET all, POST upsert)
- [ ] Create `app/api/manual-kpis/[month]/[siteCode]/route.ts` (GET one, PUT, DELETE)

#### 3.2 Implement Request/Response Types
- [ ] Create `lib/api/types.ts` with request/response DTOs
- [ ] Add validation using Zod schemas (optional but recommended)

#### 3.3 Add Error Handling
- [ ] Implement consistent error responses
- [ ] Add try-catch blocks in all route handlers
- [ ] Return appropriate HTTP status codes

**Acceptance Criteria:**
- ✅ All API routes created and functional
- ✅ Can create, read, update, delete entities via API
- ✅ Error handling implemented
- ✅ API responses match expected formats

---

### Phase 4: Data Migration Script (Week 2-3)

#### 4.1 Create Migration Utility
- [ ] Create `scripts/migrate-browser-storage-to-db.ts`
- [ ] Read from localStorage/IndexedDB
- [ ] Transform data to match Prisma schema
- [ ] Write to database via repositories
- [ ] Handle duplicates and conflicts
- [ ] Generate migration report

#### 4.2 Migration Steps
- [ ] Migrate Complaints from IndexedDB
- [ ] Migrate Deliveries from IndexedDB
- [ ] Migrate MonthlySiteKpis from localStorage
- [ ] Migrate GlobalPpm from localStorage
- [ ] Migrate UploadHistory from localStorage
- [ ] Migrate UploadSummaries from localStorage (all `qos-et-upload-summary-*` keys)
- [ ] Migrate ChangeHistory from localStorage (all `qos-et-change-history-*` keys)
- [ ] Migrate ManualKpiEntries from localStorage

#### 4.3 Migration Safety
- [ ] Add dry-run mode (preview without writing)
- [ ] Add rollback capability (optional)
- [ ] Preserve browser storage as backup during migration
- [ ] Add progress logging

**Acceptance Criteria:**
- ✅ Migration script can read all browser storage
- ✅ All data successfully migrated to database
- ✅ No data loss during migration
- ✅ Migration report generated

---

### Phase 5: Frontend Refactoring (Week 3-4)

#### 5.1 Create API Client Utilities
- [ ] Create `lib/api/client.ts` with typed fetch wrappers
- [ ] Create functions: `getKpis()`, `getComplaints()`, `getDeliveries()`, etc.
- [ ] Add error handling and retry logic

#### 5.2 Update Hooks
- [ ] Refactor `lib/data/useKpiData.ts` to fetch from API instead of localStorage
- [ ] Refactor `lib/hooks/useGlobalFilters.ts` to optionally sync with API (or keep client-side)
- [ ] Create new hooks: `useComplaints()`, `useDeliveries()`, `useUploadHistory()`

#### 5.3 Update Components - Upload Page
- [ ] Update `app/(dashboard)/upload/page.tsx`:
  - Replace IndexedDB calls with API calls
  - Replace localStorage KPI writes with API calls
  - Replace localStorage upload history with API calls
  - Replace localStorage manual KPIs with API calls
  - Replace localStorage upload summaries with API calls
  - Replace localStorage change history with API calls

#### 5.4 Update Components - Dashboard & Other Pages
- [ ] Update `app/(dashboard)/dashboard/dashboard-client.tsx` to fetch from API
- [ ] Update `app/(dashboard)/ai-summary/ai-summary-client.tsx` to fetch from API
- [ ] Update `app/(dashboard)/complaints/complaints-client.tsx` to fetch from API
- [ ] Update `app/(dashboard)/ppm/ppm-client.tsx` to fetch from API
- [ ] Update `app/(dashboard)/data-lineage/data-lineage-client.tsx` to fetch from API
- [ ] Update `components/iamq/iamq-chat-panel.tsx` to fetch from API
- [ ] Update `app/(dashboard)/glossary/glossary-client.tsx` to fetch from API

#### 5.5 Remove Browser Storage Dependencies
- [ ] Remove `lib/data/datasets-idb.ts` (or keep as fallback during transition)
- [ ] Remove localStorage read/write calls from all components
- [ ] Keep UI preferences (language, sidebar) in localStorage (or move to user preferences API)

**Acceptance Criteria:**
- ✅ All components fetch data from API instead of browser storage
- ✅ No localStorage/IndexedDB reads for business data
- ✅ All pages load data successfully
- ✅ Upload functionality works with API
- ✅ KPI calculations persist to database

---

### Phase 6: Testing & Validation (Week 4)

#### 6.1 Integration Testing
- [ ] Test complete upload flow (file → parse → save to DB → display)
- [ ] Test KPI calculation and persistence
- [ ] Test manual KPI entry
- [ ] Test change history tracking
- [ ] Test data lineage display
- [ ] Test multi-user scenarios (if applicable)

#### 6.2 Data Integrity Checks
- [ ] Verify all migrated data is accessible
- [ ] Verify KPI calculations match previous results
- [ ] Verify relationships are maintained (uploads → summaries → changes)
- [ ] Verify no duplicate records

#### 6.3 Performance Testing
- [ ] Test API response times
- [ ] Test bulk operations (large uploads)
- [ ] Test pagination if needed
- [ ] Optimize slow queries

**Acceptance Criteria:**
- ✅ All features work as before
- ✅ Data integrity maintained
- ✅ Performance acceptable
- ✅ No regressions

---

### Phase 7: Cleanup & Documentation (Week 4)

#### 7.1 Remove Legacy Code
- [ ] Remove or deprecate `lib/data/datasets-idb.ts`
- [ ] Remove localStorage business data keys (keep UI preferences)
- [ ] Update documentation to reflect new architecture

#### 7.2 Update Documentation
- [ ] Update README with database setup instructions
- [ ] Update API documentation
- [ ] Document migration process
- [ ] Update architecture diagrams

#### 7.3 Environment Setup
- [ ] Document required environment variables
- [ ] Create `.env.example` file
- [ ] Document database connection setup for Supabase and Azure

**Acceptance Criteria:**
- ✅ Legacy code removed or clearly marked as deprecated
- ✅ Documentation updated
- ✅ Environment setup documented
- ✅ Team can deploy and run the application

---

## Migration Strategy: Dual-Write Period (Optional but Recommended)

During Phase 5, implement a **dual-write period** where:
1. Data is written to both browser storage AND database
2. Data is read from database (with fallback to browser storage if API fails)
3. This allows gradual migration and rollback capability

After validation period (1-2 weeks):
1. Remove browser storage writes
2. Remove browser storage reads
3. Complete migration

---

## Risk Mitigation

1. **Data Loss**: Keep browser storage as backup during migration, implement rollback script
2. **Performance**: Add database indexes, implement pagination for large datasets
3. **Downtime**: Deploy API routes first, then gradually migrate frontend
4. **Breaking Changes**: Use feature flags to toggle between old/new implementations
5. **Migration Failures**: Implement dry-run mode, detailed logging, and error recovery

---

## Success Metrics

- ✅ All business data stored in database
- ✅ No localStorage/IndexedDB usage for business data (UI preferences OK)
- ✅ All features work as before
- ✅ Data accessible across devices/browsers
- ✅ Multi-user support enabled (if applicable)
- ✅ Performance acceptable (< 500ms for typical queries)
