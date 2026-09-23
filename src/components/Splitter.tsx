import React from 'react';
import { GripVertical } from 'lucide-react';

interface SplitterProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  title?: string;
}

export const Splitter: React.FC<SplitterProps> = ({
  onMouseDown,
  onDoubleClick,
  isDragging = false,
  title = '拖拽调整窗口宽度 (双击重置默认比例)',
}) => {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      title={title}
      className={`group relative flex-shrink-0 z-30 cursor-col-resize select-none flex items-center justify-center transition-all ${
        isDragging
          ? 'w-1.5 bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.8)]'
          : 'w-1 bg-slate-800 hover:w-1.5 hover:bg-sky-500/80'
      }`}
    >
      {/* Invisible wider hit target for effortless clicking and dragging */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />

      {/* Center Drag Handle Pill */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 rounded-full py-1.5 px-0.5 border transition-all pointer-events-none flex flex-col items-center justify-center gap-0.5 shadow-md ${
          isDragging
            ? 'bg-sky-500 text-slate-950 border-sky-300 scale-110 opacity-100 shadow-[0_0_10px_rgba(14,165,233,0.6)]'
            : 'bg-slate-900 border-slate-700 text-slate-500 group-hover:text-sky-400 group-hover:border-sky-500/50 group-hover:bg-slate-900 opacity-60 group-hover:opacity-100'
        }`}
      >
        <GripVertical className="w-2.5 h-3.5" />
      </div>
    </div>
  );
};
