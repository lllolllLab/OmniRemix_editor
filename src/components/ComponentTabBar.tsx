import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Code2,
  Layers,
  Palette,
  Terminal,
  FileCode,
  LayoutTemplate,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { ComponentSnippet, ComponentTagType } from '../types/component';

interface ComponentTabBarProps {
  components: ComponentSnippet[];
  activeComponentId: string | null; // null = entire document view
  onSelectComponent: (componentId: string | null) => void;
  onLocateInFullDoc?: (component: ComponentSnippet) => void;
}

export const ComponentTabBar: React.FC<ComponentTabBarProps> = ({
  components,
  activeComponentId,
  onSelectComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check scroll position and overflow
  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, components]);

  // Handle horizontal mouse wheel scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // When active component changes, auto scroll it into view if needed
  useEffect(() => {
    if (!activeComponentId || !containerRef.current) return;
    const activeTab = containerRef.current.querySelector<HTMLElement>(
      `[data-comp-id="${activeComponentId}"]`
    );
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeComponentId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  const scrollLeftBy = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: -140, behavior: 'smooth' });
  };

  const scrollRightBy = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: 140, behavior: 'smooth' });
  };

  const getTagBadge = (type: ComponentTagType) => {
    switch (type) {
      case 'style':
        return {
          icon: <Palette className="w-3 h-3 text-pink-400" />,
          color: 'text-pink-400',
          label: 'CSS 样式',
        };
      case 'script':
        return {
          icon: <Terminal className="w-3 h-3 text-amber-400" />,
          color: 'text-amber-400',
          label: 'JS 脚本',
        };
      case 'header':
      case 'nav':
        return {
          icon: <LayoutTemplate className="w-3 h-3 text-emerald-400" />,
          color: 'text-emerald-400',
          label: '导航头部',
        };
      case 'hero':
        return {
          icon: <Sparkles className="w-3 h-3 text-sky-400" />,
          color: 'text-sky-400',
          label: 'Hero',
        };
      case 'card':
        return {
          icon: <Layers className="w-3 h-3 text-violet-400" />,
          color: 'text-violet-400',
          label: '卡片',
        };
      case 'footer':
        return {
          icon: <LayoutTemplate className="w-3 h-3 text-slate-400" />,
          color: 'text-slate-400',
          label: '页脚',
        };
      default:
        return {
          icon: <FileCode className="w-3 h-3 text-sky-400" />,
          color: 'text-sky-400',
          label: '组件',
        };
    }
  };

  const activeComponent = components.find((c) => c.id === activeComponentId);

  return (
    <div className="relative h-9 bg-slate-900/95 border-b border-slate-800 flex items-center px-1.5 select-none z-20 min-w-0">
      {/* Default: Full HTML Document Tab */}
      <button
        onClick={() => {
          onSelectComponent(null);
          setIsDropdownOpen(false);
        }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition flex-shrink-0 border ${
          activeComponentId === null
            ? 'bg-slate-800 text-sky-300 border-sky-500/40 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
        }`}
        title="查看并编辑完整 HTML 文件"
      >
        <Code2 className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">完整代码</span>
        <span className="sm:hidden">全部</span>
      </button>

      {/* Divider */}
      {components.length > 0 && (
        <div className="h-4 w-px bg-slate-800 flex-shrink-0 mx-1" />
      )}

      {/* Scroll Left Button if overflowed */}
      {canScrollLeft && (
        <button
          onClick={scrollLeftBy}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition flex-shrink-0 z-10"
          title="向左滚动组件片段"
          aria-label="向左滚动"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Component Tabs Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth min-w-0 py-0.5 mx-0.5"
      >
        {components.map((comp) => {
          const isSelected = activeComponentId === comp.id;
          const badge = getTagBadge(comp.tagType);

          return (
            <button
              key={comp.id}
              data-comp-id={comp.id}
              onClick={() => {
                onSelectComponent(comp.id);
                setIsDropdownOpen(false);
              }}
              className={`group flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition flex-shrink-0 border ${
                isSelected
                  ? 'bg-slate-800 text-slate-100 border-sky-500/50 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/60'
              }`}
              title={`${comp.summary} (${comp.lineCount} 行 / 第 ${comp.startLine} - ${comp.endLine} 行)\n点击切换为此组件专属代码视图`}
            >
              {badge.icon}
              <span className="font-mono text-[11px] max-w-[110px] truncate">
                {comp.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-400">
                L{comp.startLine}-{comp.endLine}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button if overflowed */}
      {canScrollRight && (
        <button
          onClick={scrollRightBy}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition flex-shrink-0 z-10"
          title="向右滚动组件片段"
          aria-label="向右滚动"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Quick Component Jump Dropdown Menu (Guarantees overflow accessibility) */}
      {components.length > 0 && (
        <div ref={dropdownRef} className="relative flex-shrink-0 ml-1">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`p-1.5 rounded flex items-center gap-1 text-xs border transition ${
              isDropdownOpen || activeComponentId !== null
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
            }`}
            title={`全部 ${components.length} 个组件片段清单 (点击展开快捷菜单)`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] font-mono font-medium">{components.length}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-sky-300' : ''
              }`}
            />
          </button>

          {/* Dropdown Popup Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 max-h-72 bg-slate-900 border border-slate-700/90 rounded-lg shadow-2xl overflow-y-auto z-50 p-1.5 space-y-1 animate-in fade-in duration-100 font-sans">
              <div className="px-2 py-1 text-[11px] font-medium text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
                <span>跳转到代码组件片段</span>
                <span className="font-mono text-[10px] text-slate-500">
                  共 {components.length} 个
                </span>
              </div>

              {/* View Full Document Option */}
              <button
                onClick={() => {
                  onSelectComponent(null);
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition ${
                  activeComponentId === null
                    ? 'bg-sky-500/15 text-sky-300 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>完整 HTML 文件代码</span>
                </div>
                {activeComponentId === null && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>

              {/* List of Detected Components */}
              {components.map((comp) => {
                const isSelected = activeComponentId === comp.id;
                const badge = getTagBadge(comp.tagType);

                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      onSelectComponent(comp.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition ${
                      isSelected
                        ? 'bg-sky-500/15 text-sky-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {badge.icon}
                      <span className="font-mono text-xs truncate max-w-[130px]">
                        {comp.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-mono text-slate-500">
                        L{comp.startLine}-{comp.endLine}
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-sky-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
