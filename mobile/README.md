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
mobile/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Entry point
│   ├── auth/              # Authentication screens
│   └── (tabs)/            # Tab navigation (main app)
├── lib/                    # Utilities and services
│   ├── platform-detection.ts
│   └── api-client.ts
└── ...
```

## API Integration

The mobile app connects to the same Next.js API routes as the web/desktop app:
- Base URL: `https://action.adrata.com` (or configured via `EXPO_PUBLIC_API_URL`)
- All `/api/v1/*` endpoints are available

## Authentication

Uses JWT tokens stored securely via `expo-secure-store`. Tokens are automatically included in API requests.

## Environment Variables

Create `.env` or `.env.local`:
```
EXPO_PUBLIC_API_URL=https://action.adrata.com
```

