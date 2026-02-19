import React from 'react';
import { useLayoutStore } from './store/layoutStore';
import { useConfigStore } from './store/configStore';
import WindowControls from './components/WindowControls';
import ScrollbarChevrons from './components/ScrollbarChevrons';

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
    bannerCropModeActive, // Shared
    bannerCropLivePreview, // Shared
    bannerPreviewMode // From AppPage (override viewMode)
  } = useConfigStore();

  // Determine active banner settings based on view mode (or preview override)
  const activeBanner = bannerPreviewMode
    ? (bannerPreviewMode === 'fullscreen' ? fullscreenBanner : splitscreenBanner)
    : (viewMode === 'full' ? fullscreenBanner : splitscreenBanner);

  // Destructure active settings for easier usage
  const {
    image: customBannerImage,
    verticalPosition: bannerVerticalPosition,
    scale: bannerScale,
    spillHeight: bannerSpillHeight,
    maskPath: bannerMaskPath,
    scrollEnabled: bannerScrollEnabled,
    clipLeft: bannerClipLeft,
    horizontalOffset: bannerHorizontalOffset,
    playerControllerXOffset
  } = activeBanner || {}; // Safety check if store not ready

  // Spill Over Interaction Logic
  const [isHoveringSpill, setIsHoveringSpill] = React.useState(false);

  // Ray-casting algorithm for point-in-polygon check
  const isPointInPolygon = (point, vs) => {
    // point: [x, y], vs: [[x, y], ...]
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
    // Only track if there is actually a spill
    // AND we are NOT in fullscreen mode (where spill is clipped)
    const isFullscreen = viewMode === 'full' || bannerPreviewMode === 'fullscreen';

    if (!bannerSpillHeight || bannerSpillHeight <= 0 || isFullscreen) {
      if (isHoveringSpill) setIsHoveringSpill(false);
      return;
    }

    const handleMouseMove = (e) => {
      // 1. Check if below header
      if (e.clientY <= 200) {
        if (isHoveringSpill) setIsHoveringSpill(false);
        return;
      }

      // 2. Check if beyond total banner height
      const totalHeight = 200 + bannerSpillHeight;
      if (e.clientY > totalHeight) {
        if (isHoveringSpill) setIsHoveringSpill(false);
        return;
      }

      // 3. Check Left Clip - if hovering clipped area, don't trigger
      if (bannerClipLeft > 0) {
        const clientXPercent = (e.clientX / window.innerWidth) * 100;
        if (clientXPercent < bannerClipLeft) {
          if (isHoveringSpill) setIsHoveringSpill(false);
          return;
        }
      }

      // 4. Check Shape Mask (if exists)
      if (bannerMaskPath && bannerMaskPath.length >= 3) {
        // Calculate percentages
        const xPercent = (e.clientX / window.innerWidth) * 100;
        const yPercent = (e.clientY / totalHeight) * 100;

        // Perform point-in-polygon check
        const isInside = isPointInPolygon([xPercent, yPercent], bannerMaskPath);
        setIsHoveringSpill(isInside);
      } else {
        // Default Rectangular Spill - if we are here, we are in the zone (200 < y < totalHeight)
        // and past the left clip.
        setIsHoveringSpill(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [bannerSpillHeight, viewMode, bannerPreviewMode, bannerMaskPath, bannerClipLeft]);

  // Debug: Log when second player should render
  React.useEffect(() => {
    if (showDebugBounds && (viewMode === 'full' || viewMode === 'half')) {
      console.log('Second player should be visible - viewMode:', viewMode, 'showDebugBounds:', showDebugBounds);
    }
  }, [viewMode, showDebugBounds]);

  const isBannerGif = customBannerImage?.startsWith('data:image/gif');

  // Generate Mask SVG Data URI if path exists
  const maskImageStyle = React.useMemo(() => {
    // Don't apply mask if:
    // 1. No mask path exists (less than 3 points)
    // 2. Crop mode is active AND live preview is disabled
    if (!bannerMaskPath || bannerMaskPath.length < 3) return {};
    if (bannerCropModeActive && !bannerCropLivePreview) return {};

    // Calculate the total height including spill
    const totalHeight = 200 + (bannerSpillHeight || 0);
    const bannerHeightPercent = (200 / totalHeight) * 100;

    // Create a composite mask:
    // 1. Full rectangle for banner area (0 to bannerHeightPercent) - always visible
    // 2. User's custom path for spill area (bannerHeightPercent to 100) - selective

    // The user's path points are in percentage (0-100) of the TOTAL height
    // We need to create a combined shape that includes:
    // - The full width banner area: (0,0) -> (100,0) -> (100,bannerHeightPercent) -> (0,bannerHeightPercent)
    // - The user's custom spill path (only points with y > bannerHeightPercent)

    const userPoints = bannerMaskPath.map(p => `${p.x},${p.y}`).join(' ');

    // Create a composite path that:
    // 1. Draws the full banner rectangle
    // 2. Adds the user's custom path for the spill
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>
        <!-- Banner area: always visible (full rectangle from 0 to ${bannerHeightPercent}%) -->
        <rect x='0' y='0' width='100' height='${bannerHeightPercent}' fill='black' />
        
        <!-- Spill area: user's custom path -->
        ${bannerMaskPath.length >= 3 ? `<polygon points='${userPoints}' fill='black' />` : ''}
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
  }, [bannerMaskPath, bannerSpillHeight, bannerCropModeActive, bannerCropLivePreview]);

  return (
    <div className={`layout-shell layout-shell--${viewMode} ${menuQuarterMode ? 'layout-shell--menu-quarter' : ''} ${showDebugBounds ? 'layout-shell--debug' : ''}`}>
      {/* Fixed Player Controller - Always at top */}
      <div
        id="top-controller-anchor"
        className={`layout-shell__top-controller ${showDebugBounds ? 'debug-bounds debug-bounds--top-controller' : ''}`}
        data-debug-label="Top Controller"
        data-tauri-drag-region
      >
        {/* Background Layer with Spill Support (spill clipped in fullscreen) */}
        <div
          className="layout-shell__banner-bg"
          style={{
            ...(customBannerImage ? { backgroundImage: `url(${customBannerImage})` } : {}),
            ...(isBannerGif || !bannerScrollEnabled ? { animation: 'none' } : {}),
            backgroundPosition: `${bannerHorizontalOffset ?? 0}% ${bannerVerticalPosition ?? 0}%`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: `${bannerScale ?? 100}vw auto`,
            // Always render full height (banner + spill)
            height: bannerSpillHeight ? `${200 + bannerSpillHeight}px` : '100%',
            // Clip-path logic:
            // - Fullscreen: clip to show only banner (200px), hide spill, AND apply left clip
            // - Split-screen: show everything or apply left clip if configured
            clipPath: (() => {
              const leftClip = bannerClipLeft > 0 ? `${bannerClipLeft}%` : '0';

              if ((viewMode === 'full' || bannerPreviewMode === 'fullscreen') && bannerSpillHeight) {
                // Calculate what percentage of total height is the spill
                const totalHeight = 200 + bannerSpillHeight;
                const spillPercent = (bannerSpillHeight / totalHeight) * 100;
                // Clip from bottom to hide spill AND from left if configured
                // inset(top right bottom left)
                return `inset(0 0 ${spillPercent}% ${leftClip})`;
              }

              // In split-screen, apply left clip if configured
              return bannerClipLeft > 0 ? `inset(0 0 0 ${bannerClipLeft}%)` : 'none';
            })(),
            // Only apply mask in half/quarter modes (not in full screen)
            // But if previewing Fullscreen in split view, force disable mask (act like fullscreen)
            ...((viewMode !== 'full' && bannerPreviewMode !== 'fullscreen') ? maskImageStyle : {}),

            // Interaction Styles for Spill Over
            // We want it to be opaque normally, but transparent when hovering the SPILL area
            // "Click through" is handled by pointerEvents: 'none' (this allows clicks to pass to buttons below)
            // But we still track mouse position via window listener to trigger the visual transparency
            opacity: isHoveringSpill ? 0.15 : 1,
            transition: 'opacity 0.2s ease-out',
            pointerEvents: 'none'
          }}
        />

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
      <div className="layout-shell__content">

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

        {/* Side Menu - Only visible in half/quarter modes */}
        {(viewMode === 'half' || viewMode === 'quarter') && (
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
        )}
      </div>
    </div>
  );
};

export default LayoutShell;

