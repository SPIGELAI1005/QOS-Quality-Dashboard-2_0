# UI API Refactor Summary

**Last Updated**: 2026-03-16

## Files Created

### 1. `lib/api/complaints.ts` (NEW)
Client-side API module with fetch wrappers:
- `listComplaints(filters?)` - Get all complaints with optional filters
- `getComplaint(id)` - Get single complaint
- `createComplaint(data)` - Create single complaint
- `createComplaints(data[])` - Create multiple complaints
- `updateComplaint(id, data)` - Update complaint
- `deleteComplaint(id)` - Delete complaint
- `checkApiHealth()` - Health check for API availability

**Features:**
- Automatic user ID from localStorage (defaults to "demo-user")
- Optional tenant ID support
- Consistent error handling
- Type-safe responses

### 2. `lib/hooks/useApiMode.ts` (NEW)
Hook for managing API vs local mode:
- `mode` - Current mode: "api" | "local" | "checking"
- `isApiMode` - Boolean for API mode
- `isLocalMode` - Boolean for local mode
- `error` - Error message if API unavailable
- `switchToLocal()` - Manually switch to local mode
- `retryApi()` - Retry API connection

**Features:**
- Automatic health check on mount
- Fallback to local mode on API failure
- Manual mode switching

## Files Modified

### 3. `app/(dashboard)/upload/page.tsx` (MODIFIED)

**Changes:**
1. **Added imports:**
   - `createComplaints`, `listComplaints` from `@/lib/api/complaints`
   - `useApiMode` hook
   - `CreateComplaintInput` type

2. **Added API mode hook:**
   ```typescript
   const apiMode = useApiMode();
   ```

3. **Updated complaint upload (line ~540):**
   - Tries API first if `apiMode.isApiMode`
   - Falls back to IndexedDB on error
   - Shows error message if API fails but local save succeeds
   - Converts Complaint to CreateComplaintInput format

4. **Updated KPI calculation (line ~714):**
   - Reads complaints from API if in API mode
   - Falls back to IndexedDB on API error
   - Maintains backward compatibility

**Error Handling:**
- API errors are caught and logged
- Automatic fallback to IndexedDB
- User-friendly error messages
- Progress indicators show success/error states

---

## Key Features

### ✅ Offline Resilience
- Automatic fallback to local backend if API fails
- Error messages indicate when using local mode
- No data loss - always saves somewhere

### ✅ Loading States
- Existing progress indicators work with API
- Error states shown in UI
- Success states confirmed

### ✅ Backward Compatibility
- Existing IndexedDB code still works
- Gradual migration path
- No breaking changes

### ✅ Type Safety
- Full TypeScript support
- Validated API responses
- Type-safe error handling

---

## How It Works

### Upload Flow
1. User uploads complaints file
2. File is parsed by server
3. **API Mode:**
   - Convert complaints to `CreateComplaintInput[]`
   - Call `createComplaints()` API
   - Update counts from API
4. **Local Mode (fallback):**
   - Use existing `upsertComplaints()` IndexedDB function
   - Update counts from IndexedDB
5. Show success/error state

### KPI Calculation Flow
1. User clicks "Calculate KPIs"
2. **API Mode:**
   - Fetch complaints via `listComplaints()`
   - Fall back to IndexedDB on error
3. **Local Mode:**
   - Use existing `getAllComplaints()` IndexedDB function
4. Calculate KPIs from fetched data

---

## Error Handling

### API Failure Scenarios
1. **Network Error:**
   - Caught in try/catch
   - Falls back to IndexedDB
   - Shows warning: "Saved to local storage (API unavailable)"

2. **Validation Error:**
   - Caught and logged
   - Falls back to IndexedDB
   - Shows error message

3. **Server Error:**
   - Caught and logged
   - Falls back to IndexedDB
   - Shows error message

### User Experience
- Errors don't block the workflow
- Data is always saved (API or local)
- Clear error messages
- Option to retry API connection

---

## Testing Checklist

### ✅ Basic Upload Flow
1. Navigate to `/upload`
2. Select complaints file
3. Click "Upload"
4. Verify complaints are saved
5. Check success indicator

### ✅ API Mode
1. Ensure `DATA_BACKEND=postgres` and `DATABASE_URL` set
2. Upload complaints file
3. Verify data saved to database (check Prisma Studio)
4. Verify counts update correctly

### ✅ Local Mode Fallback
1. Set `DATA_BACKEND=local` or remove `DATABASE_URL`
2. Upload complaints file
3. Verify data saved to IndexedDB
4. Verify warning message appears (if API was attempted)

### ✅ Error Handling
1. Stop API server (or set invalid `DATABASE_URL`)
2. Upload complaints file
3. Verify fallback to IndexedDB
4. Verify error message shown
5. Verify data still saved

### ✅ KPI Calculation
1. Upload both complaints and deliveries
2. Click "Calculate KPIs"
3. Verify KPIs calculated correctly
4. Verify data source (API or IndexedDB) works

---

## Next Steps

1. **Add API Mode Indicator UI:**
   - Show current mode (API/Local) in header
   - Add "Switch to Local" button if API fails
   - Add "Retry API" button

2. **Migrate Deliveries:**
   - Create deliveries API endpoints
   - Update upload page for deliveries
   - Same pattern as complaints

3. **Add Optimistic Updates:**
   - Show data immediately on upload
   - Sync with server in background
   - Handle conflicts

4. **Add Loading States:**
   - Skeleton loaders for data fetching
   - Progress indicators for uploads
   - Disable buttons during operations

---

## Known Limitations

1. **Deliveries Not Migrated:** Only complaints use API. Deliveries still use IndexedDB.

2. **No Optimistic Updates:** Data is saved synchronously. Could add optimistic UI updates.

3. **No Retry UI:** Error messages show but no retry button (can use browser refresh).

4. **Count Updates:** Counts are updated after save, but could be optimistic.

---

## Migration Status

- ✅ Complaints API endpoints created
- ✅ Client API module created
- ✅ Upload page updated (complaints)
- ✅ KPI calculation updated (complaints)
- ⏳ Deliveries API (not started)
- ⏳ UI indicators (basic, could be enhanced)
- ⏳ Optimistic updates (not implemented)
