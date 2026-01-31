import React, { useState, useEffect, useRef } from 'react';

/**
 * ImageHoverPreview - Displays an enlarged preview of an image on hover
 * Similar to 4chanX extension behavior
 */
const ImageHoverPreview = ({
    src,
    previewSrc, // Optional high-res source for preview (defaults to src)
    alt = 'Preview',
    delay = 500,
    maxWidth = 900,
    maxHeight = 1200,
    children
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const hoverTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    const previewRef = useRef(null);

    const handleMouseEnter = (e) => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // Set timeout for delayed preview
        hoverTimeoutRef.current = setTimeout(() => {
            setShowPreview(true);
            updatePreviewPosition(e);
        }, delay);
    };

    const handleMouseLeave = () => {
        // Clear timeout if mouse leaves before delay
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setShowPreview(false);
    };

    const handleMouseMove = (e) => {
        if (showPreview) {
            updatePreviewPosition(e);
        }
    };

    const updatePreviewPosition = (e) => {
        const padding = 20; // Padding from edges
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Start with cursor position + offset
        let x = e.clientX + padding;
        let y = e.clientY + padding;

        // Priority 1: Ensure image doesn't go off RIGHT edge
        if (x + imageSize.width > viewportWidth - padding) {
            // Try positioning to the left of cursor
            x = e.clientX - imageSize.width - padding;
        }

        // Priority 2: Ensure image doesn't go off BOTTOM edge
        if (y + imageSize.height > viewportHeight - padding) {
            // Position above cursor instead
            y = e.clientY - imageSize.height - padding;
        }

        // Priority 3: If still off-screen on right, clamp to right edge
        if (x + imageSize.width > viewportWidth - padding) {
            x = viewportWidth - imageSize.width - padding;
        }

        // Priority 4: If still off-screen on bottom, clamp to bottom edge
        if (y + imageSize.height > viewportHeight - padding) {
            y = viewportHeight - imageSize.height - padding;
        }

        // Only prevent going off LEFT edge (allow top extension)
        x = Math.max(padding, x);

        // Allow negative Y (extending above viewport) - don't clamp to 0
        // This gives us more space for tall images

        setPreviewPosition({ x, y });
    };

    const handleImageLoad = (e) => {
        const img = e.target;
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Scale down if larger than max dimensions
        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        setImageSize({ width, height });
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div
                ref={containerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                style={{ display: 'inline-block', width: '100%', height: '100%' }}
            >
                {children}
            </div>

            {/* Preview overlay */}
            {showPreview && src && (
                <div
                    ref={previewRef}
                    style={{
                        position: 'fixed',
                        left: `${previewPosition.x}px`,
                        top: `${previewPosition.y}px`,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#0f172a',
                    }}
                >
                    <img
                        src={previewSrc || src}
                        alt={alt}
                        onLoad={handleImageLoad}
                        style={{
                            display: 'block',
                            maxWidth: `${maxWidth}px`,
                            maxHeight: `${maxHeight}px`,
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            )}
        </>
    );
};

export default ImageHoverPreview;
