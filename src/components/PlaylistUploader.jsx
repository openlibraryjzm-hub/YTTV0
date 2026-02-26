import React, { useState, useRef, useEffect } from 'react';
import { createPlaylist, addVideoToPlaylist, assignVideoToFolder, getAllPlaylists, getPlaylistItems, getVideosInFolder, addPlaylistSource } from '../api/playlistApi';
import { extractPlaylistId, extractVideoId, parseYouTubeDuration } from '../utils/youtubeUtils';
import { FOLDER_COLORS } from '../utils/folderColors';
import PlaylistFolderSelector from './PlaylistFolderSelector';

const PlaylistUploader = ({ onUploadComplete, onCancel, initialPlaylistId }) => {
  // Main Tab State
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'modify', 'json', 'twitterJson'

  // General State
  const [availablePlaylists, setAvailablePlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  // === NEW: SUBSCRIPTION STATE ===
  const [subscribeToChannels, setSubscribeToChannels] = useState(false);
  const [maxVideosPerSource, setMaxVideosPerSource] = useState(50); // 10, 20, 50

  // === ADD TAB STATE ===
  const [targetMode, setTargetMode] = useState('existing'); // 'existing' or 'new'
  // If initialPlaylistId is provided, use it. Otherwise empty string (for Unsorted/Default).
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(initialPlaylistId ? String(initialPlaylistId) : '');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  const [playlistLinks, setPlaylistLinks] = useState({
    all: '', // No folder assignment
    ...FOLDER_COLORS.reduce((acc, color) => {
      acc[color.id] = '';
      return acc;
    }, {}),
  });
  const [showFolderFields, setShowFolderFields] = useState(false);

  // Selector Modal State (for adding existing playlists/folders to inputs)
  const [showSelector, setShowSelector] = useState(false);
  const [selectorField, setSelectorField] = useState(null);

  // === JSON TAB STATE ===
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef(null);

  // === TWITTER JSON TAB STATE ===
  const [twitterJsonInput, setTwitterJsonInput] = useState('');
  const [twitterTargetPlaylistId, setTwitterTargetPlaylistId] = useState(initialPlaylistId ? String(initialPlaylistId) : '');
  const twitterFileInputRef = useRef(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const playlists = await getAllPlaylists();
      setAvailablePlaylists(playlists);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
  };

  // ==========================================
  // LOGIC: LINK PARSING & IMPORTING (From BulkImporter)
  // ==========================================

  const parseLinks = (text) => {
    if (!text || !text.trim()) return [];
    return text
      .split(/\n/)
      .flatMap(line => {
        if (line.includes(',')) return line.split(',').map(part => part.trim());
        if (line.includes(';')) return line.split(';').map(part => part.trim());
        if (line.includes('|')) return line.split('|').map(part => part.trim());
        return line.split(/\s+/).map(part => part.trim());
      })
      .filter(link => {
        if (!link) return false;
        const isYouTube = (
          link.includes('youtube.com/playlist') ||
          link.includes('youtu.be') ||
          (link.includes('youtube.com/watch') && link.includes('list=')) ||
          (link.includes('youtube.com/watch') && link.includes('list=')) ||
          link.includes('youtube.com/watch') || // Single video support
          link.includes('youtube.com/channel/') ||
          link.includes('youtube.com/@')
        );
        const isLocal = link.startsWith('local:playlist:') || link.startsWith('local:folder:');
        return isYouTube || isLocal;
      })
      .filter((link, index, self) => self.indexOf(link) === index);
  };

  const fetchPlaylistVideos = async (playlistUrl) => {
    const API_KEY = 'AIzaSyBYPwv0a-rRbTrvMA9nF4Wa1ryC0b6l7xw';

    // Check if it's a single video
    const singleVideoId = extractVideoId(playlistUrl);
    // If it has 'list=', it might be a playlist, but extractVideoId favors video ID.
    // Let's check specifically for playlist ID first.
    const playlistId = extractPlaylistId(playlistUrl);

    // Note: extractVideoId will return ID even if it is part of a playlist URL like watch?v=...&list=...
    // We prioritize playlist import if it IS a playlist URL (contains list=), UNLESS it is just a watch URL without list.
    // Actually, user might paste a single video.

    // Logic: 
    // If it has "list=PL...", treat as playlist.
    // Else if it has "v=..." or "youtu.be/...", treat as single video.

    if (playlistId) {
      // --- PLAYLIST IMPORT ---
      // If subscription mode and it looks like a channel ID (UC...), define uploads playlist (UU...)
      let targetListId = playlistId;
      if (playlistId.startsWith('UC')) {
        targetListId = 'UU' + playlistId.substring(2);
      }

      const playlistDetailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${targetListId}&key=${API_KEY}`;
      const playlistResponse = await fetch(playlistDetailsUrl);

      if (!playlistResponse.ok) throw new Error('Failed to fetch playlist details');
      const playlistData = await playlistResponse.json();
      if (!playlistData.items?.length) throw new Error('Playlist not found or private');

      const sourcePlaylistName = playlistData.items[0].snippet.title;
      let nextPageToken = null;
      let allVideos = [];

      // Loop for pages ONLY if NOT subscribing or if we want more than 50
      // If subscribing, we usually want just the latest X. But let's respect maxVideosPerSource regardless.
      // API maxResults is 50.

      let fetchCount = 0;
      const effectiveLimit = subscribeToChannels ? maxVideosPerSource : 1000; // Default limit for massive playlists?

      do {
        const remaining = effectiveLimit - allVideos.length;
        if (remaining <= 0) break;
        const fetchSize = Math.min(50, remaining);

        const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${targetListId}&maxResults=${fetchSize}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const res = await fetch(videosUrl);
        if (!res.ok) throw new Error('Failed to fetch videos');
        const data = await res.json();
        if (data.items) allVideos = allVideos.concat(data.items);
        nextPageToken = data.nextPageToken;
      } while (nextPageToken && allVideos.length < effectiveLimit);

      if (allVideos.length === 0) throw new Error('No videos in playlist');

      // 3. Fetch view counts (and ensure other details) for all videos
      // The playlistItems endpoint doesn't give view counts, we need the 'videos' endpoint.
      // We can fetch in batches of 50.
      const videoIds = allVideos.map(item => item.snippet.resourceId.videoId);
      const videoDetails = {};

      for (let i = 0; i < videoIds.length; i += 50) {
        const batch = videoIds.slice(i, i + 50);
        const batchUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(',')}&key=${API_KEY}`;
        try {
          const batchRes = await fetch(batchUrl);
          if (batchRes.ok) {
            const batchData = await batchRes.json();
            if (batchData.items) {
              batchData.items.forEach(v => {
                const durationIso = v.contentDetails?.duration;
                const durationSeconds = durationIso ? parseYouTubeDuration(durationIso) : null;
                const tagsArr = v.snippet?.tags;
                const tagsStr = Array.isArray(tagsArr) && tagsArr.length > 0 ? JSON.stringify(tagsArr) : null;
                videoDetails[v.id] = {
                  videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
                  title: v.snippet.title,
                  thumbnailUrl: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
                  author: v.snippet.channelTitle,
                  viewCount: v.statistics?.viewCount,
                  publishedAt: v.snippet.publishedAt,
                  durationSeconds: durationSeconds ?? undefined,
                  description: v.snippet.description || undefined,
                  tags: tagsStr ?? undefined
                };
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch batch details', err);
        }
      }

      return {
        sourcePlaylistName,
        videos: allVideos
          .filter(item => item.snippet?.resourceId?.kind === 'youtube#video')
          .map(item => {
            const vid = item.snippet.resourceId.videoId;
            const details = videoDetails[vid] || {};
            return {
              videoId: vid,
              videoUrl: details.videoUrl || `https://www.youtube.com/watch?v=${vid}`,
              title: details.title || item.snippet.title,
              thumbnailUrl: details.thumbnailUrl || item.snippet.thumbnails?.medium?.url,
              author: details.author || item.snippet.videoOwnerChannelTitle || 'Unknown',
              viewCount: details.viewCount || '0',
              publishedAt: details.publishedAt || item.snippet.publishedAt,
              durationSeconds: details.durationSeconds,
              description: details.description,
              tags: details.tags
            };
          })
      };
    } else if (singleVideoId) {
      // --- SINGLE VIDEO IMPORT ---
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${singleVideoId}&key=${API_KEY}`;
      const res = await fetch(videoUrl);
      const data = await res.json();
      let title = 'Unknown Video';
      let thumbnailUrl = null;
      let author = 'Unknown';
      let viewCount = '0';
      let publishedAt = null;
      let durationSeconds = null;
      let description = null;
      let tags = null;

      if (data.items && data.items.length > 0) {
        const snippet = data.items[0].snippet;
        const statistics = data.items[0].statistics;
        const contentDetails = data.items[0].contentDetails;
        title = snippet.title;
        thumbnailUrl = snippet.thumbnails?.medium?.url;
        author = snippet.channelTitle;
        viewCount = statistics?.viewCount || '0';
        publishedAt = snippet.publishedAt;
        if (contentDetails?.duration) {
          durationSeconds = parseYouTubeDuration(contentDetails.duration);
        }
        description = snippet.description || null;
        if (Array.isArray(snippet.tags) && snippet.tags.length > 0) {
          tags = JSON.stringify(snippet.tags);
        }
      }

      return {
        sourcePlaylistName: 'Single Video',
        videos: [{
          videoId: singleVideoId,
          videoUrl: `https://www.youtube.com/watch?v=${singleVideoId}`,
          title,
          thumbnailUrl,
          author,
          viewCount,
          publishedAt,
          durationSeconds,
          description,
          tags
        }]
      };
    } else if (playlistUrl.includes('@')) {
      // --- HANDLE IMPORT ---
      const handleMatch = playlistUrl.match(/@([\w\.\-_]+)/);
      if (!handleMatch) throw new Error('Invalid handle URL');

      const handle = handleMatch[1];
      // Need to resolve handle to channel ID
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=@${handle}&type=channel&maxResults=1&key=${API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.items?.length) throw new Error('Channel not found for handle: ' + handle);

      const channelId = searchData.items[0].snippet.channelId; // UC...
      const targetListId = 'UU' + channelId.substring(2); // Convert to Uploads

      // Recurse or reuse logic? Let's just call fetchPlaylistVideos recursively with the uploads specific URL?
      // Or inline the logic? Inlining is safer to avoid loop.
      // Actually, just calling recursively with the NEW list ID (which will be caught by the first block) involves minimal overhead.
      // We construct a fake URL for the recursion
      return await fetchPlaylistVideos(`https://www.youtube.com/playlist?list=${targetListId}`);

    } else {
      throw new Error(`Invalid URL: ${playlistUrl}`);
    }
  };

  const fetchLocalPlaylistVideos = async (id) => {
    const items = await getPlaylistItems(parseInt(id));
    return {
      sourcePlaylistName: `Local Playlist ${id}`,
      videos: items.map(i => ({
        videoId: i.video_id,
        videoUrl: i.video_url,
        title: i.title,
        thumbnailUrl: i.thumbnail_url,
        author: i.author || 'Unknown',
        viewCount: i.view_count || '0',
        publishedAt: i.published_at || null,
        durationSeconds: i.duration_seconds ?? undefined,
        description: i.description ?? undefined,
        tags: i.tags ?? undefined
      }))
    };
  };

  const fetchLocalFolderVideos = async (id, color) => {
    const items = await getVideosInFolder(parseInt(id), color);
    return {
      sourcePlaylistName: `Local ${color} Folder`,
      videos: items.map(i => ({
        videoId: i.video_id,
        videoUrl: i.video_url,
        title: i.title,
        thumbnailUrl: i.thumbnail_url,
        author: i.author || 'Unknown',
        viewCount: i.view_count || '0',
        publishedAt: i.published_at || null,
        durationSeconds: i.duration_seconds ?? undefined,
        description: i.description ?? undefined,
        tags: i.tags ?? undefined
      }))
    };
  };

  // ==========================================
  // HANDLERS: ADD TAB
  // ==========================================

  const handleLinkChange = (field, value) => {
    setPlaylistLinks(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSelectorClick = (field) => {
    setSelectorField(field);
    setShowSelector(true);
  };

  const handleSelectorSelect = (selectedItems) => {
    if (selectorField && selectedItems.length > 0) {
      const current = playlistLinks[selectorField] || '';
      const addition = selectedItems.join('\n');
      handleLinkChange(selectorField, current ? `${current}\n${addition}` : addition);
    }
    setShowSelector(false);
    setSelectorField(null);
  };

  const handleAddSubmit = async () => {
    // 1. Determine Target Playlist
    let dbPlaylistId;
    let targetName = '';

    try {
      setLoading(true);
      setError(null);

      if (targetMode === 'new') {
        if (!newPlaylistName.trim()) throw new Error('Playlist Name is required');
        targetName = newPlaylistName;
        setProgress({ current: 0, total: 1, message: 'Creating new playlist...' });
        dbPlaylistId = await createPlaylist(newPlaylistName, newPlaylistDescription);
      } else {
        // Existing or Unsorted
        if (selectedPlaylistId === '') {
          // Check if Unsorted exists
          const unsorted = availablePlaylists.find(p => p.name === 'Unsorted');
          if (unsorted) {
            dbPlaylistId = unsorted.id;
            targetName = 'Unsorted';
          } else {
            targetName = 'Unsorted';
            dbPlaylistId = await createPlaylist('Unsorted', 'Automatically created');
          }
        } else {
          dbPlaylistId = parseInt(selectedPlaylistId);
          const pl = availablePlaylists.find(p => p.id === dbPlaylistId);
          targetName = pl ? pl.name : 'Unknown';
        }
      }

      // 2. Gather all links
      const tasks = []; // { url, folderColor }

      // All/NoFolder
      const allLinks = parseLinks(playlistLinks.all);
      allLinks.forEach(url => tasks.push({ url, folderColor: null }));

      // Folders
      FOLDER_COLORS.forEach(color => {
        const links = parseLinks(playlistLinks[color.id]);
        links.forEach(url => tasks.push({ url, folderColor: color.id }));
      });

      if (tasks.length === 0) {
        if (targetMode === 'new') {
          setProgress({ current: 1, total: 1, message: `Complete! Created empty playlist "${targetName}".` });
          setTimeout(() => {
            if (onUploadComplete) onUploadComplete();
          }, 1500);
          return;
        }
        throw new Error('No valid links found to import.');
      }

      // 3. Process Imports
      setProgress({ current: 0, total: tasks.length, message: 'Fetching videos...' });

      // Flatten into list of videos with folder assignments
      let allVideosToInsert = [];

      for (let i = 0; i < tasks.length; i++) {
        const { url, folderColor } = tasks[i];
        setProgress({ current: i + 1, total: tasks.length, message: `Fetching from link ${i + 1}/${tasks.length}` });

        try {
          let result;
          if (url.startsWith('local:playlist:')) {
            result = await fetchLocalPlaylistVideos(url.replace('local:playlist:', ''));
          } else if (url.startsWith('local:folder:')) {
            const [pid, col] = url.replace('local:folder:', '').split(':');
            result = await fetchLocalFolderVideos(pid, col);
          } else {
            result = await fetchPlaylistVideos(url);
          }

          // Add to list, tagging with folder
          result.videos.forEach(v => {
            allVideosToInsert.push({ ...v, folderColor });
          });

        } catch (e) {
          console.error(`Failed to fetch ${url}`, e);
          // We'll continue but maybe log error to UI? Simplified for now.
        }
      }

      if (allVideosToInsert.length === 0) {
        throw new Error('Could not fetch any videos from provided links.');
      }

      // --- NEW: Add Sources for Subscription ---
      if (subscribeToChannels && dbPlaylistId) {
        setProgress({ current: 0, total: 1, message: 'Saving subscription sources...' });
        // We need to identify the "source intent" from the provided links.
        // Since we flattened everything, we might need to look at the original tasks.

        for (const task of tasks) {
          const url = task.url;
          // Identify source type and value
          let sourceType = null;
          let sourceValue = null;

          const pid = extractPlaylistId(url);
          if (pid) {
            if (pid.startsWith('UU')) {
              // It's an uploads playlist, treat as channel source (convert back to UC?)
              // Or just store as channel source with UC ID?
              // The user pastes a channel link usually.
              // If they pasted a channel link, we want to store the CHANNEL ID.
              // If they pasted a playlist link, we want to store the PLAYLIST ID.

              // Our parser converts channel URL to ... we haven't converted it yet in "tasks", only in "fetch".
              // "parseLinks" returns the raw URL.

              // If raw URL has "channel/", extract ID.
              if (url.includes('channel/')) {
                const m = url.match(/channel\/(UC[\w\-]+)/);
                if (m) { sourceType = 'channel'; sourceValue = m[1]; }
              } else if (url.includes('@')) {
                // We resolved this during fetch, but we don't have the result here easily.
                // For now, let's just store the HANDLE if possible? 
                // No, backend expects ID.
                // We might need to re-resolve or cache the resolution.
                // Let's assume we re-resolve quickly or skip handles for V1 of subscription.
                // Actually, let's look at the fetch result.
                // 'fetchPlaylistVideos' returns 'sourcePlaylistName' but not the ID.

                // Optimization: Just add the resolved ID during the fetch phase to a "sourcesToAdd" list.
              } else {
                // Standard playlist
                const listId = extractPlaylistId(url);
                if (listId) { sourceType = 'playlist'; sourceValue = listId; }
              }
            } else {
              sourceType = 'playlist';
              sourceValue = pid;
            }
          }

          // Handle @handles specifically if we can
          if (!sourceType && url.includes('@')) {
            // We have to resolve it again? That's wasteful. 
            // Let's rely on the fact that we can call extractVideoId which returns null for channels.
          }

          if (sourceType && sourceValue) {
            console.log(`[PlaylistUploader] Adding subscription source: Type=${sourceType}, Value=${sourceValue}, Limit=${maxVideosPerSource}`);
            try {
              await addPlaylistSource(dbPlaylistId, sourceType, sourceValue, maxVideosPerSource);
            } catch (err) {
              console.error('[PlaylistUploader] Failed to add subscription source:', err);
              // Don't block video import, but log it
            }
          } else {
            console.warn(`[PlaylistUploader] Could not determine source type/value for URL: ${url}`);
          }
        }
      }

      // 4. Insert into DB
      setProgress({ current: 0, total: 1, message: 'Checking for duplicates...' });

      const existingItems = await getPlaylistItems(dbPlaylistId);
      const existingVideoIds = new Set(existingItems.map(item => item.video_id));

      const uniqueVideosToInsert = [];
      const seenVideoIds = new Set();

      for (const v of allVideosToInsert) {
        if (!existingVideoIds.has(v.videoId) && !seenVideoIds.has(v.videoId)) {
          uniqueVideosToInsert.push(v);
          seenVideoIds.add(v.videoId);
        } else if (v.folderColor) {
          // If it's a duplicate but has a folder color, we might want to still assign it to the folder. 
          // But user requested "only unique links are added". We'll just skip it.
        }
      }

      const skippedCount = allVideosToInsert.length - uniqueVideosToInsert.length;
      allVideosToInsert = uniqueVideosToInsert;

      if (allVideosToInsert.length === 0) {
        let msg = skippedCount > 0
          ? `Complete! Skipped ${skippedCount} duplicate videos. No new videos added.`
          : `Complete! Created empty playlist "${targetName}".`;

        setProgress({ current: 1, total: 1, message: msg });
        setTimeout(() => {
          if (onUploadComplete) onUploadComplete();
        }, 2000);
        return;
      }

      setProgress({ current: 0, total: allVideosToInsert.length, message: `Adding ${allVideosToInsert.length} videos to "${targetName}"...` });

      let addedCount = 0;
      for (let i = 0; i < allVideosToInsert.length; i++) {
        const v = allVideosToInsert[i];
        try {
          const itemId = await addVideoToPlaylist(dbPlaylistId, v.videoUrl, v.videoId, v.title, v.thumbnailUrl, v.author, v.viewCount, v.publishedAt, false, null, v.durationSeconds ?? null, v.description ?? null, v.tags ?? null, null, null);
          addedCount++;

          if (v.folderColor) {
            await assignVideoToFolder(dbPlaylistId, itemId, v.folderColor);
          }

          if (i % 5 === 0) {
            setProgress({ current: i + 1, total: allVideosToInsert.length, message: `Adding videos... ${i + 1}/${allVideosToInsert.length}` });
          }
        } catch (e) {
          console.error('Insert failed', e);
        }
      }

      setProgress({ current: addedCount, total: addedCount, message: `Complete! Added ${addedCount} videos.` });

      setTimeout(() => {
        if (onUploadComplete) onUploadComplete();
      }, 1500);

    } catch (e) {
      console.error('Import failed', e);
      setError(e.message);
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: JSON TAB
  // ==========================================

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { setError('Please select a JSON file'); return; }

    try {
      const text = await file.text();
      setJsonInput(text);
      // Auto-parse to see if it's a backup, maybe switch tab? 
      // For now just fill input.
    } catch (error) {
      setError('Failed to read file: ' + error.message);
    }
  };

  const handleJsonSubmit = async () => {
    // Reuse existing JSON logic, simplified for brevity but functional
    if (!jsonInput.trim()) { setError('Please input JSON'); return; }

    try {
      setLoading(true);
      const data = JSON.parse(jsonInput);

      setProgress({ current: 0, total: 0, message: 'Processing JSON...' });

      // Determine name
      const pName = data.playlist?.name || 'Imported JSON';
      const pDesc = data.playlist?.description || '';

      const dbId = await createPlaylist(pName, pDesc);

      const videos = data.videos || (data.playlist?.videos) || [];
      if (!Array.isArray(videos)) throw new Error('No videos array found');

      setProgress({ current: 0, total: videos.length, message: `Importing ${videos.length} videos...` });

      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        // Support various formats
        const u = v.url || v.video_url || v.videoUrl;
        const vid = v.videoId || v.video_id || extractVideoId(u);
        if (!vid) continue;

        const itemId = await addVideoToPlaylist(dbId, u || `https://youtube.com/watch?v=${vid}`, vid, v.title, v.thumbnailUrl || v.thumbnail_url, v.author, v.viewCount, v.publishedAt || v.published_at, v.isLocal || false, null, v.durationSeconds ?? v.duration_seconds ?? null, v.description ?? null, v.tags ?? null, null, null);

        // Folder assignments
        if (v.folder_assignments && Array.isArray(v.folder_assignments)) {
          for (const c of v.folder_assignments) {
            await assignVideoToFolder(dbId, itemId, c);
          }
        }

        if (i % 10 === 0) setProgress({ current: i + 1, total: videos.length, message: `Importing... ${i + 1}` });
      }

      setTimeout(() => { if (onUploadComplete) onUploadComplete(); }, 1000);

    } catch (e) {
      setError('JSON Import Failed: ' + e.message);
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: TWITTER JSON TAB
  // ==========================================

  const handleTwitterFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { setError('Please select a JSON file'); return; }

    try {
      const text = await file.text();
      setTwitterJsonInput(text);
    } catch (error) {
      setError('Failed to read file: ' + error.message);
    }
  };

  const handleTwitterJsonSubmit = async () => {
    if (!twitterJsonInput.trim()) { setError('Please input Twitter JSON'); return; }

    try {
      setLoading(true);
      setError(null);
      const tweets = JSON.parse(twitterJsonInput);

      if (!Array.isArray(tweets)) throw new Error('Expected an array of tweets');

      // Determine target playlist
      let dbPlaylistId;
      let targetName = '';

      if (twitterTargetPlaylistId === '') {
        // Check if Unsorted exists
        const unsorted = availablePlaylists.find(p => p.name === 'Unsorted');
        if (unsorted) {
          dbPlaylistId = unsorted.id;
          targetName = 'Unsorted';
        } else {
          targetName = 'Unsorted';
          dbPlaylistId = await createPlaylist('Unsorted', 'Automatically created');
        }
      } else {
        dbPlaylistId = parseInt(twitterTargetPlaylistId);
        const pl = availablePlaylists.find(p => p.id === dbPlaylistId);
        targetName = pl ? pl.name : 'Unknown';
      }

      // Filter tweets that have media (videos, photos, gifs)
      const tweetsWithMedia = tweets.filter(tweet => tweet.media && tweet.media.length > 0);

      console.log(`Twitter JSON: Total tweets: ${tweets.length}, Tweets with media: ${tweetsWithMedia.length}`);

      if (tweetsWithMedia.length === 0) {
        throw new Error('No tweets with media found in JSON');
      }

      setProgress({ current: 0, total: 1, message: 'Checking for duplicates...' });

      const existingItems = await getPlaylistItems(dbPlaylistId);
      const existingVideoIds = new Set(existingItems.map(item => item.video_id));

      const uniqueTweetsToInsert = [];
      const seenTweetIds = new Set();

      for (const tweet of tweetsWithMedia) {
        if (!existingVideoIds.has(tweet.id) && !seenTweetIds.has(tweet.id)) {
          uniqueTweetsToInsert.push(tweet);
          seenTweetIds.add(tweet.id);
        }
      }

      const skippedCount = tweetsWithMedia.length - uniqueTweetsToInsert.length;
      let finalTweetsToInsert = uniqueTweetsToInsert;

      if (finalTweetsToInsert.length === 0) {
        let msg = skippedCount > 0
          ? `Complete! Skipped ${skippedCount} duplicate tweets. No new tweets added.`
          : `Complete! Created empty playlist "${targetName}".`;

        setProgress({ current: 1, total: 1, message: msg });
        setTimeout(() => {
          if (onUploadComplete) onUploadComplete();
        }, 2000);
        return;
      }

      setProgress({ current: 0, total: finalTweetsToInsert.length, message: `Importing ${finalTweetsToInsert.length} tweets to "${targetName}"...` });


      let addedCount = 0;
      for (let i = 0; i < finalTweetsToInsert.length; i++) {
        const tweet = finalTweetsToInsert[i];

        try {
          // Use the first media item's original URL as the "video"
          const media = tweet.media[0];
          const mediaUrl = media.original || media.url;

          // Create a unique ID from tweet ID
          const tweetId = tweet.id;

          // Clean tweet text by removing:
          // - "RT @username: " at the start (retweets)
          // - "@username " mentions (especially at start for replies)
          // - Quoted tweet handles
          const cleanTweetText = (text) => {
            if (!text) return '';

            let cleaned = text;

            // Remove "RT @username: " pattern at the start
            cleaned = cleaned.replace(/^RT\s+@\w+:\s*/i, '');

            // Remove @mentions at the very start (replies)
            cleaned = cleaned.replace(/^@\w+\s+/g, '');

            // Remove multiple @mentions in a row at the start
            cleaned = cleaned.replace(/^(@\w+\s+)+/g, '');

            // Trim whitespace
            cleaned = cleaned.trim();

            return cleaned;
          };

          // Build title with just the cleaned tweet text
          const title = cleanTweetText(tweet.full_text);

          // Use thumbnail if available
          const thumbnailUrl = media.thumbnail || media.original;

          // Add as a "local" video since it's not YouTube
          const itemId = await addVideoToPlaylist(
            dbPlaylistId,
            mediaUrl, // video_url
            tweetId, // video_id (using tweet ID)
            title,
            thumbnailUrl,
            `${tweet.name} (@${tweet.screen_name})`, // author
            String(tweet.views_count || 0), // view_count (convert to string)
            tweet.created_at, // published_at
            true, // is_local (since it's Twitter media, not YouTube)
            tweet.profile_image_url || null, // profile_image_url
            null, null, null, null, null // durationSeconds, description, tags, likeCount, commentCount
          );

          addedCount++;

          if (i % 5 === 0) {
            setProgress({ current: i + 1, total: tweetsWithMedia.length, message: `Adding tweets... ${i + 1}/${tweetsWithMedia.length}` });
          }
        } catch (e) {
          console.error(`Failed to import tweet ${tweet.id}:`, e);
        }
      }

      setProgress({ current: addedCount, total: addedCount, message: `Complete! Added ${addedCount} tweets.` });

      // Show warning if no tweets were added
      if (addedCount === 0) {
        setError(`No tweets were successfully imported. Found ${tweetsWithMedia.length} tweets with media, but all failed to import. Check console for details.`);
        setLoading(false);
        return;
      }

      setTimeout(() => {
        if (onUploadComplete) onUploadComplete();
      }, 1500);

    } catch (e) {
      console.error('Twitter JSON Import failed', e);
      setError('Twitter JSON Import Failed: ' + e.message);
      setLoading(false);
    }
  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {showSelector && (
        <PlaylistFolderSelector
          onSelect={handleSelectorSelect}
          onCancel={() => setShowSelector(false)}
        />
      )}

      <div className="w-full max-w-4xl mx-auto p-0 bg-slate-800 rounded-lg border border-slate-700 flex flex-col h-[80vh] max-h-[800px]">

        {/* HEADER & TABS */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-lg">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'add' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              Add
            </button>
            <button
              onClick={() => setActiveTab('modify')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'modify' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              Modify
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'json' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab('twitterJson')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'twitterJson' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              Twitter JSON
            </button>
          </div>

          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-600">

          {/* === ADD TAB === */}
          {activeTab === 'add' && (
            <div className="space-y-6">
              {/* 1. Target Playlist Bar */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-wrap gap-4 items-center">
                <div className="flex-shrink-0 text-slate-300 font-medium">Add to:</div>

                {targetMode === 'existing' ? (
                  <div className="flex-1 flex gap-2">
                    <select
                      value={selectedPlaylistId}
                      onChange={(e) => setSelectedPlaylistId(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                      disabled={loading}
                    >
                      <option value="">Default (Unsorted)</option>
                      {availablePlaylists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setTargetMode('new')}
                      className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-colors"
                      title="Create New Playlist"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      placeholder="New Playlist Name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg p-2.5 focus:border-green-500 focus:outline-none"
                      autoFocus
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={newPlaylistDescription}
                        onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-600 text-white text-sm rounded-lg p-2.5 focus:border-green-500 focus:outline-none"
                        disabled={loading}
                      />
                      <button
                        onClick={() => setTargetMode('existing')}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. All Links Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">Links (YouTube Playlists, Videos, or Local Refs)</label>
                  <button
                    onClick={() => handleAddSelectorClick('all')}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Existing
                  </button>
                </div>
                <textarea
                  value={playlistLinks.all}
                  onChange={(e) => handleLinkChange('all', e.target.value)}
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 font-mono focus:border-sky-500 focus:outline-none resize-none"
                  placeholder="Paste links here..."
                  disabled={loading}
                />
              </div>

              {/* Subscription Options */}
              <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscribeToChannels}
                    onChange={(e) => setSubscribeToChannels(e.target.checked)}
                    className="w-4 h-4 text-sky-500 rounded border-slate-600 focus:ring-sky-500 bg-slate-700"
                  />
                  <span>Subscribe (Auto-update)</span>
                </label>

                {subscribeToChannels && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <span className="text-xs text-slate-400">Limit:</span>
                    <select
                      value={maxVideosPerSource}
                      onChange={(e) => setMaxVideosPerSource(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-600 text-white text-xs rounded p-1"
                    >
                      <option value={10}>10 videos</option>
                      <option value={20}>20 videos</option>
                      <option value={50}>50 videos</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 3. Colored Folders Toggle */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowFolderFields(!showFolderFields)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 transition-colors"
                  disabled={loading}
                >
                  <span className="font-medium text-slate-300 text-sm">Colored Folder Assignments</span>
                  <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${showFolderFields ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showFolderFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                    {FOLDER_COLORS.map(color => (
                      <div key={color.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex }}></div>
                            <span>{color.name}</span>
                          </div>
                          <button onClick={() => handleAddSelectorClick(color.id)} className="hover:text-white" disabled={loading}>+</button>
                        </div>
                        <textarea
                          value={playlistLinks[color.id]}
                          onChange={(e) => handleLinkChange(color.id, e.target.value)}
                          className="w-full h-20 bg-slate-900 border border-slate-700/50 rounded-md p-2 text-xs font-mono focus:outline-none resize-none"
                          style={{ borderLeft: `3px solid ${color.hex}` }}
                          placeholder="Links..."
                          disabled={loading}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* === MODIFY TAB === */}
          {activeTab === 'modify' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <p className="text-lg font-medium">Modify Playlist</p>
              <p className="text-sm">Coming soon. Select specific playlists to batch edit or reorganize.</p>
            </div>
          )}

          {/* === JSON TAB === */}
          {activeTab === 'json' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Paste Configuration or Upload File</label>
                <div>
                  <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileSelect} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md transition-colors"
                    disabled={loading}
                  >
                    Upload File
                  </button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:border-sky-500 focus:outline-none resize-none"
                placeholder="{ 'playlist': ... }"
                disabled={loading}
              />
            </div>
          )}

          {/* === TWITTER JSON TAB === */}
          {activeTab === 'twitterJson' && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Playlist Selector */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <label className="text-sm font-medium text-slate-300 block mb-2">Add to Playlist:</label>
                <select
                  value={twitterTargetPlaylistId}
                  onChange={(e) => setTwitterTargetPlaylistId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                  disabled={loading}
                >
                  <option value="">Default (Unsorted)</option>
                  {availablePlaylists.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* File Upload / Paste Area */}
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Twitter Bookmarks JSON</label>
                <div>
                  <input type="file" ref={twitterFileInputRef} accept=".json" onChange={handleTwitterFileSelect} className="hidden" />
                  <button
                    onClick={() => twitterFileInputRef.current?.click()}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md transition-colors"
                    disabled={loading}
                  >
                    Upload File
                  </button>
                </div>
              </div>
              <textarea
                value={twitterJsonInput}
                onChange={(e) => setTwitterJsonInput(e.target.value)}
                className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:border-sky-500 focus:outline-none resize-none"
                placeholder='[{"id": "...", "full_text": "...", "media": [...], ...}]'
                disabled={loading}
              />
              <p className="text-xs text-slate-400">
                Upload Twitter bookmarks JSON. Only tweets with media (videos, photos, GIFs) will be imported.
              </p>
            </div>
          )}

        </div>

        {/* FOOTER & STATUS */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-lg space-y-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{progress.message}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${(progress.total ? (progress.current / progress.total * 100) : 0)}%` }}></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={
                activeTab === 'add' ? handleAddSubmit :
                  activeTab === 'json' ? handleJsonSubmit :
                    activeTab === 'twitterJson' ? handleTwitterJsonSubmit :
                      () => { }
              }
              disabled={loading || activeTab === 'modify'}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${loading || activeTab === 'modify' ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-sky-500 hover:bg-sky-600'}`}
            >
              {loading ? 'Processing...' : (
                activeTab === 'add' ? 'Import to Playlist' :
                  activeTab === 'json' ? 'Import JSON' :
                    activeTab === 'twitterJson' ? 'Import Twitter JSON' :
                      'Save Changes'
              )}
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default PlaylistUploader;

