# API v1 Documentation

This directory contains the version 1 API endpoints for the Adrata platform, built on the streamlined database schema with comprehensive CRUD operations following 2025 best practices.

## Versioning Strategy

- **v1**: Current stable API version
- All endpoints in this directory are prefixed with `/api/v1/`
- Breaking changes will result in a new version (v2, v3, etc.)
- Non-breaking changes can be made to existing v1 endpoints

## Endpoint Structure

```
/api/v1/
├── auth/           # Authentication endpoints
├── companies/      # Company CRUD operations
│   ├── [id]/      # Individual company operations
│   └── bulk/      # Bulk operations
├── people/         # People/contacts CRUD operations
│   └── [id]/      # Individual person operations
├── actions/        # Actions/tasks CRUD operations
│   └── [id]/      # Individual action operations
├── health/         # Health check endpoints
├── types.ts        # Shared TypeScript types
├── utils.ts        # Utility functions
├── schemas.ts      # Zod validation schemas
└── README.md       # This documentation
```

## CRUD Operations

### Companies (`/api/v1/companies`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List companies with search, filtering, and pagination |
| POST | `/companies` | Create a new company |
| GET | `/companies/[id]` | Get a specific company with related data |
| PUT | `/companies/[id]` | Update a company (full replacement) |
| PATCH | `/companies/[id]` | Partially update a company |
| DELETE | `/companies/[id]` | Delete a company |
| PATCH | `/companies/bulk` | Bulk update multiple companies |
| DELETE | `/companies/bulk` | Bulk delete multiple companies |

### People (`/api/v1/people`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/people` | List people with search, filtering, and pagination |
| POST | `/people` | Create a new person |
| GET | `/people/[id]` | Get a specific person with related data |
| PUT | `/people/[id]` | Update a person (full replacement) |
| PATCH | `/people/[id]` | Partially update a person |
| DELETE | `/people/[id]` | Delete a person |

### Actions (`/api/v1/actions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/actions` | List actions with search, filtering, and pagination |
| POST | `/actions` | Create a new action |
| GET | `/actions/[id]` | Get a specific action with related data |
| PUT | `/actions/[id]` | Update an action (full replacement) |
| PATCH | `/actions/[id]` | Partially update an action |
| DELETE | `/actions/[id]` | Delete an action |

## Response Format

All v1 API responses follow this standardized format:

```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "meta": {
    "version": "v1",
    "timestamp": "ISO 8601 string",
    "requestId": "uuid"
  }
}
```

### Success Response Example

```json
{
  "success": true,
  "data": {
    "id": "01HZ...",
    "name": "Acme Corp",
    "industry": "Technology",
    "status": "ACTIVE",
    "createdAt": "2025-01-09T10:00:00Z"
  },
  "error": null,
  "meta": {
    "version": "v1",
    "timestamp": "2025-01-09T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Response Example

```json
{
  "success": false,
  "data": null,
  "error": "Company not found",
  "meta": {
    "version": "v1",
    "timestamp": "2025-01-09T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

## HTTP Methods & Best Practices

### GET - Retrieve Data
- **Purpose**: Fetch resources without side effects
- **Idempotent**: Yes
- **Caching**: Recommended for list endpoints
- **Example**: `GET /api/v1/companies?page=1&limit=20&status=ACTIVE`

### POST - Create Resources
- **Purpose**: Create new resources
- **Idempotent**: No
- **Body**: Required (resource data)
- **Example**: `POST /api/v1/companies` with company data

### PUT - Full Update
- **Purpose**: Replace entire resource
- **Idempotent**: Yes
- **Body**: Required (complete resource data)
- **Example**: `PUT /api/v1/companies/123` with complete company data

### PATCH - Partial Update
- **Purpose**: Update specific fields
- **Idempotent**: Yes
- **Body**: Required (only changed fields)
- **Example**: `PATCH /api/v1/companies/123` with `{"status": "INACTIVE"}`

### DELETE - Remove Resources
- **Purpose**: Delete resources
- **Idempotent**: Yes
- **Body**: Not required
- **Example**: `DELETE /api/v1/companies/123`

## Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: Sort direction - `asc` or `desc` (default: desc)

### Search & Filtering
- `q`: Search query (searches across relevant fields)
- `status`: Filter by status (e.g., ACTIVE, INACTIVE)
- `priority`: Filter by priority (e.g., HIGH, MEDIUM, LOW)
- `createdAfter`: Filter by creation date (ISO 8601)
- `createdBefore`: Filter by creation date (ISO 8601)

### Example Query
```
GET /api/v1/companies?page=1&limit=10&status=ACTIVE&q=tech&sortBy=name&sortOrder=asc
```

## Error Handling

| Status Code | Description | When Used |
|-------------|-------------|-----------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., unique constraint) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## Validation

All endpoints use Zod schemas for input validation:

- **Request Body**: Validated against create/update schemas
- **Query Parameters**: Validated against search schemas
- **Path Parameters**: Validated against ID schemas
- **Error Responses**: Include detailed validation error messages

## Database Schema Integration

The API is built on the streamlined Prisma schema with:

- **Multi-tenant**: Workspace-based data isolation
- **RBAC**: Role-based access control
- **Audit Trail**: Comprehensive logging
- **Relationships**: Proper foreign key relationships
- **Indexes**: Optimized for common query patterns

## Security Features

- **Authentication**: JWT-based authentication (TODO: implement)
- **Authorization**: Role-based permissions (TODO: implement)
- **Input Validation**: Comprehensive Zod schema validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Rate Limiting**: Built-in rate limiting utilities
- **Audit Logging**: All operations logged for compliance

## Performance Optimizations

- **Pagination**: Efficient pagination with skip/take
- **Selective Fields**: Include only necessary related data
- **Database Indexes**: Optimized for common query patterns
- **Parallel Queries**: Count and data queries run in parallel
- **Connection Pooling**: Prisma connection pooling

## Development Guidelines

- **TypeScript**: Strict typing throughout
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Logging**: Structured logging for debugging and monitoring
- **Testing**: Unit and integration tests required
- **Documentation**: Keep this README updated with changes
- **Code Style**: Follow project's ESLint and Prettier configuration

## Migration from Legacy API

When migrating endpoints from the legacy API structure:

1. Move the route file to the appropriate v1 subdirectory
2. Update the response format to match v1 standards
3. Add proper error handling and validation
4. Update API documentation
5. Add version-specific tests
6. Implement proper authentication and authorization
7. Add audit logging

## Example Usage

### Create a Company
```bash
curl -X POST /api/v1/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "industry": "Technology",
    "website": "https://acme.com",
    "status": "ACTIVE"
  }'
```

### Update a Company (Partial)
```bash
curl -X PATCH /api/v1/companies/123 \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'
```

### Search Companies
```bash
curl "/api/v1/companies?q=tech&status=ACTIVE&page=1&limit=10"
```

### Bulk Update Companies
```bash
curl -X PATCH /api/v1/companies/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["123", "456", "789"],
    "updates": {"status": "INACTIVE"}
  }'
```
