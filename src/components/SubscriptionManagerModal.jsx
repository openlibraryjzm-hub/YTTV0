import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, PlaySquare, Youtube } from 'lucide-react';
import { getPlaylistItems, addVideoToPlaylist } from '../api/playlistApi';
import { fetchChannelUploads, extractPlaylistId, fetchPlaylistVideos, extractChannelInfo } from '../utils/youtubeUtils';

const SubscriptionManagerModal = ({ isOpen, onClose, playlistId }) => {
    const [channels, setChannels] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingState, setFetchingState] = useState({}); // Stores fetching state per item ID
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Load available source items when modal opens
    useEffect(() => {
        if (isOpen && playlistId) {
            loadSources();
            setError(null);
            setSuccessMsg(null);
        } else if (isOpen && !playlistId) {
            setError('No playlist ID provided');
        }
    }, [isOpen, playlistId]);

    const loadSources = async () => {
        setLoading(true);
        setError(null);
        try {
            const id = parseInt(playlistId, 10);
            if (isNaN(id)) throw new Error(`Invalid playlist ID: ${playlistId}`);

            const items = await getPlaylistItems(id);

            const discoveredChannels = [];
            const discoveredPlaylists = [];

            items.forEach(item => {
                const url = item.video_url || '';

                // Identify channels
                const channelInfo = extractChannelInfo(url);
                const isChannel = channelInfo || item.isChannel || url.includes('youtube.com/channel/') || url.includes('youtube.com/@') || url.startsWith('@');

                // Identify playlists
                const extractedPlId = extractPlaylistId(url);
                const isPlaylist = extractedPlId && !isChannel;

                if (isChannel) {
                    discoveredChannels.push(item);
                } else if (isPlaylist) {
                    discoveredPlaylists.push({ ...item, extractedListId: extractedPlId });
                }
            });

            setChannels(discoveredChannels);
            setPlaylists(discoveredPlaylists);
        } catch (err) {
            console.error('Failed to load sources:', err);
            setError('Failed to load subscriptions: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const displayMsg = (msg, type = 'success') => {
        if (type === 'error') setError(msg);
        else setSuccessMsg(msg);
        setTimeout(() => {
            setError(null);
            setSuccessMsg(null);
        }, 4000);
    };

    const handleFetchChannel = async (item, limit) => {
        if (!window.confirm(`Fetch latest ${limit === Infinity ? 'ALL' : limit} videos for ${item.title}?`)) return;

        setFetchingState(prev => ({ ...prev, [item.id]: true }));
        try {
            const pid = parseInt(playlistId, 10);
            const existingItems = await getPlaylistItems(pid);
            const existingVideoIds = new Set(existingItems.map(i => i.video_id));

            // Determine Channel ID
            const channelInfo = extractChannelInfo(item.video_url);
            let targetId = null;
            if (channelInfo && channelInfo.type === 'id') {
                targetId = channelInfo.value;
            } else {
                // If it's a handle or we couldn't parse it well, we might need a backup
                // Assume the actual ID was saved as `video_id` when the channel card was created!
                if (item.video_id && item.video_id.startsWith('UC')) {
                    targetId = item.video_id;
                } else {
                    throw new Error("Could not definitively extract Channel ID. Make sure it's a direct channel link.");
                }
            }

            const fetchLimit = limit === Infinity ? 500 : limit; // Capping Infinity to 500 to prevent API exhaustion, but it "goes crazy" relative to 10
            const newVideos = await fetchChannelUploads(targetId, fetchLimit);

            let addedCount = 0;
            for (const v of newVideos) {
                if (!existingVideoIds.has(v.video_id)) {
                    await addVideoToPlaylist(
                        pid, v.video_url, v.video_id, v.title, null, v.author, null, v.published_at, false, null
                    );
                    existingVideoIds.add(v.video_id);
                    addedCount++;
                }
            }
            displayMsg(`Fetched ${addedCount} new videos from ${item.title}`);
        } catch (err) {
            console.error('Fetch error:', err);
            displayMsg(err.message || 'Error fetching channel videos', 'error');
        } finally {
            setFetchingState(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const handleRefreshPlaylist = async (item) => {
        setFetchingState(prev => ({ ...prev, [item.id]: true }));
        try {
            const pid = parseInt(playlistId, 10);
            const existingItems = await getPlaylistItems(pid);
            const existingVideoIds = new Set(existingItems.map(i => i.video_id));

            // Fetch up to 100 recent videos to see if there's anything new
            const newVideos = await fetchPlaylistVideos(item.extractedListId, 100);

            let addedCount = 0;
            for (const v of newVideos) {
                if (!existingVideoIds.has(v.video_id)) {
                    await addVideoToPlaylist(
                        pid, v.video_url, v.video_id, v.title, null, v.author, null, v.published_at, false, null
                    );
                    existingVideoIds.add(v.video_id);
                    addedCount++;
                }
            }
            displayMsg(`Refreshed ${addedCount} new videos from ${item.title}`);
        } catch (err) {
            console.error('Refresh error:', err);
            displayMsg(err.message || 'Error refreshing playlist', 'error');
        } finally {
            setFetchingState(prev => ({ ...prev, [item.id]: false }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[75vh] flex flex-col overflow-hidden">

                {/* Header (Light Theme) */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                            <RefreshCw className="text-sky-500" size={22} />
                            Subscription Manager
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Manage channels and playlists currently residing in this folder view.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors bg-slate-50 border border-slate-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative bg-slate-50/50">

                    {/* Feedback Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium shadow-sm sticky top-0 z-10">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium shadow-sm sticky top-0 z-10">
                            {successMsg}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : channels.length === 0 && playlists.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 bg-white shadow-sm rounded-2xl border border-slate-200 border-dashed">
                            No channels or playlists found in this view.<br />
                            <span className="text-xs mt-2 block opacity-70">Add a channel or playlist link via the '+' menu first!</span>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* Channels Section */}
                            {channels.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                        <Youtube className="text-red-500" size={16} /> Channel Subscriptions ({channels.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {channels.map(item => (
                                            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-sky-200 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                                                        {item.thumbnail_url ? (
                                                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{item.title?.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                        <a href={item.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1 mt-0.5">
                                                            View Channel <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-100 rounded-lg">
                                                    <span className="text-xs font-semibold text-slate-500">Fetch:</span>
                                                    {[1, 5, 10].map(num => (
                                                        <button
                                                            key={num}
                                                            onClick={() => handleFetchChannel(item, num)}
                                                            disabled={fetchingState[item.id]}
                                                            className="flex-1 text-[10px] font-bold py-1.5 px-2 bg-white border border-slate-200 rounded text-slate-600 hover:border-sky-300 hover:text-sky-600 disabled:opacity-50 transition-all"
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => handleFetchChannel(item, Infinity)}
                                                        disabled={fetchingState[item.id]}
                                                        className="flex-1 text-[10px] font-bold py-1.5 px-2 bg-sky-500 border border-sky-600 rounded text-white hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        {fetchingState[item.id] ? <RefreshCw size={10} className="animate-spin" /> : 'ALL'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Playlists Section */}
                            {playlists.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                        <PlaySquare className="text-sky-500" size={16} /> Tracked Playlists ({playlists.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {playlists.map(item => (
                                            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-8 rounded shrink-0 bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                        {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                            <PlaySquare className="text-white/80" size={12} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                        <a href={item.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 mt-0.5">
                                                            View Playlist <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRefreshPlaylist(item)}
                                                    disabled={fetchingState[item.id]}
                                                    className="w-full mt-auto flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 disabled:opacity-50 transition-all"
                                                >
                                                    <RefreshCw size={14} className={fetchingState[item.id] ? "animate-spin" : ""} />
                                                    {fetchingState[item.id] ? 'Refreshing...' : 'Refresh Latest'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagerModal;
