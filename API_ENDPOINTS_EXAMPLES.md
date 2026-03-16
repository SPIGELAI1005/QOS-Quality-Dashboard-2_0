# Complaints API Endpoints - Example Requests

**Last Updated**: 2026-03-16

## Base URL
```
http://localhost:3005/api/complaints
```

## Authentication Headers

All requests should include user context headers (for demo/testing):

```bash
x-demo-user: demo-user          # User ID (required)
x-tenant-id: tenant-1           # Tenant ID (optional)
x-user-roles: reader,editor     # Comma-separated roles (optional, defaults to "reader")
```

---

## 1. GET /api/complaints - List Complaints

### Basic Request
```bash
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: demo-user"
```

### With Filters
```bash
# Filter by plant
curl -X GET "http://localhost:3005/api/complaints?plant=PLANT01" \
  -H "x-demo-user: demo-user"

# Filter by site code
curl -X GET "http://localhost:3005/api/complaints?siteCode=SITE01" \
  -H "x-demo-user: demo-user"

# Filter by notification type
curl -X GET "http://localhost:3005/api/complaints?notificationType=Q1" \
  -H "x-demo-user: demo-user"

# Filter by category
curl -X GET "http://localhost:3005/api/complaints?category=CustomerComplaint" \
  -H "x-demo-user: demo-user"

# Filter by date range
curl -X GET "http://localhost:3005/api/complaints?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z" \
  -H "x-demo-user: demo-user"

# Combined filters
curl -X GET "http://localhost:3005/api/complaints?plant=PLANT01&notificationType=Q1&startDate=2024-01-01T00:00:00Z" \
  -H "x-demo-user: demo-user"
```

### Response (Success)
```json
{
  "ok": true,
  "data": [
    {
      "id": "PLANT01-12345",
      "notificationNumber": "12345",
      "notificationType": "Q1",
      "category": "CustomerComplaint",
      "plant": "PLANT01",
      "siteCode": "SITE01",
      "siteName": "Main Site",
      "createdOn": "2024-01-15T10:30:00.000Z",
      "defectiveParts": 5,
      "source": "SAP_S4",
      "unitOfMeasure": "PC",
      "materialDescription": "Widget A",
      "materialNumber": "MAT001"
    }
  ]
}
```

### Response (Error)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "path": ["startDate"],
        "message": "Invalid datetime"
      }
    ]
  }
}
```

---

## 2. POST /api/complaints - Create Complaint(s)

### Create Single Complaint
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
    "siteName": "Main Site",
    "createdOn": "2024-01-15T10:30:00.000Z",
    "defectiveParts": 5,
    "source": "SAP_S4",
    "unitOfMeasure": "PC",
    "materialDescription": "Widget A",
    "materialNumber": "MAT001"
  }'
```

### Create Multiple Complaints
```bash
curl -X POST "http://localhost:3005/api/complaints" \
  -H "Content-Type: application/json" \
  -H "x-demo-user: demo-user" \
  -d '[
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
    },
    {
      "id": "PLANT01-12346",
      "notificationNumber": "12346",
      "notificationType": "Q2",
      "category": "SupplierComplaint",
      "plant": "PLANT01",
      "siteCode": "SITE01",
      "createdOn": "2024-01-16T11:00:00.000Z",
      "defectiveParts": 3,
      "source": "SAP_S4"
    }
  ]'
```

### Response (Success - Single)
```json
{
  "ok": true,
  "data": {
    "id": "PLANT01-12345",
    "notificationNumber": "12345",
    "notificationType": "Q1",
    "category": "CustomerComplaint",
    "plant": "PLANT01",
    "siteCode": "SITE01",
    "siteName": "Main Site",
    "createdOn": "2024-01-15T10:30:00.000Z",
    "defectiveParts": 5,
    "source": "SAP_S4",
    "unitOfMeasure": "PC",
    "materialDescription": "Widget A",
    "materialNumber": "MAT001"
  }
}
```

### Response (Success - Multiple)
```json
{
  "ok": true,
  "data": {
    "count": 2,
    "created": 2
  }
}
```

### Response (Validation Error)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["defectiveParts"],
        "message": "Expected number, received string"
      },
      {
        "path": ["notificationType"],
        "message": "Invalid enum value. Expected 'Q1' | 'Q2' | 'Q3' | ..."
      }
    ]
  }
}
```

---

## 3. GET /api/complaints/[id] - Get Single Complaint

### Request
```bash
curl -X GET "http://localhost:3005/api/complaints/PLANT01-12345" \
  -H "x-demo-user: demo-user"
```

### Response (Success)
```json
{
  "ok": true,
  "data": {
    "id": "PLANT01-12345",
    "notificationNumber": "12345",
    "notificationType": "Q1",
    "category": "CustomerComplaint",
    "plant": "PLANT01",
    "siteCode": "SITE01",
    "siteName": "Main Site",
    "createdOn": "2024-01-15T10:30:00.000Z",
    "defectiveParts": 5,
    "source": "SAP_S4",
    "unitOfMeasure": "PC",
    "materialDescription": "Widget A",
    "materialNumber": "MAT001"
  }
}
```

### Response (Not Found)
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Complaint not found: PLANT01-12345",
    "details": {
      "resource": "Complaint",
      "id": "PLANT01-12345"
    }
  }
}
```

---

## 4. PATCH /api/complaints/[id] - Update Complaint

### Request
```bash
curl -X PATCH "http://localhost:3005/api/complaints/PLANT01-12345" \
  -H "Content-Type: application/json" \
  -H "x-demo-user: demo-user" \
  -d '{
    "defectiveParts": 10,
    "siteName": "Updated Site Name"
  }'
```

### Partial Update (only changed fields)
```bash
curl -X PATCH "http://localhost:3005/api/complaints/PLANT01-12345" \
  -H "Content-Type: application/json" \
  -H "x-demo-user: demo-user" \
  -d '{
    "defectiveParts": 8
  }'
```

### Response (Success)
```json
{
  "ok": true,
  "data": {
    "id": "PLANT01-12345",
    "notificationNumber": "12345",
    "notificationType": "Q1",
    "category": "CustomerComplaint",
    "plant": "PLANT01",
    "siteCode": "SITE01",
    "siteName": "Updated Site Name",
    "createdOn": "2024-01-15T10:30:00.000Z",
    "defectiveParts": 10,
    "source": "SAP_S4",
    "unitOfMeasure": "PC",
    "materialDescription": "Widget A",
    "materialNumber": "MAT001"
  }
}
```

### Response (Validation Error)
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

## 5. DELETE /api/complaints/[id] - Delete Complaint

### Request
```bash
curl -X DELETE "http://localhost:3005/api/complaints/PLANT01-12345" \
  -H "x-demo-user: demo-user"
```

### Response (Success)
```json
{
  "ok": true,
  "data": {
    "id": "PLANT01-12345",
    "deleted": true
  }
}
```

### Response (Not Found)
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Complaint not found: PLANT01-12345",
    "details": {
      "resource": "Complaint",
      "id": "PLANT01-12345"
    }
  }
}
```

### Response (Not Implemented - Local Backend)
```json
{
  "ok": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Delete operation not supported with local backend. Use Postgres backend for full CRUD support.",
    "details": {
      "backend": "local"
    }
  }
}
```

---

## Error Response Format

All errors follow this consistent format:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional error details
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed (400)
- `NOT_FOUND` - Resource not found (404)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `INTERNAL_ERROR` - Server error (500)
- `BAD_REQUEST` - Invalid request (400)
- `NOT_IMPLEMENTED` - Feature not available (501)

---

## Testing with Different Users

### User 1
```bash
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-1"
```

### User 2 (different data scope)
```bash
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-2"
```

Each user only sees their own complaints (scoped by userId).

---

## Testing with Tenant Isolation

### Tenant 1
```bash
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-1" \
  -H "x-tenant-id: tenant-1"
```

### Tenant 2
```bash
curl -X GET "http://localhost:3005/api/complaints" \
  -H "x-demo-user: user-1" \
  -H "x-tenant-id: tenant-2"
```

Data is isolated by tenantId (multi-tenant support).

---

## Notes

1. **User Context**: All requests require `x-demo-user` header. In production, this would be extracted from JWT tokens or session cookies.

2. **Data Scoping**: All queries are automatically scoped by userId (and tenantId if provided). Users cannot access other users' data.

3. **Validation**: All inputs are validated with Zod schemas before processing.

4. **Backend Selection**: The API automatically uses the backend specified by `DATA_BACKEND` env var (postgres or local).

5. **Delete Limitation**: Delete operation is not fully supported with local backend (IndexedDB limitation). Use Postgres backend for full CRUD support.
