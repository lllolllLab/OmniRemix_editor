import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import {
  Search,
  ArrowDown,
  ArrowUp,
  X,
  Replace,
  Eye,
  Maximize2,
  Copy,
  Check,
  ImageIcon,
  Code2,
  Layers,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ExtractedImage } from '../types';
import { ComponentSnippet } from '../types/component';
import { ComponentTabBar } from './ComponentTabBar';

export interface CodeEditorHandle {
  locatePosition: (index: number, length: number, line: number, url?: string) => void;
  scrollToLineAndHighlight: (line: number, index: number, length: number, url?: string) => void;
  format: () => void;
  focus: () => void;
  insertSnippet: (snippet: string) => void;
}

interface CodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  onFormat: () => void;
  onSelectImageUrl?: (url: string) => void;
  onOpenLightbox?: (image: ExtractedImage) => void;
  images: ExtractedImage[];
  components: ComponentSnippet[];
  activeComponentId: string | null;
  onSelectComponent: (componentId: string | null) => void;
  onCursorChange?: (line: number, col: number) => void;
  isDarkTheme?: boolean;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(({
  content,
  onChange,
  onFormat,
  onSelectImageUrl,
  onOpenLightbox,
  images,
  components,
  activeComponentId,
  onSelectComponent,
  onCursorChange,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  // Active component snippet if in component tab mode
  const activeComponent = useMemo(() => {
    if (!activeComponentId) return null;
    return components.find((c) => c.id === activeComponentId) || null;
  }, [components, activeComponentId]);

  // Code displayed in the editor: full content OR component snippet
  const displayContent = useMemo(() => {
    if (activeComponent) {
      return activeComponent.code;
    }
    return content;
  }, [activeComponent, content]);

  // Starting line offset when viewing a component
  const startLineOffset = activeComponent ? activeComponent.startLine - 1 : 0;

  // Search & Replace state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1);

  // Highlighting state for located image in code
  const [highlightedState, setHighlightedState] = useState<{
    line: number;
    url: string;
    index: number;
    length: number;
  } | null>(null);

  // Active image under cursor
  const [activeImagePreview, setActiveImagePreview] = useState<{
    url: string;
    line: number;
    col: number;
    extracted?: ExtractedImage;
  } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState(false);

  // Lines calculation based on currently displayed code
  const lines = displayContent.split('\n');

  // Sync scroll across textarea, line gutter and highlight backdrop
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const top = textareaRef.current.scrollTop;
    const left = textareaRef.current.scrollLeft;
    if (gutterRef.current) {
      gutterRef.current.scrollTop = top;
    }
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = top;
      highlightLayerRef.current.scrollLeft = left;
    }
  };

  // Detect cursor position and whether cursor is inside an image URL
  const updateCursorAndDetectImage = () => {
    if (!textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart;

    // Calculate line and col
    const textBefore = displayContent.substring(0, selStart);
    const linesBefore = textBefore.split('\n');
    const currentLine = linesBefore.length + startLineOffset;
    const currentCol = linesBefore[linesBefore.length - 1].length + 1;

    onCursorChange?.(currentLine, currentCol);

    // Look around cursor for image URL
    const lookback = 300;
    const lookahead = 300;
    const startIdx = Math.max(0, selStart - lookback);
    const endIdx = Math.min(displayContent.length, selStart + lookahead);
    const nearby = displayContent.substring(startIdx, endIdx);
    const relativeSel = selStart - startIdx;

    // Find any extracted image whose URL covers relativeSel
    const found = images.find((img) => {
      const idxInNearby = nearby.indexOf(img.url);
      if (idxInNearby !== -1) {
        const urlEnd = idxInNearby + img.url.length;
        return relativeSel >= idxInNearby - 10 && relativeSel <= urlEnd + 10;
      }
      return false;
    });

    if (found) {
      setActiveImagePreview({
        url: found.url,
        line: currentLine,
        col: currentCol,
        extracted: found,
      });
      onSelectImageUrl?.(found.url);
    } else {
      setActiveImagePreview(null);
    }
  };

  // Handle code edit from textarea
  const handleTextareaChange = (newVal: string) => {
    if (activeComponent) {
      // Replace only this component's substring in the full document
      const before = content.substring(0, activeComponent.startIndex);
      const after = content.substring(activeComponent.endIndex);
      const updatedFull = before + newVal + after;
      onChange(updatedFull);
    } else {
      onChange(newVal);
    }
  };

  useImperativeHandle(ref, () => ({
    locatePosition: (index: number, length: number, line: number, url?: string) => {
      // If we are in component mode, switch to full doc to accurately show location
      if (activeComponentId) {
        onSelectComponent(null);
      }

      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(index, index + length);

      const targetUrl = url || content.substring(index, index + length);
      setHighlightedState({
        line,
        url: targetUrl,
        index,
        length,
      });

      const lineHeight = 24;
      const targetScroll = Math.max(0, (line - 3) * lineHeight);
      textarea.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });

      const matchExtracted = images.find((i) => i.url === targetUrl);
      setActiveImagePreview({
        url: targetUrl,
        line,
        col: index - content.lastIndexOf('\n', index),
        extracted: matchExtracted,
      });

      setTimeout(() => {
        setHighlightedState((curr) => (curr?.line === line ? null : curr));
      }, 5000);
    },
    scrollToLineAndHighlight: (line: number, index: number, length: number, url?: string) => {
      // If in component mode, switch back to full document view
      if (activeComponentId) {
        onSelectComponent(null);
      }

      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(index, index + length);

      const targetUrl = url || content.substring(index, index + length);
      setHighlightedState({
        line,
        url: targetUrl,
        index,
        length,
      });

      const lineHeight = 24;
      const visibleLines = Math.floor(textarea.clientHeight / lineHeight);
      const targetScroll = Math.max(0, (line - Math.max(2, Math.floor(visibleLines / 2))) * lineHeight);

      textarea.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });

      const matchExtracted = images.find((i) => i.url === targetUrl);
      setActiveImagePreview({
        url: targetUrl,
        line,
        col: index - content.lastIndexOf('\n', index),
        extracted: matchExtracted,
      });

      setTimeout(() => {
        setHighlightedState((curr) => (curr?.line === line ? null : curr));
      }, 5000);
    },
    format: () => {
      onFormat();
    },
    focus: () => {
      textareaRef.current?.focus();
    },
    insertSnippet: (snippet: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = displayContent.substring(0, start) + snippet + displayContent.substring(end);
      handleTextareaChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 0);
    },
  }));

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Clear highlight when user starts editing
    if (highlightedState) {
      setHighlightedState(null);
    }

    // Exit isolated component view: Escape key
    if (e.key === 'Escape' && activeComponent && !showSearch) {
      e.preventDefault();
      onSelectComponent(null);
      return;
    }

    // Search: Ctrl+F / Cmd+F
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowSearch(true);
      return;
    }

    // Format: Alt+Shift+F
    if ((e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i')) {
      e.preventDefault();
      onFormat();
      return;
    }

    // Tab key: indent 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end) {
        // Simple insert 2 spaces
        const newText = displayContent.substring(0, start) + '  ' + displayContent.substring(end);
        handleTextareaChange(newText);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      } else {
        // Multi-line indent/outdent
        const before = displayContent.substring(0, start);
        const selected = displayContent.substring(start, end);
        const after = displayContent.substring(end);

        const linesInSelection = selected.split('\n');
        let indented: string;
        let diff: number;

        if (e.shiftKey) {
          // Outdent
          indented = linesInSelection
            .map((l) => (l.startsWith('  ') ? l.slice(2) : l.startsWith(' ') ? l.slice(1) : l))
            .join('\n');
          diff = indented.length - selected.length;
        } else {
          // Indent
          indented = linesInSelection.map((l) => '  ' + l).join('\n');
          diff = indented.length - selected.length;
        }

        handleTextareaChange(before + indented + after);
        setTimeout(() => {
          textarea.setSelectionRange(start, end + diff);
        }, 0);
      }
    }
  };

  // Find occurrences
  useEffect(() => {
    if (!searchQuery) {
      setSearchMatches([]);
      setActiveMatchIndex(-1);
      return;
    }

    const matches: number[] = [];
    const query = searchQuery.toLowerCase();
    const text = displayContent.toLowerCase();
    let idx = text.indexOf(query);

    while (idx !== -1) {
      matches.push(idx);
      idx = text.indexOf(query, idx + query.length);
    }

    setSearchMatches(matches);
    if (matches.length > 0) {
      setActiveMatchIndex(0);
      highlightSearchMatch(matches[0], searchQuery.length);
    } else {
      setActiveMatchIndex(-1);
    }
  }, [searchQuery, displayContent]);

  const highlightSearchMatch = (index: number, length: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(index, index + length);

    const linesBefore = displayContent.substring(0, index).split('\n');
    const targetLine = linesBefore.length;
    const lineHeight = 24;
    textarea.scrollTo({
      top: Math.max(0, (targetLine - 5) * lineHeight),
      behavior: 'smooth',
    });
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const next = (activeMatchIndex + 1) % searchMatches.length;
    setActiveMatchIndex(next);
    highlightSearchMatch(searchMatches[next], searchQuery.length);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prev = (activeMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setActiveMatchIndex(prev);
    highlightSearchMatch(searchMatches[prev], searchQuery.length);
  };

  const handleReplace = () => {
    if (activeMatchIndex === -1 || searchMatches.length === 0) return;
    const matchIndex = searchMatches[activeMatchIndex];
    const newContent =
      displayContent.substring(0, matchIndex) +
      replaceQuery +
      displayContent.substring(matchIndex + searchQuery.length);
    handleTextareaChange(newContent);
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = displayContent.replace(regex, replaceQuery);
    handleTextareaChange(newContent);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-slate-950 font-mono select-text">
      {/* Dynamic Component Tabs Bar (Auto-detected HTML Component Snippets) */}
      <ComponentTabBar
        components={components}
        activeComponentId={activeComponentId}
        onSelectComponent={onSelectComponent}
      />

      {/* Component Context Indicator Banner (When inside a component exclusive view) */}
      {activeComponent && (
        <div className="h-8 px-3 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/70 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200 select-none flex-shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50 flex-shrink-0" />
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 uppercase font-bold flex-shrink-0">
                片段独显模式
              </span>
              <span className="font-mono font-semibold text-white text-xs truncate">
                {activeComponent.name}
              </span>
            </div>
            <span className="text-slate-400 text-[11px] hidden md:inline font-sans truncate">
              ({activeComponent.summary} · 原文件第 {activeComponent.startLine} - {activeComponent.endLine} 行 · 所做修改实时同步至主文件)
            </span>
          </div>

          <button
            onClick={() => onSelectComponent(null)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition flex-shrink-0 cursor-pointer"
            title="退出独显模式，在编辑器中显示完整代码 (快捷键: Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>退出独显 (恢复完整文件)</span>
            <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded text-[10px] bg-indigo-800/80 font-mono text-indigo-200">
              Esc
            </kbd>
          </button>
        </div>
      )}

      {/* Floating Find & Replace Bar */}
      {showSearch && (
        <div className="absolute top-12 right-4 z-40 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 w-84 sm:w-96 animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-1.5">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="查找代码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.shiftKey ? handlePrevMatch() : handleNextMatch();
                } else if (e.key === 'Escape') {
                  setShowSearch(false);
                }
              }}
              autoFocus
              className="flex-1 bg-slate-950 px-2 py-1 text-xs text-slate-200 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
            />
            <span className="text-[11px] text-slate-400 px-1 font-mono">
              {searchMatches.length > 0 ? `${activeMatchIndex + 1}/${searchMatches.length}` : '0 匹配'}
            </span>
            <button
              onClick={handlePrevMatch}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="上一个 (Shift+Enter)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMatch}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="下一个 (Enter)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Replace className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="替换为..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="flex-1 bg-slate-950 px-2 py-1 text-xs text-slate-200 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={handleReplace}
              className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans"
            >
              替换
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans"
            >
              全部替换
            </button>
          </div>
        </div>
      )}

      {/* Floating Active Image URL Tooltip (Simple & Direct, referrerPolicy="no-referrer") */}
      {activeImagePreview && (
        <div className="absolute bottom-4 right-6 z-40 bg-slate-900/95 border border-sky-500/60 backdrop-blur-md rounded-xl shadow-2xl p-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div
            className="w-12 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 cursor-pointer relative group"
            onClick={() => {
              if (activeImagePreview.extracted) {
                onOpenLightbox?.(activeImagePreview.extracted);
              }
            }}
            title="点击放大查看图片"
          >
            <img
              src={activeImagePreview.url}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.proxied && (activeImagePreview.url.startsWith('http://') || activeImagePreview.url.startsWith('https://'))) {
                  img.dataset.proxied = 'true';
                  img.src = `/api/proxy-image?url=${encodeURIComponent(activeImagePreview.url)}`;
                }
              }}
            />
          </div>

          <div className="flex flex-col max-w-[200px] sm:max-w-xs">
            <span className="text-[11px] font-mono text-slate-400 truncate">
              {activeImagePreview.url}
            </span>
            <span className="text-[10px] text-sky-400 mt-0.5">
              第 {activeImagePreview.line} 行, 列 {activeImagePreview.col}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeImagePreview.url);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="复制图片链接"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {activeImagePreview.extracted && (
              <button
                onClick={() => onOpenLightbox?.(activeImagePreview.extracted!)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                title="大图预览"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 sm:w-14 flex-shrink-0 bg-slate-950/90 border-r border-slate-800/80 py-3 select-none overflow-hidden text-right font-mono text-xs text-slate-600 z-20"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1 + startLineOffset;
            const isTargetLine = highlightedState?.line === lineNum;
            return (
              <div
                key={i}
                className={`pr-3 h-6 leading-6 transition-colors font-mono ${
                  isTargetLine
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'hover:text-slate-400'
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Editor Main Canvas with Visual Highlight Layer */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Synchronized Line Highlight Backdrop */}
          <div
            ref={highlightLayerRef}
            className="absolute inset-0 pointer-events-none overflow-hidden py-3 z-0 whitespace-pre"
            style={{ tabSize: 2 }}
          >
            {lines.map((_, i) => {
              const lineNum = i + 1 + startLineOffset;
              const isTargetLine = highlightedState?.line === lineNum;
              if (!isTargetLine) {
                return <div key={i} className="h-6 leading-6" />;
              }
              return (
                <div
                  key={i}
                  className="h-6 leading-6 w-full bg-amber-400/20 border-y border-amber-400/60 flex items-center justify-between px-3 animate-pulse"
                >
                  <span className="text-[10px] text-amber-300 font-sans font-semibold tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-amber-400 inline" />
                    <span>定位图片所在代码行</span>
                  </span>
                  <span className="text-[10px] text-amber-200/80 font-mono truncate max-w-sm">
                    {highlightedState.url}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Actual Code Textarea */}
          <textarea
            ref={textareaRef}
            wrap="off"
            value={displayContent}
            onChange={(e) => {
              handleTextareaChange(e.target.value);
              updateCursorAndDetectImage();
            }}
            onScroll={handleScroll}
            onClick={updateCursorAndDetectImage}
            onKeyUp={updateCursorAndDetectImage}
            onSelect={updateCursorAndDetectImage}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="relative z-10 w-full h-full p-3 font-mono text-sm leading-6 bg-transparent text-slate-100 placeholder-slate-600 border-none outline-none resize-none overflow-auto tab-4 selection:bg-amber-400/40 selection:text-white whitespace-pre"
            style={{
              tabSize: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
