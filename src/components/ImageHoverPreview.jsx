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
    const [imageLoaded, setImageLoaded] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    const previewRef = useRef(null);
    const lastMouseEventRef = useRef(null); // Store last mouse event for repositioning on load

    const handleMouseEnter = (e) => {
        // Store mouse event for later use
        lastMouseEventRef.current = e;

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
        setImageLoaded(false); // Reset for next hover
    };

    const handleMouseMove = (e) => {
        // Store mouse event for later use
        lastMouseEventRef.current = e;

        if (showPreview) {
            updatePreviewPosition(e);
        }
    };

    const updatePreviewPosition = (e, size = null) => {
        const padding = 20; // Padding from edges
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Use provided size or fall back to state
        const currentSize = size || imageSize;

        // Don't position if we don't have size yet
        if (currentSize.width === 0 || currentSize.height === 0) {
            return;
        }

        // Calculate available space
        const availableWidth = viewportWidth - (padding * 2);
        const availableHeight = viewportHeight - (padding * 2);

        // Determine if image is "large" (takes up more than 70% of viewport)
        const isLargeWidth = currentSize.width > availableWidth * 0.7;
        const isLargeHeight = currentSize.height > availableHeight * 0.7;

        let x, y;

        if (isLargeWidth || isLargeHeight) {
            // For large images: Center them in the viewport
            x = (viewportWidth - currentSize.width) / 2;
            y = (viewportHeight - currentSize.height) / 2;

            // Ensure we don't go off left edge
            x = Math.max(padding, x);

            // Allow extending above viewport for very tall images
            // but try to keep at least some visible
            if (y < -currentSize.height + 100) {
                y = -currentSize.height + 100; // Keep at least 100px visible
            }

            // Clamp to right edge if needed
            if (x + currentSize.width > viewportWidth - padding) {
                x = viewportWidth - currentSize.width - padding;
            }

            // Clamp to bottom edge if needed
            if (y + currentSize.height > viewportHeight - padding) {
                y = viewportHeight - currentSize.height - padding;
            }
        } else {
            // For smaller images: Follow cursor with smart positioning
            x = e.clientX + padding;
            y = e.clientY + padding;

            // Priority 1: Ensure image doesn't go off RIGHT edge
            if (x + currentSize.width > viewportWidth - padding) {
                // Try positioning to the left of cursor
                x = e.clientX - currentSize.width - padding;
            }

            // Priority 2: Ensure image doesn't go off BOTTOM edge
            if (y + currentSize.height > viewportHeight - padding) {
                // Position above cursor instead
                y = e.clientY - currentSize.height - padding;
            }

            // Priority 3: If still off-screen on right, clamp to right edge
            if (x + currentSize.width > viewportWidth - padding) {
                x = viewportWidth - currentSize.width - padding;
            }

            // Priority 4: If still off-screen on bottom, clamp to bottom edge
            if (y + currentSize.height > viewportHeight - padding) {
                y = viewportHeight - currentSize.height - padding;
            }

            // Only prevent going off LEFT edge
            x = Math.max(padding, x);

            // Allow negative Y (extending above viewport) for tall images
        }

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

        const newSize = { width, height };
        setImageSize(newSize);

        // Immediately recalculate position with the new size to prevent jump
        if (lastMouseEventRef.current) {
            updatePreviewPosition(lastMouseEventRef.current, newSize);
        }

        // Mark as loaded to trigger fade-in
        setImageLoaded(true);
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
                        border: '2px solid #e0f2fe',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#e0f2fe',
                        opacity: imageLoaded ? 1 : 0,
                        transition: 'opacity 0.15s ease-in-out',
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
