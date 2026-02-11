import React from 'react';

const OrbConfigPlaceholderPage = ({ onVideoSelect }) => {
    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            {/* Page Banner removed as it is handled by TopNavigation */}
            <div className="flex-1 p-8 text-white flex flex-col items-center justify-center">
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10 max-w-2xl text-center">
                    <h1 className="text-3xl font-bold mb-4 text-sky-400">Orb Config</h1>
                    <p className="text-xl text-slate-300">New Page Coming Soon</p>
                    <p className="mt-4 text-slate-400">This page will contain advanced configuration options for Orbs.</p>
                </div>
            </div>
        </div>
    );
};

export default OrbConfigPlaceholderPage;
