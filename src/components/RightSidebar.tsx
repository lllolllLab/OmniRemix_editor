import React from 'react';
import { Blocks, ImageIcon, X } from 'lucide-react';
import { ExtractedImage } from '../types';
import { ComponentSnippet } from '../types/component';
import { ImageSidebar } from './ImageSidebar';
import { SnippetLibrarySidebar } from './SnippetLibrarySidebar';

export type RightSidebarTab = 'snippets' | 'images';

interface RightSidebarProps {
  activeTab: RightSidebarTab;
  onTabChange: (tab: RightSidebarTab) => void;
  isOpen: boolean;
  onClose: () => void;
  // Snippets props
  components: ComponentSnippet[];
  activeComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onLocateSnippet?: (snippet: ComponentSnippet) => void;
  fileName?: string;
  // Image props
  images: ExtractedImage[];
  selectedImageUrl: string | null;
  onLocateImage: (image: ExtractedImage, locationIndex?: number) => void;
  onOpenLightbox: (image: ExtractedImage) => void;
  onReplaceUrl: (oldUrl: string, newUrl: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  components,
  activeComponentId,
  onSelectComponent,
  onLocateSnippet,
  fileName,
  images,
  selectedImageUrl,
  onLocateImage,
  onOpenLightbox,
  onReplaceUrl,
}) => {
  return (
    <div
      className={`w-full flex-shrink-0 bg-slate-900 flex flex-col h-full z-20 select-none min-w-0 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Top Universal Sidebar Tab Switcher */}
      <div className="h-11 bg-slate-950/80 border-b border-slate-800/80 px-2 sm:px-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          {/* Snippet Library Tab */}
          <button
            onClick={() => onTabChange('snippets')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'snippets'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
            title="代码中的片段与组件库"
          >
            <Blocks className="w-3.5 h-3.5 text-indigo-400" />
            <span>代码片段库</span>
            {components.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {components.length}
              </span>
            )}
            {activeComponentId && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                title="当前正在独显片段"
              />
            )}
          </button>

          {/* Images & SVG Tab */}
          <button
            onClick={() => onTabChange('images')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
            title="页面图片与 SVG 资源解析"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>图片和SVG</span>
            {images.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {images.length}
              </span>
            )}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition flex-shrink-0"
          title="收起侧边栏"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'snippets' ? (
          <SnippetLibrarySidebar
            components={components}
            activeComponentId={activeComponentId}
            onSelectComponent={onSelectComponent}
            onLocateSnippet={onLocateSnippet}
            fileName={fileName}
            isOpen={isOpen}
            onClose={onClose}
            hideTopHeader={true}
          />
        ) : (
          <ImageSidebar
            images={images}
            selectedImageUrl={selectedImageUrl}
            onLocateImage={onLocateImage}
            onOpenLightbox={onOpenLightbox}
            onReplaceUrl={onReplaceUrl}
            isOpen={isOpen}
            onClose={onClose}
            hideTopHeader={true}
          />
        )}
      </div>
    </div>
  );
};
