# Adrata Mobile Source Code

This directory contains the source code for the Adrata React Native Expo mobile application.

## Structure

```
src-mobile/
├── app/              # Expo Router app directory (routes/screens)
│   ├── _layout.tsx   # Root layout
│   ├── index.tsx     # Entry screen
│   ├── auth/         # Authentication screens
│   └── (tabs)/       # Tab navigation
├── lib/              # Utilities and services
│   ├── api-client.ts # API client for backend communication
│   └── platform-detection.ts
└── index.ts          # Entry point for Expo Router
```

## Platform Structure

The codebase is organized with clear platform separation:

- `src/` - Next.js web application
- `src-desktop/` - Tauri desktop application (formerly src-tauri)
- `src-mobile/` - React Native Expo mobile application (this directory)
- `mobile/` - Expo project configuration (app.json, package.json, assets)

## Development

The mobile app runs from the `mobile/` directory using Expo:

```bash
# From root
npm run dev:mobile

# Or from mobile directory
cd mobile
expo start
```

