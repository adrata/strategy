# Role Types in Adrata

## Workspace Roles (UserRole Enum)

The system uses a hierarchical role-based access control (RBAC) system with the following workspace roles:

### 1. SUPER_ADMIN
- **Highest level of access**
- Full system-wide access across all workspaces
- Can manage all users, workspaces, and system settings
- Typically reserved for platform administrators

### 2. WORKSPACE_ADMIN
- **Workspace-level administrator**
- Full control within a specific workspace
- Can manage users, settings, and data within their workspace
- Cannot access other workspaces unless explicitly granted

### 3. MANAGER
- **Management role**
- Can view and manage team members' data
- Typically used for sales managers who oversee a team of sellers
- Can assign records, view reports, and manage team activities

### 4. SELLER
- **Primary sales role**
- Can create, update, and manage companies and people
- Assigned as main seller for accounts
- Can manage actions and activities
- Standard role for sales representatives

### 5. VIEWER
- **Read-only access**
- Can view data but cannot create or modify records
- Useful for stakeholders who need visibility without edit access
- Default role for new workspace members

## RBAC System

In addition to workspace roles, the system includes a granular RBAC system with:

- **Roles**: Custom roles defined in the `roles` table
- **Permissions**: Granular permissions defined in the `permissions` table
- **Role-Permission Mappings**: Links roles to specific permissions
- **User-Role Assignments**: Assigns custom roles to users (can be workspace-specific)

## Permission Types

The system includes permissions for:
- Workspace management (CREATE, UPDATE, DELETE, VIEW)
- User management (CREATE, UPDATE, DELETE, VIEW)
- Company management (CREATE, UPDATE, DELETE, VIEW)
- Person management (CREATE, UPDATE, DELETE, VIEW)
- Action management (CREATE, UPDATE, DELETE, VIEW)
- Audit access (VIEW, EXPORT)
- Feature access (OASIS, STACKS, WORKSHOP, REVENUEOS, METRICS, CHRONICLE, DESKTOP_DOWNLOAD)

## Current Role Assignment

Justin Johnson currently has:
- **Workspace Role**: SELLER (in CloudCaddie workspace)
- This is the standard role for sales representatives managing accounts

