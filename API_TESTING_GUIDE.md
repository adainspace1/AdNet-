# Admin Dashboard API Testing Guide

## Quick Reference - All API Endpoints

### Base URL
```
http://localhost:PORT/api/admin
```

### Authentication
All endpoints require an authenticated session where:
- `req.session.user` exists (logged in)
- `req.session.user.TYPE === 'USER'` (admin account)

## API Endpoints

### 1. KPI Dashboard Metrics
**Endpoint**: `GET /api/admin/kpi`

**Description**: Aggregated key performance indicators for the dashboard overview

**Response**:
```json
{
  "totalCompanies": 45,
  "revenue": 2500000,
  "pendingAudits": 8,
  "overdueTax": 3
}
```

**Usage in Dashboard**:
```javascript
fetch('/api/admin/kpi')
  .then(r => r.json())
  .then(data => {
    // Update KPI cards
    document.getElementById('totalCompanies').textContent = data.totalCompanies;
  });
```

---

### 2. Companies Management

#### Get All Companies
**Endpoint**: `GET /api/admin/companies`

**Response**:
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Tech Solutions Inc",
    "status": "Active",
    "subscription": "Premium",
    "dateAdded": "2024-01-15T10:30:00Z",
    "complianceStatus": "Compliant"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Finance Corp",
    "status": "Active",
    "subscription": "Basic",
    "dateAdded": "2024-02-20T14:45:00Z",
    "complianceStatus": "Audit Overdue"
  }
]
```

#### Create New Company
**Endpoint**: `POST /api/admin/companies`

**Request Body**:
```json
{
  "name": "New Company Ltd",
  "registrationNumber": "RC123456",
  "status": "Active"
}
```

**Response**:
```json
{
  "message": "Company created successfully",
  "company": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "New Company Ltd",
    "registrationNumber": "RC123456",
    "status": "Active",
    "createdAt": "2024-03-01T10:00:00Z"
  }
}
```

---

### 3. Users & Admins Management

**Endpoint**: `GET /api/admin/users`

**Description**: Lists all admin users (TYPE: USER) in the system

**Response**:
```json
[
  {
    "id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@admin.com",
    "role": "Admin",
    "status": "Active",
    "dateAdded": "2024-01-10T08:30:00Z"
  },
  {
    "id": "507f191e810c19729de860eb",
    "name": "Jane Smith",
    "email": "jane@admin.com",
    "role": "Auditor",
    "status": "Active",
    "dateAdded": "2024-01-12T09:15:00Z"
  }
]
```

---

### 4. Audits Management

**Endpoint**: `GET /api/admin/audits`

**Description**: Lists all audit records with status and auditor information

**Response**:
```json
[
  {
    "id": "507f191e810c19729de860ec",
    "auditId": "AUD-2024-001",
    "company": "Tech Solutions Inc",
    "auditor": "John Doe",
    "status": "Ongoing",
    "startDate": "2024-02-01T00:00:00Z",
    "progress": 65
  },
  {
    "id": "507f191e810c19729de860ed",
    "auditId": "AUD-2024-002",
    "company": "Finance Corp",
    "auditor": "Unassigned",
    "status": "Pending",
    "startDate": "2024-03-01T00:00:00Z",
    "progress": 0
  }
]
```

---

### 5. Tax Management

**Endpoint**: `GET /api/admin/taxes`

**Description**: Lists tax records with aggregated status counts

**Response**:
```json
{
  "paidCount": 42,
  "pendingCount": 15,
  "overdueCount": 3,
  "records": [
    {
      "id": "507f191e810c19729de860ee",
      "company": "Tech Solutions Inc",
      "type": "Corporate Income Tax",
      "amount": 150000,
      "status": "Paid",
      "dueDate": "2024-03-31T00:00:00Z"
    },
    {
      "id": "507f191e810c19729de860ef",
      "company": "Finance Corp",
      "type": "VAT",
      "amount": 75000,
      "status": "Pending",
      "dueDate": "2024-04-15T00:00:00Z"
    }
  ]
}
```

---

### 6. Billing & Invoices

**Endpoint**: `GET /api/admin/billing`

**Description**: Invoice data with revenue calculations and subscription counts

**Response**:
```json
{
  "totalRevenue": 5250000,
  "pendingInvoices": 8,
  "activeSubscriptions": 45,
  "invoices": [
    {
      "id": "507f191e810c19729de860f0",
      "invoiceId": "INV-2024-001",
      "company": "Tech Solutions Inc",
      "amount": 500000,
      "status": "Paid",
      "dueDate": "2024-02-15T00:00:00Z"
    },
    {
      "id": "507f191e810c19729de860f1",
      "invoiceId": "INV-2024-002",
      "company": "Finance Corp",
      "amount": 250000,
      "status": "Pending",
      "dueDate": "2024-04-01T00:00:00Z"
    }
  ]
}
```

---

### 7. Logistics & Operations

**Endpoint**: `GET /api/admin/logistics`

**Description**: Driver count, vehicle statistics, and active delivery tracking

**Response**:
```json
{
  "driverCount": 25,
  "vehicleCount": 18,
  "activeDeliveries": 7
}
```

---

### 8. Recent Activities

**Endpoint**: `GET /api/admin/activities`

**Description**: System activity log showing recent user actions (limited to 10 most recent)

**Response**:
```json
[
  {
    "id": "507f191e810c19729de860f2",
    "description": "Admin user logged in",
    "timestamp": "2024-03-01T14:30:00Z",
    "type": "info"
  },
  {
    "id": "507f191e810c19729de860f3",
    "description": "New company created: Tech Solutions Inc",
    "timestamp": "2024-03-01T14:25:00Z",
    "type": "success"
  },
  {
    "id": "507f191e810c19729de860f4",
    "description": "Audit AUD-2024-001 status updated to Ongoing",
    "timestamp": "2024-03-01T14:20:00Z",
    "type": "info"
  }
]
```

---

### 9. Staff/Workers Management

**Endpoint**: `GET /api/admin/staff?adminId=<ADMIN_ID>`

**Description**: Lists workers/staff under a specific admin with roles and status

**Query Parameters**:
- `adminId` (required): The ID of the admin user

**Response**:
```json
[
  {
    "id": "507f191e810c19729de860f5",
    "name": "John Worker",
    "email": "worker1@company.com",
    "username": "jworker",
    "roles": ["Auditor", "Reviewer"],
    "status": "Active",
    "dateAdded": "2024-02-10T10:00:00Z"
  },
  {
    "id": "507f191e810c19729de860f6",
    "name": "Jane Auditor",
    "email": "auditor1@company.com",
    "username": "jauditor",
    "roles": ["Auditor"],
    "status": "Active",
    "dateAdded": "2024-02-15T11:30:00Z"
  }
]
```

---

### 10. System Logs

**Endpoint**: `GET /api/admin/logs`

**Description**: System activity logs (currently returns mock data, ready for integration)

**Response**:
```json
[
  {
    "timestamp": "2024-03-01T14:30:00Z",
    "action": "Login",
    "user": "Admin User",
    "ipAddress": "192.168.1.1"
  },
  {
    "timestamp": "2024-03-01T13:30:00Z",
    "action": "Company Created",
    "user": "Jane Smith",
    "ipAddress": "192.168.1.50"
  }
]
```

---

## Testing with Postman

### Setup
1. Open Postman
2. Create a new collection: "Admin Dashboard API"
3. Set up Authentication:
   - Type: Cookie
   - Add the session cookie from your browser after login

### Test Request Example
```
GET http://localhost:3000/api/admin/kpi
Headers:
  Cookie: connect.sid=<YOUR_SESSION_COOKIE>
```

---

## Testing with cURL

### KPI Endpoint
```bash
curl -b "connect.sid=YOUR_SESSION_ID" \
  http://localhost:3000/api/admin/kpi
```

### Companies Endpoint
```bash
curl -b "connect.sid=YOUR_SESSION_ID" \
  http://localhost:3000/api/admin/companies
```

### Create Company
```bash
curl -X POST \
  -b "connect.sid=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Co","registrationNumber":"RC999","status":"Active"}' \
  http://localhost:3000/api/admin/companies
```

---

## Testing with Browser Console

### Get KPI Data
```javascript
fetch('/api/admin/kpi')
  .then(r => r.json())
  .then(console.log)
```

### Get Companies
```javascript
fetch('/api/admin/companies')
  .then(r => r.json())
  .then(console.log)
```

### Get Staff
```javascript
fetch('/api/admin/staff?adminId=507f191e810c19729de860ea')
  .then(r => r.json())
  .then(console.log)
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Not authenticated"
}
```
**Cause**: User session not found
**Solution**: Login again

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```
**Cause**: User logged in but not an admin (TYPE: WORKER)
**Solution**: Only TYPE: USER accounts can access these endpoints

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch [endpoint] data"
}
```
**Cause**: Database error or model issue
**Solution**: Check server logs for detailed error message

---

## Response Headers

All successful responses include:
```
Content-Type: application/json
Status: 200 OK
```

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider:
- Adding rate limiter middleware
- Limiting requests per user per minute
- Implementing caching for expensive queries

---

## Performance Notes

- **KPI queries** use aggregation pipelines for efficient counting
- **Table queries** use `.limit(100)` to prevent large data transfers
- **Activities** limited to 10 most recent for performance
- **Auto-refresh** happens every 30 seconds (configurable)

---

## Database Dependency

Each endpoint depends on specific models being populated:

| Endpoint | Required Models | Data Freshness |
|----------|-----------------|-----------------|
| `/kpi` | Company, CustomPlan, AuditLog, Tax | Real-time |
| `/companies` | Company | Real-time |
| `/users` | User (TYPE: USER) | Real-time |
| `/audits` | AuditLog | Real-time |
| `/taxes` | Tax | Real-time |
| `/billing` | Invoice, CustomPlan | Real-time |
| `/logistics` | Driver, Order | Real-time |
| `/activities` | Activity | Real-time |
| `/staff` | Worker | Real-time |
| `/logs` | Mock data | Static |

---

## Next Steps

1. **Test all endpoints** in your browser console or Postman
2. **Monitor server logs** for any errors during requests
3. **Verify database** contains sample data in collections
4. **Check authentication** middleware is working correctly
5. **Monitor performance** - track response times for optimization

---

**Last Updated**: 2024
**API Version**: 1.0
**Status**: Production Ready ✅
