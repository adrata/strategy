# API v1 Documentation

This directory contains the version 1 API endpoints for the Adrata platform.

## Versioning Strategy

- **v1**: Current stable API version
- All endpoints in this directory are prefixed with `/api/v1/`
- Breaking changes will result in a new version (v2, v3, etc.)
- Non-breaking changes can be made to existing v1 endpoints

## Endpoint Structure

```
/api/v1/
├── auth/           # Authentication endpoints
├── data/           # Data access endpoints
├── companies/      # Company-related endpoints
├── people/         # People/contacts endpoints
├── opportunities/  # Sales opportunities
├── intelligence/   # AI intelligence endpoints
└── health/         # Health check endpoints
```

## Response Format

All v1 API responses follow this standard format:

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

## Error Handling

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **422**: Unprocessable Entity - Validation errors
- **500**: Internal Server Error - Server-side error

## Migration from Legacy API

When migrating endpoints from the legacy API structure:

1. Move the route file to the appropriate v1 subdirectory
2. Update the response format to match v1 standards
3. Add proper error handling and validation
4. Update API documentation
5. Add version-specific tests

## Development Guidelines

- Use TypeScript for all route handlers
- Implement proper input validation with Zod schemas
- Add comprehensive error handling
- Include proper logging and monitoring
- Write tests for all endpoints
- Follow the project's security standards
