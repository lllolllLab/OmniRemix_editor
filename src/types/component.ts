export type ComponentTagType =
  | 'all'
  | 'header'
  | 'nav'
  | 'hero'
  | 'section'
  | 'main'
  | 'article'
  | 'aside'
  | 'footer'
  | 'form'
  | 'dialog'
  | 'modal'
  | 'card'
  | 'table'
  | 'svg'
  | 'style'
  | 'script'
  | 'custom';

export interface ComponentSnippet {
  id: string;
  name: string; // e.g., "<header class='hero'>", "<style>", "<section id='features'>"
  tagType: ComponentTagType;
  tagName: string;
  summary: string; // e.g. "头部导航 (Header)"
  startLine: number;
  endLine: number;
  startIndex: number;
  endIndex: number;
  code: string; // trimmed/exact slice
  charCount: number;
  lineCount: number;
}
