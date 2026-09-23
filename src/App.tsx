import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { TitleBar } from './components/TitleBar';
import { CodeEditor, CodeEditorHandle } from './components/CodeEditor';
import { LivePreview } from './components/LivePreview';
import { RightSidebar, RightSidebarTab } from './components/RightSidebar';
import { FileTreeSidebar } from './components/FileTreeSidebar';
import { StatusBar } from './components/StatusBar';
import { ImageLightbox } from './components/ImageLightbox';
import { Splitter } from './components/Splitter';
import { EditorFile, LayoutMode, ExtractedImage } from './types';
import { ComponentSnippet } from './types/component';
import { INITIAL_FILES, SAMPLE_HTML_CLEAN } from './data/defaultFiles';
import { parseImagesFromHtml } from './utils/imageParser';
import { parseHtmlComponents } from './utils/componentParser';
import { formatHtmlCode } from './utils/htmlFormatter';
import { openLocalHtmlFiles, saveLocalFile } from './utils/fileSystem';

export default function App() {
  const [files, setFiles] = useState<EditorFile[]>(() => {
    try {
      const saved = localStorage.getItem('omniremix_tabs_data') || localStorage.getItem('onehtml_tabs_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => files[0]?.id || 'sample-gallery');
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<RightSidebarTab>(() => {
    try {
      const saved = localStorage.getItem('omniremix_sidebar_tab');
      if (saved === 'snippets' || saved === 'images') return saved;
    } catch {
      // ignore
    }
    return 'snippets';
  });
  const [isFileTreeOpen, setIsFileTreeOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('omniremix_filetree_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<ExtractedImage | null>(null);

  // Status metrics
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning'>('info');

  const [isFormatting, setIsFormatting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const editorRef = useRef<CodeEditorHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // File tree width in pixels (collapsible left panel)
  const [fileTreeWidth, setFileTreeWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('omniremix_filetree_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 150 && val <= 400) return val;
      }
    } catch {
      // ignore
    }
    return 200;
  });

  // Panel widths state: [editor%, preview%, sidebar%] (normalized sum = 100)
  const [panelWidths, setPanelWidths] = useState<[number, number, number]>(() => {
    try {
      const saved = localStorage.getItem('omniremix_panel_widths') || localStorage.getItem('onehtml_panel_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === 3 &&
          parsed.every((n) => typeof n === 'number' && n > 5)
        ) {
          const sum = parsed[0] + parsed[1] + parsed[2];
          return [
            (parsed[0] / sum) * 100,
            (parsed[1] / sum) * 100,
            (parsed[2] / sum) * 100,
          ];
        }
      }
    } catch {
      // fallback
    }
    return [45, 30, 25];
  });

  // Track active dragging divider index:
  // -1: FileTree divider
  // 0: between Editor & Preview
  // 1: between Preview & Image Sidebar
  const [activeDivider, setActiveDivider] = useState<number | null>(null);
  const dragInfoRef = useRef<{
    dividerIndex: number;
    startX: number;
    initialWidths: [number, number, number];
    initialTreeWidth: number;
    containerWidth: number;
  } | null>(null);

  // Active file derived
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Persist files in localStorage
  useEffect(() => {
    try {
      const lightweight = files.map((f) => ({
        id: f.id,
        name: f.name,
        content: f.content,
        isDirty: f.isDirty,
        createdAt: f.createdAt,
      }));
      localStorage.setItem('omniremix_tabs_data', JSON.stringify(lightweight));
    } catch {
      // quota or private mode
    }
  }, [files]);

  // Save file tree open status
  useEffect(() => {
    try {
      localStorage.setItem('omniremix_filetree_open', String(isFileTreeOpen));
    } catch {
      // ignore
    }
  }, [isFileTreeOpen]);

  // Parse images and SVGs from current active file HTML content
  const extractedImages = useMemo(() => {
    if (!activeFile) return [];
    return parseImagesFromHtml(activeFile.content);
  }, [activeFile?.content]);

  // Auto-detect and parse component snippets from current active file HTML
  const detectedComponents = useMemo(() => {
    if (!activeFile) return [];
    return parseHtmlComponents(activeFile.content);
  }, [activeFile?.content]);

  // Show status toast helper
  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'warning' = 'info', duration = 2500) => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? null : curr));
    }, duration);
  }, []);

  // Update content of active file
  const handleContentChange = useCallback((newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === activeFileId) {
          return {
            ...f,
            content: newContent,
            isDirty: true,
          };
        }
        return f;
      })
    );
  }, [activeFileId]);

  // Format active document code
  const handleFormatCode = useCallback(() => {
    if (!activeFile) return;
    setIsFormatting(true);

    try {
      const formatted = formatHtmlCode(activeFile.content, 2);
      handleContentChange(formatted);
      showToast('代码已完成一键格式化 (HTML + CSS + JS)', 'success');
    } catch (err) {
      showToast('格式化代码时发生错误', 'warning');
      console.error(err);
    } finally {
      setIsFormatting(false);
    }
  }, [activeFile, handleContentChange, showToast]);

  // Save current file to disk
  const handleSaveFile = useCallback(async (promptSaveAs = false) => {
    if (!activeFile) return;
    setIsSaving(true);

    try {
      const res = await saveLocalFile(activeFile, promptSaveAs);
      if (res.success) {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === activeFile.id) {
              return {
                ...f,
                isDirty: false,
                handle: res.handle !== undefined ? res.handle : f.handle,
                name: res.handle?.name || f.name,
              };
            }
            return f;
          })
        );
        showToast(`已成功保存到本地: ${activeFile.name}`, 'success');
      } else if (res.error && res.error !== 'User cancelled') {
        showToast(`保存失败: ${res.error}`, 'warning');
      }
    } catch (err) {
      showToast('保存文件遇到错误', 'warning');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, showToast]);

  // Open files from disk
  const handleOpenFiles = useCallback(async () => {
    try {
      const opened = await openLocalHtmlFiles();
      if (opened.length === 0) return;

      const newFiles: EditorFile[] = opened.map((item) => ({
        id: item.id,
        name: item.name,
        content: item.content,
        isDirty: false,
        handle: item.handle,
        createdAt: Date.now(),
      }));

      setFiles((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newFiles.filter((nf) => !existingIds.has(nf.id));
        return [...prev, ...filteredNew];
      });

      if (newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
        setActiveComponentId(null);
        showToast(`已打开 ${newFiles.length} 个文件`, 'success');
      }
    } catch (err) {
      showToast('打开文件失败', 'warning');
      console.error(err);
    }
  }, [showToast]);

  // Create new tab
  const handleNewFile = useCallback(() => {
    const newId = `file-${Date.now()}`;
    const newFile: EditorFile = {
      id: newId,
      name: `untitled-${files.length + 1}.html`,
      content: SAMPLE_HTML_CLEAN,
      isDirty: true,
      createdAt: Date.now(),
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
    setActiveComponentId(null);
    showToast(`已新建文件: ${newFile.name}`, 'info');
  }, [files.length, showToast]);

  // Close tab
  const handleCloseFile = useCallback((fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (files.length <= 1) {
      showToast('至少保留一个打开的文件', 'warning');
      return;
    }

    const index = files.findIndex((f) => f.id === fileId);
    const updated = files.filter((f) => f.id !== fileId);
    setFiles(updated);

    if (fileId === activeFileId) {
      const nextActive = updated[Math.min(index, updated.length - 1)];
      setActiveFileId(nextActive.id);
      setActiveComponentId(null);
    }
  }, [files, activeFileId, showToast]);

  // Locate image in CodeEditor from ImageSidebar
  const handleLocateImageInCode = useCallback((image: ExtractedImage, locationIndex = 0) => {
    const targetLoc = image.locations[locationIndex] || image.locations[0];
    if (!targetLoc || !editorRef.current) return;

    editorRef.current.scrollToLineAndHighlight(targetLoc.line, targetLoc.index, targetLoc.length);
    setSelectedImageUrl(image.url);
    showToast(`已跳转到第 ${targetLoc.line} 行代码并高亮定位`, 'info', 1800);
  }, [showToast]);

  // Select image from clicking on code editor
  const handleSelectImageUrlFromCode = useCallback((url: string) => {
    setSelectedImageUrl(url);
    setActiveSidebarTab('images');
    setIsSidebarOpen(true);
  }, []);

  // Toggle Right Sidebar and switch tab
  const handleToggleSidebarTab = useCallback((tab: RightSidebarTab) => {
    if (isSidebarOpen && activeSidebarTab === tab) {
      setIsSidebarOpen(false);
    } else {
      setActiveSidebarTab(tab);
      setIsSidebarOpen(true);
      try {
        localStorage.setItem('omniremix_sidebar_tab', tab);
      } catch {
        // ignore
      }
    }
  }, [isSidebarOpen, activeSidebarTab]);

  // Select snippet to exclusively display in editor
  const handleSelectComponent = useCallback((id: string | null) => {
    setActiveComponentId(id);
    if (layoutMode === 'preview') {
      setLayoutMode('split');
    }
    if (id) {
      const comp = detectedComponents.find((c) => c.id === id);
      if (comp) {
        showToast(`已在编辑器中独显代码片段: ${comp.name}`, 'info', 2000);
      }
    } else {
      showToast('已退出独显模式，恢复完整文件代码', 'info', 1800);
    }
  }, [detectedComponents, layoutMode, showToast]);

  // Locate and highlight snippet in full document mode
  const handleLocateSnippet = useCallback((snippet: ComponentSnippet) => {
    if (activeComponentId) {
      setActiveComponentId(null);
    }
    if (layoutMode === 'preview') {
      setLayoutMode('split');
    }
    if (editorRef.current) {
      editorRef.current.scrollToLineAndHighlight(snippet.startLine, snippet.startIndex, snippet.code.length);
      showToast(`已跳转定位至第 ${snippet.startLine} 行: ${snippet.name}`, 'info', 1800);
    }
  }, [activeComponentId, layoutMode, showToast]);

  // Insert code snippet at cursor
  const handleInsertSnippet = useCallback((snippetCode: string) => {
    if (layoutMode === 'preview') {
      setLayoutMode('split');
    }
    if (editorRef.current) {
      editorRef.current.insertSnippet(snippetCode);
      showToast('已成功将组件代码插入当前光标处', 'success', 2000);
    }
  }, [layoutMode, showToast]);

  // Replace image URL across document
  const handleReplaceUrlInCode = useCallback((oldUrl: string, newUrl: string) => {
    if (!activeFile || !oldUrl || !newUrl || oldUrl === newUrl) return;

    const occurrences = activeFile.content.split(oldUrl).length - 1;
    if (occurrences === 0) {
      showToast('未找到需要替换的原图片路径', 'warning');
      return;
    }

    const updated = activeFile.content.split(oldUrl).join(newUrl);
    handleContentChange(updated);
    showToast(`已成功替换 ${occurrences} 处图片 URL`, 'success');
  }, [activeFile, handleContentChange, showToast]);

  // Double click splitter to reset widths
  const handleResetWidths = useCallback(() => {
    setPanelWidths([45, 30, 25]);
    setFileTreeWidth(200);
    try {
      localStorage.setItem('omniremix_panel_widths', JSON.stringify([45, 30, 25]));
      localStorage.setItem('omniremix_filetree_width', '200');
    } catch {
      // ignore
    }
    showToast('已重置各窗口为默认黄金比例', 'info', 1500);
  }, [showToast]);

  // Mouse drag handler for splitters
  const handleDividerMouseDown = (dividerIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    dragInfoRef.current = {
      dividerIndex,
      startX: e.clientX,
      initialWidths: [...panelWidths] as [number, number, number],
      initialTreeWidth: fileTreeWidth,
      containerWidth: rect.width,
    };
    setActiveDivider(dividerIndex);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (activeDivider === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const info = dragInfoRef.current;
      if (!info || info.containerWidth <= 0) return;

      const deltaPixels = e.clientX - info.startX;

      // Dragging File Tree divider (-1)
      if (info.dividerIndex === -1) {
        const newWidth = Math.max(140, Math.min(380, info.initialTreeWidth + deltaPixels));
        setFileTreeWidth(newWidth);
        return;
      }

      // Remaining space percentage logic for the 3 main windows
      const effectiveContainerWidth = Math.max(300, info.containerWidth - (isFileTreeOpen ? info.initialTreeWidth : 0));
      const deltaPercent = (deltaPixels / effectiveContainerWidth) * 100;

      const minP0 = 20;
      const minP1 = 20;
      const minP2 = 15;

      if (info.dividerIndex === 0) {
        let new0 = info.initialWidths[0] + deltaPercent;
        let new1 = info.initialWidths[1] - deltaPercent;

        if (new0 < minP0) {
          const diff = minP0 - new0;
          new0 = minP0;
          new1 -= diff;
        }
        if (new1 < minP1) {
          const diff = minP1 - new1;
          new1 = minP1;
          new0 -= diff;
        }

        if (new0 >= minP0 && new1 >= minP1) {
          setPanelWidths([new0, new1, info.initialWidths[2]]);
        }
      } else if (info.dividerIndex === 1) {
        let new1 = info.initialWidths[1] + deltaPercent;
        let new2 = info.initialWidths[2] - deltaPercent;

        if (new1 < minP1) {
          const diff = minP1 - new1;
          new1 = minP1;
          new2 -= diff;
        }
        if (new2 < minP2) {
          const diff = minP2 - new2;
          new2 = minP2;
          new1 -= diff;
        }

        if (new1 >= minP1 && new2 >= minP2) {
          setPanelWidths([info.initialWidths[0], new1, new2]);
        }
      }
    };

    const handleMouseUp = () => {
      setActiveDivider(null);
      dragInfoRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setPanelWidths((curr) => {
        try {
          localStorage.setItem('omniremix_panel_widths', JSON.stringify(curr));
        } catch {
          // ignore
        }
        return curr;
      });
      try {
        localStorage.setItem('omniremix_filetree_width', String(fileTreeWidth));
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDivider, isFileTreeOpen, fileTreeWidth]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile(e.shiftKey);
        return;
      }

      // Open: Ctrl+O / Cmd+O
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFiles();
        return;
      }

      // Toggle File Tree Sidebar: Ctrl+B / Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsFileTreeOpen((prev) => !prev);
        return;
      }

      // Toggle Snippet Library: Ctrl+Shift+K or Cmd+Shift+K
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleToggleSidebarTab('snippets');
        return;
      }

      // Format: Alt+Shift+F
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFormatCode();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleSaveFile, handleOpenFiles, handleFormatCode, handleToggleSidebarTab]);

  // Drag and drop HTML files onto the window to open as tabs
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type === 'text/html'
    );

    if (droppedFiles.length === 0) {
      showToast('请拖入 .html 或 .htm 文件', 'warning');
      return;
    }

    const loadedList: EditorFile[] = [];
    for (let i = 0; i < droppedFiles.length; i++) {
      const f = droppedFiles[i];
      try {
        const text = await f.text();
        loadedList.push({
          id: `drop-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          name: f.name,
          content: text,
          isDirty: false,
          handle: null,
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error(err);
      }
    }

    if (loadedList.length > 0) {
      setFiles((prev) => [...prev, ...loadedList]);
      setActiveFileId(loadedList[0].id);
      setActiveComponentId(null);
      showToast(`已拖拽导入 ${loadedList.length} 个文件`, 'success');
    }
  }, [showToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const totalLines = useMemo(() => {
    if (!activeFile) return 0;
    return activeFile.content.split('\n').length;
  }, [activeFile?.content]);

  const totalChars = useMemo(() => {
    return activeFile?.content?.length || 0;
  }, [activeFile?.content]);

  // Determine which windows are rendered based on layoutMode and isSidebarOpen
  const showEditor = layoutMode === 'split' || layoutMode === 'editor';
  const showPreview = layoutMode === 'split' || layoutMode === 'preview';
  const showSidebar = isSidebarOpen && layoutMode !== 'preview';

  let width0 = 0;
  let width1 = 0;
  let width2 = 0;

  if (showEditor && showPreview && showSidebar) {
    width0 = panelWidths[0];
    width1 = panelWidths[1];
    width2 = panelWidths[2];
  } else if (showEditor && showPreview && !showSidebar) {
    const sum = panelWidths[0] + panelWidths[1];
    width0 = (panelWidths[0] / sum) * 100;
    width1 = (panelWidths[1] / sum) * 100;
  } else if (showEditor && !showPreview && showSidebar) {
    const sum = panelWidths[0] + panelWidths[2];
    width0 = (panelWidths[0] / sum) * 100;
    width2 = (panelWidths[2] / sum) * 100;
  } else if (!showEditor && showPreview && showSidebar) {
    const sum = panelWidths[1] + panelWidths[2];
    width1 = (panelWidths[1] / sum) * 100;
    width2 = (panelWidths[2] / sum) * 100;
  } else if (showEditor) {
    width0 = 100;
  } else if (showPreview) {
    width1 = 100;
  } else if (showSidebar) {
    width2 = 100;
  }

  const isDraggingAny = activeDivider !== null;

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* TitleBar & Tab Strip */}
      <TitleBar
        files={files}
        activeFileId={activeFileId}
        onSelectFile={(id) => {
          setActiveFileId(id);
          setActiveComponentId(null);
        }}
        onCloseFile={handleCloseFile}
        onNewFile={handleNewFile}
        onOpenFiles={handleOpenFiles}
        onSaveFile={() => handleSaveFile(false)}
        onSaveFileAs={() => handleSaveFile(true)}
        onFormatCode={handleFormatCode}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        isSidebarOpen={isSidebarOpen}
        activeSidebarTab={activeSidebarTab}
        onToggleSidebarTab={handleToggleSidebarTab}
        isFileTreeOpen={isFileTreeOpen}
        onToggleFileTree={() => setIsFileTreeOpen((prev) => !prev)}
        snippetCount={detectedComponents.length}
        isComponentIsolated={Boolean(activeComponentId)}
        imageCount={extractedImages.length}
        isFormatting={isFormatting}
        isSaving={isSaving}
      />

      {/* Main Studio Area */}
      <div
        ref={containerRef}
        className="flex-1 flex min-h-0 overflow-hidden relative select-none"
      >
        {/* Full-screen transparent overlay while dragging splitters */}
        {isDraggingAny && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
        )}

        {/* Collapsible File Tree Directory Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: isFileTreeOpen ? fileTreeWidth : 0,
            opacity: isFileTreeOpen ? 1 : 0,
          }}
          transition={
            isDraggingAny
              ? { duration: 0 }
              : { type: 'spring', stiffness: 380, damping: 34 }
          }
          className="h-full flex-shrink-0 min-w-0 flex flex-col overflow-hidden will-change-[width]"
        >
          <div style={{ width: `${fileTreeWidth}px` }} className="h-full flex flex-col">
            <FileTreeSidebar
              files={files}
              activeFileId={activeFileId}
              onSelectFile={(id) => {
                setActiveFileId(id);
                setActiveComponentId(null);
              }}
              onCloseFile={handleCloseFile}
              onNewFile={handleNewFile}
              onOpenLocalFiles={handleOpenFiles}
              isOpen={isFileTreeOpen}
              onClose={() => setIsFileTreeOpen(false)}
            />
          </div>
        </motion.div>

        {/* Resizable Splitter for File Tree */}
        {isFileTreeOpen && (
          <Splitter
            onMouseDown={(e) => handleDividerMouseDown(-1, e)}
            onDoubleClick={() => setFileTreeWidth(200)}
            isDragging={activeDivider === -1}
            title="拖拽调整文件目录宽度 (双击重置默认 200px)"
          />
        )}

        {/* Main Work Area (Editor, Preview, Image/SVG Inspector) */}
        <div className="flex-1 flex min-w-0 h-full overflow-hidden">
          {/* Window 1: Code Editor */}
          {showEditor && activeFile && (
            <motion.div
              initial={false}
              animate={{
                width: `${width0}%`,
              }}
              transition={
                isDraggingAny
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 380, damping: 34 }
              }
              className="h-full flex-shrink-0 min-w-0 flex flex-col overflow-hidden will-change-[width]"
            >
              <CodeEditor
                ref={editorRef}
                content={activeFile.content}
                onChange={handleContentChange}
                onFormat={handleFormatCode}
                onSelectImageUrl={handleSelectImageUrlFromCode}
                onOpenLightbox={(img) => setLightboxImage(img)}
                images={extractedImages}
                components={detectedComponents}
                activeComponentId={activeComponentId}
                onSelectComponent={(compId) => setActiveComponentId(compId)}
                onCursorChange={(line, col) => {
                  setCursorLine(line);
                  setCursorCol(col);
                }}
              />
            </motion.div>
          )}

          {/* Resizable Splitter between Window 1 and Window 2 (or Window 1 and Window 3) */}
          {showEditor && (showPreview || showSidebar) && (
            <Splitter
              onMouseDown={(e) => handleDividerMouseDown(0, e)}
              onDoubleClick={handleResetWidths}
              isDragging={activeDivider === 0}
              title="拖拽调整代码与预览窗口宽度 (双击重置默认比例)"
            />
          )}

          {/* Window 2: Mobile Live Preview */}
          {showPreview && activeFile && (
            <motion.div
              initial={false}
              animate={{
                width: `${width1}%`,
              }}
              transition={
                isDraggingAny
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 380, damping: 34 }
              }
              className="h-full flex-shrink-0 min-w-0 flex flex-col overflow-hidden will-change-[width]"
            >
              <LivePreview
                htmlContent={activeFile.content}
                isOpen={true}
              />
            </motion.div>
          )}

          {/* Resizable Splitter between Window 2 and Window 3 */}
          {showPreview && showSidebar && (
            <Splitter
              onMouseDown={(e) => handleDividerMouseDown(1, e)}
              onDoubleClick={handleResetWidths}
              isDragging={activeDivider === 1}
              title="拖拽调整预览与图片清单窗口宽度 (双击重置默认比例)"
            />
          )}

          {/* Window 3: Right Tool Sidebar (Snippet Library & Image/SVG) */}
          {layoutMode !== 'preview' && (
            <motion.div
              initial={false}
              animate={{
                width: showSidebar ? `${width2}%` : '0%',
              }}
              transition={
                isDraggingAny
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 380, damping: 34 }
              }
              className="h-full flex-shrink-0 min-w-0 flex flex-col overflow-hidden will-change-[width]"
            >
              <RightSidebar
                activeTab={activeSidebarTab}
                onTabChange={(tab) => {
                  setActiveSidebarTab(tab);
                  try {
                    localStorage.setItem('omniremix_sidebar_tab', tab);
                  } catch {
                    // ignore
                  }
                }}
                isOpen={showSidebar}
                onClose={() => setIsSidebarOpen(false)}
                components={detectedComponents}
                activeComponentId={activeComponentId}
                onSelectComponent={handleSelectComponent}
                onLocateSnippet={handleLocateSnippet}
                fileName={activeFile?.name}
                images={extractedImages}
                selectedImageUrl={selectedImageUrl}
                onLocateImage={handleLocateImageInCode}
                onOpenLightbox={(img) => setLightboxImage(img)}
                onReplaceUrl={handleReplaceUrlInCode}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        totalLines={totalLines}
        totalChars={totalChars}
        imageCount={extractedImages.length}
        statusMessage={statusMessage}
        statusType={statusType}
      />

      {/* Lightbox / Vector modal viewer */}
      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
          onLocateInCode={(locIdx) => {
            handleLocateImageInCode(lightboxImage, locIdx);
          }}
        />
      )}
    </div>
  );
}
