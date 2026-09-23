import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
} from 'lucide-react';

interface LivePreviewProps {
  htmlContent: string;
  isOpen: boolean;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ htmlContent, isOpen }) => {
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debounced html content to avoid rapid lag while typing fast
  const [debouncedHtml, setDebouncedHtml] = useState(htmlContent);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHtml(htmlContent);
    }, 200);
    return () => clearTimeout(timer);
  }, [htmlContent]);

  // Inject anti-hotlink recovery script into preview document
  const injectedHtml = React.useMemo(() => {
    const antiHotlinkMeta = '<meta name="referrer" content="no-referrer" />';

    const recoveryScript = `
      ${antiHotlinkMeta}
      <script>
        (function() {
          // Anti-hotlink automatic transparent image recovery
          window.addEventListener('error', function(e) {
            var target = e.target;
            if (target && target.tagName === 'IMG' && target.src && !target.dataset.omniremixProxied) {
              var s = target.src;
              if (s.indexOf('http://') === 0 || s.indexOf('https://') === 0) {
                if (s.indexOf('/api/proxy-image') === -1) {
                  target.dataset.omniremixProxied = 'true';
                  target.referrerPolicy = 'no-referrer';
                  target.src = '/api/proxy-image?url=' + encodeURIComponent(s);
                }
              }
            }
          }, true);
        })();
      </script>
    `;

    if (debouncedHtml.includes('<head>')) {
      return debouncedHtml.replace('<head>', `<head>${antiHotlinkMeta}`).replace('</head>', `${recoveryScript}</head>`);
    } else if (debouncedHtml.includes('</head>')) {
      return debouncedHtml.replace('</head>', `${recoveryScript}</head>`);
    } else if (debouncedHtml.includes('<body>')) {
      return debouncedHtml.replace('<body>', `<body>${recoveryScript}`);
    }
    return `<!DOCTYPE html><html><head>${antiHotlinkMeta}</head><body>${recoveryScript}${debouncedHtml}</body></html>`;
  }, [debouncedHtml]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const openInNewTab = () => {
    const blob = new Blob([debouncedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-slate-950 select-none overflow-hidden min-w-0">
      {/* Clean Preview Header Bar */}
      <div className="h-9 px-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-300 gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-300 text-[11px] tracking-wide">
            实时渲染视口
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="刷新预览"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={openInNewTab}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="在独立新标签页打开"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full Viewport Render Area - No device frame bezel, 100% full screen */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={injectedHtml}
          title="OmniRemix Live Preview"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-modals allow-same-origin"
          className="w-full h-full border-none block bg-white"
        />
      </div>
    </div>
  );
};
