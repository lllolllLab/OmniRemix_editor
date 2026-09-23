import React from 'react';
import { FileCheck, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StatusBarProps {
  cursorLine: number;
  cursorCol: number;
  totalLines: number;
  totalChars: number;
  imageCount: number;
  statusMessage: string | null;
  statusType?: 'info' | 'success' | 'warning';
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorLine,
  cursorCol,
  totalLines,
  totalChars,
  imageCount,
  statusMessage,
  statusType = 'info',
}) => {
  const formatSize = (chars: number) => {
    if (chars < 1024) return `${chars} B`;
    return `${(chars / 1024).toFixed(1)} KB`;
  };

  return (
    <footer className="h-6 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none flex-shrink-0 z-20">
      {/* Left: Status Toast or Document mode */}
      <div className="flex items-center gap-3">
        {statusMessage ? (
          <div className="flex items-center gap-1.5 text-sky-400 font-sans font-medium animate-in fade-in duration-150">
            {statusType === 'success' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : statusType === 'warning' ? (
              <AlertCircle className="w-3 h-3 text-amber-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-sky-400" />
            )}
            <span>{statusMessage}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-sans">一体化模式 (HTML/CSS/JS)</span>
            <span className="text-slate-700">|</span>
            <span>UTF-8</span>
          </div>
        )}
      </div>

      {/* Right: Metrics */}
      <div className="flex items-center gap-3 text-slate-400">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">光标:</span>
          <span className="text-slate-300">
            Ln {cursorLine}, Col {cursorCol}
          </span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1 hidden sm:flex">
          <span className="text-slate-500">统计:</span>
          <span>
            {totalLines} 行 · {formatSize(totalChars)}
          </span>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        <div className="flex items-center gap-1">
          <span className="text-slate-500">图片/SVG:</span>
          <span className="text-sky-400 font-semibold">{imageCount}</span>
        </div>

        <span className="text-slate-700">|</span>

        <span className="text-slate-500 hover:text-slate-300 cursor-help" title="单文档一体化 HTML 运行环境">
          Spaces: 2
        </span>
      </div>
    </footer>
  );
};
