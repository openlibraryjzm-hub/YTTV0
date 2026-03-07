import React from 'react';
import { Play, Home, Twitter, List, Shuffle, Grid3X3, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, CheckCircle2, X, Settings2, Pin, PlayCircle, ThumbsUp, MoreHorizontal, Maximize2, Minimize2, Settings, Bookmark, Settings as SettingsIcon, Layout, Circle, ChevronsLeft, ChevronsRight, Search, Upload, Clock, Library, Focus, Eye, EyeOff, Info, SearchX, Plus, RefreshCw, LayoutTemplate } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

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
    isQueueModeOpen,
    setIsQueueModeOpen,
    queue,
    setPlaylistItems,
    setCurrentVideoIndex,
    removeFromQueue,
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

                {/* Priority Pin (Top Right) */}
                {(() => {
        const priorityPinData = pins.find(pin => isPriorityPin(pin.video.id));
        if (!priorityPinData) return null;
        const thumbnailUrl = getThumbnailUrl(priorityPinData.video.video_id, 'default');
        return <div className="absolute top-1 right-1 pointer-events-auto group/pin z-40">
                      <button onClick={() => handlePinClick(priorityPinData.video)} className={`rounded-lg flex items-center justify-center transition-all shadow-md overflow-hidden ${activePin === priorityPinData.id ? 'ring-2 ring-sky-400' : ''}`} style={{
            width: '52px',
            height: '39px',
            border: '2px solid #000'
          }} title={`Priority Pin: ${priorityPinData.video.title || 'Untitled Video'}`}>
                        {thumbnailUrl ? <img src={thumbnailUrl} alt={priorityPinData.video.title} className="w-full h-full object-cover" /> : <Pin size={24} fill="#fbbf24" strokeWidth={2} />}
                      </button>
                      <button className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/pin:opacity-100 transition-opacity shadow-sm border border-white z-20" onClick={e => handleUnpin(e, priorityPinData.video)} title="Unpin video">
                        <X size={10} strokeWidth={4} />
                      </button>
                    </div>;
      })()}

                <div className="border-t border-sky-300/50 flex items-center px-3 shrink-0 relative rounded-b-2xl bg-transparent" style={{
        height: `${bottomBarHeight}px`
      }}>
                  <div className="w-full h-full relative">
                    {/* Left Side: Metadata removed (view count, author, year) */}

                    {/* Right Components: Action & Navigation Buttons */}
                    {/* Right Components: Navigation Buttons (Tab Button moved to Video Menu, Shuffle Removed) */}

                    {/* Navigation Contols (Right Cluster - "Far Right") */}

                    {/* Leftmost: More Options / Settings Menu */}
                    <div className="absolute left-1/2 top-1/2" style={{
            transform: `translate(calc(-50% - 141px), -50%)`
          }}>
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

                    {/* Plus Button */}
                    <div className="absolute left-1/2 top-1/2" style={{
            transform: `translate(calc(-50% - 100px), -50%)`
          }}>
                      <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="flex items-center justify-center group/tool" title={getInspectTitle('Add to Playlist')}>
                        <span style={ICON_WHITE_OUTLINE}>
                          <Plus size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                        </span>
                      </button>
                      {isAddMenuOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-sky-50 border border-sky-300 rounded-lg shadow-xl overflow-hidden z-[10001] animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1" style={{
              zIndex: 10001
            }}>
                          <button className="w-full text-left px-4 py-2 text-sm text-sky-900 hover:bg-sky-200 transition-colors flex items-center gap-2" onClick={handleAddClipboardToQuickVideos}>
                            <Plus size={14} />
                            Add clipboard to quick videos
                          </button>
                        </div>}
                    </div>

                    {/* Queue Mode OR Normal Action Controls */}
                    {isQueueModeOpen ? <div className="absolute top-0 bottom-0 pointer-events-auto flex items-center justify-end px-3 gap-2 w-full pr-[14px]">
                        {/* Close button slightly above */}
                        <button onClick={() => setIsQueueModeOpen(false)} className="absolute -top-7 right-[80px] p-1 text-white bg-black/60 hover:bg-black/80 rounded-full z-[101] shadow-md transition-all drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                          <X size={14} strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-2 overflow-x-auto w-full justify-end" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
                          <style dangerouslySetInnerHTML={{
                __html: `::-webkit-scrollbar { display: none; }`
              }} />
                          {queue.length === 0 ? <div className="text-white/70 text-xs italic pr-8">Queue is empty</div> : queue.map((video, idx) => {
                const thumbUrl = video.thumbnail_url || getThumbnailUrl(video.video_id, 'maxresdefault');
                return <div key={idx} onClick={() => {
                  // Using setPlaylistItems to temporarily play this video in a queue state
                  setPlaylistItems([video], null, null, 'Temporary Queue');
                  setCurrentVideoIndex(0);
                  setIsQueueModeOpen(false);
                }} className="relative group cursor-pointer flex-shrink-0" style={{
                  width: '52px',
                  height: '39px',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                                  <img src={thumbUrl} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play size={16} color="white" fill="currentColor" />
                                  </div>
                                  <div className="absolute top-0 right-0 p-0.5 bg-black/60 rounded-bl opacity-0 group-hover:opacity-100 hover:bg-black" onClick={e => {
                    e.stopPropagation();
                    removeFromQueue(video.id);
                  }} title="Remove from queue">
                                    <X size={10} color="white" />
                                  </div>
                                </div>;
              })}
                        </div>
                      </div> : <>
                        {/* Priority Pin Button */}
                        <div className="absolute left-1/2 top-1/2" style={{
              transform: `translate(calc(-50% - 59px), -50%)`
            }}>
                          <div className="relative flex items-center justify-center">
                            <div className={`absolute -left-6 transition-all duration-200 ${activeNavButton === 'pin' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-3 pointer-events-none'}`}>
                              <button onClick={() => console.log('Pin Left Nav')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="Priority Pin Nav Left">
                                <ChevronLeft size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>

                            <button onClick={() => console.log('Priority Pin button clicked')} onContextMenu={e => {
                  e.preventDefault();
                  setActiveNavButton(prev => prev === 'pin' ? null : 'pin');
                }} className={`flex items-center justify-center group/tool transition-all ${activeNavButton === 'pin' ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} title={getInspectTitle('Priority Pin (Right-click to toggle nav)')}>
                              <span style={ICON_WHITE_OUTLINE}>
                                <svg width={Math.round(bottomIconSize * 0.5)} height={Math.round(bottomIconSize * 0.5)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <g transform="translate(1, 2) scale(0.9) rotate(45 12 12)">
                                    {/* Standard Pin Body */}
                                    <line x1="12" y1="17" x2="12" y2="22" strokeWidth="2.5"></line>
                                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" strokeWidth="2.5"></path>
                                  </g>
                                  {/* Crown sitting on top left */}
                                  <g transform="translate(-1, -3) scale(0.45) rotate(-20 12 12)">
                                    <path d="M5 21L4 6l6 4 2-7 2 7 6-4-1 15H5z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"></path>
                                  </g>
                                </svg>
                              </span>
                            </button>

                            <div className={`absolute -right-6 transition-all duration-200 ${activeNavButton === 'pin' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-3 pointer-events-none'}`}>
                              <button onClick={() => console.log('Pin Right Nav')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="Priority Pin Nav Right">
                                <ChevronRight size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Bookmark Button (Placeholder) */}
                        <div className="absolute left-1/2 top-1/2" style={{
              transform: `translate(calc(-50% - 18px), -50%)`
            }}>
                          <button onClick={() => console.log('Bookmark button clicked (placeholder)')} className="flex items-center justify-center group/tool" title={getInspectTitle('Bookmark')}>
                            <span style={ICON_WHITE_OUTLINE}>
                              <Bookmark size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                            </span>
                          </button>
                        </div>

                        {/* Queue Button */}
                        <div className="absolute left-1/2 top-1/2" style={{
              transform: `translate(calc(-50% + 23px), -50%)`
            }}>
                          <div className="relative flex items-center justify-center">
                            <div className={`absolute -left-6 transition-all duration-200 ${activeNavButton === 'queue' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-3 pointer-events-none'}`}>
                              <button onClick={() => console.log('Queue Left Nav')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="Queue Nav Left">
                                <ChevronLeft size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>

                            <button onClick={() => {
                  setIsQueueModeOpen(true);
                  setActiveNavButton('queue');
                }} onContextMenu={e => {
                  e.preventDefault();
                  setActiveNavButton(prev => prev === 'queue' ? null : 'queue');
                }} className={`flex items-center justify-center group/tool transition-all ${activeNavButton === 'queue' ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} title={getInspectTitle('Queue (Right-click to toggle nav)')}>
                              <span style={ICON_WHITE_OUTLINE}>
                                <svg width={Math.round(bottomIconSize * 0.5)} height={Math.round(bottomIconSize * 0.5)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  {/* Three horizontal lines */}
                                  <line x1="11" y1="7" x2="21" y2="7"></line>
                                  <line x1="5" y1="13" x2="21" y2="13"></line>
                                  <line x1="5" y1="19" x2="21" y2="19"></line>
                                  {/* Solid play arrow in top left */}
                                  <polygon points="5,4 10,7 5,10" fill="white" strokeWidth="0"></polygon>
                                </svg>
                              </span>
                            </button>

                            <div className={`absolute -right-6 transition-all duration-200 ${activeNavButton === 'queue' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-3 pointer-events-none'}`}>
                              <button onClick={() => console.log('Queue Right Nav')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="Queue Nav Right">
                                <ChevronRight size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* History Clock Icon */}
                        <div className="absolute left-1/2 top-1/2" style={{
              transform: `translate(calc(-50% + 64px), -50%)`
            }}>
                          <div className="relative flex items-center justify-center">
                            <div className={`absolute -left-6 transition-all duration-200 ${activeNavButton === 'history' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-3 pointer-events-none'}`}>
                              <button onClick={handleHistoryBack} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="History Back (Older)">
                                <ChevronLeft size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>

                            <button onClick={() => console.log('History button clicked')} onContextMenu={e => {
                  e.preventDefault();
                  setActiveNavButton(prev => prev === 'history' ? null : 'history');
                }} className={`flex items-center justify-center group/tool transition-all ${activeNavButton === 'history' ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} ${historyIndex >= Math.min(historyStack.length - 1, 5) || historyStack.length <= 1 ? historyIndex === 0 ? 'opacity-30' : '' : ''}`} title={getInspectTitle('History (Right-click to toggle nav)')}>
                              <span style={ICON_WHITE_OUTLINE}>
                                <Clock size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                              </span>
                            </button>

                            <div className={`absolute -right-6 transition-all duration-200 ${activeNavButton === 'history' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-3 pointer-events-none'}`}>
                              <button onClick={handleHistoryForward} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title="History Forward (Newer)">
                                <ChevronRight size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Grid Button */}
                        <div className="absolute left-1/2 top-1/2" style={{
              transform: `translate(calc(-50% + 120px), -50%)`
            }}>
                          <div className="relative flex items-center justify-center">
                            <div className={`absolute -left-7 transition-all duration-200 ${activeNavButton === 'grid' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-3 pointer-events-none'}`}>
                              <button onClick={() => navigatePlaylist('down')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title={getInspectTitle('Previous playlist')}>
                                <ChevronLeft size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>

                            <button onClick={handlePlaylistsGrid} onContextMenu={e => {
                  e.preventDefault();
                  setActiveNavButton(prev => prev === 'grid' ? null : 'grid');
                }} className={`flex items-center justify-center group/tool transition-all ${activeNavButton === 'grid' ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} title={getInspectTitle('View playlists grid (Right-click to toggle nav)')}>
                              <span style={ICON_WHITE_OUTLINE}>
                                <Library size={Math.round(bottomIconSize * 0.5)} color="white" strokeWidth={3} />
                              </span>
                            </button>

                            <div className={`absolute -right-7 transition-all duration-200 ${activeNavButton === 'grid' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-3 pointer-events-none'}`}>
                              <button onClick={() => navigatePlaylist('up')} className="p-0.5 text-black hover:scale-110 active:scale-95 transition-transform" title={getInspectTitle('Next playlist')}>
                                <ChevronRight size={navChevronSize} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>}
                  </div>
                </div>

                <div className="flex-grow relative z-10" />
              </div>
            </div>
          </div>
  );
}
