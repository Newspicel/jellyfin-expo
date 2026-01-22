# Style Guide

This document outlines the design system and styling patterns used in the Jellyfin Expo app.

## Design Tokens

All design tokens are defined in `theme/tokens.ts`. Import them from `@/theme`:

```typescript
import { spacing, radii, fontSizes } from '@/theme';
```

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `spacing.xs` | 4px | Tight spacing, icon margins |
| `spacing.sm` | 8px | Small gaps, compact lists |
| `spacing.md` | 12px | Medium gaps, form elements |
| `spacing.lg` | 16px | Standard padding, screen margins |
| `spacing.xl` | 20px | Section spacing |
| `spacing['2xl']` | 24px | Large section gaps |
| `spacing['3xl']` | 32px | Major section dividers |
| `spacing['4xl']` | 40px | Screen-level spacing |
| `spacing['5xl']` | 48px | Hero spacing |

### Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `radii.xs` | 4px | Small badges, chips |
| `radii.sm` | 8px | Cards, thumbnails |
| `radii.md` | 12px | Buttons, inputs, larger cards |
| `radii.lg` | 16px | Modals, sheets |
| `radii.xl` | 20px | Large containers |
| `radii['2xl']` | 24px | Hero elements |
| `radii.full` | 9999px | Circular elements (avatars, badges) |

### Font Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `fontSizes.xs` | 11px | Captions, helper text |
| `fontSizes.sm` | 13px | Secondary text, metadata |
| `fontSizes.md` | 15px | Body text |
| `fontSizes.base` | 16px | Standard text, inputs |
| `fontSizes.lg` | 17px | Emphasis text |
| `fontSizes.xl` | 20px | Subtitles |
| `fontSizes['2xl']` | 24px | Section titles |
| `fontSizes['3xl']` | 28px | Page titles |
| `fontSizes['4xl']` | 34px | Hero titles |

## Semantic Colors

Use the `useColors()` hook to access theme-aware colors:

```typescript
import { useColors } from '@/theme';

function MyComponent() {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      <Text style={{ color: colors.text.primary }}>Hello</Text>
    </View>
  );
}
```

### Color Categories

#### Background Colors
- `colors.background.primary` - Main screen background
- `colors.background.secondary` - Cards, elevated surfaces
- `colors.background.tertiary` - Placeholders, subtle surfaces

#### Text Colors
- `colors.text.primary` - Main text
- `colors.text.secondary` - Secondary/muted text
- `colors.text.tertiary` - Disabled/placeholder text
- `colors.text.inverse` - Text on colored backgrounds

#### Interactive Colors
- `colors.interactive.primary` - Primary brand color (Jellyfin blue)
- `colors.interactive.primaryPressed` - Pressed state
- `colors.interactive.secondary` - Secondary button background
- `colors.interactive.secondaryHover` - Hover/pressed secondary
- `colors.interactive.disabled` - Disabled elements

#### Border Colors
- `colors.border.default` - Standard borders
- `colors.border.focus` - Focused input borders

#### Status Colors
- `colors.status.success` - Success states
- `colors.status.error` - Error states, destructive actions
- `colors.status.errorBackground` - Error pressed state
- `colors.status.warning` - Warning states

#### Overlay Colors
- `colors.overlay.dark` - Dark overlays (for light content)
- `colors.overlay.light` - Light overlays

#### Media-specific Colors
- `colors.media.progress` - Progress bars
- `colors.media.watched` - Watched indicators
- `colors.media.favorite` - Favorite/heart icons
- `colors.media.rating` - Star ratings

## UI Components

### Button

```typescript
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary" onPress={handleSubmit}>
  Sign In
</Button>

// Destructive button
<Button variant="destructive" onPress={handleDelete}>
  Delete
</Button>

// Ghost button (text-only)
<Button variant="ghost" onPress={handleCancel}>
  Cancel
</Button>

// Icon button
<Button variant="icon" leftIcon="heart" onPress={handleFavorite} />

// With loading state
<Button loading onPress={handleSubmit}>
  Loading...
</Button>

// Full width
<Button fullWidth size="lg" onPress={handleSubmit}>
  Continue
</Button>
```

**Variants:**
- `primary` - Main actions (filled, brand color)
- `secondary` - Secondary actions (subtle background)
- `destructive` - Destructive actions (red)
- `ghost` - Text-only, minimal style
- `icon` - Icon-only, square shape

**Sizes:**
- `sm` - 36px height
- `md` - 44px height (default)
- `lg` - 48px height

### BackButton

```typescript
import { BackButton } from '@/components/ui';

// Standard back button (positioned absolutely)
<BackButton />

// Custom press handler
<BackButton onPress={handleCustomBack} />
```

### Input

```typescript
import { Input } from '@/components/ui';

// Basic input
<Input
  placeholder="Enter username"
  value={username}
  onChangeText={setUsername}
/>

// With label
<Input
  label="Email"
  placeholder="you@example.com"
  keyboardType="email-address"
/>

// With error
<Input
  label="Password"
  error="Password must be at least 8 characters"
  secureTextEntry
/>

// With left icon
<Input
  leftIcon="magnifyingglass"
  placeholder="Search..."
/>
```

## Migration from Legacy Patterns

### Colors

| Legacy | New |
|--------|-----|
| `Colors[colorScheme].tint` | `colors.interactive.primary` |
| `Colors[colorScheme].text` | `colors.text.primary` |
| `colors.tint` | `colors.interactive.primary` |
| `#ff3b30` | `colors.status.error` |
| `#00a4dc` | `colors.interactive.primary` |
| `#2a2a2a` | `colors.background.secondary` |
| `#3a3a3a` | `colors.background.tertiary` |
| `opacity: 0.6` | `color: colors.text.secondary` |
| `opacity: 0.5` | `color: colors.text.tertiary` |

### Spacing

| Hardcoded | Token |
|-----------|-------|
| `4` | `spacing.xs` |
| `8` | `spacing.sm` |
| `12` | `spacing.md` |
| `16` | `spacing.lg` |
| `20` | `spacing.xl` |
| `24` | `spacing['2xl']` |
| `32` | `spacing['3xl']` |

### Border Radius

| Hardcoded | Token |
|-----------|-------|
| `4` | `radii.xs` |
| `8` | `radii.sm` |
| `12` | `radii.md` |
| `16` | `radii.lg` |
| `20` | `radii.xl` |
| `9999` or `circular` | `radii.full` |

### Components

| Legacy | New |
|--------|-----|
| `<TouchableOpacity style={buttonStyles}>` | `<Button variant="primary">` |
| `<TextInput style={inputStyles}>` | `<Input>` |
| Custom back button Pressable | `<BackButton />` |

## Best Practices

1. **Always use semantic colors** - Never hardcode hex values
2. **Use spacing tokens** - Avoid magic numbers for padding/margins
3. **Prefer components** - Use `Button`, `Input`, etc. over raw primitives
4. **Import from `@/theme`** - Single source for all design tokens
5. **Use `useColors()` hook** - Ensures theme-aware colors
6. **Follow existing patterns** - Check similar screens for conventions
