/**
 * Parses ISO 8601 duration (e.g. PT1H2M30S, PT15M51S) to total seconds.
 * Returns null if invalid or missing.
 */
export const parseYouTubeDuration = (isoDuration) => {
  if (!isoDuration || typeof isoDuration !== 'string') return null;
  const match = isoDuration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Extracts video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - VIDEO_ID (if already just an ID)
 */
export const extractVideoId = (url) => {
  if (!url) return null;

  // If it's already just an ID
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return url;
  }

  // Extract from watch URL
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Extract from youtu.be URL
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
};

/**
 * Gets YouTube thumbnail URL from video ID
 */
export const getThumbnailUrl = (videoId, quality = 'default') => {
  if (!videoId) return null;

  const qualities = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    max: 'maxresdefault',
  };

  const qualityKey = qualities[quality] || qualities.default;
  return `https://img.youtube.com/vi/${videoId}/${qualityKey}.jpg`;
};

/**
 * Extracts playlist ID from YouTube playlist URL
 * Supports formats:
 * - https://www.youtube.com/playlist?list=PLAYLIST_ID
 * - https://youtube.com/playlist?list=PLAYLIST_ID
 */
export const extractPlaylistId = (url) => {
  if (!url) return null;

  // Extract from playlist URL
  const playlistMatch = url.match(/[?&]list=([^&]+)/);
  if (playlistMatch) return playlistMatch[1];

  // If it's already just an ID
  if (!url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('?')) {
    return url;
  }

  return null;
};

/**
 * Fetches YouTube playlist metadata using oEmbed API
 * Note: This is a fallback - for full metadata, YouTube Data API v3 is recommended
 */
export const fetchPlaylistMetadata = async (playlistId) => {
  try {
    // YouTube oEmbed doesn't support playlists directly, so we'll use a workaround
    // For now, we'll return basic info that can be extracted from the URL
    // In production, you'd want to use YouTube Data API v3 with an API key

    // Alternative: Fetch the playlist page and parse metadata
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

    // Since we can't easily scrape in browser due to CORS, we'll return minimal metadata
    // The actual implementation would need a backend proxy or YouTube Data API
    return {
      playlistId,
      url: playlistUrl,
      // These would be fetched via API in production
      title: null,
      description: null,
      thumbnailUrl: null,
      videoCount: null,
    };
  } catch (error) {
    console.error('Failed to fetch playlist metadata:', error);
    return null;
  }
};

/**
 * Fetches video metadata from YouTube oEmbed API
 * This works for individual videos
 */
export const fetchVideoMetadata = async (videoId) => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }

    const data = await response.json();
    return {
      videoId,
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
      author: data.author_name,
      authorUrl: data.author_url,
    };
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    return null;
  }
};

const API_KEY = 'AIzaSyBYPwv0a-rRbTrvMA9nF4Wa1ryC0b6l7xw';

export const resolveHandleToChannelId = async (handle) => {
  const cleanHandle = handle.replace('@', '');
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${cleanHandle}&type=channel&maxResults=1&key=${API_KEY}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) throw new Error('Failed to resolve handle');
    const data = await response.json();
    return data.items?.[0]?.snippet?.channelId || null;
  } catch (error) {
    console.error('Error resolving handle:', error);
    return null;
  }
};

export const fetchChannelUploads = async (channelId, limit = 50) => {
  if (!channelId || !channelId.startsWith('UC')) return [];

  const uploadPlaylistId = 'UU' + channelId.substring(2);
  let allVideos = [];
  let nextPageToken = null;

  try {
    do {
      const remaining = limit - allVideos.length;
      if (remaining <= 0) break;
      const fetchSize = Math.min(50, remaining);

      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=${fetchSize}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) break;

      const data = await response.json();
      if (!data.items) break;

      const formattedVideos = data.items.map(item => ({
        video_id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        author: item.snippet.videoOwnerChannelTitle,
        published_at: item.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        is_local: false,
        view_count: null, // API doesn't return view count in playlistItems
        profile_image_url: null // Would need channel fetch for this
      }));

      allVideos = allVideos.concat(formattedVideos);
      nextPageToken = data.nextPageToken;

    } while (nextPageToken && allVideos.length < limit);

    return allVideos;
  } catch (error) {
    console.error('Error fetching channel uploads:', error);
    return [];
  }
};

