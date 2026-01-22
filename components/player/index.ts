/**
 * Player Components
 *
 * Components for video playback UI including track selection.
 *
 * @example
 * ```tsx
 * import { SubtitleSelector, AudioSelector } from '@/components/player';
 *
 * function PlayerScreen() {
 *   return (
 *     <>
 *       <SubtitleSelector
 *         visible={showSubtitles}
 *         tracks={subtitleTracks}
 *         selectedIndex={selectedSubtitleIndex}
 *         onSelect={setSubtitleTrack}
 *         onClose={() => setShowSubtitles(false)}
 *       />
 *       <AudioSelector
 *         visible={showAudio}
 *         tracks={audioTracks}
 *         selectedIndex={selectedAudioIndex}
 *         onSelect={setAudioTrack}
 *         onClose={() => setShowAudio(false)}
 *       />
 *     </>
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
export { SkipSegmentButton, type SkipSegmentButtonProps } from './skip-segment-button';
