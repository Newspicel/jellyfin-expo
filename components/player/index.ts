/**
 * Player Components
 *
 * Components for video playback UI including:
 * - Track selection (subtitle, audio)
 * - Player controls (mobile and TV)
 * - Gesture handling (tap, double-tap)
 * - Skip segments (intro, outro)
 * - Next episode overlay
 * - Buffering indicator
 *
 * @example
 * ```tsx
 * import {
 *   PlayerControls,
 *   PlayerGestureHandler,
 *   BufferingIndicator,
 *   SkipSegmentButton,
 * } from '@/components/player';
 *
 * function PlayerScreen() {
 *   return (
 *     <PlayerGestureHandler onTap={toggle} onDoubleTapLeft={seekBack} onDoubleTapRight={seekForward}>
 *       <VideoView player={player} />
 *       <PlayerControls visible={controlsVisible} {...props} />
 *       <BufferingIndicator visible={isBuffering} />
 *       <SkipSegmentButton segment={activeSegment} onSkip={handleSkip} />
 *     </PlayerGestureHandler>
 *   );
 * }
 * ```
 */

export { SubtitleSelector, type SubtitleSelectorProps } from './subtitle-selector';
export { AudioSelector, type AudioSelectorProps } from './audio-selector';
export { ResumeDialog, type ResumeDialogProps } from './resume-dialog';
export { NextEpisodeOverlay, type NextEpisodeOverlayProps } from './next-episode-overlay';
export { SeekBar } from './seek-bar';
export { VolumeControl, type VolumeControlProps } from './volume-control';
export { TVPlayerControls, type TVPlayerControlsProps } from './player-controls.tv';
export { PlayerControls, type PlayerControlsProps } from './player-controls';
export { SkipSegmentButton, type SkipSegmentButtonProps } from './skip-segment-button';
export { PlayerGestureHandler, type PlayerGestureHandlerProps } from './player-gesture-handler';
export { BufferingIndicator, type BufferingIndicatorProps } from './buffering-indicator';
