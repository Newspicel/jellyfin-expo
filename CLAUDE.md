# Claude Instructions for Jellyfin Expo

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

## Don'ts

- Don't edit files in `api/generated/` - they're auto-generated
- Don't implement multiple tasks at once
- Don't skip the lint/typecheck verification
- Don't use `npm` - use `bun` instead
- Don't create new patterns when existing ones work
