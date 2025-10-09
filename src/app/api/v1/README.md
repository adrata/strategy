# API v1 - Minimal Enterprise API

## 🎯 Overview

A **simple, clean, and secure** REST API for the next great enterprise operating system. Built with NextAuth.js integration and centralized pipeline management.

## 🏗️ Complete Structure

```
/api/v1/
├── auth.ts              # Simple authentication (NextAuth.js + JWT)
├── companies/           # Company management
│   ├── route.ts         # GET (list), POST (create)
│   └── [id]/route.ts    # GET, PUT, PATCH, DELETE
├── people/              # People management
│   ├── route.ts         # GET (list), POST (create)
│   └── [id]/route.ts    # GET, PUT, PATCH, DELETE
├── actions/             # Action/task management
│   ├── route.ts         # GET (list), POST (create)
│   └── [id]/route.ts    # GET, PUT, PATCH, DELETE
├── health/route.ts      # Health check
└── README.md           # This documentation
```

## 🎯 Centralized Pipeline Management

**No separate tables for leads/prospects/opportunities!** Everything is centralized:

- **Companies**: Use `status` field (PROSPECT → CLIENT → ACTIVE → INACTIVE)
- **People**: Use `status` field (PROSPECT → ACTIVE → INACTIVE)  
- **Actions**: Track all activities and progression between people and companies
- **Clean & Simple**: No data duplication, single source of truth

## 🔐 Authentication

**Dual Authentication System:**

1. **NextAuth.js** (Primary) - For web applications
2. **JWT Bearer Tokens** (Fallback) - For API clients

```http
# Automatic via NextAuth.js cookies
Cookie: auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Or JWT Bearer token for API clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Response Format

**Consistent JSON responses:**

```json
// Success
{
  "success": true,
  "data": { /* your data */ },
  "meta": {
    "pagination": { "page": 1, "limit": 20, "totalCount": 100 },
    "filters": { "search": "acme", "status": "ACTIVE" }
  }
}

// Error
{
  "success": false,
  error": "Authentication required"
}
```

## 🚀 Quick Start Examples

### Companies

```bash
# List companies
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/companies?page=1&limit=20&search=acme&status=PROSPECT"

# Create company
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "email": "contact@acme.com", "status": "PROSPECT"}' \
  "http://localhost:3000/api/v1/companies"

# Get company
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/companies/COMPANY_ID"

# Update company status (pipeline progression)
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CLIENT"}' \
  "http://localhost:3000/api/v1/companies/COMPANY_ID"
```

### People

```bash
# List people
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/people?page=1&limit=20&search=john&companyId=COMPANY_ID"

# Create person
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@acme.com", "companyId": "COMPANY_ID"}' \
  "http://localhost:3000/api/v1/people"

# Get person
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/people/PERSON_ID"
```

### Actions

```bash
# List actions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/actions?page=1&limit=20&companyId=COMPANY_ID&status=COMPLETED"

# Create action (tracking what someone did at a company)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "CALL", "subject": "Called CEO", "companyId": "COMPANY_ID", "personId": "PERSON_ID", "status": "COMPLETED"}' \
  "http://localhost:3000/api/v1/actions"

# Get last action for a company
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/actions?companyId=COMPANY_ID&sortBy=createdAt&sortOrder=desc&limit=1"

# Get counts by status (for left panel navigation)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/companies?counts=true"
# Returns: { "PROSPECT": 5, "OPPORTUNITY": 3, "CLIENT": 12, "ACTIVE": 8, "INACTIVE": 2 }

curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/people?counts=true"
# Returns: { "LEAD": 7, "PROSPECT": 3, "ACTIVE": 25, "INACTIVE": 1 }

curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/actions?counts=true"
# Returns: { "PLANNED": 7, "IN_PROGRESS": 3, "COMPLETED": 15, "CANCELLED": 1 }

curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/users?counts=true"
# Returns: { "SELLER": 5, "MANAGER": 2, "ADMIN": 1 }
```

## 📊 Available Endpoints

### Companies
- `GET /api/v1/companies` - List companies
- `POST /api/v1/companies` - Create company
- `GET /api/v1/companies/{id}` - Get company
- `PUT /api/v1/companies/{id}` - Update company (full)
- `PATCH /api/v1/companies/{id}` - Update company (partial)
- `DELETE /api/v1/companies/{id}` - Delete company

### People
- `GET /api/v1/people` - List people
- `POST /api/v1/people` - Create person
- `GET /api/v1/people/{id}` - Get person
- `PUT /api/v1/people/{id}` - Update person (full)
- `PATCH /api/v1/people/{id}` - Update person (partial)
- `DELETE /api/v1/people/{id}` - Delete person

### Actions
- `GET /api/v1/actions` - List actions
- `POST /api/v1/actions` - Create action
- `GET /api/v1/actions/{id}` - Get action
- `PUT /api/v1/actions/{id}` - Update action (full)
- `PATCH /api/v1/actions/{id}` - Update action (partial)
- `DELETE /api/v1/actions/{id}` - Delete action

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user (full)
- `PATCH /api/v1/users/{id}` - Update user (partial)
- `DELETE /api/v1/users/{id}` - Delete user

### Health
- `GET /api/v1/health` - Health check

## 🔍 Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Filtering
- `search` - Search across relevant fields
- `status` - Filter by status (PROSPECT, ACTIVE, CLIENT, INACTIVE, etc.)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT, etc.)
- `companyId` - Filter by company (for people and actions)
- `personId` - Filter by person (for actions)
- `type` - Filter by action type (for actions)
- `counts=true` - Return counts by status instead of full data

### Sorting
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - asc or desc (default: desc)

## 🎯 Pipeline Status Values

### Company Status
- `PROSPECT` - Initial prospect
- `OPPORTUNITY` - Opportunity stage
- `CLIENT` - Active client
- `ACTIVE` - Active company
- `INACTIVE` - Inactive company

### Person Status
- `LEAD` - Lead status
- `PROSPECT` - Initial prospect
- `ACTIVE` - Active person
- `INACTIVE` - Inactive person

### Action Status
- `PLANNED` - Planned action
- `IN_PROGRESS` - Action in progress
- `COMPLETED` - Completed action
- `CANCELLED` - Cancelled action

### Action Priority
- `LOW` - Low priority
- `NORMAL` - Normal priority
- `HIGH` - High priority
- `URGENT` - Urgent priority

## 🛡️ Security Features

- **Authentication Required**: All endpoints require valid authentication
- **NextAuth.js Integration**: Uses your existing auth system
- **Workspace Isolation**: Data is isolated by workspace
- **Input Validation**: Basic validation on all inputs
- **Error Handling**: Consistent error responses
- **SQL Injection Protection**: Via Prisma ORM

## 🚀 Performance

- **Optimized Queries**: Efficient Prisma database queries
- **Pagination**: Built-in pagination for large datasets
- **Parallel Queries**: Multiple queries run in parallel
- **Selective Fields**: Only return requested data
- **Connection Pooling**: Efficient database connections

## 🔧 Development

### Test the API
```bash
# Health check
curl http://localhost:3000/api/v1/health

# List companies (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/companies
```

### Environment Variables
```env
# Your existing variables work as-is
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
JWT_SECRET="your-jwt-secret"
```

## 🎯 Key Features

- **🔐 Secure**: Integrates with your existing NextAuth.js system
- **🚀 Simple**: Clean, straightforward implementation
- **📊 Enterprise Ready**: Built for scale and compliance
- **🔧 CRUD Operations**: Full Create, Read, Update, Delete support
- **📝 PATCH Support**: Partial updates for efficiency
- **🔍 Search & Filter**: Built-in search and filtering
- **📄 Pagination**: Efficient pagination for large datasets
- **⚡ Fast**: Optimized database queries and caching
- **🎯 Centralized**: No data duplication, single source of truth

## 🚀 Ready to Build!

This is a **complete, minimal foundation** for your enterprise operating system. You can:

1. **Start using it immediately** for companies, people, and actions management
2. **Track pipeline progression** through status changes
3. **Monitor activities** between people and companies
4. **Scale up gradually** by adding more features as needed

The API is **secure**, **fast**, and **enterprise-ready** while being **simple and maintainable**.

---

**🎉 Ready to build the next great enterprise operating system!**