# Adrata Source Code Documentation

This document provides a complete overview of the `src/` directory structure, explaining every folder and file's purpose and connections to other documentation.

## 📁 Root Files

- **`.DS_Store`** - macOS system file for folder view settings (8KB)
- **`middleware.ts`** - Next.js middleware for authentication, routing, and platform detection (19KB, 666 lines)

## 🎯 App Directory (`app/`)
Next.js 15 App Router pages and API routes following the new app directory structure.

### Core App Files
- **`layout.tsx`** - Root application layout with metadata and global structure (4.2KB)
- **`page.tsx`** - Home page component with platform overview (2.6KB)
- **`globals.css`** - Global CSS styles including Tailwind, animations, and theme variables (12KB)
- **`favicon.ico`** - Application favicon (25KB)
- **`error.tsx`** - Global error boundary component (2.7KB)
- **`global-error.tsx`** - Root error boundary for unhandled errors (2.5KB)
- **`not-found.tsx`** - Custom 404 page component (1.6KB)

### Application Pages
- **`academy/`** - Academy learning platform page
- **`aos/`** - Acquisition Operating System main application page
- **`auth/`** - Authentication pages and components
- **`battleground/`** - Competitive intelligence application page
- **`grand-central/`** - Integration hub and data management page
- **`speedrun/`** - Speedrun communication and outreach platform page
- **`monaco/`** - Monaco prospecting intelligence application page
- **`oasis/`** - Oasis workspace management application page
- **`onboarding/`** - User onboarding flow pages
- **`paper/`** - Paper note-taking application page
- **`pipeline/`** - Pipeline CRM application page
- **`reports/`** - Analytics and reporting pages
- **`store/`** - Application marketplace and extensions
- **`tower/`** - Tower executive dashboard page
- **`win/`** - Win collaborative workspace page
- **`(website)/`** - Marketing website pages (grouped route)

### API Routes (`api/`)
Backend API endpoints following RESTful conventions.

## 🛠️ Platform Directory (`platform/`)
Core platform infrastructure, shared services, and architectural components.

### Platform Documentation
- **`README.md`** - Platform architecture overview and module documentation (8.1KB)

### Core Platform Files
- **`config.ts`** - Central configuration for applications, features, and environment settings (4.2KB)
- **`index.ts`** - Platform entry point and main exports (2.0KB)
- **`types.ts`** - Core TypeScript type definitions (4.0KB)
- **`utils.ts`** - Shared utility functions (1.4KB)
- **`session.ts`** - Session management utilities (137B)
- **`workspace.ts`** - Workspace context and management (457B)
- **`prisma.ts`** - Prisma database client configuration (284B)

### Authentication & Security
- **`auth-unified.ts`** - Unified authentication system across web/desktop/mobile (1.6KB)
- **`auth-fetch.ts`** - Authenticated API request utilities (2.1KB)
- **`api-auth.ts`** - API authentication middleware (2.4KB)
- **`desktop-auth-bypass.ts`** - Desktop authentication bypass for development (1.6KB)
- **`auth/`** - Authentication components and services

### Platform Detection & Environment
- **`platform-detection.ts`** - Multi-platform detection and feature flags (12KB)
- **`desktop-env-check.ts`** - Desktop environment validation and diagnostics (9.3KB)
- **`desktop-error-logger.ts`** - Desktop error logging and crash reporting (6.8KB)

### Data Management
- **`data-service.ts`** - Core data service layer with caching and sync (14KB)
- **`dal.ts`** - Data Access Layer abstraction (3.0KB)
- **`unified-storage.ts`** - Cross-platform storage abstraction (6.8KB)
- **`safe-storage.ts`** - Secure storage utilities (3.5KB)
- **`safe-api-fetch.ts`** - Safe API fetching with error handling (1.1KB)
- **`unified-api-service.ts`** - Unified API service layer (12KB)
- **`api-utils.ts`** - API utility functions (804B)
- **`data/`** - Data schemas and configurations
- **`database/`** - Database utilities and migrations

### Real-time & Communication
- **`pusher.ts`** - Pusher real-time communication setup (1.8KB)
- **`debug-pusher.ts`** - Pusher debugging utilities (2.8KB)
- **`typing.ts`** - Real-time typing indicators (718B)
- **`typing-users.ts`** - User typing state management (1.1KB)

### Desktop Integration
- **`window-manager.ts`** - Desktop window management (4.1KB)
- **`desktop-updater.ts`** - Auto-update functionality for desktop apps (6.2KB)
- **`test-utils.tsx`** - Testing utilities and helpers (869B)
- **`desktop/`** - Desktop-specific utilities and integrations

### Platform Modules
- **`action-platform.ts`** - Action Platform core functionality and routing (7.2KB)
- **`ai/`** - AI services, intelligence systems, and ML capabilities
- **`apps/`** - Individual application modules and configurations
- **`enterprise/`** - Enterprise features and provisioning
- **`grand-central/`** - Integration hub and data synchronization
- **`hooks/`** - Shared React hooks and state management
- **`keyboard-shortcuts/`** - Global keyboard shortcuts and navigation
- **`speedrun/`** - Speedrun communication platform core
- **`menu/`** - Application menus and navigation
- **`monaco-pipeline/`** - Monaco-Pipeline integration layer
- **`reports/`** - Reporting engine and analytics
- **`services/`** - Business logic services and external integrations
- **`shared/`** - Shared components and utilities
- **`ui/`** - UI component library and design system
- **`utils/`** - Utility functions and helpers
- **`web/`** - Web-specific platform features

## 🚀 Products Directory (`products/`)
Individual product applications and their specific implementations.

### Product Documentation
- **`index.tsx`** - Product registry and routing configuration (16KB)
- **`types.ts`** - Product-specific type definitions (659B)

### Individual Products
- **`academy/`** - Learning and training platform - *See: Academy product documentation*
- **`auth/`** - Authentication and user management product
- **`battleground/`** - Competitive intelligence and market analysis - *See: Battleground product docs*
- **`data-analytics/`** - Data analytics and business intelligence platform
- **`demo/`** - Demo environments and sample data
- **`grand-central/`** - Integration hub and data management - *See: Grand Central documentation*
- **`monaco/`** - Prospecting intelligence and lead research - *See: `products/monaco/README.md`*
- **`oasis/`** - Workspace management and productivity - *See: `products/oasis/README.md`*
- **`paper/`** - Note-taking and documentation platform
- **`people/`** - Contact and relationship management
- **`pipeline/`** - CRM and sales pipeline management
- **`recruit/`** - Recruiting and talent acquisition platform
- **`reports/`** - Analytics and reporting dashboards
- **`research/`** - Market research and intelligence tools
- **`win/`** - Collaborative workspace and team coordination

## ☁️ Clouds Directory (`clouds/`)
Multi-cloud deployment configurations and environment management.

### Cloud Infrastructure
- **`CloudManager.ts`** - Multi-cloud deployment and orchestration manager (18KB)
- **`index.ts`** - Cloud services entry point and configuration (3.3KB)
- **`types.ts`** - Cloud infrastructure type definitions (10KB)

### Cloud Categories
- **`enterprise/`** - Enterprise cloud configurations and compliance
- **`geography/`** - Geographic deployment regions and data sovereignty
- **`industry/`** - Industry-specific cloud configurations
- **`vertical/`** - Vertical market deployment templates

## 🧪 Tests Directory (`__tests__/`)
Test suites and testing documentation.

### Testing Documentation
- **`README.md`** - Testing strategy, patterns, and execution guide (10KB)

## 📚 Documentation Connections

### Primary Documentation
- **Platform Architecture**: `platform/README.md` - Core platform documentation
- **Testing Guide**: `__tests__/README.md` - Testing strategies and patterns
- **Product Guides**: 
  - Monaco: `products/monaco/README.md`
  - Oasis: `products/oasis/README.md`

### External Documentation
- **Deployment**: `docs/` - Deployment guides and infrastructure documentation
- **API Reference**: Generated from code comments and schemas
- **User Guides**: Product-specific documentation in respective product directories

### Configuration Files
- **TypeScript**: `tsconfig.json` - TypeScript configuration
- **Next.js**: `next.config.mjs` - Next.js build and runtime configuration
- **Tailwind**: `tailwind.config.ts` - UI styling configuration
- **Prisma**: `prisma/schema.prisma` - Database schema and models

## 🏗️ Architecture Overview

The `src/` directory follows a modular architecture:

1. **`app/`** - Next.js App Router for routing and pages
2. **`platform/`** - Shared infrastructure and services
3. **`products/`** - Individual product implementations
4. **`clouds/`** - Deployment and infrastructure management
5. **`__tests__/`** - Testing suites and quality assurance

This structure enables:
- **Modular Development**: Each product can be developed independently
- **Shared Infrastructure**: Common services and utilities in platform
- **Scalable Deployment**: Cloud-specific configurations
- **Quality Assurance**: Comprehensive testing coverage

For specific implementation details, refer to the README files in each major directory and the individual product documentation. 