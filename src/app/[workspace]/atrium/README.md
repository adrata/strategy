# Atrium - Secure Document Storage & Management

Atrium is a comprehensive document management system built for the Adrata platform, providing secure storage, organization, and collaboration features for all types of documents.

## 🏛️ Overview

Atrium follows the established Grand Central + Speedrun pattern with a three-panel layout:
- **Left Panel**: Navigation, folders, and quick actions
- **Middle Panel**: Document grid/list view with search and filtering
- **Right Panel**: Document details, sharing, and activity

## 📁 Architecture

### Database Schema
- `AtriumDocument` - Core document model with encryption, versioning, and metadata
- `AtriumFolder` - Hierarchical folder structure for organization
- `AtriumShare` - Document sharing with permissions and expiration
- `AtriumVersion` - Version history tracking with diff support
- `AtriumComment` - Collaborative comments and annotations
- `AtriumActivity` - Comprehensive audit log for all document activities

### API Routes
- `/api/atrium/documents` - Document CRUD operations
- `/api/atrium/documents/[id]` - Individual document management
- `/api/atrium/documents/[id]/content` - Document content access
- `/api/atrium/documents/[id]/share` - Sharing functionality
- `/api/atrium/documents/[id]/versions` - Version control
- `/api/atrium/folders` - Folder management
- `/api/atrium/upload` - Secure file upload
- `/api/atrium/download/[id]` - Secure file download
- `/api/atrium/search` - Full-text search and filtering

## 🎯 Document Types

Atrium supports four distinct document types:

### 1. Paper 📄
- Rich text documents for notes, articles, and reports
- Collaborative editing with real-time updates
- Markdown support with live preview
- Template system for consistent formatting

### 2. Pitch 🎯
- Presentation documents for meetings and demos
- Slide-based editor with drag-and-drop components
- Export to PDF and presentation formats
- Speaker notes and timing controls

### 3. Grid 📊
- Spreadsheet functionality for data analysis
- Excel-like formulas and functions
- Data visualization and charts
- Import/export from Excel and CSV

### 4. Code 💻
- Code editor with syntax highlighting
- Support for multiple programming languages
- Git integration for version control
- Code execution and testing capabilities

## 🔐 Security Features

### Encryption
- End-to-end encryption for sensitive documents
- Client-side encryption before upload
- Per-workspace encryption keys
- AES-256 encryption for file content

### Access Control
- Role-based permissions (owner, editor, commenter, viewer)
- Share links with expiration and password protection
- IP whitelisting for sensitive documents
- Audit logging for all document access

### Compliance
- SOC 2 compliance ready
- GDPR and privacy regulation compliance
- Data retention and deletion policies
- Comprehensive audit trails

## 🚀 Key Features

### Organization
- Hierarchical folder structure with drag-and-drop
- Tags and custom metadata for flexible categorization
- Starred/favorited documents for quick access
- Recent documents and activity tracking

### Collaboration
- Real-time collaborative editing for Paper documents
- Comments and annotations on all document types
- @mentions and notifications
- Version history with diff viewing

### Search & Discovery
- Full-text search across all document types
- Advanced filtering by type, owner, date, tags
- Search suggestions and auto-complete
- Content indexing for fast retrieval

### Sharing
- Internal sharing with workspace members
- External sharing with secure links
- Permission levels (view/comment/edit/admin)
- Link expiration and password protection

## 📱 User Interface

### Navigation Tabs
- **My Documents**: Personal documents
- **Shared with Me**: Documents shared by others
- **Recent**: Recently accessed/modified documents
- **Starred**: Favorited documents
- **Trash**: Deleted documents (30-day retention)

### View Modes
- **Grid View**: Card-based layout with document previews
- **List View**: Compact table view with sortable columns

### Quick Actions
- Create new document (Paper/Pitch/Grid/Code)
- Upload files with drag-and-drop
- Create folders for organization
- Search documents with filters

## 🔧 Technical Implementation

### Frontend
- React with TypeScript for type safety
- Tailwind CSS for styling
- React Query for data fetching and caching
- Context API for state management

### Backend
- Next.js API routes for serverless functions
- Prisma ORM for database operations
- PostgreSQL for data storage
- File system storage with encryption

### Real-time Features
- WebSockets for collaborative editing
- Y.js for conflict-free replicated data types
- Pusher for real-time notifications

## 📊 Analytics & Monitoring

### Document Analytics
- View count and download tracking
- Last accessed timestamps
- User engagement metrics
- Storage usage monitoring

### Activity Logging
- Comprehensive audit trail
- User action tracking
- IP address and user agent logging
- Compliance reporting

## 🚀 Getting Started

1. **Access Atrium**: Navigate to `/[workspace]/atrium` in your workspace
2. **Create Documents**: Use the "Create" button to start with any document type
3. **Upload Files**: Drag and drop files or use the upload button
4. **Organize**: Create folders and use tags to organize your documents
5. **Share**: Use the share button to collaborate with team members

## 🔄 Integration Points

### Grand Central
- Import documents from connected cloud storage
- Export to connected services
- Sync with external storage providers

### AI Integration
- Document summarization and analysis
- Smart document classification
- Content extraction and indexing
- Intelligent search suggestions

### Platform Integration
- Attach documents to opportunities in Pipeline
- Reference documents in Oasis chat
- Share documents via Speedrun
- Document templates in Paper

## 📈 Performance

### Optimization
- Lazy loading for large document lists
- Thumbnail caching for quick previews
- Virtual scrolling for performance
- CDN integration for file delivery

### Monitoring
- Document load time tracking
- Search performance metrics
- User experience analytics
- Error tracking and reporting

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis for caching (optional)

### Setup
1. Install dependencies: `npm install`
2. Set up database: `npx prisma migrate dev`
3. Start development server: `npm run dev`
4. Access Atrium at `http://localhost:3000/[workspace]/atrium`

### Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for large datasets

## 📝 Roadmap

### Phase 1 (Current)
- ✅ Core document management
- ✅ Basic sharing and permissions
- ✅ File upload and download
- ✅ Search and filtering

### Phase 2 (Next)
- 🔄 Advanced editors for all document types
- 🔄 Real-time collaborative editing
- 🔄 Version control with diff viewing
- 🔄 Advanced security features

### Phase 3 (Future)
- 📋 AI-powered document analysis
- 📋 Advanced workflow automation
- 📋 Mobile app development
- 📋 Enterprise SSO integration

## 🤝 Contributing

1. Follow the established coding standards
2. Write tests for new features
3. Update documentation
4. Submit pull requests for review

## 📄 License

This project is part of the Adrata platform and follows the same licensing terms.
