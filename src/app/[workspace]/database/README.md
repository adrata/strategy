# Database GUI Application

A comprehensive database management interface for the Adrata platform, providing developers and data teams with powerful tools to explore, query, and manage workspace database tables.

## Features

### 🗄️ **Table Browser**
- Grid view of all database tables with metadata
- Categorized by type (Core, Auth, Activity, Products)
- Search and filter capabilities
- Table statistics (row count, columns, relationships)

### 📊 **Data Grid**
- Paginated table data display (50 rows per page)
- Inline editing for records (double-click cell)
- Add new records with form modal
- Delete with confirmation
- Export to CSV/JSON
- Column sorting and filtering
- Search across visible columns

### 🏗️ **Schema Explorer**
- Display all columns with types, constraints, and relationships
- Show indexes and constraints
- Foreign key relationships visualization
- Prisma model preview

### 🔍 **Query Console**
- Visual query builder for non-technical users
- Raw SQL editor with syntax highlighting
- Query history (stored per workspace)
- Saved queries library
- Query execution with results grid
- Query performance metrics

### 🔗 **Relationship Viewer**
- Interactive ER diagram showing table relationships
- Click to navigate between tables
- Highlight related tables on hover

### ✏️ **Data Operations**
- **Create**: Modal form with field validation
- **Read**: Paginated grid with search/filter
- **Update**: Inline editing or modal form
- **Delete**: Soft delete aware (check for deletedAt column)
- **Bulk Operations**: Select multiple rows for batch updates/deletes

## Security & Permissions

### Workspace Isolation
- All queries filtered by workspaceId
- Users can only access data from their assigned workspace

### Role-Based Access Control
- **VIEWER**: Read-only access
- **SELLER/MANAGER**: Read + write their assigned data
- **WORKSPACE_ADMIN**: Full access to workspace data
- **SUPER_ADMIN**: Full access including raw SQL

### Security Features
- SQL injection protection via Prisma client
- Parameterized queries only
- Audit logging for all modifications
- Rate limiting on query endpoint
- Input validation and sanitization

## API Endpoints

### Tables
- `GET /api/database/tables` - List all tables with metadata
- `GET /api/database/tables/[tableName]` - Get table schema
- `GET /api/database/tables/[tableName]/data` - Get paginated table data

### Operations
- `POST /api/database/query` - Execute SQL queries (SELECT only)
- `POST /api/database/record` - Create new record
- `PATCH /api/database/record` - Update existing record
- `DELETE /api/database/record` - Delete record

### Statistics
- `GET /api/database/stats` - Get database statistics

## Usage

### Accessing the Database GUI
1. Navigate to `/[workspace]/database` in your browser
2. The interface will load with your workspace's database tables
3. Use the left panel to navigate between different views

### Browsing Tables
1. Click on any table in the left panel or main grid
2. View table data, schema, and relationships in tabs
3. Use search and filters to find specific data

### Running Queries
1. Switch to "Query Console" in the left panel
2. Enter your SQL query in the editor
3. Press Cmd+Enter to execute
4. View results in the results panel

### Editing Data
1. Click on any table to view its data
2. Double-click a cell to edit inline
3. Use the "Add Record" button to create new records
4. Select multiple rows for bulk operations

## Keyboard Shortcuts

- `Cmd+K` - Focus search
- `Cmd+Enter` - Execute query (in Query Console)
- `Escape` - Close modals/panels
- `Cmd+E` - Export data

## Technical Implementation

### Database Connection
- Uses singleton Prisma client from `src/platform/database/prisma-client.ts`
- Connection pooling handled by Prisma
- Query timeout: 30 seconds

### Schema Introspection
- Parses Prisma schema to get full table structure
- Uses Prisma DMMF for programmatic access
- Caches schema information for performance

### State Management
- React Context for selected table/record state
- Local storage for UI preferences
- Session state for query history

### Performance Optimizations
- Virtual scrolling for large result sets
- Debounced search/filter inputs
- Lazy loading for relationship data
- Query result caching (5-minute TTL)
- Progressive loading for table list

## File Structure

```
src/app/[workspace]/database/
├── layout.tsx                 # Main layout with providers
├── page.tsx                   # Main database browser
├── types.ts                   # TypeScript definitions
├── components/
│   ├── DatabaseLeftPanel.tsx  # Navigation panel
│   ├── TableBrowser.tsx       # Grid view of tables
│   ├── TableDetail.tsx        # Individual table view
│   ├── DataGrid.tsx           # Editable data grid
│   ├── QueryConsole.tsx       # SQL editor
│   ├── SchemaViewer.tsx       # Schema display
│   ├── RelationshipDiagram.tsx # ER diagram
│   ├── RecordModal.tsx        # Create/edit modal
│   └── DatabaseStats.tsx      # Statistics display
└── README.md                  # This file

src/app/api/database/
├── tables/
│   ├── route.ts               # Tables list API
│   └── [tableName]/
│       ├── route.ts           # Table schema API
│       └── data/route.ts      # Table data API
├── query/route.ts             # Query execution API
├── record/route.ts            # CRUD operations API
└── stats/route.ts             # Statistics API
```

## Development

### Adding New Features
1. Create new components in the `components/` directory
2. Add corresponding API endpoints in `src/app/api/database/`
3. Update types in `types.ts` as needed
4. Follow the existing patterns for state management and error handling

### Testing
- All API endpoints include proper error handling
- Components include loading states and error boundaries
- Input validation on both client and server side

### Performance Considerations
- Large tables are paginated by default
- Search is debounced to prevent excessive API calls
- Schema information is cached to reduce database queries
- Virtual scrolling for tables with many columns

## Troubleshooting

### Common Issues

**"Access denied" errors**
- Check user permissions and workspace membership
- Ensure user has appropriate role for the operation

**Query execution fails**
- Verify query syntax and permissions
- Check if query contains forbidden keywords
- Ensure workspace isolation is maintained

**Slow performance**
- Check database indexes on frequently queried columns
- Consider reducing page size for large tables
- Monitor query execution times in the console

**Data not loading**
- Check network connectivity
- Verify workspace ID is correct
- Check browser console for JavaScript errors

## Future Enhancements

- [ ] Visual ER diagram with drag-and-drop
- [ ] Advanced query builder with visual interface
- [ ] Data export in multiple formats (Excel, PDF)
- [ ] Real-time data updates with WebSocket
- [ ] Query performance analysis and optimization suggestions
- [ ] Database backup and restore functionality
- [ ] Custom dashboard creation
- [ ] Advanced filtering and search capabilities
- [ ] Data validation rules and constraints
- [ ] Audit trail visualization
