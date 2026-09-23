import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Search,
  Crosshair,
  Copy,
  Check,
  Maximize2,
  Edit3,
  X,
  ImageOff,
  Layers,
  Shapes,
  Maximize,
} from 'lucide-react';
import { ExtractedImage } from '../types';

interface ImageSidebarProps {
  images: ExtractedImage[];
  selectedImageUrl: string | null;
  onLocateImage: (image: ExtractedImage, locationIndex?: number) => void;
  onOpenLightbox: (image: ExtractedImage) => void;
  onReplaceUrl: (oldUrl: string, newUrl: string) => void;
  isOpen: boolean;
  onClose: () => void;
  hideTopHeader?: boolean;
}

export const ImageSidebar: React.FC<ImageSidebarProps> = ({
  images,
  selectedImageUrl,
  onLocateImage,
  onOpenLightbox,
  onReplaceUrl,
  isOpen,
  onClose,
  hideTopHeader = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replacingUrl, setReplacingUrl] = useState<string | null>(null);
  const [newUrlInput, setNewUrlInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Track image load statuses and natural dimensions
  const [imgStats, setImgStats] = useState<
    Record<string, { width: number; height: number; error: boolean; proxied?: boolean }>
  >({});

  const handleImgLoad = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    setImgStats((prev) => ({
      ...prev,
      [url]: {
        width: target.naturalWidth,
        height: target.naturalHeight,
        error: false,
        proxied: prev[url]?.proxied || false,
      },
    }));
  };

  const handleImgError = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget;
    const stats = imgStats[url];

    // Transparently retry via internal proxy for external http/https images
    if (!stats?.proxied && (url.startsWith('http://') || url.startsWith('https://'))) {
      setImgStats((prev) => ({
        ...prev,
        [url]: { width: 0, height: 0, error: false, proxied: true },
      }));
      imgEl.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      return;
    }

    setImgStats((prev) => ({
      ...prev,
      [url]: {
        width: 0,
        height: 0,
        error: true,
        proxied: true,
      },
    }));
  };

  // Auto-scroll to selected image card in sidebar when clicked in editor
  useEffect(() => {
    if (!selectedImageUrl || !listRef.current) return;
    try {
      const escaped = CSS.escape(selectedImageUrl);
      const card = listRef.current.querySelector(`[data-img-url="${escaped}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {
      // ignore
    }
  }, [selectedImageUrl]);

  const svgCount = useMemo(() => {
    return images.filter((img) => img.type === 'inline-svg' || img.type === 'svg-image').length;
  }, [images]);

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchesSearch =
        img.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (img.svgContent && img.svgContent.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesFilter = true;
      if (filterType === 'svg') {
        matchesFilter = img.type === 'inline-svg' || img.type === 'svg-image';
      } else if (filterType === 'css') {
        matchesFilter = img.type === 'css-url';
      } else if (filterType === 'base64') {
        matchesFilter = img.type === 'base64';
      }

      return matchesSearch && matchesFilter;
    });
  }, [images, searchQuery, filterType]);

  const handleCopy = (id: string, url: string, e: React.MouseEvent, svgContent?: string) => {
    e.stopPropagation();
    const textToCopy = svgContent || url;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const submitReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (replacingUrl && newUrlInput.trim()) {
      onReplaceUrl(replacingUrl, newUrlInput.trim());
      setReplacingUrl(null);
      setNewUrlInput('');
    }
  };

  return (
    <aside
      className={`w-full flex-shrink-0 bg-slate-900 flex flex-col h-full z-20 select-none min-w-0 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Sidebar Header */}
      {!hideTopHeader && (
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
                图片和SVG
              </h2>
              <p className="text-[11px] text-slate-400">
                已识别 {images.length} 项 (含 {svgCount} 处 SVG)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition"
            title="收起图片和SVG侧边栏"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-slate-800/60 bg-slate-900/60 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索图片名、URL 或 SVG 内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-0.5 no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded transition whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            全部 ({images.length})
          </button>
          <button
            onClick={() => setFilterType('svg')}
            className={`px-2 py-0.5 rounded transition whitespace-nowrap flex items-center gap-1 ${
              filterType === 'svg'
                ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shapes className="w-3 h-3 text-amber-400" />
            <span>SVG 矢量 ({svgCount})</span>
          </button>
          <button
            onClick={() => setFilterType('css')}
            className={`px-2 py-0.5 rounded transition whitespace-nowrap ${
              filterType === 'css'
                ? 'bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            CSS 背景
          </button>
          <button
            onClick={() => setFilterType('base64')}
            className={`px-2 py-0.5 rounded transition whitespace-nowrap ${
              filterType === 'base64'
                ? 'bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Base64
          </button>
        </div>
      </div>

      {/* URL Replacement Modal / Input */}
      {replacingUrl && (
        <form
          onSubmit={submitReplace}
          className="p-3 bg-amber-500/10 border-b border-amber-500/20 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-amber-300">
              替换全局图片 URL
            </span>
            <button
              type="button"
              onClick={() => setReplacingUrl(null)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              取消
            </button>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newUrlInput}
              onChange={(e) => setNewUrlInput(e.target.value)}
              placeholder="输入新的图片链接..."
              className="flex-1 px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-medium rounded transition"
            >
              替换
            </button>
          </div>
        </form>
      )}

      {/* Images List */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs text-center px-4">
            <ImageIcon className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
            <p className="font-medium text-slate-400">暂无符合条件的图片或矢量资源</p>
            <p className="text-[11px] text-slate-500 mt-1">
              支持 &lt;svg&gt;、&lt;img src="..."&gt;、CSS url(...) 与 Base64 自动提取
            </p>
          </div>
        ) : (
          filteredImages.map((img) => {
            const isSelected = selectedImageUrl === img.url;
            const stats = imgStats[img.url];
            const isSvg = img.type === 'inline-svg' || img.type === 'svg-image';

            // Resolve dimension display: real loaded natural size > parsed attribute size
            let dimensionText = '';
            if (stats && stats.width > 0 && stats.height > 0) {
              dimensionText = `${stats.width} × ${stats.height} px`;
            } else if (img.parsedWidth && img.parsedHeight) {
              dimensionText = `${img.parsedWidth} × ${img.parsedHeight}`;
            }

            return (
              <div
                key={img.id}
                data-img-url={img.url}
                onClick={() => onLocateImage(img, 0)}
                className={`group relative rounded-xl border p-2.5 transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail / Vector Viewer */}
                  <div
                    className={`relative w-16 h-16 rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center group-hover:border-slate-700 transition ${
                      isSvg
                        ? 'bg-slate-950/90 border-amber-500/30 p-2'
                        : 'bg-slate-900 border-slate-800/80'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(img);
                    }}
                    title="点击大图/矢量查看"
                  >
                    {isSvg && img.svgContent ? (
                      <div
                        className="w-full h-full flex items-center justify-center pointer-events-none [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:max-w-full text-amber-400"
                        dangerouslySetInnerHTML={{ __html: img.svgContent }}
                      />
                    ) : stats?.error ? (
                      <div className="flex flex-col items-center justify-center text-slate-500 p-1 text-center font-sans">
                        <ImageOff className="w-5 h-5 mb-0.5 text-slate-600" />
                        <span className="text-[9px] text-slate-500">无法渲染</span>
                      </div>
                    ) : (
                      <img
                        src={img.url}
                        alt={img.fileName}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-contain transition duration-200 group-hover:scale-105"
                        onLoad={(e) => handleImgLoad(img.url, e)}
                        onError={(e) => handleImgError(img.url, e)}
                      />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                          {isSvg && <Shapes className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                          <span className="truncate">{img.fileName}</span>
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono flex-shrink-0 uppercase border ${
                            isSvg
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800/80 text-slate-400 border-slate-700/50'
                          }`}
                        >
                          {img.type}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono select-all">
                        {img.type === 'inline-svg' ? '内联原生 SVG 矢量元素' : img.url}
                      </div>
                    </div>

                    {/* Dimensions & Occurrence Count */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {dimensionText ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono text-[10px] font-medium">
                            <Maximize className="w-2.5 h-2.5 text-sky-400" />
                            <span>{dimensionText}</span>
                          </span>
                        ) : isSvg ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300/90 font-mono text-[10px]">
                            <Shapes className="w-2.5 h-2.5 text-amber-400" />
                            <span>矢量无限缩放</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-mono">
                            {img.url.startsWith('data:') ? 'Base64' : '网络尺寸加载中...'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-mono flex-shrink-0 ml-1">
                        <Layers className="w-3 h-3" />
                        <span>{img.locations.length} 处引用</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Line Tags & Action Buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  {/* Quick line jump pills */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[190px] no-scrollbar">
                    {img.locations.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateImage(img, idx);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 text-slate-300 font-mono text-[10px] transition border border-slate-700/60 flex items-center gap-0.5 flex-shrink-0"
                        title={`跳转到第 ${loc.line} 行代码并高亮`}
                      >
                        <Crosshair className="w-2.5 h-2.5" />
                        <span>L{loc.line}</span>
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopy(img.id, img.url, e, img.svgContent)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title={img.svgContent ? '复制 SVG 代码' : '复制图片 URL'}
                    >
                      {copiedId === img.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {img.type !== 'inline-svg' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplacingUrl(img.url);
                          setNewUrlInput(img.url);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                        title="批量替换此图片 URL"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
