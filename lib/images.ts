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

  // Get the appropriate image tag
  let imageTag: string | null | undefined;
  let itemId = item.Id;

  if (imageType === 'Primary') {
    imageTag = item.ImageTags?.Primary;
    // For episodes, use series primary image if no episode image
    if (!imageTag && item.SeriesPrimaryImageTag && item.SeriesId) {
      imageTag = item.SeriesPrimaryImageTag;
      itemId = item.SeriesId;
    }
    // For episodes/seasons, fall back to parent
    if (!imageTag && item.ParentPrimaryImageTag && item.ParentId) {
      imageTag = item.ParentPrimaryImageTag;
      itemId = item.ParentId;
    }
  } else if (imageType === 'Backdrop') {
    imageTag = item.BackdropImageTags?.[0];
    // Use parent backdrop if available
    if (!imageTag && item.ParentBackdropImageTags?.length && item.ParentBackdropItemId) {
      imageTag = item.ParentBackdropImageTags[0];
      itemId = item.ParentBackdropItemId;
    }
  } else if (imageType === 'Thumb') {
    imageTag = item.ImageTags?.Thumb;
    if (!imageTag && item.SeriesThumbImageTag && item.SeriesId) {
      imageTag = item.SeriesThumbImageTag;
      itemId = item.SeriesId;
    }
    if (!imageTag && item.ParentThumbImageTag && item.ParentThumbItemId) {
      imageTag = item.ParentThumbImageTag;
      itemId = item.ParentThumbItemId;
    }
  }

  if (!imageTag) return null;

  const params = new URLSearchParams({
    tag: imageTag,
    quality: quality.toString(),
    maxWidth: maxWidth.toString(),
  });

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
