import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutStore } from './store/layoutStore';
import { useConfigStore } from './store/configStore';
import WindowControls from './components/WindowControls';
import ScrollbarChevrons from './components/ScrollbarChevrons';
import FullscreenVideoInfo from './components/FullscreenVideoInfo';

import './LayoutShell.css';

const LayoutShell = ({
  topController,
  mainPlayer,
  sideMenu,
  miniHeader,
  animatedMenu,
  spacerMenu,
  menuSpacerMenu,
  secondPlayer
}) => {

  const { viewMode, menuQuarterMode, showDebugBounds } = useLayoutStore();
  const {
    fullscreenBanner,
    splitscreenBanner,
    playerBorderPattern, // Shared
    fullscreenPlayerWidthPercent,
    bannerCropModeActive, // Shared
    bannerCropLivePreview, // Shared
    bannerPreviewMode, // From AppPage (override viewMode)
    bannerNavBannerId,
    bannerPresets
  } = useConfigStore();

  // Determine active banner settings based on view mode (or preview override)
  // detailed logic:
  // 1. If bannerPreviewMode is set, that dictates the "Primary" (interactive) banner.
  // 2. Otherwise, viewMode dictates it ('full' -> fullscreen, 'half'/'quarter' -> splitscreen).
  const isSplitscreenMode = bannerPreviewMode
    ? bannerPreviewMode === 'splitscreen'
    : viewMode !== 'full';

  // Resolve Effective Banners (Normal vs Nav Mode)
  let effectiveFullscreenBanner = fullscreenBanner;
  let effectiveSplitscreenBanner = splitscreenBanner;

  // Only apply navigation override if NOT in preview/edit mode from AppPage
  if (bannerNavBannerId && !bannerPreviewMode) {
    const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
    if (preset) {
      // Use preset configs if available, falling back to current global if specific slot missing in preset
      // (Though usually a preset should define what it wants to show)
      if (preset.fullscreenBanner) effectiveFullscreenBanner = preset.fullscreenBanner;
      if (preset.splitscreenBanner) effectiveSplitscreenBanner = preset.splitscreenBanner;
    }
  }

  const activeBanner = isSplitscreenMode ? effectiveSplitscreenBanner : effectiveFullscreenBanner;

  // Background Banner: In Splitscreen Mode, we also render the Fullscreen Banner behind.
  // In Fullscreen Mode, we only render the Fullscreen Banner (which is active).
  const backgroundBanner = isSplitscreenMode ? effectiveFullscreenBanner : null;

  // Destructure active settings for easier usage (for legacy reference in component if needed)
  const {
    playerControllerXOffset
  } = activeBanner || {};

  // Spill Over Interaction: when hovering the spill area, dim the primary banner so you can see through (single opacity, no cursor tracking)
  const [isHoveringSpill, setIsHoveringSpill] = React.useState(false);
  const SPILL_HOVER_OPACITY = 1; // 1 = no change (transparency effect disabled); set to e.g. 0.2 to re-enable see-through on spill hover

  // Ray-casting algorithm for point-in-polygon check
  const isPointInPolygon = (point, vs) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x, yi = vs[i].y;
      const xj = vs[j].x, yj = vs[j].y;
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  React.useEffect(() => {
    const banner = activeBanner;
    if (!banner) return;

    const { spillHeight, maskPath, clipLeft } = banner;
    const isFullscreenPreview = bannerPreviewMode === 'fullscreen' || (!bannerPreviewMode && viewMode === 'full');

    if (!spillHeight || spillHeight <= 0 || isFullscreenPreview) {
      if (isHoveringSpill) setIsHoveringSpill(false);
      return;
    }

    const handleMouseMove = (e) => {
      if (e.clientY <= 200) {
        if (isHoveringSpill) setIsHoveringSpill(false);
        return;
      }
      const totalHeight = 200 + spillHeight;
      if (e.clientY > totalHeight) {
        if (isHoveringSpill) setIsHoveringSpill(false);
        return;
      }
      if (clipLeft > 0) {
        const clientXPercent = (e.clientX / window.innerWidth) * 100;
        if (clientXPercent < clipLeft) {
          if (isHoveringSpill) setIsHoveringSpill(false);
          return;
        }
      }

      if (maskPath && maskPath.length >= 3) {
        const xPercent = (e.clientX / window.innerWidth) * 100;
        const yPercent = (e.clientY / totalHeight) * 100;
        setIsHoveringSpill(isPointInPolygon([xPercent, yPercent], maskPath));
      } else {
        setIsHoveringSpill(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeBanner, viewMode, bannerPreviewMode]);

  // Debug: Log when second player should render
  React.useEffect(() => {
    if (showDebugBounds && (viewMode === 'full' || viewMode === 'half')) {
      console.log('Second player should be visible - viewMode:', viewMode, 'showDebugBounds:', showDebugBounds);
    }
  }, [viewMode, showDebugBounds]);


  // Helper: Generate Mask SVG Data URI
  const getMaskStyle = (config, isPrimary) => {
    const { maskPath, spillHeight } = config;

    // Don't apply mask if:
    // 1. No mask path
    if (!maskPath || maskPath.length < 3) return {};
    // 2. If Primary (Active) and Crop Mode Active but NOT Live Preview -> don't show mask
    if (isPrimary && bannerCropModeActive && !bannerCropLivePreview) return {};

    // Calculate total height
    const totalHeight = 200 + (spillHeight || 0);
    const bannerHeightPercent = (200 / totalHeight) * 100;

    const userPoints = maskPath.map(p => `${p.x},${p.y}`).join(' ');

    const svg = `
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>
          <rect x='0' y='0' width='100' height='${bannerHeightPercent}' fill='black' />
          ${maskPath.length >= 3 ? `<polygon points='${userPoints}' fill='black' />` : ''}
        </svg>
       `;
    const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\n/g, '').trim())}`;

    return {
      maskImage: `url("${encodedSvg}")`,
      WebkitMaskImage: `url("${encodedSvg}")`,
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%',
      maskPosition: '0% 0%',
      WebkitMaskPosition: '0% 0%',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat'
    };
  };

  // Helper: Generate Banner Style
  const renderBanner = (config, isPrimary) => {
    if (!config) return null;

    const {
      image: bannerImage,
      verticalPosition,
      scale,
      spillHeight,
      scrollEnabled,
      clipLeft,
      horizontalOffset
    } = config;

    const isGif = bannerImage?.startsWith('data:image/gif');

    // Determine if we should force clip the spill (for Fullscreen mode/bg)
    // Primary: Force clip if checks depend on viewmode (Fullscreen Mode)
    // Background: ALWAYS force clip (Layer 0 is just the header strip)
    const isFullscreenPreview = bannerPreviewMode === 'fullscreen' || (!bannerPreviewMode && viewMode === 'full');
    const forceClip = isPrimary ? isFullscreenPreview : true;

    return (
      <div
        key={isPrimary ? 'primary-banner' : 'bg-banner'}
        className="layout-shell__banner-bg"
        style={{
          ...(bannerImage ? { backgroundImage: `url(${bannerImage})` } : {}),
          ...(isGif || !scrollEnabled ? { animation: 'none' } : {}),
          backgroundPosition: `${horizontalOffset ?? 0}% ${verticalPosition ?? 0}%`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: `${scale ?? 100}vw auto`,
          height: spillHeight ? `${200 + spillHeight}px` : '100%',

          clipPath: (() => {
            const left = clipLeft > 0 ? `${clipLeft}%` : '0';
            if (forceClip && spillHeight) {
              const totalHeight = 200 + spillHeight;
              const spillPercent = (spillHeight / totalHeight) * 100;
              return `inset(0 0 ${spillPercent}% ${left})`;
            }
            return clipLeft > 0 ? `inset(0 0 0 ${clipLeft}%)` : 'none';
          })(),

          ...getMaskStyle(config, isPrimary),

          zIndex: isPrimary ? 15 : 14,

          opacity: isPrimary && isHoveringSpill ? SPILL_HOVER_OPACITY : 1,
          transition: 'opacity 0.2s ease-out',
          pointerEvents: 'none'
        }}
      />
    );
  };

  return (
    <div className={`layout-shell layout-shell--${viewMode} ${menuQuarterMode ? 'layout-shell--menu-quarter' : ''} ${showDebugBounds ? 'layout-shell--debug' : ''}`}>
      {/* Fixed Player Controller - Always at top */}
      <div
        id="top-controller-anchor"
        className={`layout-shell__top-controller ${showDebugBounds ? 'debug-bounds debug-bounds--top-controller' : ''}`}
        data-debug-label="Top Controller"
        data-tauri-drag-region
      >
        {/* Layer 0: Background Banner (Fullscreen Banner in Splitscreen Mode) */}
        {backgroundBanner && renderBanner(backgroundBanner, false)}

        {/* Layer 1: Primary Banner (Active Banner) */}
        {renderBanner(activeBanner, true)}

        <WindowControls />

        {!showDebugBounds && (
          <div className="layout-shell__top-controller-wrapper" style={{ transform: `translateX(${playerControllerXOffset || 0}px)` }}>
            {topController || (
              <div className="placeholder placeholder--top-controller">
                <span className="placeholder__label">Top Controller</span>
                <span className="placeholder__subtitle">Orb Controller Slot</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Pattern Separator - Acts as top border for player/menu below */}
        <div className={`layout-shell__separator pattern-${playerBorderPattern || 'diagonal'}`} />
      </div>

      {/* Radial Menu - Positioned at top controller level, left side */}
      {animatedMenu && (
        <div style={{
          position: 'fixed',
          top: '0', // Start at top of screen
          left: '0',
          width: '50vw', // Left half of screen
          height: '200px', // Same height as top controller
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '20px',
          zIndex: 1001, // Above top controller (z-index 100)
          pointerEvents: 'auto'
        }}>
          {animatedMenu}
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="layout-shell__content"
        style={
          viewMode === 'full' && fullscreenPlayerWidthPercent != null
            ? { '--fullscreen-player-width': `${Math.min(100, Math.max(20, fullscreenPlayerWidthPercent))}%` }
            : undefined
        }
      >

        {/* Empty Spacer - Only in Quarter mode for top-left empty space */}
        {viewMode === 'quarter' && (
          <div
            className={`layout-shell__spacer ${showDebugBounds ? 'debug-bounds debug-bounds--spacer' : ''}`}
            data-debug-label="Spacer"
            style={{
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {spacerMenu || (showDebugBounds && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '12px'
              }}>
                Spacer (no menu)
              </div>
            ))}
          </div>
        )}

        {/* Empty Spacer for Menu Quarter Mode - top-right empty space */}
        {menuQuarterMode && (
          <div
            className={`layout-shell__menu-spacer ${showDebugBounds ? 'debug-bounds debug-bounds--menu-spacer' : ''}`}
            data-debug-label="Menu Spacer"
            style={{
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {menuSpacerMenu || (showDebugBounds && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '12px'
              }}>
                Menu Spacer (no menu)
              </div>
            ))}
          </div>
        )}

        {/* Main Player Slot */}
        <div
          className={`layout-shell__player layout-shell__player--${viewMode} pattern-${playerBorderPattern || 'diagonal'} ${showDebugBounds ? 'debug-bounds debug-bounds--player' : ''}`}
          data-debug-label="Main Player"
          style={{ position: 'relative', overflow: showDebugBounds ? 'visible' : undefined }}
        >
          {!showDebugBounds && (
            <>
              {mainPlayer || (
                <div className="placeholder placeholder--player">
                  <span className="placeholder__label">Main Player</span>
                  <span className="placeholder__subtitle">{viewMode.toUpperCase()} View</span>
                </div>
              )}
            </>
          )}

          {/* Second Player - Bottom Left Quarter */}
          {((viewMode === 'full' || viewMode === 'half') || showDebugBounds) && (
            <div
              className={`layout-shell__second-player layout-shell__second-player--${viewMode} ${showDebugBounds ? 'debug-bounds debug-bounds--second-player' : ''}`}
              data-debug-label="Second Player"
              style={{
                position: 'absolute',
                bottom: '0px',
                left: '0px',
                right: 'auto',
                top: 'auto',
                width: '50%',
                height: '50%',
                zIndex: showDebugBounds ? 10000 : 10,
                ...(showDebugBounds && {
                  backgroundColor: 'rgba(251, 191, 36, 0.5)',
                  border: '6px solid #fbbf24'
                })
              }}
            >
              {showDebugBounds ? (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  zIndex: 1001
                }}>
                  Second Player (no content)
                </div>
              ) : (
                <>
                  {secondPlayer || (
                    <div className="placeholder placeholder--second-player">
                      <span className="placeholder__label">Second Player</span>
                      <span className="placeholder__subtitle">Bottom Left Quarter</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen only: video info panel in right margin (author, year, view count) */}
        {/* Side Menu - Only visible in half/quarter modes */}
        {/* Unified right column: crossfade between FullscreenVideoInfo and side menu for smoother transition */}
        <div className="layout-shell__right-column">
          <AnimatePresence mode="wait">
            {viewMode === 'full' && !showDebugBounds && (
              <motion.div
                key="fullscreen-video-info"
                className="layout-shell__fullscreen-video-info-mount"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FullscreenVideoInfo />
              </motion.div>
            )}
            {(viewMode === 'half' || viewMode === 'quarter') && (
              <motion.div
                key="side-menu"
                className="layout-shell__side-menu-mount"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                <div
                  className={`layout-shell__side-menu ${showDebugBounds ? 'debug-bounds debug-bounds--side-menu' : ''}`}
                  data-debug-label="Side Menu"
                >
                  {/* Mini Header Slot */}
                  <div
                    className={`layout-shell__mini-header ${showDebugBounds ? 'debug-bounds debug-bounds--mini-header' : ''}`}
                    data-debug-label="Mini Header"
                  >
                    {!showDebugBounds && (
                      <>
                        {miniHeader || (
                          <div className="placeholder placeholder--mini-header">
                            <span className="placeholder__label">Mini Header</span>
                            <span className="placeholder__subtitle">Navigation Bar</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Side Menu Content */}
                  <div
                    className={`layout-shell__side-menu-content scrollbar-chevrons-wrapper ${showDebugBounds ? 'debug-bounds debug-bounds--side-menu-content' : ''}`}
                    data-debug-label="Side Menu Content"
                  >
                    {!showDebugBounds && (
                      <>
                        {sideMenu || (
                          <div className="placeholder placeholder--side-menu">
                            <span className="placeholder__label">Side Menu</span>
                            <span className="placeholder__subtitle">Playlists, File Nav, etc.</span>
                          </div>
                        )}
                        {/* Scrollbar Navigation Chevrons */}
                        <ScrollbarChevrons scrollbarWidth={10} />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LayoutShell;

