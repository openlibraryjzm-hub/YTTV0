import React, { useState, useEffect } from 'react';
import { X, Trash2, ExternalLink, Save } from 'lucide-react';
import { getPlaylistSources, removePlaylistSource, updatePlaylistSourceLimit } from '../api/playlistApi';

const SubscriptionManagerModal = ({ isOpen, onClose, playlistId }) => {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load sources when modal opens
    useEffect(() => {
        console.log('SubscriptionManagerModal: Effect triggered', { isOpen, playlistId });
        if (isOpen && playlistId) {
            loadSources();
        } else if (isOpen && !playlistId) {
            console.warn('SubscriptionManagerModal: Open but no playlistId provided');
            setError('No playlist ID provided');
        }
    }, [isOpen, playlistId]);

    const loadSources = async () => {
        console.log('SubscriptionManagerModal: Loading sources for playlist', playlistId);
        setLoading(true);
        setError(null);
        try {
            // Ensure playlistId is integer
            const id = parseInt(playlistId, 10);
            if (isNaN(id)) {
                throw new Error(`Invalid playlist ID: ${playlistId}`);
            }
            const data = await getPlaylistSources(id);
            console.log('SubscriptionManagerModal: Sources loaded', data);
            setSources(data);
        } catch (err) {
            console.error('Failed to load sources:', err);
            setError('Failed to load subscriptions: ' + err.message);
        } finally {
            setLoading(false);
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
            alert('Failed to remove subscription.');
        }
    };

    const handleLimitChange = async (id, newLimit) => {
        try {
            // Optimistic update
            setSources(sources.map(s => s.id === id ? { ...s, video_limit: newLimit } : s));
            await updatePlaylistSourceLimit(id, newLimit);
        } catch (err) {
            console.error('Failed to update limit:', err);
            // Revert on failure
            loadSources();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Subscription Manager
                        <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            {sources.length}
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-400 text-center py-8">{error}</div>
                    ) : sources.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No subscriptions found for this playlist.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sources.map((source) => (
                                <div
                                    key={source.id}
                                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between gap-4 group hover:border-slate-600 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${source.source_type === 'channel' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {source.source_type}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Added: {new Date(source.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-200 font-mono truncate" title={source.source_value}>
                                            {source.source_value}
                                            {(source.source_type === 'channel' && source.source_value.startsWith('UC')) && (
                                                <a
                                                    href={`https://youtube.com/channel/${source.source_value}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sky-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        {/* Limit Selector */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">Fetch Limit:</span>
                                            <select
                                                value={source.video_limit || 10}
                                                onChange={(e) => handleLimitChange(source.id, parseInt(e.target.value))}
                                                className="bg-slate-900 border border-slate-600 text-white text-xs rounded p-1.5 focus:ring-1 focus:ring-sky-500 outline-none"
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemove(source.id, source.source_value)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-xl">
                    <p className="text-xs text-slate-500 text-center">
                        Right-click the Refresh button to open this manager anytime.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagerModal;
