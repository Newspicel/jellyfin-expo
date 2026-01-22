/**
 * ResumeDialog - Modal for asking users if they want to resume playback
 *
 * Displays when a user tries to play content that has existing progress,
 * offering the choice to resume from where they left off or start over.
 */

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui';
import { spacing, radii, fontSizes, fontWeights } from '@/theme/tokens';

// =============================================================================
// TYPES
// =============================================================================

export interface ResumeDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Position in ticks (Jellyfin uses 10,000 ticks per millisecond) */
  positionTicks: number;
  /** Total duration in ticks (optional, for displaying progress percentage) */
  durationTicks?: number;
  /** Item title for display */
  title?: string;
  /** Called when user chooses to resume */
  onResume: () => void;
  /** Called when user chooses to start from beginning */
  onStartOver: () => void;
  /** Called to close the dialog without action */
  onClose: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert ticks to a human-readable time string
 * Jellyfin uses 10,000 ticks per millisecond
 */
function formatTicksToTime(ticks: number): string {
  const totalSeconds = Math.floor(ticks / 10000000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate remaining time
 */
function formatRemainingTime(positionTicks: number, durationTicks: number): string {
  const remainingTicks = durationTicks - positionTicks;
  const remainingMinutes = Math.floor(remainingTicks / 600000000);

  if (remainingMinutes >= 60) {
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return `${hours}h ${minutes}m remaining`;
  }
  return `${remainingMinutes}m remaining`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ResumeDialog({
  visible,
  positionTicks,
  durationTicks,
  title,
  onResume,
  onStartOver,
  onClose,
}: ResumeDialogProps) {
  const insets = useSafeAreaInsets();

  const timeString = formatTicksToTime(positionTicks);
  const remainingString = durationTicks ? formatRemainingTime(positionTicks, durationTicks) : null;

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
            { marginBottom: insets.bottom + spacing.lg },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <IconSymbol name="play.circle.fill" size={48} color="#00a2ff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Resume Playback?</Text>

          {/* Item title */}
          {title && (
            <Text style={styles.itemTitle} numberOfLines={2}>
              {title}
            </Text>
          )}

          {/* Progress info */}
          <View style={styles.progressInfo}>
            <Text style={styles.timeText}>
              Left off at {timeString}
            </Text>
            {remainingString && (
              <Text style={styles.remainingText}>{remainingString}</Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.resumeButton]}
              onPress={onResume}
            >
              <IconSymbol name="play.fill" size={18} color="#fff" />
              <Text style={styles.buttonText}>Resume</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.startOverButton]}
              onPress={onStartOver}
            >
              <IconSymbol name="arrow.counterclockwise" size={18} color="#fff" />
              <Text style={[styles.buttonText, styles.startOverText]}>Start Over</Text>
            </Pressable>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: '#fff',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  itemTitle: {
    fontSize: fontSizes.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timeText: {
    fontSize: fontSizes.base,
    color: '#fff',
    fontWeight: fontWeights.medium,
  },
  remainingText: {
    fontSize: fontSizes.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  resumeButton: {
    backgroundColor: '#00a2ff',
  },
  startOverButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: '#fff',
  },
  startOverText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default ResumeDialog;
