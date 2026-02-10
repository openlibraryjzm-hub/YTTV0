import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const EditPlaylistModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [customAscii, setCustomAscii] = useState('');

    // Page Banner State
    const [bannerImage, setBannerImage] = useState(null);
    const [bannerScale, setBannerScale] = useState(100);
    const [bannerXOffset, setBannerXOffset] = useState(50);
    const [bannerYOffset, setBannerYOffset] = useState(50);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setCustomAscii(initialData.customAscii || '');

            // Initialize banner settings
            setBannerImage(initialData.bannerImage || null);
            setBannerScale(initialData.bannerScale ?? 100);
            setBannerXOffset(initialData.bannerXOffset ?? 50);
            setBannerYOffset(initialData.bannerYOffset ?? 50);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBanner = () => {
        setBannerImage(null);
        setBannerScale(100);
        setBannerXOffset(50);
        setBannerYOffset(50);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            await onSave({
                name,
                description,
                customAscii,
                bannerImage,
                bannerScale,
                bannerXOffset,
                bannerYOffset
            });
            onClose();
        } catch (error) {
            console.error('Failed to update playlist:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">Edit Details</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                            placeholder="Name"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 h-24 resize-none"
                            placeholder="Add a description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Custom ASCII Banner
                        </label>
                        <textarea
                            value={customAscii}
                            onChange={(e) => setCustomAscii(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 h-24 resize-none font-mono text-xs whitespace-pre leading-tight"
                            placeholder="Paste ASCII art here to override default signature..."
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Page Banner Image (Layer 2)
                        </label>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <label className="relative cursor-pointer bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm inline-flex items-center">
                                    <span>Upload Image</span>
                                    <input
                                        type="file"
                                        onChange={handleBannerUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </label>
                                {bannerImage && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveBanner}
                                        className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>

                            {bannerImage && (
                                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="h-24 w-full bg-slate-200 rounded-md overflow-hidden relative">
                                        <img
                                            src={bannerImage}
                                            alt="Banner Preview"
                                            className="w-full h-full object-cover"
                                            style={{
                                                objectPosition: `${bannerXOffset}% ${bannerYOffset}%`,
                                                transform: `scale(${bannerScale / 100})`,
                                                transformOrigin: 'center'
                                            }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                <span>Scale ({bannerScale}%)</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="50"
                                                max="200"
                                                value={bannerScale}
                                                onChange={(e) => setBannerScale(Number(e.target.value))}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                    <span>X Offset ({bannerXOffset}%)</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={bannerXOffset}
                                                    onChange={(e) => setBannerXOffset(Number(e.target.value))}
                                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                    <span>Y Offset ({bannerYOffset}%)</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={bannerYOffset}
                                                    onChange={(e) => setBannerYOffset(Number(e.target.value))}
                                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit} // Bind click to submit handler as it's outside form
                        disabled={isSaving || !name.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPlaylistModal;
