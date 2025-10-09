# Cursor Project Rules

This directory contains the modern Cursor project rules for the Adrata project, following 2025 best practices. The old `.cursorrules` file has been deprecated in favor of this structured approach.

## Rule Files Overview

### Core Development Rules
- **`typescript-standards.mdc`** - TypeScript coding standards and best practices
- **`react-nextjs-standards.mdc`** - React and Next.js development standards
- **`database-prisma-standards.mdc`** - Database and Prisma ORM standards
- **`testing-standards.mdc`** - Testing standards and best practices
- **`security-standards.mdc`** - Security standards and best practices
- **`performance-standards.mdc`** - Performance optimization standards
- **`ai-assistant-behavior.mdc`** - AI assistant behavior and interaction guidelines

### Specialized Rules
- **`api-development.mdc`** - API development standards (auto-attached to API files)
- **`mobile-desktop-standards.mdc`** - Mobile and desktop development standards
- **`ai-integration.mdc`** - AI integration and LLM usage standards

## Rule Types

### Always Applied Rules
Rules with `alwaysApply: true` are included in all AI contexts:
- TypeScript Standards
- React & Next.js Standards
- Database & Prisma Standards
- Testing Standards
- Security Standards
- Performance Standards
- AI Assistant Behavior

### Auto-Attached Rules
Rules with `alwaysApply: false` and specific `globs` patterns are automatically included when working with matching files:
- API Development (applies to `src/app/api/**/*.ts` and `src/platform/api/**/*.ts`)
- Mobile & Desktop Standards (applies to Tauri and Capacitor files)
- AI Integration (applies to AI-related files)

## Usage

These rules are automatically applied by Cursor based on the file patterns and settings defined in each rule file. You can also manually reference specific rules using `@ruleName` in your conversations with the AI assistant.

## Maintenance

- Keep rules focused and under 500 lines each
- Update rules as the project evolves
- Add new rules for new technologies or patterns
- Remove obsolete rules when no longer relevant
- Version control all rule changes

## Migration from .cursorrules

The old `.cursorrules` file has been replaced with this structured approach that provides:
- Better organization and maintainability
- More granular control over when rules are applied
- Better integration with the codebase
- Improved performance through targeted rule application
