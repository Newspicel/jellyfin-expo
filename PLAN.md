# Jellyfin Expo - Complete Implementation Plan

A feature-complete Jellyfin media client for iOS, Android, Apple TV, Android TV, macOS, and Windows using Expo, React Native, and automatic OpenAPI code generation with React Query.

---

## Table of Contents

1. [Phase 0: Project Setup & Foundation](#phase-0-project-setup--foundation)
2. [Phase 1: Authentication & Server Management](#phase-1-authentication--server-management)
3. [Phase 2: Movies & TV Shows](#phase-2-movies--tv-shows)
4. [Phase 3: Video Playback](#phase-3-video-playback)
5. [Phase 4: Audio/Music Library](#phase-4-audiomusic-library)
6. [Phase 5: Live TV & DVR](#phase-5-live-tv--dvr)
7. [Phase 6: Advanced Features](#phase-6-advanced-features)
8. [Phase 7: Platform Polish](#phase-7-platform-polish)

---

## Phase 0: Project Setup & Foundation

### 0.1 TV Platform Support Setup

> Reference: https://docs.expo.dev/guides/building-for-tv/

- [x] Replace `react-native` with TV-compatible version in `package.json`:
  ```json
  "react-native": "npm:react-native-tvos@0.81.5-0"
  ```
- [x] Add exclusion to `package.json`:
  ```json
  "expo": {
    "install": {
      "exclude": ["react-native"]
    }
  }
  ```
- [x] Install TV config plugin:
  ```bash
  bun add -D @react-native-tvos/config-tv
  ```
- [x] Add plugin to `app.json`:
  ```json
  "plugins": ["@react-native-tvos/config-tv"]
  ```
- [x] Configure TV targets in `app.json`:
  ```json
  {
    "expo": {
      "ios": {
        "supportsTablet": true
      },
      "plugins": [
        "@react-native-tvos/config-tv",
        ["expo-router"]
      ]
    }
  }
  ```
- [x] Create prebuild scripts in `package.json`:
  ```json
  "prebuild:tv": "EXPO_TV=1 expo prebuild --clean",
  "prebuild": "expo prebuild --clean"
  ```
- [ ] Run initial TV prebuild: `bun run prebuild:tv`
- [ ] Set up Android TV emulator (API 31+, Android Studio Iguana+)
- [ ] Set up tvOS Simulator (Xcode 16+, tvOS 17+ SDK)

### 0.2 OpenAPI Code Generation

- [x] Install code generation dependencies:
  ```bash
  bun add @hey-api/client-fetch @tanstack/react-query
  bun add -D @hey-api/openapi-ts
  ```
- [x] Create `openapi-ts.config.ts` (in project root):
  ```typescript
  import { defineConfig } from '@hey-api/openapi-ts';

  export default defineConfig({
    input: './jellyfin-openapi-stable.json',
    output: { path: './api/generated', format: 'prettier' },
    plugins: [
      '@hey-api/typescript',
      { name: '@hey-api/client-fetch' },
      { name: '@tanstack/react-query' },
    ],
  });
  ```
- [x] Add generation script to `package.json`:
  ```json
  "generate:api": "openapi-ts"
  ```
- [x] Run code generation: `bun run generate:api`
- [x] Verify `api/generated/` contains types and hooks

### 0.3 State Management Setup

- [x] Install Zustand:
  ```bash
  bun add zustand
  ```
- [x] Install secure storage:
  ```bash
  bun add expo-secure-store
  ```
- [x] Create `stores/` directory structure:
  ```
  stores/
  ├── auth.store.ts
  ├── server.store.ts
  ├── index.ts
  ├── player.store.ts (pending)
  └── settings.store.ts (pending)
  ```
- [x] Implement `stores/auth.store.ts` with:
  - [x] `credentials`, `currentUser`, `isAuthenticated` state
  - [x] `setCredentials()`, `logout()`, `logoutAll()` actions
  - [x] Persistence to expo-secure-store

- [x] Implement `stores/server.store.ts` with:
  - [x] `servers[]`, `currentServerId` state
  - [x] `addServer()`, `removeServer()`, `setCurrentServer()` actions
  - [x] Multi-server persistence

### 0.4 API Client Configuration

- [x] Create `api/client.ts`:
  - [x] Configure base URL from current server via interceptor
  - [x] Add auth header interceptor (MediaBrowser format)
  - [x] Add device info headers (Client, Device, DeviceId, Version)
- [x] Create `lib/device.ts` for device ID generation and info

### 0.5 React Query Provider Setup

- [x] Create `lib/query-client.ts`:
  ```typescript
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
      },
    },
  });
  ```
- [x] Wrap app in QueryClientProvider in `app/_layout.tsx`

### 0.6 Project Structure Creation

- [x] Create directory structure:
  ```
  api/
  ├── generated/
  ├── client.ts
  ├── device-profile.ts (pending)
  └── auth.ts (pending)
  components/
  ├── ui/
  ├── themed/
  ├── media/
  ├── player/
  └── layout/
  stores/
  hooks/
  theme/
  lib/
  config/
  ```

### Verification 0

- [x] `bun run generate:api` completes without errors
- [x] TypeScript compiles without errors
- [ ] App runs on iOS Simulator
- [ ] App runs on Android Emulator
- [ ] App runs on tvOS Simulator
- [ ] App runs on Android TV Emulator

---

## Phase 1: Authentication & Server Management

### 1.1 Auth Route Group

- [x] Create `app/(auth)/_layout.tsx` with stack navigation
- [x] Create `app/(auth)/index.tsx` - Server selection screen:
  - [x] Server URL input field
  - [x] "Connect" button
  - [x] Previously used servers list
  - [x] Server info display after connection
- [x] Create `app/(auth)/login.tsx` - Login screen:
  - [x] Username input
  - [x] Password input
  - [x] "Sign In" button
  - [x] Error handling display
  - [x] "Use Quick Connect" link
- [x] Create `app/(auth)/quick-connect.tsx`:
  - [x] Display Quick Connect code
  - [x] Polling for authorization
  - [x] Success/failure handling

### 1.2 Auth API Integration

- [x] Implement server discovery/validation
- [x] Implement `POST /Users/AuthenticateByName` login
- [x] Implement Quick Connect flow:
  - [x] `POST /QuickConnect/Initiate`
  - [x] `GET /QuickConnect/Connect` polling
- [x] Store credentials securely after login

### 1.3 Auth State & Routing

- [x] Update `app/_layout.tsx`:
  - [x] Check auth state on mount
  - [x] Redirect to `/(auth)` if not authenticated
  - [x] Redirect to `/(tabs)` if authenticated
- [x] Implement auth state hydration from secure storage
- [x] Add logout functionality (in auth store)

### 1.4 Multi-Server Support

- [ ] Server management screen in settings
- [x] Add/remove servers (in store)
- [x] Switch between servers (in store)
- [x] Per-server credential storage

### Verification 1

- [ ] Can enter a Jellyfin server URL
- [ ] Can log in with username/password
- [ ] Can log in with Quick Connect
- [ ] Auth persists across app restarts
- [ ] Can log out and return to login
- [ ] Can manage multiple servers

---

## Phase 2: Movies & TV Shows

### 2.1 Main Tab Navigation

- [x] Update `app/(tabs)/_layout.tsx`:
  - [x] Home tab
  - [x] Library tab
  - [x] Search tab
  - [x] Settings tab
- [x] Create TV layout variant with sidebar navigation:
  ```typescript
  if (Platform.isTV) {
    return <Drawer>...</Drawer>;
  }
  return <Tabs>...</Tabs>;
  ```

### 2.2 Home Screen

- [x] Create `app/(tabs)/index.tsx` with sections:
  - [x] Continue Watching row (resume items)
  - [x] Next Up row (next episodes)
  - [x] Latest Movies row
  - [x] Latest TV Shows row
  - [ ] Recommendations row
- [x] Implement horizontal scrolling rows
- [x] Implement poster cards with:
  - [x] Image loading with expo-image
  - [x] Title overlay
  - [x] Progress bar for in-progress items
  - [ ] TV focus states

### 2.3 Library Browser

- [x] Create `app/(tabs)/library/_layout.tsx`
- [x] Create `app/(tabs)/library/index.tsx`:
  - [x] List all user libraries
  - [x] Library type icons
- [x] Create `app/(tabs)/library/[libraryId].tsx`:
  - [ ] Grid/list view toggle
  - [ ] Sort options (name, date added, release date, etc.)
  - [ ] Filter options (genre, year, etc.)
  - [ ] Pagination/infinite scroll
- [ ] Install and configure FlashList:
  ```bash
  npm install @shopify/flash-list
  ```

### 2.4 Media Components

- [x] Create `components/media/poster-card.tsx`:
  - [x] Image with aspect ratio
  - [x] Title
  - [x] Year/rating
  - [x] Watched indicator
- [ ] Create `components/media/poster-card.tv.tsx`:
  - [ ] Focus scaling animation
  - [ ] Focus border/glow
  - [ ] Parallax effect on focus
- [x] Create `components/media/media-row.tsx`:
  - [x] Horizontal scroll
  - [x] Row title
  - [ ] "See All" link
- [ ] Create `components/media/media-grid.tsx`:
  - [ ] Responsive column count
  - [ ] TV-optimized spacing

### 2.5 Movie Details

- [x] Create `app/item/movie/[id].tsx`:
  - [x] Hero image/backdrop
  - [x] Title, year, runtime
  - [x] Rating (community, critics)
  - [x] Overview/synopsis
  - [x] Genres, studios
  - [x] Cast & crew list
  - [x] Play button
  - [x] Mark watched/unwatched
  - [x] Add to favorites
  - [x] Similar movies row
  - [x] Media info (codec, resolution, etc.)

### 2.6 TV Series Details

- [x] Create `app/item/series/[id].tsx`:
  - [x] Hero backdrop
  - [x] Series title, year range
  - [x] Overview
  - [x] Seasons list/selector
  - [x] Next up episode highlight
  - [x] Cast list
- [x] Create `app/item/season/[id].tsx`:
  - [x] Season info
  - [x] Episode list with thumbnails
  - [x] Episode progress indicators
- [x] Create `app/item/episode/[id].tsx`:
  - [x] Episode thumbnail
  - [x] Title, number, runtime
  - [x] Overview
  - [x] Play button
  - [x] Next/previous episode navigation

### 2.7 Search

- [x] Create `app/(tabs)/search.tsx`:
  - [x] Search input with debounce
  - [ ] Recent searches
  - [x] Search results grid
  - [x] Filter by type (movies, series, episodes, people)
- [ ] Voice search on TV platforms

### Verification 2

- [ ] Home screen shows personalized content
- [ ] Can browse library with filtering/sorting
- [ ] Movie details show all metadata
- [ ] TV series shows seasons and episodes
- [ ] Search returns relevant results
- [ ] All screens work on TV with remote navigation

---

## Phase 3: Video Playback

### 3.1 Video Player Setup

- [x] Install react-native-video:
  ```bash
  npm install react-native-video
  ```
- [ ] Run prebuild to link native modules:
  ```bash
  npm run prebuild:tv
  ```
- [x] Configure iOS permissions in `app.json`:
  ```json
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["audio"]
    }
  }
  ```

### 3.2 Device Profiles

- [x] Create `api/device-profile.ts`:
- [x] Implement iOS/macOS profile:
  - [x] Direct play: H.264, HEVC, AAC, AC3, E-AC3, FLAC, ALAC
  - [x] Containers: MP4, MOV, MKV
  - [x] Subtitles: SRT, VTT, ASS (external), PGS (burn-in)
- [x] Implement tvOS profile:
  - [x] Same as iOS with Dolby Atmos support
- [x] Implement Android profile:
  - [x] Direct play: H.264, HEVC 8-bit, VP9, AV1, AAC, MP3, Opus
  - [x] Containers: MP4, MKV, WebM
- [x] Implement Android TV profile:
  - [x] Same as Android with enhanced audio passthrough
- [x] Implement Windows profile

### 3.3 Playback Info & Stream Selection

- [x] Create `hooks/use-playback.ts`:
  - [x] Fetch playback info with device profile
  - [x] Select best media source
  - [x] Build stream URL based on play method
- [x] Implement stream URL builder:
  - [x] Direct Play: `/Videos/{id}/stream?static=true`
  - [x] Direct Stream: `/Videos/{id}/stream`
  - [x] Transcode: Uses `TranscodingUrl` from server response

### 3.4 Player Screen

- [x] Create `app/(player)/_layout.tsx`:
  - [x] Fullscreen modal presentation
  - [x] Hide status bar
  - [ ] Landscape orientation lock (optional)
- [x] Create `app/(player)/[itemId].tsx`:
  - [x] Fetch playback info on mount
  - [x] Display loading state
  - [x] Initialize video player
  - [x] Handle errors gracefully

### 3.5 Player Components

- [ ] Create `components/player/video-player.tsx`:
  - [ ] react-native-video wrapper
  - [ ] Buffer configuration for streaming
  - [ ] Hardware acceleration enabled
- [ ] Create `components/player/player-controls.tsx`:
  - [ ] Play/pause button
  - [ ] Seek bar with current/total time
  - [ ] Rewind/fast-forward buttons (10s/30s)
  - [ ] Intro-Skip/Ads/End button
  - [ ] Volume control
  - [ ] Fullscreen toggle
  - [ ] Settings button (quality, subtitles, audio)
  - [ ] Auto-hide after inactivity
- [ ] Create `components/player/player-controls.tv.tsx`:
  - [ ] D-pad/remote optimized
  - [ ] Swipe gestures for seek
  - [ ] Play/pause on center button
  - [ ] Back button handling

### 3.6 Subtitle & Audio Selection

- [x] Create `components/player/subtitle-selector.tsx`:
  - [x] List available subtitle tracks
  - [x] Off option
  - [x] External subtitle support
- [x] Create `components/player/audio-selector.tsx`:
  - [x] List available audio tracks
  - [x] Language/codec info display

### 3.7 Progress Reporting

- [x] Create `hooks/use-progress-reporting.ts`:
  - [x] Report progress every 10 seconds
  - [x] Report on pause/resume
  - [x] Report on stop
  - [x] Report play method (DirectPlay/Transcode)
- [x] Implement `POST /Sessions/Playing/Progress`
- [x] Implement `POST /Sessions/Playing/Stopped`

### 3.8 Resume & Next Episode

- [ ] Resume from last position on play
- [ ] Show resume dialog if position > 10%
- [ ] Auto-play next episode option
- [ ] Next episode overlay at end of playback
- [ ] Skip intro button (if intro data available)

### 3.9 Picture-in-Picture

- [ ] Enable PiP on iOS/Android
- [ ] Handle PiP lifecycle events
- [ ] Return to full player on tap

### 3.10 Background Audio

- [ ] Enable background audio playback
- [ ] Lock screen controls
- [ ] Now Playing info for audio content

### Verification 3

- [ ] Video plays with direct play when compatible
- [ ] Video transcodes when needed
- [ ] Subtitles can be selected and displayed
- [ ] Audio tracks can be switched
- [ ] Progress is saved and reported
- [ ] Can resume from last position
- [ ] PiP works on supported platforms
- [ ] TV remote controls work for playback
- [ ] Player controls auto-hide

---

## Phase 4: Audio/Music Library

### 4.1 Music Library Browser

- [ ] Create music library view in library browser:
  - [ ] Artists view
  - [ ] Albums view
  - [ ] Songs view
  - [ ] Playlists view
  - [ ] Genres view
- [ ] Implement artist card component
- [ ] Implement album card component

### 4.2 Artist Details

- [ ] Create `app/item/artist/[id].tsx`:
  - [ ] Artist image/backdrop
  - [ ] Biography
  - [ ] Albums list
  - [ ] Top songs
  - [ ] Similar artists
  - [ ] Play all button

### 4.3 Album Details

- [ ] Create `app/item/album/[id].tsx`:
  - [ ] Album artwork
  - [ ] Album title, artist, year
  - [ ] Track list with durations
  - [ ] Play all / shuffle buttons
  - [ ] Add to playlist

### 4.4 Audio Player UI

- [ ] Create mini player component:
  - [ ] Shows at bottom of screen during playback
  - [ ] Current track info
  - [ ] Play/pause, skip buttons
  - [ ] Tap to expand
- [ ] Create full audio player screen:
  - [ ] Large album artwork
  - [ ] Track info
  - [ ] Progress bar
  - [ ] Play/pause, skip, shuffle, repeat
  - [ ] Volume control
  - [ ] Queue button
  - [ ] Lyrics (if available)

### 4.5 Queue Management

- [ ] Create queue view:
  - [ ] Current queue list
  - [ ] Drag to reorder
  - [ ] Remove from queue
  - [ ] Clear queue
- [ ] Implement queue store in Zustand
- [ ] Play next / add to queue actions

### 4.6 Instant Mix

- [ ] Implement "Instant Mix" for artists/albums
- [ ] Radio-style continuous playback

### 4.7 System Audio Controls

- [ ] Control Center / lock screen controls (iOS)
- [ ] Media notification controls (Android)
- [ ] Bluetooth/headphone controls

### Verification 4

- [ ] Can browse music by artist/album/genre
- [ ] Album plays with track list
- [ ] Mini player shows during playback
- [ ] Queue management works
- [ ] Background audio continues
- [ ] System controls work

---

## Phase 5: Live TV & DVR

### 5.1 Channel List

- [ ] Create `app/(tabs)/live-tv/index.tsx`:
  - [ ] Channel grid/list
  - [ ] Current program info
  - [ ] Channel logos
  - [ ] Favorites section
- [ ] Implement channel card component

### 5.2 Electronic Program Guide (EPG)

- [ ] Create `app/(tabs)/live-tv/guide.tsx`:
  - [ ] Time-based grid layout
  - [ ] Horizontal scrolling by time
  - [ ] Vertical scrolling by channel
  - [ ] Current time indicator
  - [ ] Program details on selection
- [ ] Optimize for large datasets (virtualization)

### 5.3 Live Stream Playback

- [ ] Implement live stream URL building
- [ ] Handle live-specific player controls:
  - [ ] No seek bar (or limited)
  - [ ] Channel up/down
- [ ] Live indicator in player

### 5.4 Program Details

- [ ] Create program detail modal:
  - [ ] Title, description
  - [ ] Air time
  - [ ] Cast
  - [ ] Record button
  - [ ] Series record button

### 5.5 Recordings Browser

- [ ] Create `app/(tabs)/live-tv/recordings.tsx`:
  - [ ] List of recorded programs
  - [ ] Recording status
  - [ ] Play recording
  - [ ] Delete recording
- [ ] Group by series option

### 5.6 Schedule Recording

- [ ] Single recording scheduling
- [ ] Series recording rules
- [ ] Recording conflicts handling
- [ ] Upcoming recordings list

### 5.7 Timer Management

- [ ] View scheduled timers
- [ ] Cancel timers
- [ ] Edit recording rules

### Verification 5

- [ ] Can browse live TV channels
- [ ] EPG displays correctly
- [ ] Live streams play
- [ ] Can schedule recordings
- [ ] Recordings list and play

---

## Phase 6: Advanced Features

### 6.1 SyncPlay (Watch Together)

- [ ] Create SyncPlay UI:
  - [ ] Create/join group
  - [ ] Group member list
  - [ ] Ready/not ready status
  - [ ] Playback sync
- [ ] Implement SyncPlay API:
  - [ ] `/SyncPlay/Join`
  - [ ] `/SyncPlay/Leave`
  - [ ] `/SyncPlay/Ready`
  - [ ] `/SyncPlay/Pause`, `/SyncPlay/Play`
- [ ] Handle sync events via WebSocket/polling

### 6.2 Collections

- [ ] Browse collections
- [ ] Collection detail view
- [ ] Create collection
- [ ] Add/remove items from collection

### 6.3 Playlists

- [ ] Browse playlists
- [ ] Create playlist
- [ ] Add to playlist from any item
- [ ] Edit playlist (reorder, remove)

### 6.4 Offline Downloads

- [ ] Create `stores/downloads.store.ts`
- [ ] Download management UI:
  - [ ] Download button on items
  - [ ] Download progress
  - [ ] Downloaded items list
  - [ ] Storage usage
  - [ ] Delete downloads
- [ ] Implement download with `expo-file-system`
- [ ] Offline playback from local files
- [ ] Sync watch status when online

### 6.5 Advanced Search

- [ ] Filters:
  - [ ] Year range
  - [ ] Genre
  - [ ] Rating
  - [ ] Studio
  - [ ] Person (actor, director)
- [ ] Sort options
- [ ] Save search as dynamic collection

### 6.6 User Preferences

- [ ] Playback settings:
  - [ ] Default audio language
  - [ ] Default subtitle language
  - [ ] Quality preferences
  - [ ] Skip intro preference
- [ ] Display settings:
  - [ ] Grid size
  - [ ] Sort preferences
- [ ] Notification settings

### 6.7 Parental Controls

- [ ] PIN entry for restricted content
- [ ] Content rating filtering
- [ ] User profile management

### Verification 6

- [ ] SyncPlay works between devices
- [ ] Collections can be created and browsed
- [ ] Items can be downloaded for offline
- [ ] Advanced search filters work
- [ ] Settings persist correctly

---

## Phase 7: Platform Polish

### 7.1 iOS - Liquid Glass Design

- [x] Install expo-glass-effect for native iOS 26+ Liquid Glass:
  ```bash
  npx expo install expo-glass-effect
  ```
- [x] Create unified styling system (`theme/`):
  - [x] Design tokens (spacing, colors, typography, shadows)
  - [x] Platform detection utilities
  - [x] Glass effect configurations
  - [x] Theme hooks (useTheme, useColors, etc.)
- [x] Create `components/themed/GlassView.tsx`:
  - [x] Native Liquid Glass on iOS 26+
  - [x] BlurView fallback for older iOS/other platforms
  - [x] Multiple glass styles (clear, regular, prominent, navigation, etc.)
  - [x] Vibrancy effects via tint colors
- [x] Create `components/themed/GlassCard.tsx`:
  - [x] Card component with glass styling
  - [x] Size presets and shadow support
- [ ] Apply Liquid Glass to:
  - [ ] Navigation bars
  - [ ] Tab bar
  - [ ] Cards and modals
  - [ ] Player controls overlay
- [ ] Use SF Symbols consistently
- [ ] Implement haptic feedback for interactions
- [ ] Support Dynamic Type for accessibility

### 7.2 tvOS - Liquid Glass + Focus

- [ ] Implement focus engine integration:
  - [ ] `TVFocusGuideView` for complex layouts
  - [ ] Focus ring styling
  - [ ] Parallax poster effects
- [ ] Sidebar navigation with focus states
- [ ] Large, TV-optimized layouts
- [ ] Siri Remote gestures:
  - [ ] Swipe to browse
  - [ ] Click to select
  - [ ] Menu button handling
- [ ] Top Shelf integration (future)

### 7.3 Android - Material You

- [ ] Implement dynamic colors:
  ```typescript
  DynamicColorAndroid('@android:color/system_accent1_200')
  ```
- [ ] Material 3 component styling:
  - [ ] Rounded corners
  - [ ] Elevation shadows
  - [ ] Ripple effects
- [ ] Edge-to-edge layout
- [ ] Predictive back gesture support

### 7.4 Android TV - Leanback

- [ ] Implement Leanback-style layouts:
  - [ ] Large row-based browsing
  - [ ] Channel rows
  - [ ] Focus scaling
- [ ] D-pad navigation optimization
- [ ] Voice search integration
- [ ] Recommendation row (future)

### 7.5 macOS

- [ ] Keyboard shortcuts:
  - [ ] Space: play/pause
  - [ ] Arrow keys: seek
  - [ ] F: fullscreen
  - [ ] M: mute
  - [ ] Cmd+,: settings
- [ ] Menu bar integration (future)
- [ ] Multiple window support (future)
- [ ] Touch Bar support (if applicable)

### 7.6 Windows

- [ ] Mica/Acrylic backgrounds:
  ```typescript
  // Windows-specific translucent styling
  ```
- [ ] Windows 11 design language
- [ ] Keyboard navigation
- [ ] Media transport controls

### 7.7 Widgets

- [ ] iOS Lock Screen widget (Continue Watching)
- [ ] iOS Home Screen widget (Now Playing)
- [ ] Android widget (Continue Watching)
- [ ] Requires `expo-widget` or native module

### 7.8 Accessibility

- [ ] VoiceOver support (iOS/tvOS)
- [ ] TalkBack support (Android)
- [ ] Screen reader labels for all interactive elements
- [ ] Sufficient color contrast
- [ ] Reduce motion support

### Verification 7

- [ ] iOS app follows Liquid Glass aesthetic
- [ ] tvOS navigation works flawlessly with remote
- [ ] Android uses system dynamic colors
- [ ] Android TV is usable with D-pad only
- [ ] Keyboard shortcuts work on desktop
- [ ] Accessibility features work

---

## Testing Checklist

### Unit Tests
- [ ] Set up Jest with React Native
- [ ] Test Zustand stores
- [ ] Test custom hooks
- [ ] Test utility functions
- [ ] Test API client configuration

### Integration Tests
- [ ] Auth flow tests
- [ ] Library browsing tests
- [ ] Playback flow tests
- [ ] Search tests

### E2E Tests (Maestro)
- [ ] Install Maestro
- [ ] Login flow test
- [ ] Browse and play movie test
- [ ] Browse and play TV episode test
- [ ] Search test
- [ ] Settings test

### Device Testing
- [ ] iPhone (various sizes)
- [ ] iPad
- [ ] Apple TV
- [ ] Android Phone
- [ ] Android Tablet
- [ ] Android TV
- [ ] Mac (Apple Silicon + Intel)
- [ ] Windows

---

## Dependencies Summary

```json
{
  "dependencies": {
    "@hey-api/client-fetch": "^0.8.0",
    "@tanstack/react-query": "^5.62.0",
    "react-native-video": "^7.0.0",
    "zustand": "^5.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-blur": "~14.0.0",
    "expo-file-system": "~18.0.0",
    "@shopify/flash-list": "^1.7.0"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.64.0",
    "@react-native-tvos/config-tv": "^0.0.10"
  }
}
```

---

## File Structure (Final)

```
jellyfin-expo/
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   └── quick-connect.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── library/
│   │   ├── search.tsx
│   │   ├── live-tv/
│   │   └── settings/
│   ├── item/
│   │   ├── movie/[id].tsx
│   │   ├── series/[id].tsx
│   │   ├── season/[id].tsx
│   │   ├── episode/[id].tsx
│   │   ├── album/[id].tsx
│   │   └── artist/[id].tsx
│   └── (player)/
│       ├── _layout.tsx
│       └── [itemId].tsx
├── api/
│   ├── generated/
│   ├── client.ts
│   ├── device-profile.ts
│   └── auth.ts
├── components/
│   ├── ui/
│   ├── themed/
│   ├── media/
│   ├── player/
│   └── layout/
├── stores/
├── hooks/
├── theme/
├── lib/
├── config/
├── __tests__/
├── .maestro/
├── jellyfin-openapi-stable.json
├── PLAN.md
└── package.json
```

---

## Notes

- **Apple-first approach**: Complete iOS and tvOS before moving to Android
- **Feature priority**: Movies/TV > Music > Live TV > Advanced
- **Minimize transcoding**: Configure device profiles carefully
- **Reference implementation**: Streamyfin (https://github.com/streamyfin/streamyfin) uses MPVKit for maximum codec support - consider if react-native-video proves insufficient
