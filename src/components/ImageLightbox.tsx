import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, ZoomIn, ImageOff, Shapes, Maximize } from 'lucide-react';
import { ExtractedImage } from '../types';

interface ImageLightboxProps {
  image: ExtractedImage | null;
  onClose: () => void;
  onLocateInCode?: (locationIndex: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  image,
  onClose,
  onLocateInCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setUseProxy(false);
    setFailed(false);
    setNaturalDimensions(null);
  }, [image?.url]);

  if (!image) return null;

  const handleCopy = () => {
    const text = image.svgContent || image.url;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInlineSvg = image.type === 'inline-svg' && !!image.svgContent;

  const currentSrc = useProxy
    ? `/api/proxy-image?url=${encodeURIComponent(image.url)}`
    : image.url;

  const dimensionText = naturalDimensions
    ? `${naturalDimensions.width} × ${naturalDimensions.height} px`
    : image.parsedWidth && image.parsedHeight
    ? `${image.parsedWidth} × ${image.parsedHeight}`
    : isInlineSvg
    ? '矢量无限缩放 (SVG)'
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-medium uppercase border border-sky-500/30 flex items-center gap-1 flex-shrink-0">
              {isInlineSvg && <Shapes className="w-3 h-3 text-amber-400" />}
              <span>{image.type}</span>
            </span>
            <h3 className="text-sm font-medium text-slate-200 truncate font-mono">
              {image.fileName}
            </h3>

            {/* Dimension Badge in Lightbox */}
            {dimensionText && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-sky-300 font-mono text-xs flex-shrink-0">
                <Maximize className="w-3 h-3 text-sky-400" />
                <span>{dimensionText}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1 text-xs"
              title={isInlineSvg ? '复制 SVG 代码' : '复制图片 URL'}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>复制</span>
                </>
              )}
            </button>

            {!image.url.startsWith('data:') && !isInlineSvg && (
              <a
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                title="在新标签页打开"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image / SVG Preview Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/60 min-h-[300px]">
          {isInlineSvg ? (
            <div
              className="max-w-md max-h-[60vh] p-6 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl flex items-center justify-center text-amber-400 [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[50vh]"
              dangerouslySetInnerHTML={{ __html: image.svgContent! }}
            />
          ) : failed ? (
            <div className="flex flex-col items-center justify-center text-slate-500 py-12">
              <ImageOff className="w-12 h-12 mb-3 stroke-1 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">无法渲染此图片</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                链接可能无法访问或为尚未保存的本地相对路径
              </p>
            </div>
          ) : (
            <img
              src={currentSrc}
              alt={image.fileName}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg border border-slate-800"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                }
              }}
              onError={() => {
                if (!useProxy && (image.url.startsWith('http://') || image.url.startsWith('https://'))) {
                  setUseProxy(true);
                } else {
                  setFailed(true);
                }
              }}
            />
          )}
        </div>

        {/* Footer Info & Code Navigation */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="truncate max-w-lg font-mono text-[11px] text-slate-400 select-all">
            {isInlineSvg ? '原生态 HTML 内联 SVG 矢量图标' : image.url}
          </div>

          <div className="flex items-center gap-2">
            {image.locations.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">出现在代码中:</span>
                {image.locations.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onLocateInCode?.(idx);
                      onClose();
                    }}
                    className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 font-mono text-[11px] transition border border-amber-500/30 flex items-center gap-1"
                  >
                    <span>第 {loc.line} 行</span>
                    <ZoomIn className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
