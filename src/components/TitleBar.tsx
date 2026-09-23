import React, { useRef } from 'react';
import {
  FileCode2,
  Plus,
  FolderOpen,
  Save,
  Wand2,
  Columns2,
  Code2,
  Play,
  Image as ImageIcon,
  X,
  Download,
  PanelLeft,
  Blocks,
} from 'lucide-react';
import { EditorFile, LayoutMode } from '../types';
import { RightSidebarTab } from './RightSidebar';

interface TitleBarProps {
  files: EditorFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onCloseFile: (id: string, e: React.MouseEvent) => void;
  onNewFile: () => void;
  onOpenFiles: () => void;
  onSaveFile: () => void;
  onSaveFileAs: () => void;
  onFormatCode: () => void;
  layoutMode: LayoutMode;
  onChangeLayout: (mode: LayoutMode) => void;
  isSidebarOpen: boolean;
  activeSidebarTab: RightSidebarTab;
  onToggleSidebarTab: (tab: RightSidebarTab) => void;
  isFileTreeOpen: boolean;
  onToggleFileTree: () => void;
  snippetCount: number;
  isComponentIsolated: boolean;
  imageCount: number;
  isFormatting: boolean;
  isSaving: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCloseFile,
  onNewFile,
  onOpenFiles,
  onSaveFile,
  onSaveFileAs,
  onFormatCode,
  layoutMode,
  onChangeLayout,
  isSidebarOpen,
  activeSidebarTab,
  onToggleSidebarTab,
  isFileTreeOpen,
  onToggleFileTree,
  snippetCount,
  isComponentIsolated,
  imageCount,
  isFormatting,
  isSaving,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 sm:px-3 select-none flex-shrink-0 z-30 min-w-0">
      {/* Brand & Multi-File Tabs Strip */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden mr-1 sm:mr-2">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 pr-1 flex-shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <FileCode2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="font-bold text-xs sm:text-sm tracking-tight text-white hidden md:inline">
            OmniRemix
          </span>
        </div>

        {/* Toggle File Tree Directory Button: Placed to the right of logo */}
        <button
          onClick={onToggleFileTree}
          className={`p-1.5 sm:p-2 rounded-lg border transition flex items-center justify-center flex-shrink-0 ${
            isFileTreeOpen
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border-slate-700/50 hover:bg-slate-800'
          }`}
          title={isFileTreeOpen ? '收起目录侧边栏 (Ctrl+B)' : '展开目录侧边栏 (Ctrl+B)'}
          aria-label={isFileTreeOpen ? '收起目录侧边栏' : '展开目录侧边栏'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Vertical divider */}
        <div className="h-4 w-px bg-slate-800 flex-shrink-0 mx-0.5" />

        {/* Tab Strip */}
        <div
          ref={tabsContainerRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full py-1"
        >
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs cursor-pointer border transition-all flex-shrink-0 max-w-[130px] sm:max-w-[200px] ${
                  isActive
                    ? 'bg-slate-950 text-sky-400 border-slate-700/80 shadow-sm font-medium'
                    : 'bg-slate-900/50 text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="truncate font-mono text-[11px] sm:text-xs">
                  {file.name}
                </span>

                {/* Dirty Indicator (●) or Close (×) */}
                <div className="flex items-center ml-1">
                  {file.isDirty ? (
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 group-hover:hidden"
                      title="有未保存修改"
                    />
                  ) : null}

                  <button
                    onClick={(e) => onCloseFile(file.id, e)}
                    className={`p-0.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition ${
                      file.isDirty ? 'hidden group-hover:block' : ''
                    }`}
                    title="关闭文件"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* New Tab Button */}
          <button
            onClick={onNewFile}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition flex-shrink-0"
            title="新建文件标签"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Open Local Files */}
        <button
          onClick={onOpenFiles}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="打开本地 HTML 文件 (Ctrl+O)"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Save Current File */}
        <button
          onClick={onSaveFile}
          disabled={isSaving || !activeFile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-40"
          title="保存当前文件到本地 (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
        </button>

        {/* Save As */}
        <button
          onClick={onSaveFileAs}
          disabled={isSaving || !activeFile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition disabled:opacity-40 hidden md:flex"
          title="另存为新文件..."
        >
          <Download className="w-4 h-4" />
        </button>

        {/* One-Click Format Code */}
        <button
          onClick={onFormatCode}
          disabled={isFormatting || !activeFile}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
            isFormatting
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border-slate-700/60'
          }`}
          title="一键美化格式化 HTML/CSS/JS (Alt+Shift+F)"
        >
          <Wand2 className={`w-3.5 h-3.5 ${isFormatting ? 'animate-spin text-sky-400' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">格式化</span>
        </button>

        {/* Layout Switcher */}
        <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onChangeLayout('editor')}
            className={`p-1.5 rounded transition ${
              layoutMode === 'editor'
                ? 'bg-sky-500/20 text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="纯代码模式"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeLayout('split')}
            className={`p-1.5 rounded transition ${
              layoutMode === 'split'
                ? 'bg-sky-500/20 text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="工作区布局模式"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeLayout('preview')}
            className={`p-1.5 rounded transition ${
              layoutMode === 'preview'
                ? 'bg-sky-500/20 text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="全屏渲染预览模式"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snippet Library Toggle: Blocks icon */}
        <button
          onClick={() => onToggleSidebarTab('snippets')}
          className={`relative p-2 rounded-lg text-xs font-medium transition flex items-center justify-center border ${
            isSidebarOpen && activeSidebarTab === 'snippets'
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border-slate-700/50 hover:bg-slate-800'
          }`}
          title={
            isSidebarOpen && activeSidebarTab === 'snippets'
              ? '收起代码片段库'
              : `展开代码片段库 (${snippetCount} 处识别代码片段)`
          }
          aria-label={
            isSidebarOpen && activeSidebarTab === 'snippets'
              ? '收起代码片段库'
              : '展开代码片段库'
          }
        >
          <Blocks className="w-4 h-4" />
          {snippetCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center bg-indigo-500 text-white border border-slate-900 shadow-sm">
              {snippetCount > 99 ? '99+' : snippetCount}
            </span>
          )}
          {isComponentIsolated && (
            <span
              className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping"
              title="当前正独显代码片段"
            />
          )}
        </button>

        {/* Image & SVG Sidebar Toggle: Icon only with badge */}
        <button
          onClick={() => onToggleSidebarTab('images')}
          className={`relative p-2 rounded-lg text-xs font-medium transition flex items-center justify-center border ${
            isSidebarOpen && activeSidebarTab === 'images'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10'
              : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border-slate-700/50 hover:bg-slate-800'
          }`}
          title={
            isSidebarOpen && activeSidebarTab === 'images'
              ? '收起图片和SVG'
              : `展开图片和SVG (${imageCount})`
          }
          aria-label={
            isSidebarOpen && activeSidebarTab === 'images'
              ? '收起图片和SVG'
              : '展开图片和SVG'
          }
        >
          <ImageIcon className="w-4 h-4" />
          {imageCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center bg-sky-500 text-slate-950 border border-slate-900 shadow-sm">
              {imageCount > 99 ? '99+' : imageCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
