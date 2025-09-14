# Monaco

A modular implementation of the Monaco application for intelligent prospecting and customer discovery.

## Architecture

This module follows the same modular pattern as the Action Platform, Speedrun, and Oasis, with clear separation of concerns:

### Components

- **MonacoApp**: Main entry component that wraps everything with providers
- **MonacoContent**: Core content component that handles all Monaco functionality
- Integrates with existing Monaco components: `MonacoContainer`, `MonacoQueryProvider`

### Context

- **MonacoContext**: Manages global state for UI, chat, and user data
- **useMonaco**: Hook to access the context

### Hooks

- **useMonacoActions**: Custom hook for managing chat actions and AI responses

## Usage

```tsx
import { MonacoApp } from "@/features/monaco-app";

export default function MonacoPage() {
  return (
    <ZoomProvider>
      <MonacoApp />
    </ZoomProvider>
  );
}
```

## Features

- ✅ Intelligent prospect search and discovery
- ✅ AI-powered chat assistance
- ✅ Multiple application spaces (Home, Search, Analytics, Sequences, Enrichment, Integrations)
- ✅ Real-time chat with contextual responses
- ✅ Dashboard with metrics and activity tracking
- ✅ Modular architecture for maintainability
- ✅ Context-based state management
- ✅ TypeScript support
- ✅ Consistent UI/UX with other apps

## Application Spaces

1. **Home**: Dashboard overview with metrics and recent activity
2. **Search**: Prospect discovery using MonacoContainer
3. **Analytics**: Performance insights and metrics (placeholder)
4. **Sequences**: Automated outreach campaigns (placeholder)
5. **Enrichment**: Data enhancement and validation (placeholder)
6. **Integrations**: CRM and sales stack connections (placeholder)

## File Structure

```
src/features/monaco-app/
├── components/
│   ├── MonacoApp.tsx
│   └── MonacoContent.tsx
├── context/
│   └── MonacoContext.tsx
├── hooks/
│   └── useMonacoActions.ts
├── index.ts
└── README.md
```

## Integration

This modular Monaco app integrates seamlessly with existing Monaco components:

- Uses `MonacoContainer` for search functionality
- Uses `MonacoQueryProvider` for query management
- Maintains all existing Monaco features while providing better architecture
