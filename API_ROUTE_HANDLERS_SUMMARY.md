# API Route Handlers Implementation Summary

**Last Updated**: 2026-03-16

## Overview

Created Next.js Route Handlers (App Router) for the Complaint entity with:
- ✅ Full CRUD operations
- ✅ Zod validation on all inputs
- ✅ Consistent JSON response envelope
- ✅ User/tenant scoping for security
- ✅ Error handling

---

## Files Created

### 1. `lib/api/context.ts` (NEW)

Request context helper that extracts user information from headers:

```typescript
export interface RequestContext {
  userId: string;
  tenantId?: string;
  roles: string[];
}

export function getRequestContext(req: NextRequest): RequestContext
```

**Headers:**
- `x-demo-user` - User ID (required, defaults to "demo-user")
- `x-tenant-id` - Tenant ID (optional, for multi-tenant support)
- `x-user-roles` - Comma-separated roles (optional, defaults to ["reader"])

### 2. `lib/api/response.ts` (NEW)

Consistent JSON response envelope helpers:

```typescript
// Success response
{ ok: true, data: T }

// Error response
{ ok: false, error: { code: string, message: string, details?: unknown } }
```

**Helper functions:**
- `success(data)` - Create success response
- `error(code, message, details?)` - Create error response
- `validationError(message, details?)` - Validation error
- `notFoundError(resource, id?)` - Not found error
- `unauthorizedError(message?)` - Unauthorized error
- `forbiddenError(message?)` - Forbidden error
- `internalError(message?, details?)` - Internal server error

### 3. `app/api/complaints/route.ts` (NEW)

**GET /api/complaints** - List complaints with optional filters:
- Query params: `plant`, `siteCode`, `notificationType`, `category`, `startDate`, `endDate`
- Returns: Array of complaints scoped by userId/tenantId

**POST /api/complaints** - Create complaint(s):
- Accepts: Single complaint object or array of complaints
- Validates: All inputs with Zod schema
- Returns: Created complaint(s) with userId/tenantId automatically set

### 4. `app/api/complaints/[id]/route.ts` (NEW)

**GET /api/complaints/[id]** - Get single complaint:
- Returns: Complaint if found and accessible by user
- Error: 404 if not found

**PATCH /api/complaints/[id]** - Update complaint:
- Accepts: Partial complaint object (only fields to update)
- Validates: Update input with Zod schema
- Returns: Updated complaint

**DELETE /api/complaints/[id]** - Delete complaint:
- Returns: Success confirmation
- Error: 501 if using local backend (delete not implemented)

---

## Security Implementation

### User/Tenant Scoping

All database queries are automatically scoped by `userId` (and `tenantId` if provided):

1. **Request Context**: Extracted from headers via `getRequestContext(req)`
2. **Repository Calls**: All repository methods receive `userId` and `tenantId` parameters
3. **Postgres Repository**: Filters all queries by `userId` (required) and `tenantId` (optional)
4. **Local Repository**: Note: Local backend doesn't fully support scoping (IndexedDB limitation)

### Security Features

- ✅ **No Global Access**: If `userId` is not provided, Postgres repository returns empty results
- ✅ **Tenant Isolation**: Data is isolated by `tenantId` when provided
- ✅ **Automatic Scoping**: All queries automatically include user/tenant filters
- ✅ **Header-Based Auth**: Lightweight demo implementation (ready for JWT/session upgrade)

---

## Validation

All inputs are validated with Zod schemas:

- **Create**: `createComplaintSchema` - Validates all required fields
- **Update**: `updateComplaintSchema` - Validates optional update fields
- **Query Params**: `listQuerySchema` - Validates filter parameters

Validation errors return:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["defectiveParts"],
        "message": "Expected number >= 0, received -5"
      }
    ]
  }
}
```

---

## Response Format

### Success Response
```json
{
  "ok": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### HTTP Status Codes

- `200` - Success (GET, PATCH, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error
- `501` - Not Implemented (delete with local backend)

---

## Repository Updates

### Updated Methods to Support Scoping

1. **`findById(id, userId?, tenantId?)`** - Added userId/tenantId parameters
2. **`findByNotificationNumber(..., userId?, tenantId?)`** - Added scoping
3. **`findBySite(..., userId?, tenantId?)`** - Added scoping
4. **`findByDateRange(..., userId?, tenantId?)`** - Added scoping
5. **`findAll(filters)`** - Filters must include userId (required for Postgres)

### Postgres Repository Security

- **findAll**: Returns empty array if userId not provided
- **findById**: Filters by userId/tenantId
- **count**: Returns 0 if userId not provided
- **Query methods**: All require userId for security

---

## Example Requests

See `API_ENDPOINTS_EXAMPLES.md` for complete curl examples.

### Quick Examples

**List complaints:**
```bash
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: demo-user"
```

**Create complaint:**
```bash
curl -X POST "http://localhost:3005/api/complaints" \
  -H "Content-Type: application/json" \
  -H "x-demo-user: demo-user" \
  -d '{
    "id": "PLANT01-12345",
    "notificationNumber": "12345",
    "notificationType": "Q1",
    "category": "CustomerComplaint",
    "plant": "PLANT01",
    "siteCode": "SITE01",
    "createdOn": "2024-01-15T10:30:00.000Z",
    "defectiveParts": 5,
    "source": "SAP_S4"
  }'
```

**Get single complaint:**
```bash
curl -X GET "http://localhost:3005/api/complaints/PLANT01-12345" \
  -H "x-demo-user: demo-user"
```

**Update complaint:**
```bash
curl -X PATCH "http://localhost:3005/api/complaints/PLANT01-12345" \
  -H "Content-Type: application/json" \
  -H "x-demo-user: demo-user" \
  -d '{
    "defectiveParts": 10
  }'
```

**Delete complaint:**
```bash
curl -X DELETE "http://localhost:3005/api/complaints/PLANT01-12345" \
  -H "x-demo-user: demo-user"
```

---

## Testing

### Test User Scoping

```bash
# User 1 sees only their complaints
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-1"

# User 2 sees only their complaints
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-2"
```

### Test Tenant Isolation

```bash
# Tenant 1
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-1" \
  -H "x-tenant-id: tenant-1"

# Tenant 2 (same user, different tenant)
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-1" \
  -H "x-tenant-id: tenant-2"
```

---

## Next Steps

1. **Update UI Components**: Replace direct IndexedDB calls with API calls
2. **Add Authentication**: Replace header-based auth with JWT tokens or sessions
3. **Add Authorization**: Implement role-based access control (reader/editor/admin)
4. **Add Rate Limiting**: Protect endpoints from abuse
5. **Add Caching**: Cache frequently accessed data
6. **Add Pagination**: For large result sets

---

## Known Limitations

1. **Local Backend Scoping**: Local backend (IndexedDB) doesn't fully support userId/tenantId scoping. This is a limitation of the current domain model. For full security, use Postgres backend.

2. **Delete with Local Backend**: Delete operation returns 501 error with local backend. Use Postgres backend for full CRUD support.

3. **Header-Based Auth**: Current implementation uses headers for demo/testing. In production, replace with proper JWT token validation or session management.
