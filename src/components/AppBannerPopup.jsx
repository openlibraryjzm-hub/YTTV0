import React from 'react';

// AppBannerPopup Component
// Dimensions: 185px x 110px
// Layout:
// - Top Section: Top 1/3 height (approx 36px)
//   - Contains a centered Orb
// - Bottom Right Section: Bottom 2/3 height, Right 1/2 width
// - Bottom Left Section: (Implicitly the remainder)

const AppBannerPopup = ({ isVisible }) => {
    return (
        <div
            className="app-banner-popup"
            style={{
                width: '185px',
                height: '110px',
                background: 'rgba(255, 255, 255, 0.15)', // Glassmorphism base
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px 0 rgba(7, 30, 50, 0.3)',
                opacity: isVisible ? 1 : 0,
                transform: `scale(${isVisible ? 1 : 0.95}) translateX(${isVisible ? 0 : 10}px)`,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: isVisible ? 'auto' : 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 90,
                // Positioning handled by parent container usually, but we'll include the standard positioning here 
                // to match previous inline implementation IF needed, strictly this is inner content.
                // But LayoutShell had it absolute positioned. We'll verify usage in LayoutShell.
                position: 'absolute',
                top: '50%',
                right: '24px',
                translate: '0 -50%' // Using standard translate property for vertical centering cleanup
            }}
        >
            {/* Top Section (1/3 height) */}
            <div
                className="popup-section-top"
                style={{
                    height: '33.33%',
                    width: '100%',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    gap: '12px' // Spacing between orb and rectangles
                }}
            >
                {/* Left Small Rectangle */}
                <div
                    style={{
                        width: '40px',
                        height: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                />

                {/* Orb in middle of top section */}
                <div
                    className="popup-orb"
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #bae6fd 0%, #0ea5e9 100%)', // Sky blue gradient
                        boxShadow: '0 0 10px rgba(14, 165, 233, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />

                {/* Right Small Rectangle */}
                <div
                    style={{
                        width: '40px',
                        height: '16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                />
            </div>

            {/* Bottom Container (2/3 height) */}
            <div
                className="popup-section-bottom"
                style={{
                    flex: 1,
                    display: 'flex',
                    width: '100%'
                }}
            >
                {/* Bottom Left (Rest of space) */}
                <div
                    className="popup-section-bottom-left"
                    style={{
                        width: '50%',
                        height: '100%',
                        // borderRight: '1px solid rgba(255, 255, 255, 0.1)' // Optional divider
                    }}
                />

                {/* Bottom Right Section (Right half minus top 1/3) */}
                <div
                    className="popup-section-bottom-right"
                    style={{
                        width: '50%',
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.05)', // Subtle differentiation
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Top 1/3 of Bottom Right Section */}
                    <div
                        style={{
                            width: '100%',
                            height: '33.33%',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {/* Placeholder for top 1/3 action */}
                    </div>

                    {/* Remaining 2/3 of Bottom Right Section */}
                    <div
                        style={{
                            width: '100%',
                            height: '66.67%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Action</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppBannerPopup;
