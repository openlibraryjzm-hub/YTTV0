import React from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';
import { LayoutGrid, Trash2 } from 'lucide-react';

const ExplorerPage = ({ onVideoSelect }) => {
  const { setCurrentPage } = useNavigationStore();
  const { groups, totalPages: storeTotalPages, setTotalPages, setActivePage, deletePage } = usePlaylistGroupStore();

  const derivedTotalPages = groups.length > 0 ? Math.max(1, ...groups.map(g => g.page || 1)) : 1;
  const totalPages = Math.max(storeTotalPages, derivedTotalPages);

  const playlistPages = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    // Calculate how many folders (groups) are actually placed on this page
    const foldersCount = groups.filter(g => (g.page || 1) === pageNum).length;
    return {
      id: pageNum,
      name: `Page ${pageNum}`,
      folders: foldersCount
    };
  });

  const handlePageClick = (pageNum) => {
    setActivePage(pageNum);
    setCurrentPage('playlists');
  };

  const handleAddPage = () => {
    const newPageNum = totalPages + 1;
    setTotalPages(newPageNum);
  };

  const handleDeletePage = (e, pageId) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to remove Page ${pageId} from your Hub?\n\nThis will instantly delete any carousels/folders configured on this page, but your actual underlying playlists and videos will remain safe in the 'Unsorted' section of Page 1.`);
    if (confirmed) {
      deletePage(pageId);
    }
  };

  // Dynamic grid structure based directly on the number of pages present
  const count = playlistPages.length;
  let gridClass = 'grid-cols-1 grid-rows-1';
  if (count === 2) gridClass = 'grid-cols-2 grid-rows-1';
  else if (count === 3) gridClass = 'grid-cols-3 grid-rows-1';
  else if (count === 4) gridClass = 'grid-cols-2 grid-rows-2';
  else if (count > 4 && count <= 6) gridClass = 'grid-cols-3 grid-rows-2';
  else if (count > 6 && count <= 9) gridClass = 'grid-cols-3 grid-rows-3';
  else if (count > 9) gridClass = 'grid-cols-4';

  const isGiant = count <= 2;

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-white font-sans overflow-hidden select-none border-l border-white/5">
      
      {/* Sleek Header */}
      <div className="bg-[#0f0f0f] border-b border-white/5 p-8 flex items-end justify-between shadow-sm relative z-10 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4 drop-shadow-md">
            <LayoutGrid className="text-sky-500" size={40} strokeWidth={2.5} />
            Hub
          </h1>
          <p className="text-slate-400 mt-3 text-sm max-w-xl leading-relaxed">
            Select a segment representing an entire page of playlists. Adapts dynamically as you add more pages.
          </p>
        </div>
        
        <button 
          onClick={handleAddPage}
          className="bg-sky-500/10 text-sky-500 border border-sky-500/30 hover:bg-sky-500 hover:text-white transition-all px-6 py-3 rounded-xl font-bold flex items-center gap-3 relative overflow-hidden group shadow-[0_0_20px_rgba(14,165,233,0.1)] hover:shadow-[0_0_30px_rgba(14,165,233,0.3)]"
        >
          <span className="text-2xl leading-none font-light block group-hover:rotate-90 group-hover:scale-125 transition-transform duration-300 origin-center">+</span>
          New Page
        </button>
      </div>

      {/* Main Container - Automatically calculating minimum aspect square bounds */}
      <div className="flex-1 w-full flex items-center justify-center p-4 md:p-8 xl:p-12 overflow-hidden min-h-0">
        
        {/* Unified Dynamic Responsive Giant Square */}
        {/* gap-px with a bright background acts as a flawless 1px interior border grid line */}
        <div 
          className={`bg-white/10 grid gap-px ${gridClass} rounded-3xl overflow-hidden shadow-2xl border border-white/10`}
          style={{
             // Keeps it a perfect square matching whichever available dimension is smallest!
             width: 'min(100%, calc(100vh - 240px))', 
             height: 'min(100%, calc(100vh - 240px))' 
          }}
        >
          {playlistPages.map((page) => (
            <div 
              key={page.id}
              onClick={() => handlePageClick(page.id)}
              className="group relative bg-[#0a0a0a] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden hover:bg-[#151515]"
            >
              {page.id > 1 && (
                <button
                  onClick={(e) => handleDeletePage(e, page.id)}
                  className="absolute top-4 right-4 p-3 bg-red-500/0 text-red-500/0 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all duration-300 group-hover:text-red-500/50 z-20 scale-90 hover:scale-110"
                  title={`Delete Page ${page.id}`}
                >
                  <Trash2 size={24} strokeWidth={2} />
                </button>
              )}

              {/* Vibrant Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-transparent to-transparent group-hover:from-sky-500/10 transition-colors duration-700" />
              
              <div className={`${isGiant ? 'w-48 h-48 mb-8' : 'w-20 h-20 mb-4'} bg-white/5 group-hover:bg-sky-500/15 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                 <LayoutGrid size={isGiant ? 96 : 40} className="text-white/20 group-hover:text-sky-400 transition-colors duration-500" />
              </div>
              
              <h2 className={`${isGiant ? 'text-5xl' : 'text-xl'} font-extrabold text-white tracking-wider text-center relative z-10 transition-all duration-500 drop-shadow-lg group-hover:scale-105`}>
                 {page.name}
              </h2>
              
              <span className={`${isGiant ? 'text-xl mt-4 max-w-sm' : 'text-xs mt-2'} text-sky-400 font-bold tracking-widest uppercase text-center relative z-10 opacity-70 group-hover:opacity-100 transition-all duration-500`}>
                 {page.folders} Folders
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ExplorerPage;
