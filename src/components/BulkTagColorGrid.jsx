import React, { useState } from 'react';
import { FOLDER_COLORS } from '../utils/folderColors';

/**
 * BulkTagColorGrid - Shows a grid of 16 colors on hover for bulk tagging
 * Appears when hovering over a video thumbnail in bulk tag mode
 */
const BulkTagColorGrid = ({ 
  videoId, 
  currentFolders = [], 
  selectedFolders = new Set(),
  onColorClick,
  playlistId = null,
  folderMetadata = {}
}) => {
  // Helper to get display name for a folder color
  const getDisplayName = (color) => {
    const metadata = folderMetadata[color.id];
    if (metadata && metadata.name) {
      // Check if custom name differs from default
      const defaultName = color.name;
      const customName = metadata.name.trim();
      
      // Normalize both names for comparison (remove " Folder" suffix, case-insensitive)
      const normalize = (name) => name.replace(/\s+Folder$/i, '').trim().toLowerCase();
      const defaultBase = normalize(defaultName);
      const customBase = normalize(customName);
      
      // Return custom name if it's different from default
      if (customBase !== defaultBase && customBase.length > 0) {
        return customName;
      }
    }
    return null; // Return null if no custom name or it matches default
  };

  return (
    <div 
      className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20"
      data-card-action="true"
      onClick={(e) => e.stopPropagation()}
      style={{ overflow: 'visible' }}
    >
      <div className="grid grid-cols-4 grid-rows-4 h-full w-full gap-0" style={{ overflow: 'visible' }}>
        {FOLDER_COLORS.map((color) => {
          const isSelected = selectedFolders.has(color.id);
          const isCurrentlyAssigned = currentFolders.includes(color.id);
          const customName = getDisplayName(color);
          const displayName = customName || color.name;
          
          return (
            <div key={color.id} className="relative w-full h-full group" style={{ overflow: 'visible' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onColorClick) {
                    onColorClick(color.id);
                  }
                }}
                className={`
                  w-full h-full transition-all relative
                  ${isSelected 
                    ? 'ring-2 ring-white ring-inset' 
                    : 'hover:opacity-90'
                  }
                  ${isCurrentlyAssigned ? 'opacity-100' : 'opacity-70'}
                `}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <svg 
                    className="w-6 h-6 text-white absolute inset-0 m-auto z-10" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
                
                {/* Custom name overlay - always show if custom name exists and differs from default */}
                {customName && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ 
                      zIndex: 15
                    }}
                  >
                    <div 
                      className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 1)',
                        whiteSpace: 'nowrap',
                        maxWidth: '90%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {customName}
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BulkTagColorGrid;

