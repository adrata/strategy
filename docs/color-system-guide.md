# Color System Guide

## Overview

The Adrata color system is a unified, theme-driven architecture where CSS variables serve as the single source of truth. All colors flow from theme CSS variables → Tailwind utilities → Components, enabling beautiful pre-made themes with full user customization.

## Architecture

### Color Flow

```
Theme Definition → CSS Variables → Tailwind Config → Components
     ↓                  ↓               ↓              ↓
theme-definitions.ts → var(--color) → bg-background → <div className="bg-background">
```

### Core Principles

1. **Single Source of Truth**: CSS variables defined in themes
2. **Theme-Driven**: All colors update when themes change
3. **Type-Safe**: Full TypeScript support for color access
4. **Consistent**: Unified APIs across all components

## Using Colors in Components

### Tailwind Utilities (Recommended)

With the unified system, you can use Tailwind classes directly:

```tsx
// Background colors
<div className="bg-background">...</div>
<div className="bg-foreground">...</div>
<div className="bg-hover">...</div>

// Text colors
<span className="text-foreground">...</span>
<span className="text-muted">...</span>

// Border colors
<div className="border border-border">...</div>

// Shadcn semantic tokens
<button className="bg-primary text-primary-foreground">...</button>
<div className="bg-destructive text-destructive-foreground">...</div>
```

### CSS Variables (Fallback)

For dynamic values or when Tailwind utilities aren't sufficient:

```tsx
<div style={{ backgroundColor: 'var(--background)' }}>...</div>
<div className="bg-[var(--background)]">...</div>
```

### Color Utilities (For Complex Logic)

Use the color utility functions for dynamic color selection:

```tsx
import { getStatusColorClass, getPriorityColorClass, getCategoryColorClass } from '@/platform/utils/color-utils';

// Status colors
<span className={getStatusColorClass('new')}>New</span>
<span className={getStatusColorClass('qualified')}>Qualified</span>

// Priority colors
<span className={getPriorityColorClass('high')}>High Priority</span>

// Category colors
<div className={getCategoryColorClass('speedrun', 'bg')}>...</div>
```

## Available Colors

### Core Theme Colors

| Tailwind Class | CSS Variable | Description |
|---------------|--------------|-------------|
| `bg-background` | `--background` | Main background color |
| `bg-foreground` | `--foreground` | Main text color |
| `bg-hover` | `--hover` | Hover state background |
| `border-border` | `--border` | Border color |
| `text-muted` | `--muted` | Muted text color |
| `bg-accent` | `--accent` | Accent color |

### Shadcn Semantic Tokens

| Token | Maps To | Usage |
|-------|---------|-------|
| `primary` | `--accent` | Primary actions, buttons |
| `secondary` | `--hover` | Secondary actions |
| `destructive` | `--error` | Destructive actions, errors |
| `muted` | `--muted` | Muted content |
| `accent` | `--accent` | Accent elements |
| `foreground` | `--foreground` | Text color |
| `background` | `--background` | Background color |
| `border` | `--border` | Border color |
| `input` | `--border` | Input borders |
| `ring` | `--focus-ring` | Focus ring color |

All tokens have `-foreground` variants for text colors.

### Status Colors

| Tailwind Class | CSS Variable | Usage |
|----------------|--------------|-------|
| `bg-status-new-bg text-status-new-text` | `--status-new-bg`, `--status-new-text` | New items |
| `bg-status-contacted-bg text-status-contacted-text` | `--status-contacted-bg`, `--status-contacted-text` | Contacted items |
| `bg-status-qualified-bg text-status-qualified-text` | `--status-qualified-bg`, `--status-qualified-text` | Qualified items |
| `bg-status-won-bg text-status-won-text` | `--status-won-bg`, `--status-won-text` | Won deals |
| `bg-status-lost-bg text-status-lost-text` | `--status-lost-bg`, `--status-lost-text` | Lost deals |

Use utility function: `getStatusColorClass(status)`

### Priority Colors

| Tailwind Class | CSS Variable | Usage |
|----------------|--------------|-------|
| `bg-priority-high-bg text-priority-high-text` | `--priority-high-bg`, `--priority-high-text` | High priority |
| `bg-priority-medium-bg text-priority-medium-text` | `--priority-medium-bg`, `--priority-medium-text` | Medium priority |
| `bg-priority-low-bg text-priority-low-text` | `--priority-low-bg`, `--priority-low-text` | Low priority |

Use utility function: `getPriorityColorClass(priority)`

### Status Semantic Colors (Success, Warning, Error, Info)

| Tailwind Class | CSS Variable | Usage |
|----------------|--------------|-------|
| `bg-success-bg text-success-text` | `--success-bg`, `--success-text` | Success states |
| `bg-warning-bg text-warning-text` | `--warning-bg`, `--warning-text` | Warning states |
| `bg-error-bg text-error-text` | `--error-bg`, `--error-text` | Error states |
| `bg-info-bg text-info-text` | `--info-bg`, `--info-text` | Info states |

### Category Colors

Category colors are defined in `src/platform/config/color-palette.ts` and available via:

- **Tailwind**: `bg-category-speedrun-50`, `text-category-leads-800`, etc.
- **Utility Functions**: `getCategoryColorClass(category, type)`
- **Direct Access**: `getCategoryColors(category)` for hex values

Available categories:
- `speedrun` (Emerald)
- `leads` (Orange)
- `prospects` (Blue)
- `opportunities` (Indigo)
- `people` (Violet)
- `companies` (Slate)

## Component Patterns

### Badges

Use the unified Badge component:

```tsx
import { Badge } from '@/platform/shared/components/ui/badge';

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Status Pills

```tsx
import { getStatusColorClass } from '@/platform/utils/color-utils';

<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColorClass('qualified')}`}>
  Qualified
</span>
```

### Priority Indicators

```tsx
import { getPriorityColorClass } from '@/platform/utils/color-utils';

<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColorClass('high')}`}>
  High Priority
</span>
```

### Category Styling

```tsx
import { getCategoryTailwindClasses } from '@/platform/utils/color-utils';

const categoryClasses = getCategoryTailwindClasses('speedrun');
<div className={categoryClasses.bg}>...</div>
```

## Theme Customization

### How Themes Work

1. Themes are defined in `src/platform/ui/themes/theme-definitions.ts`
2. Each theme has a `ThemeColors` object with all color values
3. Theme applier converts these to CSS variables: `background` → `--background`
4. Tailwind config maps CSS variables to utilities
5. Components use Tailwind classes that reference CSS variables

### Creating Custom Themes

1. Add theme definition to `theme-definitions.ts`:

```typescript
{
  id: 'my-theme',
  name: 'My Theme',
  displayName: 'My Custom Theme',
  category: 'light',
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    // ... all other colors
  },
  metadata: {
    contrastRatio: 21,
    accessibility: 'AAA',
    popularityScore: 85,
    description: 'My custom theme',
    tags: ['custom'],
  },
}
```

2. Theme will automatically be available in theme selector
3. All components using Tailwind utilities will update automatically

### User Theme Customization

Users can:
1. Select from 20+ pre-made themes via theme selector
2. Themes update CSS variables in real-time
3. All colors cascade through the unified system

Future: Users may be able to customize individual colors, which will update CSS variables and cascade everywhere.

## Migration Guide

### From Hardcoded Colors

**Before:**
```tsx
<div className="bg-emerald-100 text-emerald-800">...</div>
```

**After:**
```tsx
// Option 1: Use theme colors (recommended)
<div className="bg-status-qualified-bg text-status-qualified-text">...</div>

// Option 2: Use category utilities (for category-specific)
import { getCategoryColorClass } from '@/platform/utils/color-utils';
<div className={getCategoryColorClass('speedrun', 'bg') + ' ' + getCategoryColorClass('speedrun', 'text')}>...</div>
```

### From CSS Variables (Direct)

**Before:**
```tsx
<div className="bg-[var(--background)] text-[var(--foreground)]">...</div>
```

**After:**
```tsx
<div className="bg-background text-foreground">...</div>
```

### From statusUtils

**Before:**
```tsx
import { getStatusColor } from '@/platform/utils/statusUtils';
<span className={getStatusColor('new')}>...</span>
```

**After:**
```tsx
// Option 1: Use statusUtils (still works, now uses unified system)
import { getStatusColor } from '@/platform/utils/statusUtils';
<span className={getStatusColor('new')}>...</span>

// Option 2: Use color-utils directly (preferred)
import { getStatusColorClass } from '@/platform/utils/color-utils';
<span className={getStatusColorClass('new')}>...</span>
```

## Best Practices

1. **Prefer Tailwind Utilities**: Use `bg-background` over `bg-[var(--background)]`
2. **Use Utility Functions**: For dynamic colors, use functions from `color-utils.ts`
3. **Avoid Hardcoded Colors**: Don't use `bg-red-500` directly; use theme colors
4. **Category Colors**: Use category utilities for category-specific styling
5. **Status Colors**: Use `getStatusColorClass()` for status indicators
6. **Priority Colors**: Use `getPriorityColorClass()` for priority indicators

## Troubleshooting

### Colors Not Updating with Theme

1. Check that you're using Tailwind utilities, not hardcoded colors
2. Verify CSS variables are being set (check browser DevTools)
3. Ensure Tailwind config includes the color mapping

### Tailwind Class Not Found

1. Verify the color is defined in `tailwind.config.ts`
2. Check that the CSS variable exists in theme definitions
3. Restart the development server after config changes

### Type Errors

1. Use TypeScript types from `color-utils.ts`
2. Import types: `import type { CategoryType, ColorProperty } from '@/platform/utils/color-utils'`

## API Reference

### Color Utilities

See `src/platform/utils/color-utils.ts` for complete API documentation:

- `getStatusColorClass(status?: string): string`
- `getPriorityColorClass(priority?: string): string`
- `getCategoryColorClass(category: string, type: ColorProperty): string`
- `getCategoryTailwindClasses(category: string)`
- `getBadgeClasses(type, value, options)`

## Summary

The unified color system provides:
- **User Control**: Themes change CSS variables, all colors update automatically
- **Beautiful Presets**: 20+ themes work seamlessly
- **Smart Architecture**: Single source of truth, type-safe, consistent
- **Developer Experience**: Simple APIs, clear patterns, no duplication

For questions or issues, refer to the implementation files or contact the development team.

