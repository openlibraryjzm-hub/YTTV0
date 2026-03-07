import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Home, Twitter, List, Shuffle, Grid3X3, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, CheckCircle2, X, Settings2, Pin, Share2, Info, BarChart2, Bookmark, MoreHorizontal, Heart, ListMusic, Zap, Radio, Flame, ChevronsLeft, ChevronsRight, Upload, Palette, History as HistoryIcon, Layout, Layers, Compass, Library, Eye, EyeOff, RotateCcw, ThumbsUp, Plus, Anchor as AnchorIcon, Type, MousePointer2, ArrowLeftRight, Circle, Settings, Move, LayoutGrid, Clock, HelpCircle } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useNavigationStore } from '../store/navigationStore';
import { usePinStore } from '../store/pinStore';
import { useQueueStore } from '../store/queueStore';
import { useLayoutStore } from '../store/layoutStore';
import { useFolderStore } from '../store/folderStore';
import { useTabStore } from '../store/tabStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { useConfigStore } from '../store/configStore';
import { useMissionStore } from '../store/missionStore';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useTabPresetStore } from '../store/tabPresetStore';
import { useInspectLabel } from '../utils/inspectLabels';
import { getAllPlaylists, getPlaylistItems, getAllFoldersWithVideos, getVideosInFolder, getAllStuckFolders, assignVideoToFolder, unassignVideoFromFolder, getVideoFolderAssignments, createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getFolderMetadata, getWatchHistory } from '../api/playlistApi';
import { getThumbnailUrl, extractVideoId, fetchVideoMetadata } from '../utils/youtubeUtils';
import { getFolderColorById, FOLDER_COLORS } from '../utils/folderColors';
import { THEMES } from '../utils/themes';
import AudioVisualizer from './AudioVisualizer';

// Seeded random function for consistent random selection per page
const seededRandom = seed => {
  let hash = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
  }
  return Math.abs(hash) % 10000 / 10000;
};

// Use folder colors from the app's folder system
const COLORS = FOLDER_COLORS.map(color => ({
  hex: color.hex,
  name: color.name,
  id: color.id
}));

// White icon with black outline (no circle) - use as wrapper style for toolbar icons
const ICON_WHITE_OUTLINE = {
  display: 'inline-flex',
  color: 'white',
  filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
};

// Badge text: white with black outline (no bubble container)
const BADGE_TEXT_STYLE = {
  color: 'white',
  WebkitTextStroke: '1px #000',
  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
};

export default function PlayerControllerOrbMenu(props) {
  const {
    viewMode,
    orbMenuGap,
    isVisualizerEnabled,
    orbSize,
    orbImageSrc,
    displayIsSpillEnabled,
    displayScale,
    orbImageScaleW,
    orbImageScaleH,
    displayX,
    displayY,
    fileInputRef,
    handleOrbImageUpload,
    getInspectTitle,
    theme,
    setFullscreenInfoBlanked,
    setViewMode,
    setCurrentPage,
    lockApp,
    openTwitter,
    setActiveNavigationMode,
    activeNavigationMode,
    handlePlaylistNav,
    handleItemNav
  } = props;

  return (
    <div className={`flex items-center justify-center relative group z-30 flex-shrink-0 ${viewMode !== 'full' ? 'col-start-1 row-start-1 row-span-2' : ''}`} style={{
      marginLeft: viewMode === 'full' ? `${orbMenuGap}px` : '0px',
      marginRight: viewMode === 'full' ? `${orbMenuGap}px` : '0px'
    }}>

      {/* Audio Visualizer - Around Orb */}
      {/* Audio Visualizer - Around Orb */}
      <AudioVisualizer enabled={isVisualizerEnabled} orbSize={orbSize} barCount={113} barWidth={4} radius={77} radiusY={77} maxBarLength={76} minBarLength={7} colors={[255, 255, 255, 255]} smoothing={0.75} preAmpGain={4.0} angleTotal={Math.PI * 2} angleStart={-Math.PI / 2} clockwise={true} inward={false} fftSize={2048} freqMin={60} freqMax={11000} sensitivity={64} updateRate={16} />
      <div className={`rounded-full bg-sky-50 backdrop-blur-3xl shadow-2xl flex items-center justify-center transition-all relative overflow-visible z-20`} style={{
        width: `${orbSize}px`,
        height: `${orbSize}px`
      }}>
        {/* IMAGE LAYER */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center z-40" style={{
          clipPath: 'url(#orbClipPath)',
          overflow: 'visible'
        }}>
          <img src={orbImageSrc} alt="" className="max-w-none transition-all duration-500" style={{
            width: displayIsSpillEnabled ? `${orbSize * displayScale * orbImageScaleW}px` : '100%',
            height: displayIsSpillEnabled ? `${orbSize * displayScale * orbImageScaleH}px` : '100%',
            transform: displayIsSpillEnabled ? `translate(${displayX}px, ${displayY}px)` : 'none',
            objectFit: displayIsSpillEnabled ? 'contain' : 'cover'
          }} />
        </div>

        {/* Adjuster Border Guide */}
        {/* GLASS INTERLAY */}
        <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none"><div className="absolute inset-0 bg-sky-200/10" /></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-60 z-10 pointer-events-none rounded-full" />

        <input type="file" ref={fileInputRef} onChange={handleOrbImageUpload} accept="image/*" className="hidden" />
        <button className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          width: `28px`,
          height: `28px`
        }} onClick={() => fileInputRef.current.click()} title={getInspectTitle('Upload orb image')}><Upload size={16} className={theme.accent} strokeWidth={3} /></button>

        {/* Orb Config Button (Top Left) */}
        <button onClick={() => {
          if (viewMode === 'full') {
            setFullscreenInfoBlanked(true);
            requestAnimationFrame(() => {
              setViewMode('half');
              setCurrentPage('orb-config');
            });
          } else {
            setCurrentPage('orb-config');
          }
        }} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '15%',
          top: '15%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title={getInspectTitle('Orb Config') || 'Orb Config'}>
          <Circle size={14} className="text-black" strokeWidth={2.5} />
        </button>

        {/* Settings Button (Top Right) */}
        <button onClick={() => {
          if (viewMode === 'full') {
            setFullscreenInfoBlanked(true);
            requestAnimationFrame(() => {
              setViewMode('half');
              setCurrentPage('app');
            });
          } else {
            setCurrentPage('app');
          }
        }} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '85%',
          top: '15%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title={getInspectTitle('Settings') || 'Settings'}>
          <Settings size={14} className="text-black" strokeWidth={2.5} />
        </button>

        {/* Home Hub Button (Bottom Center) */}
        <button onClick={lockApp} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '50%',
          top: '100%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title="Home Hub">
          <Home size={14} className="text-black" strokeWidth={2.5} />
        </button>

        {/* Twitter Button (Bottom Left) */}
        <button onClick={openTwitter} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '15%',
          top: '85%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title="Open X (Twitter)">
          <Twitter size={14} className="text-black" strokeWidth={2.5} />
        </button>

        {/* Navigation Mode Toggle (Bottom Right) */}
        <button onClick={() => setActiveNavigationMode(activeNavigationMode === 'orb' ? 'banner' : 'orb')} className={`absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black text-black opacity-0 group-hover:opacity-100 transition-all duration-300`} style={{
          left: '85%',
          top: '85%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title={activeNavigationMode === 'orb' ? "Switch to Banner Navigation" : "Switch to Orb Navigation"}>
          {activeNavigationMode === 'orb' ? <Circle size={14} className="text-black" strokeWidth={2.5} /> : <Layout size={14} className="text-black" strokeWidth={2.5} />}
        </button>

        {/* Prev Playlist */}
        <button onClick={() => handlePlaylistNav('prev')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '2%',
          top: '38%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title={activeNavigationMode === 'orb' ? "Previous Orb Playlist" : "Previous Banner Category"}>
          <ChevronsLeft size={14} className="text-black" strokeWidth={2.5} />
        </button>

        {/* Prev Item */}
        <button onClick={() => handleItemNav('prev')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '2%',
          top: '62%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title={activeNavigationMode === 'orb' ? "Previous Orb" : "Previous Banner"}>
          <ChevronLeft size={14} className="text-black" strokeWidth={2.5} />
        </button>

        {/* Next Playlist */}
        <button onClick={() => handlePlaylistNav('next')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '98%',
          top: '38%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title={activeNavigationMode === 'orb' ? "Next Orb Playlist" : "Next Banner Category"}>
          <ChevronsRight size={14} className="text-black" strokeWidth={2.5} />
        </button>

        {/* Next Item */}
        <button onClick={() => handleItemNav('next')} className="absolute rounded-full flex items-center justify-center bg-white shadow-xl hover:scale-110 active:scale-95 group/btn z-50 border-2 border-black opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
          left: '98%',
          top: '62%',
          transform: 'translate(-50%, -50%)',
          width: `28px`,
          height: `28px`
        }} title={activeNavigationMode === 'orb' ? "Next Orb" : "Next Banner"}>
          <ChevronRight size={14} className="text-black" strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
}
