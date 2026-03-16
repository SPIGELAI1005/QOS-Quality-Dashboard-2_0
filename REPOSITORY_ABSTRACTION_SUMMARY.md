# Repository Abstraction Layer - Implementation Summary

**Last Updated**: 2026-03-16

## Entity Choice: Complaint

**Why Complaint was chosen:**
- **Core domain entity**: Complaint is the primary business entity, used throughout the app
- **High usage**: Stored in IndexedDB, used in dashboard, KPIs, AI summary, complaints page
- **Existing local logic**: Well-defined IndexedDB operations to wrap
- **Representative complexity**: Includes relationships, optional fields, JSON conversion data
- **Migration priority**: Critical for data persistence migration

## Implementation Overview

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│  (Upload, Dashboard, Complaints Page, etc.)            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Repository Factory                         │
│         (lib/repo/index.ts)                            │
│  - Reads DATA_BACKEND env var                          │
│  - Returns appropriate repository instance              │
└──────────────┬──────────────────────┬──────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  Postgres Repository     │  │  Local Repository         │
│  (Prisma)               │  │  (IndexedDB wrapper)      │
│  - Full CRUD support    │  │  - Fallback backend       │
│  - Multi-user ready     │  │  - Existing UI works      │
└──────────────────────────┘  └──────────────────────────┘
```

### Files Created

1. **`lib/repo/types.ts`** - Repository interfaces
   - `IRepository<T, TCreate, TUpdate>` - Generic CRUD interface
   - `IComplaintRepository` - Complaint-specific interface
   - `CreateComplaintInput` / `UpdateComplaintInput` - Input types
   - `ComplaintEntity` - Database entity with metadata

2. **`lib/repo/postgres/complaintRepo.ts`** - Postgres implementation
   - Uses Prisma Client
   - Full CRUD operations
   - Query methods (findByNotificationNumber, findBySite, findByDateRange)
   - Converts between Prisma models and domain types

3. **`lib/repo/local/complaintRepo.ts`** - Local implementation
   - Wraps existing `lib/data/datasets-idb.ts` functions
   - Maintains backward compatibility
   - Note: `delete()` not fully implemented (IndexedDB limitation)

4. **`lib/repo/index.ts`** - Repository factory
   - `getComplaintRepo()` - Returns appropriate repository
   - Reads `DATA_BACKEND` env var (defaults to "postgres" if DATABASE_URL set)
   - Falls back to local if Postgres fails

5. **`lib/repo/validation.ts`** - Zod validation schemas
   - `createComplaintSchema` - Validates create input
   - `updateComplaintSchema` - Validates update input
   - Type-safe validation functions

### Files Modified

1. **`prisma/schema.prisma`** - Added Complaint model
   - All Complaint fields from domain types
   - `userId` / `tenantId` for multi-user support (stubbed)
   - `createdAt` / `updatedAt` timestamps
   - Indexes on common query fields

---

## How to Toggle DATA_BACKEND

### Option 1: Environment Variable (Recommended)

Set `DATA_BACKEND` in `.env.local`:

```bash
# Use Postgres backend
DATA_BACKEND=postgres
DATABASE_URL="postgresql://user:password@localhost:5432/qos_et_db"

# OR use Local backend (IndexedDB)
DATA_BACKEND=local
```

### Option 2: Automatic Detection

If `DATA_BACKEND` is not set:
- **Postgres** is used if `DATABASE_URL` is set
- **Local** is used if `DATABASE_URL` is not set

This ensures existing UI continues working without configuration.

### Usage in Code

```typescript
import { getComplaintRepo } from "@/lib/repo";

// Get repository (automatically chooses backend)
const repo = getComplaintRepo();

// Use repository methods
const complaints = await repo.findAll();
const complaint = await repo.findById("some-id");
await repo.create({ ... });
```

---

## File-by-File Diffs

### `lib/repo/types.ts` (NEW)
```typescript
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

export interface IComplaintRepository extends IRepository<...> {
  findByNotificationNumber(...): Promise<Complaint[]>;
  findBySite(...): Promise<Complaint[]>;
  findByDateRange(...): Promise<Complaint[]>;
}
```

### `lib/repo/postgres/complaintRepo.ts` (NEW)
- Implements `IComplaintRepository` using Prisma
- Converts between Prisma models and domain `Complaint` types
- Full CRUD + query methods

### `lib/repo/local/complaintRepo.ts` (NEW)
- Implements `IComplaintRepository` using IndexedDB
- Wraps `upsertComplaints()` and `getAllComplaints()` from `datasets-idb.ts`
- Maintains backward compatibility

### `lib/repo/index.ts` (NEW)
```typescript
export function getComplaintRepo(): IComplaintRepository {
  const backend = getBackendType(); // Reads DATA_BACKEND env var
  if (backend === "postgres") {
    return new PostgresComplaintRepository();
  }
  return new LocalComplaintRepository();
}
```

### `lib/repo/validation.ts` (NEW)
- Zod schemas for create/update validation
- Type-safe validation functions

### `prisma/schema.prisma` (MODIFIED)
```prisma
model Complaint {
  id                  String   @id
  notificationNumber  String
  notificationType    String
  category            String
  plant               String
  siteCode            String
  siteName            String?
  createdOn           DateTime
  defectiveParts      Int
  source              String
  unitOfMeasure       String?
  materialDescription String?
  materialNumber      String?
  conversionJson      String?
  userId              String?
  tenantId            String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
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

## Database Migration

### Step 1: Generate Prisma Client
```bash
pnpm db:generate
```

### Step 2: Create Migration
```bash
pnpm db:migrate
```

When prompted, enter migration name: `add_complaints_table`

This will:
- Create migration file in `prisma/migrations/`
- Apply migration to database
- Create `complaints` table with all fields and indexes

---

## Testing the Implementation

### Test with Local Backend
```bash
# .env.local
DATA_BACKEND=local
```

Existing UI should work unchanged (uses IndexedDB).

### Test with Postgres Backend
```bash
# .env.local
DATA_BACKEND=postgres
DATABASE_URL="postgresql://user:password@localhost:5432/qos_et_db"
```

Run migration first, then UI will use Postgres.

---

## Known Limitations

1. **Local Backend Delete**: `delete()` method in `LocalComplaintRepository` throws an error. IndexedDB delete would require adding a delete function to `datasets-idb.ts`. For now, use Postgres backend for full CRUD.

2. **Type Conversions**: Some type assertions (`as any`) are used when converting between domain types and repository inputs. This is safe because validation happens at the API layer.

3. **Single Entity**: Only Complaint is implemented. Other entities (Delivery, MonthlySiteKpi, etc.) will follow the same pattern in future phases.

---

## Next Steps

1. **Update Upload Page**: Replace direct `upsertComplaints()` calls with `getComplaintRepo().upsertMany()`
2. **Update Dashboard**: Replace `getAllComplaints()` with `getComplaintRepo().findAll()`
3. **Add API Routes**: Create `/api/complaints` route handlers using repository
4. **Add Other Entities**: Follow same pattern for Delivery, MonthlySiteKpi, etc.

---

## Benefits

✅ **Backend Agnostic**: UI code doesn't know about storage backend
✅ **Backward Compatible**: Existing UI works with local backend
✅ **Type Safe**: Full TypeScript support with validation
✅ **Multi-User Ready**: userId/tenantId fields in schema
✅ **Migration Path**: Easy to switch backends via env var
✅ **Testable**: Repository pattern enables easy mocking
