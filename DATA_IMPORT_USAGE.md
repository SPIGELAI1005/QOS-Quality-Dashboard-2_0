# Data Import Usage Instructions

**Last Updated**: 2026-03-16

## Overview

The data import feature allows you to migrate existing complaints from local storage (IndexedDB) to the server database. This is a one-time migration operation that can be run safely multiple times (it will update existing records).

---

## How to Use

### Step 1: Navigate to Settings

1. Open the application
2. Click on **Settings** in the sidebar (or navigate to `/settings`)
3. Click on the **"Data Migration"** tab

### Step 2: Check Local Data

The page will automatically show:
- **Local Complaints count**: Number of complaints found in IndexedDB
- If count is 0, there's no data to import

### Step 3: Run Dry Run (Recommended)

1. Click **"Dry Run (Preview)"** button
2. Wait for the preview to complete
3. Review the results:
   - **Total**: Total number of complaints to process
   - **Imported**: New records that would be created
   - **Updated**: Existing records that would be updated
   - **Skipped**: Records with validation errors
   - **Errors**: List of any errors encountered

### Step 4: Import Data

1. After reviewing the dry run results, click **"Import to Server"** button
2. Confirm the import when prompted
3. Wait for the import to complete
4. Review the results summary

---

## API Endpoint

### POST /api/complaints/import

**Request Body:**
```json
{
  "complaints": [
    {
      "id": "PLANT01-12345",
      "notificationNumber": "12345",
      "notificationType": "Q1",
      "category": "CustomerComplaint",
      "plant": "PLANT01",
      "siteCode": "SITE01",
      "createdOn": "2024-01-15T10:30:00.000Z",
      "defectiveParts": 5,
      "source": "SAP_S4",
      ...
    }
  ]
}
```

**Query Parameters:**
- `dryRun=true` - Run in dry run mode (validation only, no actual import)

**Response:**
```json
{
  "ok": true,
  "data": {
    "total": 100,
    "imported": 80,
    "updated": 15,
    "skipped": 5,
    "errors": [
      {
        "index": 10,
        "id": "PLANT01-12345",
        "error": "Validation error message"
      }
    ],
    "message": "Import complete. Imported 80 new, updated 15 existing, skipped 5."
  }
}
```

---

## Example cURL Requests

### Dry Run
```bash
curl -X POST "http://localhost:3005/api/complaints/import?dryRun=true" \
  -H "Content-Type: application/json" \
  -H "x-demo-user: demo-user" \
  -d '{
    "complaints": [
      {
        "id": "PLANT01-12345",
        "notificationNumber": "12345",
        "notificationType": "Q1",
        "category": "CustomerComplaint",
        "plant": "PLANT01",
        "siteCode": "SITE01",
        "createdOn": "2024-01-15T10:30:00.000Z",
        "defectiveParts": 5,
        "source": "SAP_S4"
      }
    ]
  }'
```

### Actual Import
```bash
curl -X POST "http://localhost:3005/api/complaints/import" \
  -H "Content-Type: application/json" \
  -H "x-demo-user: demo-user" \
  -d '{
    "complaints": [...]
  }'
```

---

## How It Works

1. **Read Local Data**: Reads all complaints from IndexedDB using `getAllComplaints()`
2. **Convert Format**: Converts domain `Complaint` objects to `CreateComplaintInput` format
3. **Validate**: Validates all complaints using Zod schemas
4. **Upsert**: For each complaint:
   - If ID exists (with same userId), updates the record
   - If ID doesn't exist, creates a new record
   - If validation fails, skips the record
5. **Report**: Returns summary of imported/updated/skipped counts

---

## Safety Features

### ✅ User-Triggered
- Import only happens when user clicks the button
- Confirmation dialog before actual import
- No automatic imports

### ✅ Dry Run Mode
- Preview what would happen without making changes
- Validates all data before import
- Shows potential errors

### ✅ Idempotent
- Can be run multiple times safely
- Existing records are updated (not duplicated)
- Uses ID + userId for uniqueness

### ✅ Error Handling
- Validation errors are caught and reported
- Individual record failures don't stop the import
- Detailed error messages for debugging

### ✅ Scoped by User
- All imports are scoped by userId
- Users can only import their own data
- No cross-user data leakage

---

## Troubleshooting

### "No local data found"
- **Cause**: No complaints in IndexedDB
- **Solution**: Upload some complaints first via the Upload page

### "API unavailable"
- **Cause**: Server not running or DATABASE_URL not set
- **Solution**: 
  - Ensure server is running
  - Check DATABASE_URL in `.env.local`
  - Verify database connection

### "Validation errors"
- **Cause**: Some complaints have invalid data
- **Solution**: 
  - Review error messages
  - Fix invalid data in IndexedDB (or re-upload)
  - Re-run import

### "Import failed"
- **Cause**: Network error or server error
- **Solution**:
  - Check browser console for details
  - Verify server logs
  - Retry the import

---

## Best Practices

1. **Always run dry run first** - Preview what will happen
2. **Backup data** - Export data before import (if needed)
3. **Check results** - Review imported/updated/skipped counts
4. **Fix errors** - Address validation errors before re-importing
5. **Run during low usage** - Import can be slow for large datasets

---

## Limitations

1. **Complaints only** - Only complaints are supported (deliveries not yet migrated)
2. **No rollback** - Imported data cannot be automatically rolled back
3. **Sequential processing** - Records are processed one at a time (not batched)
4. **Large datasets** - Very large imports (>10,000 records) may be slow

---

## Next Steps

After successful import:
1. Verify data in database (use Prisma Studio: `pnpm db:studio`)
2. Test the application with server data
3. Optionally clear IndexedDB after verification
4. Switch to API mode (`DATA_BACKEND=postgres`)
