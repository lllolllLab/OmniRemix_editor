export interface EditorFile {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  handle?: FileSystemFileHandle | null;
  lastSavedContent?: string;
  cursorLine?: number;
  cursorCol?: number;
  createdAt: number;
}

export interface ImageLocation {
  line: number;
  col: number;
  index: number;
  length: number;
  contextSnippet: string;
}

export interface ExtractedImage {
  id: string;
  url: string; // for inline SVG, this can be a data URI or identifier
  svgContent?: string; // actual raw SVG xml for inline svg
  type: 'img-src' | 'srcset' | 'css-url' | 'icon' | 'svg-image' | 'inline-svg' | 'base64' | 'video-poster' | 'data-src' | 'unknown';
  locations: ImageLocation[];
  occurrenceCount: number;
  naturalWidth?: number;
  naturalHeight?: number;
  parsedWidth?: string;
  parsedHeight?: string;
  isLoaded?: boolean;
  hasError?: boolean;
  fileName: string;
}

export type LayoutMode = 'split' | 'editor' | 'preview';

export type EditorTheme = 'dark' | 'light';
