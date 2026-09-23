import React, { useState, useMemo } from 'react';
import {
  Blocks,
  Search,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Code2,
  Sparkles,
  FileCode,
  Palette,
  Terminal,
  Compass,
  LayoutTemplate,
  Crosshair,
  Layers,
  Table as TableIcon,
  CreditCard,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { ComponentSnippet, ComponentTagType } from '../types/component';

interface SnippetLibrarySidebarProps {
  components: ComponentSnippet[];
  activeComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onLocateSnippet?: (snippet: ComponentSnippet) => void;
  isOpen: boolean;
  onClose: () => void;
  hideTopHeader?: boolean;
  fileName?: string;
}

type FilterCategory = 'all' | 'structure' | 'style' | 'script' | 'cards' | 'custom';

export const SnippetLibrarySidebar: React.FC<SnippetLibrarySidebarProps> = ({
  components,
  activeComponentId,
  onSelectComponent,
  onLocateSnippet,
  isOpen,
  onClose,
  hideTopHeader = false,
  fileName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active component currently isolated in editor
  const activeComponent = useMemo(() => {
    if (!activeComponentId) return null;
    return components.find((c) => c.id === activeComponentId) || null;
  }, [components, activeComponentId]);

  // Tag type classification for categories
  const matchesCategory = (comp: ComponentSnippet, category: FilterCategory): boolean => {
    if (category === 'all') return true;
    if (category === 'style') return comp.tagType === 'style';
    if (category === 'script') return comp.tagType === 'script';
    if (category === 'structure') {
      return ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'].includes(
        comp.tagType
      );
    }
    if (category === 'cards') {
      return ['card', 'modal', 'dialog', 'form', 'table'].includes(comp.tagType);
    }
    if (category === 'custom') {
      return comp.tagType === 'custom' || comp.tagType === 'hero';
    }
    return true;
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: components.length,
      structure: components.filter((c) => matchesCategory(c, 'structure')).length,
      style: components.filter((c) => matchesCategory(c, 'style')).length,
      script: components.filter((c) => matchesCategory(c, 'script')).length,
      cards: components.filter((c) => matchesCategory(c, 'cards')).length,
      custom: components.filter((c) => matchesCategory(c, 'custom')).length,
    };
  }, [components]);

  // Filtered components based on search and category
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      if (!matchesCategory(comp, selectedCategory)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        comp.name.toLowerCase().includes(q) ||
        comp.summary.toLowerCase().includes(q) ||
        comp.tagName.toLowerCase().includes(q) ||
        comp.code.toLowerCase().includes(q)
      );
    });
  }, [components, selectedCategory, searchQuery]);

  // Copy code handler
  const handleCopyCode = (snippet: ComponentSnippet, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === snippet.id ? null : curr));
    }, 2000);
  };

  // Get visual badge info based on component tag type
  const getBadgeInfo = (tagType: ComponentTagType) => {
    switch (tagType) {
      case 'header':
      case 'nav':
        return {
          label: tagType === 'header' ? '头部' : '导航',
          icon: <Compass className="w-3 h-3 text-cyan-400" />,
          color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        };
      case 'style':
        return {
          label: 'CSS 样式',
          icon: <Palette className="w-3 h-3 text-pink-400" />,
          color: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
        };
      case 'script':
        return {
          label: 'JS 脚本',
          icon: <Terminal className="w-3 h-3 text-amber-400" />,
          color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        };
      case 'section':
      case 'main':
      case 'article':
        return {
          label: tagType === 'main' ? '主体' : tagType === 'section' ? '章节' : '文章',
          icon: <Layers className="w-3 h-3 text-blue-400" />,
          color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        };
      case 'card':
        return {
          label: '卡片',
          icon: <CreditCard className="w-3 h-3 text-emerald-400" />,
          color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        };
      case 'modal':
      case 'dialog':
        return {
          label: '弹窗模态',
          icon: <AlertCircle className="w-3 h-3 text-purple-400" />,
          color: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        };
      case 'table':
        return {
          label: '表格',
          icon: <TableIcon className="w-3 h-3 text-teal-400" />,
          color: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
        };
      case 'footer':
        return {
          label: '页脚',
          icon: <LayoutTemplate className="w-3 h-3 text-slate-400" />,
          color: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
        };
      case 'hero':
        return {
          label: 'Hero',
          icon: <Sparkles className="w-3 h-3 text-indigo-400" />,
          color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        };
      default:
        return {
          label: '组件',
          icon: <Code2 className="w-3 h-3 text-indigo-400" />,
          color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        };
    }
  };

  return (
    <aside
      className={`w-full flex-shrink-0 bg-slate-900 flex flex-col h-full z-20 select-none min-w-0 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Standalone Header (Shown when not wrapped in tabs) */}
      {!hideTopHeader && (
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
              <Blocks className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-slate-200 tracking-wide uppercase truncate">
                代码片段库
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                自动识别自当前编辑器 · {components.length} 个片段
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition"
            title="收起代码片段库"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Prominent Active Exclusive Display Banner */}
      {activeComponent && (
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-950/90 border-b border-indigo-500/30 flex items-center justify-between flex-shrink-0 shadow-inner">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  独显中
                </span>
                <span className="text-xs font-mono font-semibold text-white truncate max-w-[160px]">
                  {activeComponent.name}
                </span>
              </div>
              <p className="text-[10px] text-indigo-300/80 mt-0.5 truncate">
                第 {activeComponent.startLine} - {activeComponent.endLine} 行 ({activeComponent.lineCount} 行代码)
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectComponent(null)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition flex-shrink-0 cursor-pointer"
            title="退出独显模式，在编辑器中显示完整文件代码"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>退出独显</span>
          </button>
        </div>
      )}

      {/* Search and Category Filter Section */}
      <div className="p-3 border-b border-slate-800/60 bg-slate-900/60 space-y-2.5 flex-shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索代码片段、标签名、CSS选择器或关键字..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            全部 ({categoryCounts.all})
          </button>

          {categoryCounts.structure > 0 && (
            <button
              onClick={() => setSelectedCategory('structure')}
              className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                selectedCategory === 'structure'
                  ? 'bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              结构语义 ({categoryCounts.structure})
            </button>
          )}

          {categoryCounts.style > 0 && (
            <button
              onClick={() => setSelectedCategory('style')}
              className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                selectedCategory === 'style'
                  ? 'bg-pink-500/20 text-pink-300 font-medium border border-pink-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              样式表 ({categoryCounts.style})
            </button>
          )}

          {categoryCounts.script > 0 && (
            <button
              onClick={() => setSelectedCategory('script')}
              className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                selectedCategory === 'script'
                  ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              交互脚本 ({categoryCounts.script})
            </button>
          )}

          {categoryCounts.cards > 0 && (
            <button
              onClick={() => setSelectedCategory('cards')}
              className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                selectedCategory === 'cards'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              组件块 ({categoryCounts.cards})
            </button>
          )}

          {categoryCounts.custom > 0 && (
            <button
              onClick={() => setSelectedCategory('custom')}
              className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                selectedCategory === 'custom'
                  ? 'bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              自定义/ID ({categoryCounts.custom})
            </button>
          )}
        </div>
      </div>

      {/* Snippet List Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {filteredComponents.length === 0 ? (
          <div className="p-6 text-center text-slate-500 space-y-3 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-300">
                {components.length === 0
                  ? '当前代码中未识别到独立片段'
                  : '未找到符合条件的片段'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                {components.length === 0
                  ? '在编辑器中编写包含 <header>、<nav>、<section>、<style>、<script> 等语义标签或带有 class/id 的区块后，系统将自动识别并显示在此处，可一键在编辑器中单独独显编辑。'
                  : '尝试更换搜索词或选择“全部”分类查看'}
              </p>
            </div>
          </div>
        ) : (
          filteredComponents.map((comp) => {
            const isIsolated = activeComponentId === comp.id;
            const badge = getBadgeInfo(comp.tagType);

            // Preview code preview lines (first 3 non-empty lines)
            const previewLines = comp.code
              .split('\n')
              .slice(0, 4)
              .join('\n');

            return (
              <div
                key={comp.id}
                className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
                  isIsolated
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                    : 'bg-slate-950/40 hover:bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header Information */}
                <div className="p-3 border-b border-slate-800/50 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.color}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      <h3
                        className="text-xs font-mono font-bold text-slate-200 truncate cursor-pointer hover:text-indigo-300 transition"
                        onClick={() => onSelectComponent(isIsolated ? null : comp.id)}
                        title={comp.name}
                      >
                        {comp.name}
                      </h3>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {comp.summary}
                    </p>
                  </div>

                  {/* Right side stats badge */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      第 {comp.startLine} - {comp.endLine} 行
                    </span>
                    <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                      {comp.lineCount} 行 · {(comp.charCount / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                {/* Code Preview Box */}
                <div
                  className="px-3 py-2 bg-slate-950/80 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-24 leading-5 cursor-pointer selection:bg-indigo-500/30"
                  onClick={() => onSelectComponent(isIsolated ? null : comp.id)}
                  title="点击在编辑器中独显该片段"
                >
                  <pre className="whitespace-pre overflow-hidden text-slate-400 text-[10px] leading-relaxed">
                    {previewLines}
                    {comp.lineCount > 4 && (
                      <span className="text-slate-600 block mt-0.5">
                        ... ({comp.lineCount - 4} 行省略)
                      </span>
                    )}
                  </pre>
                </div>

                {/* Bottom Actions Row */}
                <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  {/* Primary Action: Exclusive Display in Editor ("独显") */}
                  <button
                    onClick={() => onSelectComponent(isIsolated ? null : comp.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isIsolated
                        ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 font-semibold'
                        : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 hover:text-indigo-200'
                    }`}
                    title={isIsolated ? '点击退出独显模式' : '在编辑器中单独独显编辑该代码片段'}
                  >
                    {isIsolated ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>独显中 (点击退出)</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>在编辑器中独显</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Actions: Locate & Copy */}
                  <div className="flex items-center gap-1">
                    {onLocateSnippet && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateSnippet(comp);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-md transition"
                        title={`在完整代码中定位并滚动到第 ${comp.startLine} 行`}
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleCopyCode(comp, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-md transition"
                      title="复制代码片段"
                    >
                      {copiedId === comp.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info tip */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between flex-shrink-0">
        <span className="flex items-center gap-1 truncate">
          <HelpCircle className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>点击“在编辑器中独显”仅聚焦编辑该组件</span>
        </span>
        {fileName && (
          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[100px]">
            {fileName}
          </span>
        )}
      </div>
    </aside>
  );
};
