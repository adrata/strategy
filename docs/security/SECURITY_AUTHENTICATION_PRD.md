# Security Authentication Fix PRD

## Executive Summary

**Critical Security Vulnerability Identified:** Multiple API endpoints lack proper authentication, allowing unauthorized access to sensitive business data through workspaceId query parameters. This PRD outlines the comprehensive fix to implement enterprise-grade authentication across all API endpoints.

## Problem Statement

### Current Security Issues

1. **No Authentication on Core Endpoints**: 40+ API endpoints rely solely on `workspaceId` query parameters
2. **Security Through Obscurity**: System assumes `workspaceId` is secret, but it's easily discoverable
3. **Inconsistent Authentication**: Three different patterns across the codebase
4. **Development TODOs in Production**: Explicit security bypasses in production code
5. **Missing Workspace Access Control**: No validation of user workspace membership

### Business Impact

- **Data Breach Risk**: Unauthorized access to customer data, leads, prospects, opportunities
- **Compliance Violations**: SOC2, GDPR, and other security standards non-compliance
- **Reputation Damage**: Security vulnerabilities in production system
- **Legal Liability**: Potential data protection violations

## Solution Overview

### Universal Authentication System

Implement a comprehensive authentication system that:

1. **Protects ALL API endpoints** with JWT-based authentication
2. **Validates workspace membership** for proper access control
3. **Removes all security fallbacks** and development bypasses
4. **Implements consistent error handling** across all endpoints
5. **Adds security monitoring** and audit logging

## Technical Requirements

### 1. Universal Authentication Middleware

**File**: `src/middleware.ts`

**Requirements**:
- Protect ALL `/api/*` routes except authentication endpoints
- Validate JWT tokens from Authorization header or cookies
- Extract user context and add to request headers
- Return 401 for invalid/missing authentication
- Support both web (cookies) and API (Bearer token) authentication

**Implementation**:
```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect ALL API routes except auth endpoints
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const authUser = await getUnifiedAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Add user context to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', authUser.id);
    response.headers.set('x-workspace-id', authUser.workspaceId || '');
    response.headers.set('x-user-email', authUser.email);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
```

### 2. Workspace Access Control

**File**: `src/platform/services/workspace-access-control.ts`

**Requirements**:
- Validate user membership in requested workspace
- Check workspace status (active, suspended, etc.)
- Support role-based access control (admin, member, viewer)
- Cache membership validation for performance
- Handle workspace switching scenarios

**Implementation**:
```typescript
export async function validateWorkspaceAccess(
  userId: string, 
  workspaceId: string
): Promise<{ hasAccess: boolean; role?: string; error?: string }> {
  try {
    const membership = await prisma.workspaceMembership.findFirst({
      where: {
        userId,
        workspaceId,
        status: 'active'
      },
      include: {
        role: true
      }
    });
    
    if (!membership) {
      return { hasAccess: false, error: 'User not member of workspace' };
    }
    
    return { 
      hasAccess: true, 
      role: membership.role?.name || 'member' 
    };
  } catch (error) {
    console.error('Workspace access validation error:', error);
    return { hasAccess: false, error: 'Access validation failed' };
  }
}
```

### 3. Secure API Endpoint Pattern

**Standard Pattern for All Endpoints**:

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Validate workspace access
    const workspaceAccess = await validateWorkspaceAccess(
      authUser.id, 
      authUser.workspaceId!
    );
    
    if (!workspaceAccess.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Workspace access denied' },
        { status: 403 }
      );
    }

    // 3. Extract parameters safely
    const { searchParams } = new URL(request.url);
    const workspaceId = authUser.workspaceId; // Use authenticated workspace
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // 4. Execute business logic with authenticated context
    const data = await getDataForWorkspace(workspaceId, authUser.id);
    
    return NextResponse.json({
      success: true,
      data,
      meta: {
        userId: authUser.id,
        workspaceId: authUser.workspaceId,
        role: workspaceAccess.role
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Day 1)

1. **Update Middleware** (`src/middleware.ts`)
   - Implement universal API protection
   - Add user context extraction
   - Handle authentication errors consistently

2. **Create Workspace Access Control** (`src/platform/services/workspace-access-control.ts`)
   - Implement membership validation
   - Add role-based access control
   - Create caching for performance

3. **Update Authentication Service** (`src/platform/api-auth.ts`)
   - Enhance `getUnifiedAuthUser` function
   - Add workspace context validation
   - Improve error handling and logging

### Phase 2: Critical Endpoints (Day 2-3)

**Priority 1 - Critical Data Endpoints**:
- `/api/activities` - User activity data
- `/api/users/[userId]/profile` - User profiles
- `/api/data/*` - All business data endpoints
- `/api/notes` - Private communications

**Implementation Steps**:
1. Remove query parameter authentication
2. Add JWT validation
3. Implement workspace access control
4. Add proper error handling
5. Test with invalid tokens

### Phase 3: High-Risk Endpoints (Day 4-5)

**Priority 2 - High-Risk Endpoints**:
- `/api/timeline/*` - Timeline data
- `/api/pipeline/*` - Pipeline data
- `/api/intelligence/*` - AI and research data
- `/api/email/*` - Email communications

### Phase 4: Remaining Endpoints (Day 6-7)

**Priority 3 - All Other Endpoints**:
- Utility endpoints
- Configuration endpoints
- Health check endpoints
- Webhook endpoints

### Phase 5: Testing & Validation (Day 8)

1. **Security Testing**
   - Test all endpoints with invalid tokens
   - Verify no data leakage between workspaces
   - Test role-based access control
   - Validate error responses

2. **Performance Testing**
   - Ensure authentication doesn't impact performance
   - Test caching mechanisms
   - Validate memory usage

3. **Integration Testing**
   - Test with frontend applications
   - Verify mobile app compatibility
   - Test desktop app integration

## Security Requirements

### Authentication Standards

1. **JWT Token Validation**
   - Verify token signature with proper secret
   - Check token expiration
   - Validate token structure and claims
   - Handle token refresh scenarios

2. **Workspace Access Control**
   - Validate user membership in workspace
   - Check workspace status and permissions
   - Support role-based access (admin, member, viewer)
   - Handle workspace switching

3. **Error Handling**
   - Consistent error responses across all endpoints
   - No information leakage in error messages
   - Proper HTTP status codes
   - Security logging for audit trails

### Security Monitoring

1. **Audit Logging**
   - Log all authentication attempts
   - Track workspace access attempts
   - Monitor failed authentication
   - Alert on suspicious activity

2. **Rate Limiting**
   - Implement rate limiting on authentication endpoints
   - Add brute force protection
   - Monitor for unusual access patterns

## Success Criteria

### Functional Requirements

- [ ] All API endpoints require valid authentication
- [ ] Workspace access is properly validated
- [ ] No data leakage between workspaces
- [ ] Consistent error handling across all endpoints
- [ ] Performance impact < 50ms per request

### Security Requirements

- [ ] No endpoints accessible without authentication
- [ ] All development fallbacks removed
- [ ] Proper JWT validation on all endpoints
- [ ] Workspace membership validation
- [ ] Security audit logging implemented

### Quality Requirements

- [ ] 100% test coverage for authentication logic
- [ ] All endpoints tested with invalid tokens
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Security review completed

## Risk Mitigation

### Implementation Risks

1. **Breaking Changes**
   - **Risk**: Existing integrations may break
   - **Mitigation**: Implement feature flags and gradual rollout
   - **Fallback**: Maintain backward compatibility during transition

2. **Performance Impact**
   - **Risk**: Authentication adds latency
   - **Mitigation**: Implement caching and optimize database queries
   - **Monitoring**: Add performance monitoring and alerts

3. **User Experience**
   - **Risk**: Users may experience authentication issues
   - **Mitigation**: Implement proper error messages and user guidance
   - **Support**: Provide clear documentation and support channels

### Security Risks

1. **Token Compromise**
   - **Risk**: JWT tokens may be compromised
   - **Mitigation**: Implement token rotation and short expiration times
   - **Monitoring**: Add token usage monitoring and anomaly detection

2. **Workspace Isolation**
   - **Risk**: Data leakage between workspaces
   - **Mitigation**: Implement strict workspace validation
   - **Testing**: Comprehensive testing of workspace isolation

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | Day 1 | Core infrastructure (middleware, access control) |
| Phase 2 | Day 2-3 | Critical endpoints secured |
| Phase 3 | Day 4-5 | High-risk endpoints secured |
| Phase 4 | Day 6-7 | All remaining endpoints secured |
| Phase 5 | Day 8 | Testing, validation, and documentation |

## Dependencies

### Technical Dependencies

- Existing authentication system (`getUnifiedAuthUser`)
- Database schema for workspace membership
- JWT token infrastructure
- Error handling utilities

### External Dependencies

- Security review and approval
- Testing environment setup
- Performance monitoring tools
- Documentation updates

## Success Metrics

### Security Metrics

- **Authentication Coverage**: 100% of API endpoints protected
- **Vulnerability Reduction**: 0 critical security vulnerabilities
- **Access Control**: 100% workspace access validation
- **Error Handling**: Consistent error responses across all endpoints

### Performance Metrics

- **Authentication Latency**: < 50ms per request
- **Cache Hit Rate**: > 80% for workspace validation
- **Error Rate**: < 1% for authentication failures
- **Response Time**: No degradation in API response times

### Quality Metrics

- **Test Coverage**: 100% for authentication logic
- **Security Tests**: All endpoints tested with invalid tokens
- **Documentation**: Complete security documentation
- **Code Review**: 100% of changes reviewed and approved

## Conclusion

This PRD addresses critical security vulnerabilities in the Adrata API system by implementing comprehensive authentication and authorization controls. The solution ensures enterprise-grade security while maintaining system performance and user experience.

The implementation plan provides a structured approach to fixing all security issues while minimizing risk and ensuring thorough testing and validation.
