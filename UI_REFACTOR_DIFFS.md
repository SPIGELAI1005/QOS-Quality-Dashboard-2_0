# UI API Refactor - File-by-File Diffs

**Last Updated**: 2026-03-16

## Files Created

### 1. `lib/api/complaints.ts` (NEW)

Client-side API module with fetch wrappers for complaints endpoints.

**Key Functions:**
- `listComplaints(filters?)` - Get all complaints with optional filters
- `getComplaint(id)` - Get single complaint
- `createComplaint(data)` - Create single complaint
- `createComplaints(data[])` - Create multiple complaints (batch)
- `updateComplaint(id, data)` - Update complaint
- `deleteComplaint(id)` - Delete complaint
- `checkApiHealth()` - Health check for API availability

**Features:**
- Automatic user ID from localStorage (defaults to "demo-user")
- Optional tenant ID support
- Consistent error handling
- Type-safe responses

### 2. `lib/hooks/useApiMode.ts` (NEW)

React hook for managing API vs local mode with automatic fallback.

**Returns:**
```typescript
{
  mode: "api" | "local" | "checking",
  isApiMode: boolean,
  isLocalMode: boolean,
  isChecking: boolean,
  error: string | null,
  switchToLocal: () => void,
  retryApi: () => Promise<void>
}
```

**Features:**
- Automatic health check on mount
- Fallback to local mode on API failure
- Manual mode switching
- Retry functionality

---

## Files Modified

### 3. `app/(dashboard)/upload/page.tsx` (MODIFIED)

#### Added Imports
```typescript
import { createComplaints, listComplaints } from "@/lib/api/complaints";
import { useApiMode } from "@/lib/hooks/useApiMode";
import type { CreateComplaintInput } from "@/lib/repo/types";
```

#### Added Hook
```typescript
const apiMode = useApiMode();
```

#### Updated Complaint Upload (Line ~540)

**Before:**
```typescript
// Persist parsed complaints in IndexedDB to avoid localStorage quota issues
if (typeof window !== "undefined") {
  const revived = (items as any[]).filter((x) => x?.id).map(reviveComplaint);
  await upsertComplaints(revived);
  const counts = await getDatasetCounts();
  setStoredParsedCounts(counts);
  setProgressBySection((p) => ({ ...p, complaints: { percent: 100, status: "success" } }));
}
```

**After:**
```typescript
// Persist parsed complaints via API or IndexedDB fallback
if (typeof window !== "undefined") {
  const revived = (items as any[]).filter((x) => x?.id).map(reviveComplaint);
  
  try {
    if (apiMode.isApiMode) {
      // Use API
      const complaintInputs: CreateComplaintInput[] = revived.map((c) => ({
        id: c.id,
        notificationNumber: c.notificationNumber,
        notificationType: c.notificationType,
        category: c.category,
        plant: c.plant,
        siteCode: c.siteCode,
        siteName: c.siteName,
        createdOn: c.createdOn,
        defectiveParts: c.defectiveParts,
        source: c.source,
        unitOfMeasure: c.unitOfMeasure,
        materialDescription: c.materialDescription,
        materialNumber: c.materialNumber,
        conversionJson: c.conversion ? JSON.stringify(c.conversion) : undefined,
      }));
      
      await createComplaints(complaintInputs);
      
      // Update counts from API
      const apiComplaints = await listComplaints();
      setStoredParsedCounts({ complaints: apiComplaints.length, deliveries: storedParsedCounts.deliveries });
    } else {
      // Fallback to IndexedDB
      await upsertComplaints(revived);
      const counts = await getDatasetCounts();
      setStoredParsedCounts(counts);
    }
    
    setProgressBySection((p) => ({ ...p, complaints: { percent: 100, status: "success" } }));
  } catch (err) {
    console.error("[Upload] Failed to save complaints:", err);
    // Fallback to IndexedDB on error
    try {
      await upsertComplaints(revived);
      const counts = await getDatasetCounts();
      setStoredParsedCounts(counts);
      setProgressBySection((p) => ({ ...p, complaints: { percent: 100, status: "success" } }));
      setErrors((prev) => ({ ...prev, complaints: "Saved to local storage (API unavailable)" }));
    } catch (fallbackErr) {
      setProgressBySection((p) => ({ ...p, complaints: { percent: 0, status: "error" } }));
      setErrors((prev) => ({ ...prev, complaints: err instanceof Error ? err.message : "Failed to save complaints" }));
    }
  }
}
```

#### Updated KPI Calculation (Line ~714)

**Before:**
```typescript
try {
  // Read from IndexedDB (large storage)
  const [complaintsRaw, deliveriesRaw] = await Promise.all([getAllComplaints(), getAllDeliveries()]);
  // Safety: ensure Date fields are Dates (in case older data was stored as strings)
  const complaints = complaintsRaw.map(reviveComplaint);
  const deliveries = deliveriesRaw.map(reviveDelivery);
```

**After:**
```typescript
try {
  // Read from API or IndexedDB fallback
  let complaints: Complaint[];
  let deliveries: Delivery[];
  
  if (apiMode.isApiMode) {
    try {
      // Use API
      const apiComplaints = await listComplaints();
      complaints = apiComplaints.map((c) => ({
        ...c,
        createdOn: c.createdOn instanceof Date ? c.createdOn : new Date(c.createdOn),
      }));
    } catch (err) {
      console.warn("[KPI Calc] API failed, falling back to IndexedDB:", err);
      // Fallback to IndexedDB
      const complaintsRaw = await getAllComplaints();
      complaints = complaintsRaw.map(reviveComplaint);
    }
  } else {
    // Use IndexedDB
    const complaintsRaw = await getAllComplaints();
    complaints = complaintsRaw.map(reviveComplaint);
  }
  
  // Deliveries still use IndexedDB (not migrated yet)
  const deliveriesRaw = await getAllDeliveries();
  deliveries = deliveriesRaw.map(reviveDelivery);
```

---

## Key Changes Summary

### ✅ API Integration
- Complaints now use API endpoints when available
- Automatic fallback to IndexedDB on error
- Type-safe API calls with validation

### ✅ Error Handling
- Try/catch blocks around API calls
- Graceful fallback to local storage
- User-friendly error messages
- No data loss on API failure

### ✅ Backward Compatibility
- Existing IndexedDB code still works
- Local mode fully functional
- No breaking changes to UI

### ✅ Loading States
- Existing progress indicators work
- Error states shown in UI
- Success states confirmed

---

## Testing Checklist

See `QA_CHECKLIST.md` for detailed testing steps.

**Quick Test:**
1. Navigate to `/upload`
2. Upload a complaints file
3. Verify data saved (check database or IndexedDB)
4. Click "Calculate KPIs"
5. Verify KPIs calculated correctly

---

## Migration Status

- ✅ Complaints API integration complete
- ✅ Upload page updated
- ✅ KPI calculation updated
- ⏳ Deliveries API (not started - still uses IndexedDB)
- ⏳ UI indicators (basic - could add mode indicator)
- ⏳ Optimistic updates (not implemented)

---

## Next Steps

1. Add API mode indicator in UI header
2. Migrate deliveries to use API
3. Add optimistic UI updates
4. Add retry button for failed API calls
5. Add loading skeletons for data fetching
