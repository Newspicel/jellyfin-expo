/**
 * SubtitleSelector - Modal for selecting subtitle tracks during playback
 *
 * Displays available subtitle tracks and allows users to select one
 * or turn subtitles off.
 */

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui';
import { spacing, radii, fontSizes, fontWeights } from '@/theme/tokens';
import type { MediaStream } from '@/api/generated/types.gen';

// =============================================================================
// TYPES
// =============================================================================

export interface SubtitleSelectorProps {
  /** Whether the selector is visible */
  visible: boolean;
  /** Available subtitle tracks */
  tracks: MediaStream[];
  /** Currently selected subtitle index (-1 for off) */
  selectedIndex: number | null;
  /** Called when a track is selected */
  onSelect: (index: number) => void;
  /** Called to close the selector */
  onClose: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get display label for a subtitle track
 */
function getTrackLabel(track: MediaStream): string {
  // Use DisplayTitle if available (most informative)
  if (track.DisplayTitle) {
    return track.DisplayTitle;
  }

  // Build label from available info
  const parts: string[] = [];

  // Title or language
  if (track.Title) {
    parts.push(track.Title);
  } else if (track.Language) {
    parts.push(track.Language.toUpperCase());
  } else {
    parts.push(`Track ${track.Index ?? 0}`);
  }

  // Codec
  if (track.Codec) {
    parts.push(`(${track.Codec.toUpperCase()})`);
  }

  return parts.join(' ');
}

/**
 * Get subtitle info badges
 */
function getTrackBadges(track: MediaStream): string[] {
  const badges: string[] = [];

  if (track.IsDefault) badges.push('Default');
  if (track.IsForced) badges.push('Forced');
  if (track.IsHearingImpaired) badges.push('CC');
  if (track.IsExternal) badges.push('External');

  return badges;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SubtitleSelector({
  visible,
  tracks,
  selectedIndex,
  onSelect,
  onClose,
}: SubtitleSelectorProps) {
  const insets = useSafeAreaInsets();

  const handleSelectOff = () => {
    onSelect(-1);
    onClose();
  };

  const handleSelectTrack = (index: number) => {
    onSelect(index);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          // Prevent closing when tapping inside the modal
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Subtitles</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <IconSymbol name="xmark" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Track list */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Off option */}
            <Pressable
              style={[
                styles.trackItem,
                selectedIndex === -1 || selectedIndex === null
                  ? styles.trackItemSelected
                  : null,
              ]}
              onPress={handleSelectOff}
            >
              <View style={styles.trackInfo}>
                <Text style={styles.trackLabel}>Off</Text>
              </View>
              {(selectedIndex === -1 || selectedIndex === null) && (
                <IconSymbol name="checkmark" size={20} color="#00a2ff" />
              )}
            </Pressable>

            {/* Subtitle tracks */}
            {tracks.map((track) => {
              const isSelected = track.Index === selectedIndex;
              const badges = getTrackBadges(track);

              return (
                <Pressable
                  key={track.Index}
                  style={[
                    styles.trackItem,
                    isSelected ? styles.trackItemSelected : null,
                  ]}
                  onPress={() =>
                    track.Index !== undefined && handleSelectTrack(track.Index)
                  }
                >
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackLabel}>{getTrackLabel(track)}</Text>
                    {badges.length > 0 && (
                      <View style={styles.badgeContainer}>
                        {badges.map((badge) => (
                          <View key={badge} style={styles.badge}>
                            <Text style={styles.badgeText}>{badge}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {isSelected && (
                    <IconSymbol name="checkmark" size={20} color="#00a2ff" />
                  )}
                </Pressable>
              );
            })}

            {tracks.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No subtitles available</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  trackItemSelected: {
    backgroundColor: 'rgba(0, 162, 255, 0.15)',
  },
  trackInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  trackLabel: {
    fontSize: fontSizes.base,
    color: '#fff',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radii.xs,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: fontWeights.medium,
  },
  emptyState: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default SubtitleSelector;
