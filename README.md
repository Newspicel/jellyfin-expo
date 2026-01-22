# Jellyfin Expo

A modern, cross-platform Jellyfin media client built with Expo and React Native.

## Platforms

- iOS & iPadOS
- Android (Phone & Tablet)
- Apple TV (tvOS)
- Android TV
- macOS
- Windows

## Features

### Implemented

- **Multi-server support** - Connect to multiple Jellyfin servers and switch between them
- **Authentication** - Username/password login and Quick Connect
- **Home screen** - Continue Watching, Next Up, and Latest content rows
- **Library browsing** - Browse your media libraries with poster grids
- **Search** - Find movies, shows, and other content
- **Media details** - View movie, series, season, and episode information
- **Secure storage** - Credentials stored securely using expo-secure-store
- **iOS Liquid Glass** - Native iOS 26+ glassmorphism effects with fallbacks
- **TV navigation** - Drawer-based navigation optimized for TV remotes

### In Progress

- Video playback with react-native-video
- Subtitle and audio track selection
- Progress reporting and resume functionality
- Music library and audio player
- Live TV and DVR
- Offline downloads
- SyncPlay (watch together)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Expo](https://expo.dev) ~54 | Framework and build tooling |
| [expo-router](https://docs.expo.dev/router/introduction/) | File-based navigation |
| [React Native](https://reactnative.dev) 0.81 | Cross-platform UI |
| [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos) | TV platform support |
| [@hey-api/openapi-ts](https://heyapi.dev) | API type generation |
| [TanStack Query](https://tanstack.com/query) | Data fetching and caching |
| [Zustand](https://zustand-demo.pmnd.rs) | State management |
| [react-native-video](https://thewidlarzgroup.github.io/react-native-video/) | Media playback |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js
- [Xcode](https://developer.apple.com/xcode/) (for iOS/tvOS)
- [Android Studio](https://developer.android.com/studio) (for Android/Android TV)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/jellyfin-expo.git
cd jellyfin-expo

# Install dependencies
bun install

# Generate API types from OpenAPI spec
bun run generate:api
```

### Development

```bash
# Start the Expo dev server
bun run start

# iOS
bun run ios

# Android
bun run android
```

### Building for TV

TV platforms require a separate prebuild step:

```bash
# Generate native projects for TV
bun run prebuild:tv

# Start dev server (same command for all platforms)
bun run start
```

### All Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run start` | Start Expo dev server |
| `bun run ios` | Run on iOS Simulator |
| `bun run android` | Run on Android Emulator |
| `bun run prebuild` | Generate native projects (mobile) |
| `bun run prebuild:tv` | Generate native projects (TV) |
| `bun run generate:api` | Regenerate API types from OpenAPI spec |
| `bun run lint` | Run ESLint |

## Project Structure

```
jellyfin-expo/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login and server selection
│   ├── (tabs)/             # Main tab navigation
│   │   ├── library/        # Library browser
│   │   └── search/         # Search
│   ├── (player)/           # Video player
│   └── item/               # Media detail screens
├── api/
│   ├── generated/          # Auto-generated types & hooks (do not edit)
│   └── client.ts           # API client configuration
├── components/
│   ├── media/              # Poster cards, media rows
│   ├── themed/             # Glass effects, themed components
│   └── ui/                 # Base UI components
├── stores/                 # Zustand state management
├── hooks/                  # Custom React hooks
├── theme/                  # Design tokens and theming
├── lib/                    # Utilities
└── jellyfin-openapi-stable.json  # Jellyfin API spec
```

## Platform-Specific Files

React Native automatically selects platform-specific file variants:

```
component.tsx       # Default (mobile)
component.tv.tsx    # TV platforms (Apple TV, Android TV)
```

## API Generation

This project uses [@hey-api/openapi-ts](https://heyapi.dev) to generate TypeScript types and React Query hooks from the Jellyfin OpenAPI specification.

```bash
# Regenerate after updating jellyfin-openapi-stable.json
bun run generate:api
```

Generated files are in `api/generated/` and should not be edited manually.

## Contributing

1. Read `PLAN.md` for the implementation roadmap
2. Pick an uncompleted task
3. Implement it following existing patterns
4. Ensure `bun run lint` and `bunx tsc --noEmit` pass
5. Submit a pull request

## License

MIT

## Acknowledgments

- [Jellyfin](https://jellyfin.org) - The Free Software Media System
- [Streamyfin](https://github.com/streamyfin/streamyfin) - Reference implementation
