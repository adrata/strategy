# Adrata Mobile App

React Native Expo mobile application for Adrata platform.

## Setup

```bash
# Install dependencies (from root)
npm install

# Start development server
npm run dev:mobile

# Or from mobile directory
cd mobile
expo start
```

## Development

- **iOS**: `expo start --ios` or use Expo Go app
- **Android**: `expo start --android` or use Expo Go app
- **Web**: `expo start --web` (for testing)

## Project Structure

```
mobile/                      # Expo project configuration
├── app.json                # Expo configuration
├── package.json            # Dependencies and scripts
├── babel.config.js         # Babel config (NativeWind support)
├── metro.config.js         # Metro bundler config
├── tailwind.config.js      # Tailwind/NativeWind config
├── jest.config.js          # Jest testing config
└── assets/                 # App icons and splash screens

src-mobile/                 # Source code (actual app code)
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Entry point
│   ├── auth/              # Authentication screens
│   └── (tabs)/            # Tab navigation (main app)
├── lib/                    # Utilities and services
│   ├── platform-detection.ts
│   └── api-client.ts
├── components/            # Reusable components
│   └── ErrorBoundary.tsx  # Error boundary component
└── global.css             # NativeWind global styles
```

## Testing

```bash
# Run tests from mobile directory
cd mobile
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# CI mode
npm run test:ci
```

## Code Quality

```bash
# Lint code
cd mobile
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

## Building for Production

```bash
# Build for iOS
npm run build:mobile:ios

# Build for Android
npm run build:mobile:android

# Or use EAS directly
cd mobile
eas build --platform ios
eas build --platform android
```

## API Integration

The mobile app connects to the same Next.js API routes as the web/desktop app:
- Base URL: `https://action.adrata.com` (or configured via `EXPO_PUBLIC_API_URL`)
- All `/api/v1/*` endpoints are available

## Authentication

Uses JWT tokens stored securely via `expo-secure-store`. Tokens are automatically included in API requests.

## Environment Variables

Create `.env` or `.env.local` in the `mobile/` directory:
```
EXPO_PUBLIC_API_URL=https://action.adrata.com
```

See `.env.example` for reference.

## Styling

This app uses **NativeWind** (Tailwind CSS for React Native) for styling. All components use `className` props instead of `StyleSheet.create()`.

Example:
```tsx
<View className="flex-1 justify-center items-center p-6 bg-white">
  <Text className="text-2xl font-bold text-black">Hello</Text>
</View>
```

## Error Handling

The app includes an `ErrorBoundary` component that catches JavaScript errors. In production, consider integrating Sentry or similar crash reporting service.

## Architecture

- **State Management**: Zustand for global state, TanStack Query for server state
- **Forms**: react-hook-form with Zod validation
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS)
- **Testing**: Jest + React Native Testing Library

