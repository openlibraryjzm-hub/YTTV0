import React, { useState, useEffect } from 'react';
import { X, Trash2, ExternalLink, Plus, RefreshCw, Youtube } from 'lucide-react';
import {
    getPlaylistSources,
    removePlaylistSource,
    updatePlaylistSourceLimit,
    addPlaylistSource,
    getPlaylistItems,
    addVideoToPlaylist,
    updatePlaylistSourceName,
    updatePlaylistSourceSync
} from '../api/playlistApi';
import { resolveHandleToChannelId, fetchChannelUploads } from '../utils/youtubeUtils';

const SubscriptionManagerModal = ({ isOpen, onClose, playlistId }) => {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [newSourceInput, setNewSourceInput] = useState('');
    const [newSourceLimit, setNewSourceLimit] = useState(10);
    const [addingSource, setAddingSource] = useState(false);

    // Editable row state
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const startEditingName = (source) => {
        setEditingId(source.id);
        setEditingName(source.custom_name || source.source_value);
    };

    const saveName = async (id) => {
        try {
            await updatePlaylistSourceName(id, editingName || null);
            setSources(sources.map(s => s.id === id ? { ...s, custom_name: editingName || null } : s));
            setEditingId(null);
        } catch (err) {
            console.error('Failed to update name:', err);
        }
    };

    const handleKeyDown = (e, id) => {
        if (e.key === 'Enter') saveName(id);
        if (e.key === 'Escape') setEditingId(null);
    };

    const mostRecentSync = React.useMemo(() => {
        if (!sources || sources.length === 0) return null;
        let latest = null;
        for (const source of sources) {
            if (source.last_synced_at) {
                const syncDt = new Date(source.last_synced_at);
                if (!latest || syncDt > latest) {
                    latest = syncDt;
                }
            }
        }
        return latest ? latest.toLocaleString() : 'Never synced';
    }, [sources]);

    // Load sources when modal opens
    useEffect(() => {
        if (isOpen && playlistId) {
            loadSources();
            setNewSourceInput('');
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
            if (isNaN(id)) {
                throw new Error(`Invalid playlist ID: ${playlistId}`);
            }
            const data = await getPlaylistSources(id);
            setSources(data);
        } catch (err) {
            console.error('Failed to load sources:', err);
            setError('Failed to load subscriptions: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSource = async (e) => {
        e.preventDefault();
        if (!newSourceInput.trim()) return;

        setAddingSource(true);
        setError(null);
        setSuccessMsg(null);

        try {
            let channelId = null;
            let inputValue = newSourceInput.trim();

            // Try to extract from URL or Handle
            if (inputValue.includes('youtube.com/channel/')) {
                channelId = inputValue.split('channel/')[1].split('/')[0].split('?')[0];
            } else if (inputValue.includes('@')) {
                let handle = inputValue.split('@')[1].split('/')[0].split('?')[0];
                channelId = await resolveHandleToChannelId(handle);
            } else if (inputValue.startsWith('UC') && inputValue.length === 24) {
                channelId = inputValue;
            } else {
                channelId = await resolveHandleToChannelId(inputValue);
            }

            if (!channelId) {
                throw new Error("Could not resolve YouTube channel from input. Please try a valid handle or channel URL.");
            }

            // Check for duplicates
            if (sources.some(s => s.source_value === channelId)) {
                throw new Error("This channel is already in your subscriptions.");
            }

            // Save
            await addPlaylistSource(parseInt(playlistId, 10), 'channel', channelId, newSourceLimit);
            await loadSources();
            setNewSourceInput('');
            setSuccessMsg(`Channel successfully added!`);

            // Clear success msg after a bit
            setTimeout(() => setSuccessMsg(null), 3000);

        } catch (err) {
            console.error('Failed to add source:', err);
            setError(err.message);
        } finally {
            setAddingSource(false);
        }
    };

    const handleRemove = async (id, value) => {
        if (!window.confirm(`Are you sure you want to remove the subscription for "${value}"?`)) {
            return;
        }

        try {
            await removePlaylistSource(id);
            setSources(sources.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to remove source:', err);
            setError('Failed to remove subscription.');
        }
    };

    const handleLimitChange = async (id, newLimit) => {
        try {
            // Optimistic update
            setSources(sources.map(s => s.id === id ? { ...s, video_limit: newLimit } : s));
            await updatePlaylistSourceLimit(id, newLimit);
        } catch (err) {
            console.error('Failed to update limit:', err);
            loadSources();
        }
    };

    const handleFetchVideos = async () => {
        if (sources.length === 0) return;

        if (!window.confirm('This will fetch the latest videos from all your active subscriptions. Proceed?')) {
            return;
        }

        setFetching(true);
        setError(null);
        setSuccessMsg(null);
        let newVideosCount = 0;

        try {
            const pid = parseInt(playlistId, 10);
            const existingItems = await getPlaylistItems(pid);
            const existingVideoIds = new Set(existingItems.map(item => item.video_id));

            for (const source of sources) {
                if (source.source_type === 'channel') {
                    const videos = await fetchChannelUploads(source.source_value, source.video_limit);

                    for (const video of videos) {
                        // Skip if we already have it
                        if (!existingVideoIds.has(video.video_id)) {
                            await addVideoToPlaylist(
                                pid,
                                video.video_url,
                                video.video_id,
                                video.title,
                                null, // Set thumbnail_url to null to ensure consistency with VideoCard's internal YouTube scaling
                                video.author,
                                null, // view_count
                                video.published_at,
                                false, // is_local
                                null // profile_image_url
                            );
                            existingVideoIds.add(video.video_id);
                            newVideosCount++;
                        }
                    }
                    // Update sync time internally
                    await updatePlaylistSourceSync(source.id);
                }
            }
            await loadSources();
            setSuccessMsg(`Successfully fetched ${newVideosCount} new videos!`);
        } catch (err) {
            console.error('Failed to fetch videos from shorts/channels:', err);
            setError("Error fetching videos: " + (err.message || (typeof err === 'string' ? err : 'Unknown error')));
        } finally {
            setFetching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 pb-12 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[75vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Youtube className="text-red-500" size={24} />
                        Subscription Manager
                        <span className="text-xs font-normal text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
                            {sources.length} Channels
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        disabled={fetching || addingSource}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">

                    {/* Feedback Messages */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm">
                            {successMsg}
                        </div>
                    )}

                    {/* Add New Source Section */}
                    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl">
                        <h3 className="text-sm font-semibold text-slate-200 mb-3">Add Channel Subscription</h3>
                        <form onSubmit={handleAddSource} className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Channel URL or @handle..."
                                value={newSourceInput}
                                onChange={(e) => setNewSourceInput(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none placeholder:text-slate-500"
                                disabled={addingSource || fetching}
                            />

                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2">
                                <span className="text-xs text-slate-400 pl-1">Limit:</span>
                                <select
                                    value={newSourceLimit}
                                    onChange={(e) => setNewSourceLimit(parseInt(e.target.value))}
                                    className="bg-transparent text-white text-sm py-2 px-1 outline-none"
                                    disabled={addingSource || fetching}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={!newSourceInput.trim() || addingSource || fetching}
                                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                {addingSource ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Plus size={16} />
                                )}
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Sources List */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-200 mb-3">Active Subscriptions</h3>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : sources.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-xl border border-slate-700/50 border-dashed">
                                No subscriptions found for this playlist. <br /> Add a channel above to get started.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sources.map((source) => (
                                    <div
                                        key={source.id}
                                        className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-4 group hover:border-slate-600 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-sm text-slate-200 font-mono truncate">
                                                {editingId === source.id ? (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, source.id)}
                                                        onBlur={() => saveName(source.id)}
                                                        className="bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-white outline-none w-48"
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => startEditingName(source)}
                                                        className="cursor-pointer hover:text-sky-400"
                                                        title="Click to edit custom name"
                                                    >
                                                        {source.custom_name || source.source_value}
                                                    </span>
                                                )}
                                                <a
                                                    href={`https://youtube.com/channel/${source.source_value}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sky-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                Added: {new Date(source.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            {/* Limit Selector */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">Limit:</span>
                                                <select
                                                    value={source.video_limit || 10}
                                                    onChange={(e) => handleLimitChange(source.id, parseInt(e.target.value))}
                                                    disabled={fetching}
                                                    className="bg-slate-900 border border-slate-600 text-white text-xs rounded p-1.5 focus:ring-1 focus:ring-sky-500 outline-none disabled:opacity-50"
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleRemove(source.id, source.source_value)}
                                                disabled={fetching}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Remove Subscription"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer and Fetch Action */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 rounded-b-xl flex flex-col gap-2">
                    <button
                        onClick={handleFetchVideos}
                        disabled={sources.length === 0 || fetching || addingSource}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-sky-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {fetching ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Fetching Latest Videos...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                Sync Latest Videos
                            </>
                        )}
                    </button>
                    {sources.length > 0 && (
                        <div className="text-center text-xs text-slate-500">
                            Last synced: {mostRecentSync}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagerModal;
