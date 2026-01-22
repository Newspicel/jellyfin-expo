/**
 * Hook for fetching media segments (intro, outro, credits, etc.)
 *
 * Media segments allow the player to show skip buttons when the playback
 * position is within certain marked sections of a video (e.g., "Skip Intro").
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getItemSegmentsOptions } from '@/api/generated/@tanstack/react-query.gen';
import type { MediaSegmentDto, MediaSegmentType } from '@/api/generated/types.gen';

// Ticks per second (Jellyfin uses 10,000,000 ticks per second)
const TICKS_PER_SECOND = 10_000_000;

export interface MediaSegment {
  /** Segment ID */
  id: string;
  /** Type of segment */
  type: MediaSegmentType;
  /** Start time in seconds */
  startSeconds: number;
  /** End time in seconds */
  endSeconds: number;
  /** Start time in ticks */
  startTicks: number;
  /** End time in ticks */
  endTicks: number;
}

export interface UseMediaSegmentsOptions {
  /** Item ID to fetch segments for */
  itemId: string;
  /** Types of segments to fetch (default: all skippable types) */
  includeTypes?: MediaSegmentType[];
  /** Whether to enable the query */
  enabled?: boolean;
}

export interface UseMediaSegmentsResult {
  /** All fetched segments */
  segments: MediaSegment[];
  /** Whether segments are loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Get the active segment at a given time (in seconds) */
  getActiveSegment: (currentTimeSeconds: number) => MediaSegment | null;
  /** Check if there's an active skippable segment at the given time */
  hasActiveSegment: (currentTimeSeconds: number) => boolean;
}

// Segment types that can be skipped
const SKIPPABLE_TYPES: MediaSegmentType[] = ['Intro', 'Outro', 'Recap', 'Commercial', 'Preview'];

/**
 * Convert a MediaSegmentDto to our MediaSegment format
 */
function toMediaSegment(dto: MediaSegmentDto): MediaSegment | null {
  if (!dto.Id || dto.StartTicks === undefined || dto.EndTicks === undefined) {
    return null;
  }

  return {
    id: dto.Id,
    type: dto.Type ?? 'Unknown',
    startSeconds: dto.StartTicks / TICKS_PER_SECOND,
    endSeconds: dto.EndTicks / TICKS_PER_SECOND,
    startTicks: dto.StartTicks,
    endTicks: dto.EndTicks,
  };
}

/**
 * Get a user-friendly label for a segment type
 */
export function getSegmentLabel(type: MediaSegmentType): string {
  switch (type) {
    case 'Intro':
      return 'Skip Intro';
    case 'Outro':
      return 'Skip Credits';
    case 'Recap':
      return 'Skip Recap';
    case 'Commercial':
      return 'Skip Ad';
    case 'Preview':
      return 'Skip Preview';
    default:
      return 'Skip';
  }
}

/**
 * Hook for fetching and working with media segments
 *
 * @example
 * ```tsx
 * const { segments, getActiveSegment } = useMediaSegments({
 *   itemId: 'abc123',
 * });
 *
 * const activeSegment = getActiveSegment(currentTimeSeconds);
 * if (activeSegment) {
 *   return <SkipButton label={getSegmentLabel(activeSegment.type)} />;
 * }
 * ```
 */
export function useMediaSegments(options: UseMediaSegmentsOptions): UseMediaSegmentsResult {
  const { itemId, includeTypes = SKIPPABLE_TYPES, enabled = true } = options;

  const { data, isLoading, error } = useQuery({
    ...getItemSegmentsOptions({
      path: { itemId },
      query: { includeSegmentTypes: includeTypes },
    }),
    enabled: enabled && !!itemId,
    // Segments don't change during playback, cache for the session
    staleTime: Infinity,
  });

  // Convert API response to our MediaSegment format
  const segments = useMemo((): MediaSegment[] => {
    if (!data?.Items) return [];

    return data.Items.map(toMediaSegment).filter((s): s is MediaSegment => s !== null);
  }, [data?.Items]);

  // Get the active segment at a given time
  const getActiveSegment = useMemo(() => {
    return (currentTimeSeconds: number): MediaSegment | null => {
      for (const segment of segments) {
        if (currentTimeSeconds >= segment.startSeconds && currentTimeSeconds < segment.endSeconds) {
          return segment;
        }
      }
      return null;
    };
  }, [segments]);

  // Check if there's an active segment
  const hasActiveSegment = useMemo(() => {
    return (currentTimeSeconds: number): boolean => {
      return getActiveSegment(currentTimeSeconds) !== null;
    };
  }, [getActiveSegment]);

  return {
    segments,
    isLoading,
    error: error as Error | null,
    getActiveSegment,
    hasActiveSegment,
  };
}
