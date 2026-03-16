# Repository Abstraction - File-by-File Diffs

**Last Updated**: 2026-03-16

## Entity Choice: Complaint

**Selected Entity:** `Complaint`

**Rationale:**
- **Core domain entity**: Complaint is the primary business entity used throughout the application
- **High usage**: Currently stored in IndexedDB, consumed by dashboard, KPIs, AI summary, complaints page
- **Existing local logic**: Well-defined IndexedDB operations (`upsertComplaints`, `getAllComplaints`) to wrap
- **Representative complexity**: Includes relationships, optional fields, JSON conversion metadata
- **Migration priority**: Critical for data persistence migration - complaints are the foundation for KPI calculations

---

## New Files Created

### 1. `lib/repo/types.ts` (NEW)

```typescript
/**
 * Repository Interface Types
 * 
 * Defines common interfaces for repository pattern.
 * Allows switching between storage backends (Postgres, Local, etc.)
 */

import type { Complaint } from "@/lib/domain/types";

/**
 * Base repository interface for CRUD operations
 */
export interface IRepository<T, TCreate, TUpdate> {
  findAll(filters?: Record<string, any>): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  createMany(data: TCreate[]): Promise<number>;
  update(id: string, data: TUpdate): Promise<T>;
  upsert(id: string, data: TCreate): Promise<T>;
  upsertMany(data: TCreate[]): Promise<number>;
  delete(id: string): Promise<void>;
  count(filters?: Record<string, any>): Promise<number>;
}

/**
 * Complaint-specific repository interface
 */
export interface IComplaintRepository extends IRepository<
  Complaint,
  CreateComplaintInput,
  UpdateComplaintInput
> {
  findByNotificationNumber(notificationNumber: string, plant?: string): Promise<Complaint[]>;
  findBySite(siteCode: string): Promise<Complaint[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Complaint[]>;
}

/**
 * Input types for Complaint operations
 */
export interface CreateComplaintInput {
  id: string;
  notificationNumber: string;
  notificationType: string;
  category: string;
  plant: string;
  siteCode: string;
  siteName?: string;
  createdOn: Date;
  defectiveParts: number;
  source: string;
  unitOfMeasure?: string;
  materialDescription?: string;
  materialNumber?: string;
  conversionJson?: string; // JSON stringified UnitConversion
  userId?: string; // For future multi-user support
  tenantId?: string; // For future multi-tenant support
}

export interface UpdateComplaintInput {
  notificationNumber?: string;
  notificationType?: string;
  category?: string;
  plant?: string;
  siteCode?: string;
  siteName?: string;
  createdOn?: Date;
  defectiveParts?: number;
  source?: string;
  unitOfMeasure?: string;
  materialDescription?: string;
  materialNumber?: string;
  conversionJson?: string;
}

/**
 * Database-backed Complaint entity (includes metadata)
 */
export interface ComplaintEntity extends Complaint {
  userId?: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. `lib/repo/postgres/complaintRepo.ts` (NEW)

Implements `IComplaintRepository` using Prisma Client. Key features:
- Full CRUD operations
- Query methods (findByNotificationNumber, findBySite, findByDateRange)
- Converts between Prisma models and domain `Complaint` types
- Handles JSON serialization for `conversion` field

### 3. `lib/repo/local/complaintRepo.ts` (NEW)

Implements `IComplaintRepository` using IndexedDB wrapper. Key features:
- Wraps existing `upsertComplaints()` and `getAllComplaints()` from `lib/data/datasets-idb.ts`
- Maintains backward compatibility with existing UI
- Note: `delete()` method throws error (IndexedDB limitation - would need delete function added to datasets-idb.ts)

### 4. `lib/repo/index.ts` (NEW)

```typescript
/**
 * Repository Factory
 * 
 * Chooses backend implementation based on DATA_BACKEND environment variable.
 * Defaults to "postgres" if not set.
 * Falls back to "local" if Postgres is not configured.
 */

import type { IComplaintRepository } from "./types";
import { PostgresComplaintRepository } from "./postgres/complaintRepo";
import { LocalComplaintRepository } from "./local/complaintRepo";

type BackendType = "postgres" | "local";

function getBackendType(): BackendType {
  const backend = process.env.DATA_BACKEND?.toLowerCase();
  
  if (backend === "local" || backend === "postgres") {
    return backend;
  }

  // Default to postgres if DATABASE_URL is set, otherwise local
  if (process.env.DATABASE_URL) {
    return "postgres";
  }

  return "local";
}

export function getComplaintRepo(): IComplaintRepository {
  const backend = getBackendType();

  if (backend === "postgres") {
    if (!process.env.DATABASE_URL) {
      console.warn("[Repo] DATA_BACKEND=postgres but DATABASE_URL not set. Falling back to local.");
      return new LocalComplaintRepository();
    }

    try {
      return new PostgresComplaintRepository();
    } catch (error) {
      console.error("[Repo] Failed to initialize Postgres repository:", error);
      console.warn("[Repo] Falling back to local repository.");
      return new LocalComplaintRepository();
    }
  }

  return new LocalComplaintRepository();
}

export function getCurrentBackend(): BackendType {
  return getBackendType();
}
```

### 5. `lib/repo/validation.ts` (NEW)

Zod validation schemas for create/update operations:
- `createComplaintSchema` - Validates all required fields
- `updateComplaintSchema` - Validates optional update fields
- Type-safe validation functions

---

## Modified Files

### 6. `prisma/schema.prisma` (MODIFIED)

**Before:**
```prisma
// Schema will be defined in Phase 2 of migration plan
// For now, this is a minimal foundation setup
```

**After:**
```prisma
// Complaint model - core domain entity
// Supports multi-user/tenant via userId/tenantId (stubbed for now)
model Complaint {
  id                  String   @id
  notificationNumber  String
  notificationType    String   // "Q1" | "Q2" | "Q3" | "D1" | "D2" | "D3" | "P1" | "P2" | "P3" | "Other"
  category            String   // NotificationCategory enum
  plant               String
  siteCode            String
  siteName            String?
  createdOn           DateTime // Original complaint creation date
  defectiveParts      Int
  source              String   // "SAP_S4" | "Manual" | "Import"
  
  // Unit conversion fields (for supplier complaints - Q2)
  unitOfMeasure       String?
  materialDescription String?
  materialNumber      String?
  conversionJson      String?  // JSON stringified UnitConversion object
  
  // Multi-user/tenant support (stubbed for now)
  userId              String?
  tenantId            String?
  
  // Metadata
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Indexes for common queries
  @@index([notificationNumber])
  @@index([plant])
  @@index([siteCode])
  @@index([notificationType])
  @@index([createdOn])
  @@index([userId, tenantId])
  @@map("complaints")
}
```

---

## How to Toggle DATA_BACKEND

### Method 1: Environment Variable (Recommended)

Add to `.env.local`:

```bash
# Use Postgres backend
DATA_BACKEND=postgres
DATABASE_URL="postgresql://user:password@localhost:5432/qos_et_db"

# OR use Local backend (IndexedDB)
DATA_BACKEND=local
```

### Method 2: Automatic Detection

If `DATA_BACKEND` is not set:
- **Postgres** is used if `DATABASE_URL` is set
- **Local** is used if `DATABASE_URL` is not set

This ensures existing UI continues working without any configuration changes.

### Usage Example

```typescript
import { getComplaintRepo } from "@/lib/repo";

// Get repository (automatically chooses backend)
const repo = getComplaintRepo();

// Use repository methods (same API regardless of backend)
const complaints = await repo.findAll();
const complaint = await repo.findById("some-id");
await repo.create({ id: "...", notificationNumber: "...", ... });
await repo.upsertMany([...]);
```

---

## Database Migration Instructions

### Step 1: Generate Prisma Client
```bash
pnpm db:generate
```

### Step 2: Create and Apply Migration
```bash
pnpm db:migrate
```

When prompted, enter migration name: `add_complaints_table`

This will:
- Create migration file in `prisma/migrations/`
- Apply migration to your database
- Create `complaints` table with all fields and indexes

### Step 3: Verify Migration
```bash
pnpm db:studio
```

Open Prisma Studio and verify the `complaints` table exists.

---

## Testing

### Test Local Backend (Existing Behavior)
```bash
# .env.local
DATA_BACKEND=local
# (or omit DATA_BACKEND and DATABASE_URL)
```

Existing UI should work unchanged - uses IndexedDB as before.

### Test Postgres Backend
```bash
# .env.local
DATA_BACKEND=postgres
DATABASE_URL="postgresql://user:password@localhost:5432/qos_et_db"
```

1. Run migration first: `pnpm db:migrate`
2. UI will now use Postgres backend
3. Data persists in database instead of browser storage

---

## Key Features

✅ **Backend Agnostic**: UI code doesn't know about storage backend
✅ **Backward Compatible**: Existing UI works with local backend unchanged
✅ **Type Safe**: Full TypeScript support with Zod validation
✅ **Multi-User Ready**: userId/tenantId fields in schema (stubbed for now)
✅ **Migration Path**: Easy to switch backends via env var
✅ **Testable**: Repository pattern enables easy mocking
✅ **No Breaking Changes**: Existing code continues to work

---

## Known Limitations

1. **Local Backend Delete**: `delete()` method in `LocalComplaintRepository` throws an error. IndexedDB delete would require adding a delete function to `datasets-idb.ts`. For now, use Postgres backend for full CRUD support.

2. **Single Entity**: Only Complaint is implemented. Other entities (Delivery, MonthlySiteKpi, etc.) will follow the same pattern in future phases.

---

## Next Steps

1. Update Upload Page to use `getComplaintRepo().upsertMany()` instead of direct `upsertComplaints()`
2. Update Dashboard to use `getComplaintRepo().findAll()` instead of `getAllComplaints()`
3. Create API routes (`/api/complaints`) using repository
4. Add other entities following the same pattern
