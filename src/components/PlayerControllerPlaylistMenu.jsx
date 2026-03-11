import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Play, Home, Twitter, List, Shuffle, Grid3X3, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, CheckCircle2, X, Settings2, Pin, Share2, Info, BarChart2, Bookmark, MoreHorizontal, Heart, ListMusic, Zap, Radio, Flame, ChevronsLeft, ChevronsRight, Upload, Palette, History as HistoryIcon, Layout, Layers, Compass, Library, Eye, EyeOff, RotateCcw, ThumbsUp, Plus, Anchor as AnchorIcon, Type, MousePointer2, ArrowLeftRight, Circle, Settings, Move, LayoutGrid, Clock, HelpCircle } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useNavigationStore } from '../store/navigationStore';
import { usePinStore } from '../store/pinStore';
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

export default function PlayerControllerPlaylistMenu(props) {
  const {
    viewMode,
    leftAltNavX,
    playlistCheckpoint,
    handleCommit,
    getInspectTitle,
    handleRevert,
    showPreviewMenus,
    theme,
    menuHeight,
    handleAltNav,
    isEditMode,
    menuWidth,
    handleShufflePlaylist,
    playlistTitleRef,
    titleFontSize,
    handlePlaylistsGrid,
    playlistTitle,
    currentVideoFolders,
    activeTabId,
    activePresetId,
    singleGroupForBadge,
    cycleGroupBadge,
    canCycleGroups,
    safePresets,
    safeTabs,
    currentVideoFolderNames,
    pins,
    isPriorityPin,
    handlePinClick,
    activePin,
    handleUnpin,
    bottomBarHeight,
    setIsMoreMenuOpen,
    isMoreMenuOpen,
    bottomIconSize,
    setShowPreviewMenus,
    toggleDevToolbar,
    showDevToolbar,
    setIsVisualizerEnabled,
    isVisualizerEnabled,
    handleBannerUpload,
    setIsAddMenuOpen,
    isAddMenuOpen,
    handleAddClipboardToQuickVideos,
    handleAddClipboardToCurrentPlaylist,
    setPlaylistItems,
    setCurrentVideoIndex,
    activeNavButton,
    navChevronSize,
    setActiveNavButton,
    handleHistoryBack,
    historyIndex,
    historyStack,
    handleHistoryForward,
    navigatePlaylist
  } = props;

  return (
    <div className={viewMode !== 'full' ? "col-start-2 row-start-2 flex items-start justify-start self-start origin-top-left scale-90 -mt-2" : "flex-1 flex items-center justify-end"}>
      {/* PLAYLIST SECTION */}
      <div className="flex items-center gap-4 relative z-10 flex-shrink-0">
        <div className="absolute right-full mr-4 transition-transform" style={{
          transform: `translateX(${leftAltNavX}px)`
        }}>
          <div className="flex items-center gap-4 animate-in slide-in-from-right-2 duration-300">
            <div className="flex flex-col gap-3 w-9 h-24 items-center justify-center">
              {playlistCheckpoint !== null && <><button onClick={() => handleCommit('playlist')} className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-emerald-500 text-white active:scale-90" title={getInspectTitle('Commit playlist preview')}><Check size={20} strokeWidth={3} /></button><button onClick={() => handleRevert('playlist')} className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-rose-500 text-white active:scale-90" title={getInspectTitle('Revert playlist preview')}><X size={20} strokeWidth={3} /></button></>}
            </div>
            {/* Playlist Preview Navigation Menu */}
            {showPreviewMenus && <div className={`w-8 ${theme.menuBg} border ${theme.menuBorder} rounded-lg shadow-sm flex flex-col justify-between items-center py-2 shrink-0 animate-in fade-in zoom-in-95 duration-200`} style={{
              height: `${menuHeight}px`
            }}>
              <button onClick={() => handleAltNav('up', 'playlist')} className="text-black p-1" title={getInspectTitle('Previous playlist in preview')}><ChevronUp size={18} strokeWidth={3} /></button>
              <div className={`w-full h-px ${theme.bottomBar} my-1`} />
              <button onClick={() => handleAltNav('down', 'playlist')} className="text-black p-1" title={getInspectTitle('Next playlist in preview')}><ChevronDown size={18} strokeWidth={3} /></button>
            </div>}
          </div>
        </div>
        <div className={`shadow-2xl flex flex-col relative overflow-visible transition-all duration-300 group/playlist ${isEditMode ? 'ring-4 ring-sky-400/30' : 'bg-transparent rounded-2xl overflow-hidden'}`} style={{
          width: `${menuWidth}px`,
          height: `${menuHeight}px`
        }}>
          <div className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 overflow-x-visible overflow-y-hidden w-full h-full min-h-0" onMouseDown={e => {
            if (e.button === 2) {
              // Right mouse button
              e.preventDefault();
              e.stopPropagation();
              console.log('Mega shuffle triggered from container (mouseDown)');
              handleShufflePlaylist();
            }
          }} onContextMenu={e => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mega shuffle triggered from container (contextMenu)');
            handleShufflePlaylist();
          }}>
            <h1 ref={playlistTitleRef} className="font-black text-center leading-tight line-clamp-3 tracking-tight transition-all pb-1 cursor-pointer hover:opacity-90 select-none" style={{
              fontSize: `${titleFontSize}px`,
              pointerEvents: 'auto',
              color: 'white',
              WebkitTextStroke: '1px #000',
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
            }} onClick={handlePlaylistsGrid} title={`${playlistTitle} (Right-click for mega shuffle)`}>
              {playlistTitle}
            </h1>

            {/* Badges Container */}
            {(currentVideoFolders.length > 0 || activeTabId !== 'all' || activePresetId !== 'all' || singleGroupForBadge) && <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0 mb-0.5 animate-in fade-in zoom-in duration-300 overflow-visible min-w-0">

              {/* Group Carousel Badge - single group; always show left/right arrows (disabled when only one group) */}
              {singleGroupForBadge && <span key={singleGroupForBadge.id} className="inline-flex items-center shrink-0 gap-0">
                <button type="button" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  cycleGroupBadge('prev');
                }} disabled={!canCycleGroups} className="p-0.5 disabled:opacity-40 disabled:cursor-default" title={canCycleGroups ? getInspectTitle('Previous group carousel') || 'Previous group carousel' : 'Only one group carousel'}>
                  <span style={ICON_WHITE_OUTLINE}>
                    <ChevronLeft size={14} color="white" strokeWidth={3} />
                  </span>
                </button>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] px-1 inline-flex items-center leading-none" style={BADGE_TEXT_STYLE} title={`Carousel: ${singleGroupForBadge.name}`}>
                  {singleGroupForBadge.name}
                </span>
                <button type="button" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  cycleGroupBadge('next');
                }} disabled={!canCycleGroups} className="p-0.5 disabled:opacity-40 disabled:cursor-default" title={canCycleGroups ? getInspectTitle('Next group carousel') || 'Next group carousel' : 'Only one group carousel'}>
                  <span style={ICON_WHITE_OUTLINE}>
                    <ChevronRight size={14} color="white" strokeWidth={3} />
                  </span>
                </button>
              </span>}

              {/* Active Preset Badge */}
              {activePresetId !== 'all' && (() => {
                const activePreset = safePresets.find(p => p.id === activePresetId);
                if (!activePreset) return null;
                return <span key="badge-preset" className="text-[11px] font-black uppercase tracking-[0.15em] px-1 inline-flex items-center leading-none" style={BADGE_TEXT_STYLE}>
                  {activePreset.name}
                </span>;
              })()}

              {/* Active Tab Badge */}
              {activeTabId !== 'all' && (() => {
                const activeTab = safeTabs.find(t => t.id === activeTabId);
                if (!activeTab) return null;
                return <span key="badge-tab" className="text-[11px] font-black uppercase tracking-[0.15em] px-1 inline-flex items-center leading-none" style={BADGE_TEXT_STYLE}>
                  {activeTab.name}
                </span>;
              })()}

              {/* Video Folder Badge */}
              {currentVideoFolders.map(folderId => {
                const folderColor = FOLDER_COLORS.find(c => c.id === folderId);
                if (!folderColor) return null;
                const customName = currentVideoFolderNames[folderId];
                return <span key={folderId} className="text-[11px] font-black uppercase tracking-[0.15em] px-1 inline-flex items-center leading-none" style={BADGE_TEXT_STYLE}>
                  {customName || folderColor.name}
                </span>;
              })}
            </div>}

          </div>

          <div className="border-t border-sky-300/50 flex items-center px-6 shrink-0 relative rounded-b-2xl bg-transparent" style={{
            height: `${bottomBarHeight}px`
          }}>
            <div className="w-full h-full flex items-center relative">

              {/* Left Side (2 items evenly spaced) */}
              <div className="flex-1 flex items-center justify-evenly h-full pr-4">
                {/* 1. More Options / Settings Menu */}
                <div className="relative flex items-center justify-center -translate-x-6">
                  <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="flex items-center justify-center group/tool" title={getInspectTitle('More options')}>
                    <span style={ICON_WHITE_OUTLINE}>
                      <MoreHorizontal size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                    </span>
                  </button>
                  {isMoreMenuOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-sky-50 border border-sky-300 rounded-lg shadow-xl overflow-hidden z-[10001] animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1" style={{
                    zIndex: 10001
                  }}>
                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      setShowPreviewMenus(!showPreviewMenus);
                      setIsMoreMenuOpen(false);
                    }}>
                      {showPreviewMenus ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPreviewMenus ? 'Hide Preview Menus' : 'Show Preview Menus'}
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      toggleDevToolbar();
                      setIsMoreMenuOpen(false);
                    }}>
                      {showDevToolbar ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showDevToolbar ? 'Hide Dev Toolbar' : 'Show Dev Toolbar'}
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      document.getElementById('banner-upload').click();
                      setIsMoreMenuOpen(false);
                    }}>
                      <Upload size={14} />
                      Change Banner
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => {
                      setIsVisualizerEnabled(!isVisualizerEnabled);
                      setIsMoreMenuOpen(false);
                    }}>
                      {isVisualizerEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
                      {isVisualizerEnabled ? 'Hide Audio Visualizer' : 'Show Audio Visualizer'}
                    </button>
                    <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                  </div>}
                </div>

                {/* 2. History Clock Icon */}
                <div className="relative flex items-center justify-center h-full -translate-x-[5px]">
                  <div className="absolute -left-6 opacity-100 pointer-events-auto">
                    <button onClick={handleHistoryBack} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="History Back (Older)">
                      <ChevronLeft size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>

                  <button onClick={() => console.log('History button clicked')} className={`flex items-center justify-center group/tool transition-all ${historyIndex >= Math.min(historyStack.length - 1, 5) || historyStack.length <= 1 ? historyIndex === 0 ? 'opacity-30' : '' : ''}`} title={getInspectTitle('History')}>
                    <span style={ICON_WHITE_OUTLINE}>
                      <Clock size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                    </span>
                  </button>

                  <div className="absolute -right-6 opacity-100 pointer-events-auto">
                    <button onClick={handleHistoryForward} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="History Forward (Newer)">
                      <ChevronRight size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Plus Button - Absolute Centered */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 w-10">
                <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="flex items-center justify-center group/tool" title={getInspectTitle('Add to Playlist')}>
                  <span style={ICON_WHITE_OUTLINE}>
                    <Plus size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                  </span>
                </button>
                {isAddMenuOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[260px] bg-sky-50 border border-sky-300 rounded-lg shadow-xl overflow-hidden z-[10001] animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1" style={{
                  zIndex: 10001
                }}>
                  <div className="flex border-b border-sky-200">
                    <button className="flex-1 text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => handleAddClipboardToQuickVideos(false)} title="Add clipboard to Quick Videos playlist">
                      <Plus size={14} />
                      Add to quick videos
                    </button>
                    <button className="px-4 hover:bg-sky-200 transition-colors flex items-center justify-center border-l border-sky-200 text-sky-900" onClick={() => handleAddClipboardToQuickVideos(true)} title="Add and Play immediately">
                      <Play size={14} className="fill-current" />
                    </button>
                  </div>
                  <div className="flex">
                    <button className="flex-1 text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={() => handleAddClipboardToCurrentPlaylist(false)} title="Add clipboard to Current Playlist">
                      <Plus size={14} />
                      Add to current playlist
                    </button>
                    <button className="px-4 hover:bg-sky-200 transition-colors flex items-center justify-center border-l border-sky-200 text-sky-900" onClick={() => handleAddClipboardToCurrentPlaylist(true)} title="Add and Play immediately">
                      <Play size={14} className="fill-current" />
                    </button>
                  </div>
                </div>}
              </div>

              {/* Right Side (2 items evenly spaced) */}
              <div className="flex-1 flex items-center justify-evenly h-full pl-4">
                {/* 4. Priority Pin */}
                <div className="relative flex items-center justify-center w-[52px] h-[39px]">
                  {(() => {
                    const priorityPinData = pins.find(pin => isPriorityPin(pin.video.id));
                    if (!priorityPinData) return null;
                    const thumbnailUrl = getThumbnailUrl(priorityPinData.video.video_id, 'default');
                    return (
                      <div className="pointer-events-auto group/pin z-40 relative w-full h-full">
                        <button onClick={() => handlePinClick(priorityPinData.video)} className={`rounded-lg flex items-center justify-center transition-all shadow-md overflow-hidden ${activePin === priorityPinData.id ? 'ring-2 ring-sky-400' : ''}`} style={{
                          width: '100%',
                          height: '100%',
                          border: '2px solid #000'
                        }} title={`Priority Pin: ${priorityPinData.video.title || 'Untitled Video'}`}>
                          {thumbnailUrl ? <img src={thumbnailUrl} alt={priorityPinData.video.title} className="w-full h-full object-cover" /> : <Pin size={24} fill="#fbbf24" strokeWidth={2} />}
                        </button>
                        <button className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/pin:opacity-100 transition-opacity shadow-sm border border-white z-20" onClick={e => handleUnpin(e, priorityPinData.video)} title="Unpin video">
                          <X size={12} strokeWidth={4} />
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* 5. Grid Button */}
                <div className="relative flex items-center justify-center h-full translate-x-[14px]">
                  <div className="absolute -left-6 opacity-100 pointer-events-auto">
                    <button onClick={() => navigatePlaylist('down')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title={getInspectTitle('Previous playlist')}>
                      <ChevronLeft size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>

                  <button onClick={handlePlaylistsGrid} className="flex items-center justify-center group/tool transition-all" title={getInspectTitle('View playlists grid')}>
                    <span style={ICON_WHITE_OUTLINE}>
                      <Menu size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                    </span>
                  </button>

                  <div className="absolute -right-6 opacity-100 pointer-events-auto">
                    <button onClick={() => navigatePlaylist('up')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title={getInspectTitle('Next playlist')}>
                      <ChevronRight size={navChevronSize} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow relative z-10" />
        </div>
      </div>
    </div>
  );
}
