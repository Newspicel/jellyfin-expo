# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform Jellyfin media client built with:
- **Expo** (~54) with React Native TV support
- **expo-router** for file-based navigation
- **@hey-api/openapi-ts** for auto-generated API types and React Query hooks
- **Zustand** for state management with expo-secure-store persistence
- **react-native-video** for media playback

Target platforms: iOS, Android, Apple TV, Android TV, macOS, Windows

## Workflow

When asked to work on this project, follow this process:

### 1. Pick ONE Task

Read `PLAN.md` and select the **single most important uncompleted task** (marked with `- [ ]`).

Priority order:
1. Tasks blocking other tasks
2. Core functionality (auth, playback)
3. UI/polish items

### 2. Implement It

- Write clean, typed TypeScript
- Follow existing patterns in the codebase
- Use the generated API hooks from `api/generated/@tanstack/react-query.gen.ts`
- Use Zustand stores for state (`stores/`)
- Platform-specific files use `.tv.tsx` suffix for TV variants

### 3. Verify

```bash
bun run lint        # Must pass with no errors
bunx tsc --noEmit   # Must compile cleanly
```

### 4. Mark Complete

Update `PLAN.md` and change `- [ ]` to `- [x]` for the completed task.

### 5. Stop

Do NOT continue to the next task. Wait for user confirmation.

## Key Files

| File | Purpose |
|------|---------|
| `PLAN.md` | Master checklist - all tasks live here |
| `jellyfin-openapi-stable.json` | OpenAPI spec (do not edit) |
| `api/generated/` | Auto-generated types and hooks (do not edit) |
| `api/client.ts` | API client with auth interceptors |
| `stores/auth.store.ts` | Authentication state |
| `stores/server.store.ts` | Multi-server management |
| `app/_layout.tsx` | Root layout with providers |
| `app/(auth)/` | Login/server selection screens |
| `app/(tabs)/` | Main app screens |
| `app/(player)/` | Video player |

## Commands

```bash
bun install              # Install dependencies
bun run generate:api     # Regenerate API from OpenAPI spec
bun run lint             # Run ESLint
bun run start            # Start Expo dev server
bun run prebuild         # Generate native projects (mobile)
bun run prebuild:tv      # Generate native projects (TV)
```

## Code Patterns

### Using Generated API Hooks

```typescript
import { useGetItems } from '@/api/generated/@tanstack/react-query.gen';

function MyComponent() {
  const { data, isLoading } = useGetItems({
    query: {
      parentId: libraryId,
      includeItemTypes: ['Movie'],
    },
  });
}
```

### Using Stores

```typescript
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';

// In component
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const currentServer = useServerStore((s) => s.getCurrentServer());

// Outside component (for API client, etc.)
const credentials = useAuthStore.getState().getCredentials(serverId);
```

### Platform-Specific Components

```
components/media/
├── poster-card.tsx      # Default (mobile)
└── poster-card.tv.tsx   # TV variant with focus states
```

React Native automatically picks `.tv.tsx` on TV platforms.

### Navigation

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/(tabs)');           // Navigate
router.replace('/(auth)/login');  // Replace (no back)
router.back();                    // Go back
```

## Architecture

### Image URLs

Use the utilities in `lib/images.ts` for all image URLs:

```typescript
import { getPrimaryImageUrl, getBackdropImageUrl } from '@/lib/images';

const posterUrl = getPrimaryImageUrl(item, width * 2); // 2x for retina
const backdropUrl = getBackdropImageUrl(item);
```

### Theming System

The `theme/` directory provides a unified styling system:

```typescript
import { useTheme, useColors, useIsDark } from '@/theme';
import { spacing, radii, typography } from '@/theme';

// In components
const { colors, isDark } = useTheme();
const backgroundColor = colors.background.primary;
const padding = spacing.md; // 16px
```

Platform detection is in `theme/platform.ts`:

```typescript
import { isTV, isIOS, isAndroid, isIOSLiquidGlassSupported } from '@/theme';
```

### Request Interceptors

The API client (`api/client.ts`) automatically:
- Prepends the current server URL from `useServerStore`
- Adds MediaBrowser authorization headers with device info
- Handles 401 responses by clearing credentials

Initialize once at app startup:
```typescript
await initializeApiClient();
configureApiClient();
```

## Don'ts

- Don't edit files in `api/generated/` - they're auto-generated
- Don't implement multiple tasks at once
- Don't skip the lint/typecheck verification
- Don't use `npm` - use `bun` instead
- Don't create new patterns when existing ones work
- Don't hardcode server URLs or auth tokens - use stores
- Don't build image URLs manually - use `lib/images.ts`
