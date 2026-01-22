import { useServerStore } from '@/stores/server.store';
import type { BaseItemDto, ImageType } from '@/api/generated';

interface ImageUrlOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function getImageUrl(
  item: BaseItemDto,
  imageType: ImageType = 'Primary',
  options: ImageUrlOptions = {}
): string | null {
  const server = useServerStore.getState().getCurrentServer();
  if (!server || !item.Id) return null;

  const { maxWidth = 300, maxHeight, quality = 90 } = options;

  // Get the appropriate image tag and item ID
  let imageTag: string | null | undefined;
  let itemId = item.Id;
  let hasImage = false;

  if (imageType === 'Primary') {
    imageTag = item.ImageTags?.Primary;
    hasImage = !!imageTag;
    // For episodes, use series primary image if no episode image
    if (!hasImage && item.SeriesPrimaryImageTag && item.SeriesId) {
      imageTag = item.SeriesPrimaryImageTag;
      itemId = item.SeriesId;
      hasImage = true;
    }
    // For episodes/seasons, fall back to parent
    if (!hasImage && item.ParentPrimaryImageTag && item.ParentId) {
      imageTag = item.ParentPrimaryImageTag;
      itemId = item.ParentId;
      hasImage = true;
    }
    // If still no image but item has ImageBlurHashes for Primary, image exists
    if (!hasImage && item.ImageBlurHashes?.Primary) {
      hasImage = true;
    }
  } else if (imageType === 'Backdrop') {
    imageTag = item.BackdropImageTags?.[0];
    hasImage = !!imageTag;
    // Use parent backdrop if available
    if (!hasImage && item.ParentBackdropImageTags?.length && item.ParentBackdropItemId) {
      imageTag = item.ParentBackdropImageTags[0];
      itemId = item.ParentBackdropItemId;
      hasImage = true;
    }
    if (!hasImage && item.ImageBlurHashes?.Backdrop) {
      hasImage = true;
    }
  } else if (imageType === 'Thumb') {
    imageTag = item.ImageTags?.Thumb;
    hasImage = !!imageTag;
    if (!hasImage && item.SeriesThumbImageTag && item.SeriesId) {
      imageTag = item.SeriesThumbImageTag;
      itemId = item.SeriesId;
      hasImage = true;
    }
    if (!hasImage && item.ParentThumbImageTag && item.ParentThumbItemId) {
      imageTag = item.ParentThumbImageTag;
      itemId = item.ParentThumbItemId;
      hasImage = true;
    }
    if (!hasImage && item.ImageBlurHashes?.Thumb) {
      hasImage = true;
    }
  }

  // If no image info found, still try to load (server might have it)
  // But prefer returning null if we're certain there's no image
  if (!hasImage && !imageTag) {
    // Check if there's any primary image available by looking at ImageTags
    if (imageType === 'Primary' && !item.ImageTags?.Primary) {
      // Try anyway - some items have images without tags in response
      hasImage = true;
    } else {
      return null;
    }
  }

  const params = new URLSearchParams({
    quality: quality.toString(),
    maxWidth: maxWidth.toString(),
  });

  // Add tag if available (for caching)
  if (imageTag) {
    params.set('tag', imageTag);
  }

  if (maxHeight) {
    params.set('maxHeight', maxHeight.toString());
  }

  return `${server.url}/Items/${itemId}/Images/${imageType}?${params.toString()}`;
}

export function getPrimaryImageUrl(item: BaseItemDto, maxWidth = 300): string | null {
  return getImageUrl(item, 'Primary', { maxWidth });
}

export function getBackdropImageUrl(item: BaseItemDto, maxWidth = 1280): string | null {
  return getImageUrl(item, 'Backdrop', { maxWidth });
}

export function getThumbImageUrl(item: BaseItemDto, maxWidth = 480): string | null {
  return getImageUrl(item, 'Thumb', { maxWidth });
}

export function getPersonImageUrl(
  personId: string,
  imageTag: string | null | undefined,
  maxWidth = 150
): string | null {
  const server = useServerStore.getState().getCurrentServer();
  if (!server || !personId || !imageTag) return null;

  const params = new URLSearchParams({
    tag: imageTag,
    quality: '90',
    maxWidth: maxWidth.toString(),
  });

  return `${server.url}/Items/${personId}/Images/Primary?${params.toString()}`;
}
