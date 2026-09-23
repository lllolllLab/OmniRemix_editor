import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode2,
  FilePlus,
  Upload,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
} from 'lucide-react';
import { EditorFile } from '../types';

interface FileTreeSidebarProps {
  files: EditorFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCloseFile: (fileId: string, e: React.MouseEvent) => void;
  onNewFile: () => void;
  onOpenLocalFiles: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FileTreeSidebar: React.FC<FileTreeSidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCloseFile,
  onNewFile,
  onOpenLocalFiles,
  isOpen,
  onClose,
}) => {
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <aside
      className={`w-full flex-shrink-0 bg-slate-900 flex flex-col h-full select-none border-r border-slate-800/80 min-w-0 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Directory Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 flex-shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
              文件资源目录
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              WORKSPACE · {files.length} 个文件
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onNewFile}
            className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 rounded transition"
            title="新建 HTML 文件"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenLocalFiles}
            className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 rounded transition"
            title="打开本地文件..."
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition ml-0.5"
            title="收起目录侧边栏"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Filter if more than 3 files */}
      {files.length > 3 && (
        <div className="p-2 border-b border-slate-800/50 bg-slate-950/30">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="过滤文件..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-6 pr-2 py-1 bg-slate-950/60 border border-slate-800 rounded text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      )}

      {/* Directory Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Workspace Root Folder Item */}
        <div>
          <button
            onClick={() => setIsWorkspaceExpanded((prev) => !prev)}
            className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold text-slate-300 hover:bg-slate-800/60 transition group"
          >
            {isWorkspaceExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
            <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="tracking-wide">项目工程工作区</span>
          </button>

          {isWorkspaceExpanded && (
            <div className="ml-3 pl-2 border-l border-slate-800/80 mt-1 space-y-0.5">
              {filteredFiles.map((file) => {
                const isActive = file.id === activeFileId;

                return (
                  <div
                    key={file.id}
                    onClick={() => onSelectFile(file.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer border transition-all ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <FileCode2
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                        }`}
                      />
                      <span className="truncate font-mono text-[11px] sm:text-xs">
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {file.isDirty && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
                          title="有未保存改动"
                        />
                      )}

                      {files.length > 1 && (
                        <button
                          onClick={(e) => onCloseFile(file.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="关闭文件"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Directory Footer Actions */}
      <div className="p-2 border-t border-slate-800/70 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
        <button
          onClick={onNewFile}
          className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-800 hover:text-slate-200 text-slate-400 transition"
          title="新建文件"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建文件</span>
        </button>

        <div className="w-px h-3 bg-slate-800 mx-1" />

        <button
          onClick={onOpenLocalFiles}
          className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-800 hover:text-slate-200 text-slate-400 transition"
          title="打开本地电脑文件"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>打开本地</span>
        </button>
      </div>
    </aside>
  );
};
