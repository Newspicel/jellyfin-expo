/**
 * Device profiles for Jellyfin playback
 *
 * Device profiles tell the Jellyfin server what media formats the client can play directly
 * vs. what needs to be transcoded. This is critical for optimal playback experience.
 */

import type {
  DeviceProfile,
  DirectPlayProfile,
  TranscodingProfile,
  CodecProfile,
  SubtitleProfile,
  ProfileCondition,
} from './generated/types.gen';
import {
  isIOS,
  isAndroid,
  isAppleTV,
  isAndroidTV,
  isMacOS,
  isWindows,
  isWeb,
} from '@/theme/platform';

// =============================================================================
// PROFILE CONDITION HELPERS
// =============================================================================

type ProfileConditionType =
  | 'Equals'
  | 'NotEquals'
  | 'LessThanEqual'
  | 'GreaterThanEqual';

type ProfileConditionProperty =
  | 'AudioChannels'
  | 'AudioBitrate'
  | 'AudioProfile'
  | 'Width'
  | 'Height'
  | 'Has64BitOffsets'
  | 'PacketLength'
  | 'VideoBitDepth'
  | 'VideoBitrate'
  | 'VideoFramerate'
  | 'VideoLevel'
  | 'VideoProfile'
  | 'VideoRangeType'
  | 'VideoTimestamp'
  | 'IsAnamorphic'
  | 'RefFrames'
  | 'NumAudioStreams'
  | 'NumVideoStreams'
  | 'IsSecondaryAudio'
  | 'AudioSampleRate'
  | 'IsInterlaced';

function createCondition(
  condition: ProfileConditionType,
  property: ProfileConditionProperty,
  value: string,
  isRequired = true
): ProfileCondition {
  return {
    Condition: condition,
    Property: property,
    Value: value,
    IsRequired: isRequired,
  };
}

// =============================================================================
// DIRECT PLAY PROFILES
// =============================================================================

/** Video direct play profile */
function createVideoDirectPlay(
  container: string,
  videoCodec: string,
  audioCodec: string
): DirectPlayProfile {
  return {
    Container: container,
    Type: 'Video',
    VideoCodec: videoCodec,
    AudioCodec: audioCodec,
  };
}

/** Audio direct play profile */
function createAudioDirectPlay(
  container: string,
  audioCodec: string
): DirectPlayProfile {
  return {
    Container: container,
    Type: 'Audio',
    AudioCodec: audioCodec,
  };
}

// =============================================================================
// TRANSCODING PROFILES
// =============================================================================

function createVideoTranscoding(
  container: string,
  videoCodec: string,
  audioCodec: string,
  protocol: 'hls' | 'http' = 'hls'
): TranscodingProfile {
  return {
    Container: container,
    Type: 'Video',
    VideoCodec: videoCodec,
    AudioCodec: audioCodec,
    Protocol: protocol,
    EstimateContentLength: false,
    EnableMpegtsM2TsMode: false,
    TranscodeSeekInfo: 'Auto',
    CopyTimestamps: false,
    Context: 'Streaming',
    EnableSubtitlesInManifest: true,
    MaxAudioChannels: '6',
    MinSegments: 2,
    SegmentLength: 6,
    BreakOnNonKeyFrames: false,
  };
}

function createAudioTranscoding(
  container: string,
  audioCodec: string
): TranscodingProfile {
  return {
    Container: container,
    Type: 'Audio',
    AudioCodec: audioCodec,
    Protocol: 'http',
    EstimateContentLength: false,
    Context: 'Streaming',
  };
}

// =============================================================================
// SUBTITLE PROFILES
// =============================================================================

function createSubtitleProfile(
  format: string,
  method: 'Encode' | 'Embed' | 'External' | 'Hls' | 'Drop'
): SubtitleProfile {
  return {
    Format: format,
    Method: method,
  };
}

// =============================================================================
// CODEC PROFILES
// =============================================================================

function createH264CodecProfile(maxLevel: string = '52'): CodecProfile {
  return {
    Type: 'Video',
    Codec: 'h264',
    Conditions: [
      createCondition('LessThanEqual', 'VideoLevel', maxLevel),
      createCondition('NotEquals', 'IsAnamorphic', 'true', false),
    ],
  };
}

function createHevcCodecProfile(
  maxLevel: string = '183',
  max10Bit = true
): CodecProfile {
  const conditions: ProfileCondition[] = [
    createCondition('LessThanEqual', 'VideoLevel', maxLevel),
    createCondition('NotEquals', 'IsAnamorphic', 'true', false),
  ];

  if (!max10Bit) {
    conditions.push(createCondition('LessThanEqual', 'VideoBitDepth', '8'));
  } else {
    conditions.push(createCondition('LessThanEqual', 'VideoBitDepth', '10'));
  }

  return {
    Type: 'Video',
    Codec: 'hevc',
    Conditions: conditions,
  };
}

function createAv1CodecProfile(
  maxLevel: string = '19',
  max10Bit = true
): CodecProfile {
  const conditions: ProfileCondition[] = [
    createCondition('LessThanEqual', 'VideoLevel', maxLevel),
  ];

  if (max10Bit) {
    conditions.push(createCondition('LessThanEqual', 'VideoBitDepth', '10'));
  } else {
    conditions.push(createCondition('LessThanEqual', 'VideoBitDepth', '8'));
  }

  return {
    Type: 'Video',
    Codec: 'av1',
    Conditions: conditions,
  };
}

function createAudioCodecProfile(
  codec: string,
  maxChannels: string
): CodecProfile {
  return {
    Type: 'VideoAudio',
    Codec: codec,
    Conditions: [createCondition('LessThanEqual', 'AudioChannels', maxChannels)],
  };
}

// =============================================================================
// iOS / iPadOS PROFILE
// =============================================================================

function createIOSProfile(): DeviceProfile {
  // iOS supports: H.264, HEVC (8-bit & 10-bit on newer devices)
  // Containers: MP4, MOV, M4V only (AVFoundation does NOT support MKV/WebM)
  // Audio: AAC, AC3, E-AC3, ALAC, FLAC, MP3
  const videoContainers = 'mp4,m4v,mov';
  const videoCodecs = 'h264,hevc';
  const audioCodecs = 'aac,ac3,eac3,alac,flac,mp3';

  return {
    Name: 'Jellyfin iOS',
    MaxStreamingBitrate: 120000000, // 120 Mbps
    MaxStaticBitrate: 100000000, // 100 Mbps
    MusicStreamingTranscodingBitrate: 384000, // 384 kbps

    DirectPlayProfiles: [
      // Video profiles
      createVideoDirectPlay(videoContainers, videoCodecs, audioCodecs),
      // Audio profiles
      createAudioDirectPlay('mp3', 'mp3'),
      createAudioDirectPlay('aac,m4a,m4b', 'aac'),
      createAudioDirectPlay('flac', 'flac'),
      createAudioDirectPlay('alac,m4a', 'alac'),
      createAudioDirectPlay('wav', 'pcm_s16le,pcm_s24le'),
      createAudioDirectPlay('ogg', 'opus,vorbis'),
      createAudioDirectPlay('webm', 'opus,vorbis'),
    ],

    TranscodingProfiles: [
      // HLS for video (best compatibility)
      createVideoTranscoding('ts', 'h264', 'aac,ac3,eac3', 'hls'),
      // Fallback for older content
      createVideoTranscoding('mp4', 'h264', 'aac', 'http'),
      // Audio transcoding
      createAudioTranscoding('aac', 'aac'),
    ],

    CodecProfiles: [
      createH264CodecProfile('52'), // Level 5.2 (4K@60fps)
      createHevcCodecProfile('183', true), // Level 6.1, 10-bit HDR
      createAudioCodecProfile('aac', '8'),
      createAudioCodecProfile('ac3,eac3', '8'),
    ],

    SubtitleProfiles: [
      createSubtitleProfile('srt', 'External'),
      createSubtitleProfile('vtt', 'External'),
      createSubtitleProfile('ass', 'External'),
      createSubtitleProfile('ssa', 'External'),
      createSubtitleProfile('sub', 'External'),
      createSubtitleProfile('smi', 'External'),
      createSubtitleProfile('pgs', 'Encode'), // Burn-in required for PGS
      createSubtitleProfile('pgssub', 'Encode'),
      createSubtitleProfile('dvdsub', 'Encode'),
      createSubtitleProfile('dvbsub', 'Encode'),
    ],
  };
}

// =============================================================================
// tvOS PROFILE
// =============================================================================

function createTvOSProfile(): DeviceProfile {
  // tvOS supports same as iOS plus better audio passthrough
  // Containers: MP4, MOV, M4V only (AVFoundation does NOT support MKV/WebM)
  // Dolby Atmos support via E-AC3 JOC
  const videoContainers = 'mp4,m4v,mov';
  const videoCodecs = 'h264,hevc';
  const audioCodecs = 'aac,ac3,eac3,alac,flac,mp3,truehd';

  return {
    Name: 'Jellyfin tvOS',
    MaxStreamingBitrate: 120000000, // 120 Mbps
    MaxStaticBitrate: 100000000,
    MusicStreamingTranscodingBitrate: 384000,

    DirectPlayProfiles: [
      // Video with expanded audio (Dolby Atmos capable)
      createVideoDirectPlay(videoContainers, videoCodecs, audioCodecs),
      // Audio profiles
      createAudioDirectPlay('mp3', 'mp3'),
      createAudioDirectPlay('aac,m4a,m4b', 'aac'),
      createAudioDirectPlay('flac', 'flac'),
      createAudioDirectPlay('alac,m4a', 'alac'),
      createAudioDirectPlay('wav', 'pcm_s16le,pcm_s24le'),
      createAudioDirectPlay('ogg', 'opus,vorbis'),
    ],

    TranscodingProfiles: [
      // HLS with Dolby support
      createVideoTranscoding('ts', 'hevc,h264', 'aac,ac3,eac3', 'hls'),
      createVideoTranscoding('mp4', 'h264', 'aac', 'http'),
      createAudioTranscoding('aac', 'aac'),
    ],

    CodecProfiles: [
      createH264CodecProfile('52'),
      createHevcCodecProfile('183', true), // 10-bit HDR support
      createAv1CodecProfile('19', true), // AV1 on Apple TV 4K (3rd gen)
      createAudioCodecProfile('aac', '8'),
      createAudioCodecProfile('ac3,eac3', '8'),
      // TrueHD/Atmos passthrough
      createAudioCodecProfile('truehd', '8'),
    ],

    SubtitleProfiles: [
      createSubtitleProfile('srt', 'External'),
      createSubtitleProfile('vtt', 'External'),
      createSubtitleProfile('ass', 'External'),
      createSubtitleProfile('ssa', 'External'),
      createSubtitleProfile('pgs', 'Encode'),
      createSubtitleProfile('pgssub', 'Encode'),
      createSubtitleProfile('dvdsub', 'Encode'),
      createSubtitleProfile('dvbsub', 'Encode'),
    ],
  };
}

// =============================================================================
// ANDROID PROFILE
// =============================================================================

function createAndroidProfile(): DeviceProfile {
  // Android: H.264, HEVC (8-bit widely, 10-bit on newer), VP9, AV1 on recent
  // Audio: AAC, MP3, Opus, Vorbis, FLAC
  const videoContainers = 'mp4,mkv,webm,m4v';
  const videoCodecs = 'h264,hevc,vp9,av1';
  const audioCodecs = 'aac,mp3,opus,vorbis,flac,ac3,eac3';

  return {
    Name: 'Jellyfin Android',
    MaxStreamingBitrate: 100000000, // 100 Mbps
    MaxStaticBitrate: 100000000,
    MusicStreamingTranscodingBitrate: 320000, // 320 kbps

    DirectPlayProfiles: [
      createVideoDirectPlay(videoContainers, videoCodecs, audioCodecs),
      // Audio profiles
      createAudioDirectPlay('mp3', 'mp3'),
      createAudioDirectPlay('aac,m4a', 'aac'),
      createAudioDirectPlay('flac', 'flac'),
      createAudioDirectPlay('ogg', 'opus,vorbis,flac'),
      createAudioDirectPlay('webm', 'opus,vorbis'),
      createAudioDirectPlay('wav', 'pcm_s16le'),
    ],

    TranscodingProfiles: [
      createVideoTranscoding('ts', 'h264', 'aac', 'hls'),
      createVideoTranscoding('mp4', 'h264', 'aac', 'http'),
      createAudioTranscoding('aac', 'aac'),
      createAudioTranscoding('mp3', 'mp3'),
    ],

    CodecProfiles: [
      createH264CodecProfile('51'), // Level 5.1
      createHevcCodecProfile('153', false), // Level 5.1, 8-bit (conservative)
      createAv1CodecProfile('13', false), // Conservative AV1 support
      {
        Type: 'Video',
        Codec: 'vp9',
        Conditions: [
          createCondition('LessThanEqual', 'VideoBitDepth', '8'),
        ],
      },
      createAudioCodecProfile('aac', '6'),
    ],

    SubtitleProfiles: [
      createSubtitleProfile('srt', 'External'),
      createSubtitleProfile('vtt', 'External'),
      createSubtitleProfile('ass', 'External'),
      createSubtitleProfile('ssa', 'External'),
      createSubtitleProfile('sub', 'External'),
      createSubtitleProfile('pgs', 'Encode'),
      createSubtitleProfile('pgssub', 'Encode'),
      createSubtitleProfile('dvdsub', 'Encode'),
    ],
  };
}

// =============================================================================
// ANDROID TV PROFILE
// =============================================================================

function createAndroidTVProfile(): DeviceProfile {
  // Android TV: Enhanced audio passthrough, better codec support
  const videoContainers = 'mp4,mkv,webm,m4v';
  const videoCodecs = 'h264,hevc,vp9,av1';
  const audioCodecs = 'aac,mp3,opus,vorbis,flac,ac3,eac3,dts,truehd';

  return {
    Name: 'Jellyfin Android TV',
    MaxStreamingBitrate: 120000000, // 120 Mbps
    MaxStaticBitrate: 100000000,
    MusicStreamingTranscodingBitrate: 384000,

    DirectPlayProfiles: [
      // Video with enhanced audio passthrough
      createVideoDirectPlay(videoContainers, videoCodecs, audioCodecs),
      // Audio profiles
      createAudioDirectPlay('mp3', 'mp3'),
      createAudioDirectPlay('aac,m4a', 'aac'),
      createAudioDirectPlay('flac', 'flac'),
      createAudioDirectPlay('ogg', 'opus,vorbis,flac'),
      createAudioDirectPlay('webm', 'opus,vorbis'),
      createAudioDirectPlay('ac3', 'ac3'),
      createAudioDirectPlay('eac3', 'eac3'),
      createAudioDirectPlay('dts', 'dca,dts'),
    ],

    TranscodingProfiles: [
      createVideoTranscoding('ts', 'h264,hevc', 'aac,ac3,eac3', 'hls'),
      createVideoTranscoding('mp4', 'h264', 'aac', 'http'),
      createAudioTranscoding('aac', 'aac'),
    ],

    CodecProfiles: [
      createH264CodecProfile('52'), // Level 5.2 for 4K
      createHevcCodecProfile('183', true), // 10-bit HDR
      createAv1CodecProfile('19', true), // Full AV1 support
      {
        Type: 'Video',
        Codec: 'vp9',
        Conditions: [
          createCondition('LessThanEqual', 'VideoBitDepth', '10'),
          createCondition('LessThanEqual', 'VideoLevel', '51'),
        ],
      },
      createAudioCodecProfile('aac', '8'),
      createAudioCodecProfile('ac3,eac3', '8'),
      createAudioCodecProfile('dca,dts', '8'),
    ],

    SubtitleProfiles: [
      createSubtitleProfile('srt', 'External'),
      createSubtitleProfile('vtt', 'External'),
      createSubtitleProfile('ass', 'External'),
      createSubtitleProfile('ssa', 'External'),
      createSubtitleProfile('pgs', 'Encode'),
      createSubtitleProfile('pgssub', 'Encode'),
      createSubtitleProfile('dvdsub', 'Encode'),
      createSubtitleProfile('dvbsub', 'Encode'),
    ],
  };
}

// =============================================================================
// macOS PROFILE
// =============================================================================

function createMacOSProfile(): DeviceProfile {
  // macOS via Catalyst - uses AVFoundation, same container limitations as iOS
  // Containers: MP4, MOV, M4V only (AVFoundation does NOT support MKV/WebM/AVI)
  const videoContainers = 'mp4,m4v,mov';
  const videoCodecs = 'h264,hevc';
  const audioCodecs = 'aac,ac3,eac3,alac,flac,mp3';

  return {
    Name: 'Jellyfin macOS',
    MaxStreamingBitrate: 150000000, // 150 Mbps (desktop bandwidth)
    MaxStaticBitrate: 150000000,
    MusicStreamingTranscodingBitrate: 384000,

    DirectPlayProfiles: [
      createVideoDirectPlay(videoContainers, videoCodecs, audioCodecs),
      createAudioDirectPlay('mp3', 'mp3'),
      createAudioDirectPlay('aac,m4a,m4b', 'aac'),
      createAudioDirectPlay('flac', 'flac'),
      createAudioDirectPlay('alac,m4a', 'alac'),
      createAudioDirectPlay('wav', 'pcm_s16le,pcm_s24le,pcm_s32le'),
      createAudioDirectPlay('ogg', 'opus,vorbis,flac'),
      createAudioDirectPlay('webm', 'opus,vorbis'),
      createAudioDirectPlay('aiff', 'pcm_s16be'),
    ],

    TranscodingProfiles: [
      createVideoTranscoding('ts', 'h264,hevc', 'aac,ac3,eac3', 'hls'),
      createVideoTranscoding('mp4', 'h264', 'aac', 'http'),
      createAudioTranscoding('aac', 'aac'),
    ],

    CodecProfiles: [
      createH264CodecProfile('52'),
      createHevcCodecProfile('186', true), // Level 6.2 for 8K
      createAv1CodecProfile('23', true), // Full AV1
      {
        Type: 'Video',
        Codec: 'vp9',
        Conditions: [
          createCondition('LessThanEqual', 'VideoBitDepth', '10'),
        ],
      },
      createAudioCodecProfile('aac', '8'),
      createAudioCodecProfile('ac3,eac3', '8'),
    ],

    SubtitleProfiles: [
      createSubtitleProfile('srt', 'External'),
      createSubtitleProfile('vtt', 'External'),
      createSubtitleProfile('ass', 'External'),
      createSubtitleProfile('ssa', 'External'),
      createSubtitleProfile('sub', 'External'),
      createSubtitleProfile('pgs', 'Encode'),
      createSubtitleProfile('pgssub', 'Encode'),
      createSubtitleProfile('dvdsub', 'Encode'),
    ],
  };
}

// =============================================================================
// WINDOWS PROFILE
// =============================================================================

function createWindowsProfile(): DeviceProfile {
  // Windows - broad codec support via system decoders
  const videoContainers = 'mp4,mkv,webm,m4v,avi,mov';
  const videoCodecs = 'h264,hevc,vp9,av1,vc1';
  const audioCodecs = 'aac,ac3,eac3,mp3,opus,vorbis,flac,dts,truehd';

  return {
    Name: 'Jellyfin Windows',
    MaxStreamingBitrate: 150000000,
    MaxStaticBitrate: 150000000,
    MusicStreamingTranscodingBitrate: 384000,

    DirectPlayProfiles: [
      createVideoDirectPlay(videoContainers, videoCodecs, audioCodecs),
      createAudioDirectPlay('mp3', 'mp3'),
      createAudioDirectPlay('aac,m4a', 'aac'),
      createAudioDirectPlay('flac', 'flac'),
      createAudioDirectPlay('ogg', 'opus,vorbis,flac'),
      createAudioDirectPlay('webm', 'opus,vorbis'),
      createAudioDirectPlay('wav', 'pcm_s16le,pcm_s24le'),
      createAudioDirectPlay('wma', 'wmav2,wmapro'),
    ],

    TranscodingProfiles: [
      createVideoTranscoding('ts', 'h264,hevc', 'aac,ac3', 'hls'),
      createVideoTranscoding('mp4', 'h264', 'aac', 'http'),
      createAudioTranscoding('aac', 'aac'),
      createAudioTranscoding('mp3', 'mp3'),
    ],

    CodecProfiles: [
      createH264CodecProfile('52'),
      createHevcCodecProfile('186', true),
      createAv1CodecProfile('23', true),
      {
        Type: 'Video',
        Codec: 'vp9',
        Conditions: [
          createCondition('LessThanEqual', 'VideoBitDepth', '10'),
        ],
      },
      {
        Type: 'Video',
        Codec: 'vc1',
        Conditions: [
          createCondition('LessThanEqual', 'VideoLevel', '3'),
        ],
      },
      createAudioCodecProfile('aac', '8'),
      createAudioCodecProfile('ac3,eac3', '8'),
      createAudioCodecProfile('dca,dts', '8'),
    ],

    SubtitleProfiles: [
      createSubtitleProfile('srt', 'External'),
      createSubtitleProfile('vtt', 'External'),
      createSubtitleProfile('ass', 'External'),
      createSubtitleProfile('ssa', 'External'),
      createSubtitleProfile('sub', 'External'),
      createSubtitleProfile('pgs', 'Encode'),
      createSubtitleProfile('pgssub', 'Encode'),
      createSubtitleProfile('dvdsub', 'Encode'),
    ],
  };
}

// =============================================================================
// WEB PROFILE (Fallback)
// =============================================================================

function createWebProfile(): DeviceProfile {
  // Web - conservative profile for browser playback
  const videoContainers = 'mp4,webm';
  const videoCodecs = 'h264,vp9';
  const audioCodecs = 'aac,mp3,opus,vorbis';

  return {
    Name: 'Jellyfin Web',
    MaxStreamingBitrate: 40000000, // 40 Mbps
    MaxStaticBitrate: 40000000,
    MusicStreamingTranscodingBitrate: 256000,

    DirectPlayProfiles: [
      createVideoDirectPlay(videoContainers, videoCodecs, audioCodecs),
      createAudioDirectPlay('mp3', 'mp3'),
      createAudioDirectPlay('aac,m4a', 'aac'),
      createAudioDirectPlay('ogg', 'opus,vorbis'),
      createAudioDirectPlay('webm', 'opus,vorbis'),
    ],

    TranscodingProfiles: [
      createVideoTranscoding('ts', 'h264', 'aac', 'hls'),
      createAudioTranscoding('aac', 'aac'),
      createAudioTranscoding('mp3', 'mp3'),
    ],

    CodecProfiles: [
      createH264CodecProfile('42'), // Level 4.2 for web compatibility
      {
        Type: 'Video',
        Codec: 'vp9',
        Conditions: [
          createCondition('LessThanEqual', 'VideoBitDepth', '8'),
        ],
      },
      createAudioCodecProfile('aac', '6'),
    ],

    SubtitleProfiles: [
      createSubtitleProfile('vtt', 'External'),
      createSubtitleProfile('srt', 'External'),
      createSubtitleProfile('ass', 'Encode'),
      createSubtitleProfile('ssa', 'Encode'),
      createSubtitleProfile('pgs', 'Encode'),
    ],
  };
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Get the device profile for the current platform
 *
 * This profile tells Jellyfin what the device can play directly
 * and what needs transcoding.
 */
export function getDeviceProfile(): DeviceProfile {
  // Most specific matches first
  if (isAppleTV) {
    const profile = createTvOSProfile();
    console.log('Using tvOS profile, DirectPlay containers:', profile.DirectPlayProfiles?.[0]?.Container);
    return profile;
  }

  if (isAndroidTV) {
    return createAndroidTVProfile();
  }

  if (isIOS) {
    const profile = createIOSProfile();
    console.log('Using iOS profile, DirectPlay containers:', profile.DirectPlayProfiles?.[0]?.Container);
    return profile;
  }

  if (isAndroid) {
    return createAndroidProfile();
  }

  if (isMacOS) {
    return createMacOSProfile();
  }

  if (isWindows) {
    return createWindowsProfile();
  }

  if (isWeb) {
    return createWebProfile();
  }

  // Fallback to web profile (most conservative)
  return createWebProfile();
}

/**
 * Get a specific platform's device profile
 * Useful for testing or manual override
 */
export function getDeviceProfileForPlatform(
  platform: 'ios' | 'tvos' | 'android' | 'androidtv' | 'macos' | 'windows' | 'web'
): DeviceProfile {
  switch (platform) {
    case 'ios':
      return createIOSProfile();
    case 'tvos':
      return createTvOSProfile();
    case 'android':
      return createAndroidProfile();
    case 'androidtv':
      return createAndroidTVProfile();
    case 'macos':
      return createMacOSProfile();
    case 'windows':
      return createWindowsProfile();
    case 'web':
      return createWebProfile();
  }
}
