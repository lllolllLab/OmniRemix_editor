import { ComponentSnippet, ComponentTagType } from '../types/component';

/**
 * Intelligent HTML Component Segment Parser
 * Identifies high-level components such as:
 * - <style>...</style> (CSS 样式表)
 * - <script>...</script> (JS 交互脚本)
 * - Semantic tags: <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>, <form>, <dialog>
 * - Custom components: divs/elements with semantic class or id like .hero, .card, .banner, .modal, .sidebar, #app, #navbar
 */

// Helper to determine line number from character index
function getLineFromIndex(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
    }
  }
  return line;
}

// Find balanced closing tag for standard non-void HTML tags
function findMatchingCloseTag(html: string, openTagEndIndex: number, tagName: string): number {
  const lowerTag = tagName.toLowerCase();
  let depth = 1;
  const regex = new RegExp(`<\/?${lowerTag}\\b[^>]*>`, 'gi');
  regex.lastIndex = openTagEndIndex;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const matchedStr = match[0];
    if (matchedStr.startsWith('</')) {
      depth--;
      if (depth === 0) {
        return regex.lastIndex;
      }
    } else if (!matchedStr.endsWith('/>')) {
      // Nested opening tag (not self-closing)
      depth++;
    }
  }

  return -1;
}

export function parseHtmlComponents(html: string): ComponentSnippet[] {
  if (!html || !html.trim()) return [];

  const snippets: ComponentSnippet[] = [];
  const registeredRanges: Array<{ start: number; end: number }> = [];

  const isOverlapping = (start: number, end: number) => {
    return registeredRanges.some((r) => r.start === start && r.end === end);
  };

  // 1. Parse <style> blocks
  const styleRegex = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    const startLine = getLineFromIndex(html, startIndex);
    const endLine = getLineFromIndex(html, endIndex);
    const code = match[0];

    snippets.push({
      id: `comp-style-${startIndex}`,
      name: '<style>',
      tagType: 'style',
      tagName: 'style',
      summary: 'CSS 样式表',
      startLine,
      endLine,
      startIndex,
      endIndex,
      code,
      charCount: code.length,
      lineCount: endLine - startLine + 1,
    });
    registeredRanges.push({ start: startIndex, end: endIndex });
  }

  // 2. Parse <script> blocks (excluding json / template if needed, or include all scripts)
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    const startLine = getLineFromIndex(html, startIndex);
    const endLine = getLineFromIndex(html, endIndex);
    const code = match[0];

    snippets.push({
      id: `comp-script-${startIndex}`,
      name: '<script>',
      tagType: 'script',
      tagName: 'script',
      summary: 'JavaScript 交互逻辑',
      startLine,
      endLine,
      startIndex,
      endIndex,
      code,
      charCount: code.length,
      lineCount: endLine - startLine + 1,
    });
    registeredRanges.push({ start: startIndex, end: endIndex });
  }

  // 3. Parse Semantic Structural Tags: header, nav, main, section, article, aside, footer, form, dialog, table
  const SEMANTIC_TAGS: Array<{ tag: string; type: ComponentTagType; label: string }> = [
    { tag: 'header', type: 'header', label: '页面/栏目头部' },
    { tag: 'nav', type: 'nav', label: '导航菜单' },
    { tag: 'main', type: 'main', label: '主体内容区域' },
    { tag: 'section', type: 'section', label: '内容章节' },
    { tag: 'article', type: 'article', label: '文章/内容块' },
    { tag: 'aside', type: 'aside', label: '边栏/辅助信息' },
    { tag: 'footer', type: 'footer', label: '页脚' },
    { tag: 'form', type: 'form', label: '表单组件' },
    { tag: 'dialog', type: 'dialog', label: '模态对话框' },
    { tag: 'table', type: 'table', label: '数据表格' },
  ];

  for (const item of SEMANTIC_TAGS) {
    const openTagRegex = new RegExp(`<${item.tag}\\b([^>]*)>`, 'gi');
    while ((match = openTagRegex.exec(html)) !== null) {
      const startIndex = match.index;
      const openTagStr = match[0];
      const openTagEnd = startIndex + openTagStr.length;
      const endIndex = findMatchingCloseTag(html, openTagEnd, item.tag);

      if (endIndex !== -1 && !isOverlapping(startIndex, endIndex)) {
        const code = html.substring(startIndex, endIndex);
        const startLine = getLineFromIndex(html, startIndex);
        const endLine = getLineFromIndex(html, endIndex);

        // Try extracting id or class to name it clearly
        const idMatch = openTagStr.match(/\bid=["']([^"']+)["']/i);
        const classMatch = openTagStr.match(/\bclass=["']([^"']+)["']/i);

        let displayName = `<${item.tag}>`;
        if (idMatch && idMatch[1]) {
          displayName = `<${item.tag} #${idMatch[1]}>`;
        } else if (classMatch && classMatch[1]) {
          const firstClass = classMatch[1].trim().split(/\s+/)[0];
          displayName = `<${item.tag}.${firstClass}>`;
        }

        snippets.push({
          id: `comp-${item.tag}-${startIndex}`,
          name: displayName,
          tagType: item.type,
          tagName: item.tag,
          summary: item.label,
          startLine,
          endLine,
          startIndex,
          endIndex,
          code,
          charCount: code.length,
          lineCount: endLine - startLine + 1,
        });
        registeredRanges.push({ start: startIndex, end: endIndex });
      }
    }
  }

  // 4. Parse Significant Elements by Class or ID (e.g., .hero, .card, .banner, .modal, .sidebar, #xxx)
  const CUSTOM_SELECTORS = [
    { pattern: /\bclass=["']([^"']*\b(hero|banner|jumbotron)\b[^"']*)["']/i, type: 'hero' as ComponentTagType, label: 'Hero 首屏横幅' },
    { pattern: /\bclass=["']([^"']*\b(card|pricing-card|product-card)\b[^"']*)["']/i, type: 'card' as ComponentTagType, label: '卡片组件' },
    { pattern: /\bclass=["']([^"']*\b(modal|popup|drawer)\b[^"']*)["']/i, type: 'modal' as ComponentTagType, label: '弹窗模态框' },
    { pattern: /\bclass=["']([^"']*\b(navbar|navigation|topbar)\b[^"']*)["']/i, type: 'nav' as ComponentTagType, label: '导航菜单栏' },
    { pattern: /\bclass=["']([^"']*\b(sidebar)\b[^"']*)["']/i, type: 'aside' as ComponentTagType, label: '侧边栏组件' },
    { pattern: /\bclass=["']([^"']*\b(footer)\b[^"']*)["']/i, type: 'footer' as ComponentTagType, label: '页脚组件' },
  ];

  // Regex to match any tag starting with <div or <section with attributes
  const divRegex = /<(div|section)\b([^>]*)>/gi;
  while ((match = divRegex.exec(html)) !== null) {
    const tagName = match[1];
    const attrs = match[2];
    const startIndex = match.index;
    const openTagEnd = startIndex + match[0].length;

    let matched = false;
    for (const rule of CUSTOM_SELECTORS) {
      const classHit = attrs.match(rule.pattern);
      if (classHit) {
        const endIndex = findMatchingCloseTag(html, openTagEnd, tagName);
        if (endIndex !== -1 && !isOverlapping(startIndex, endIndex)) {
          const code = html.substring(startIndex, endIndex);
          const startLine = getLineFromIndex(html, startIndex);
          const endLine = getLineFromIndex(html, endIndex);
          const matchedClass = classHit[2];

          snippets.push({
            id: `comp-custom-${startIndex}`,
            name: `.${matchedClass}`,
            tagType: rule.type,
            tagName,
            summary: rule.label,
            startLine,
            endLine,
            startIndex,
            endIndex,
            code,
            charCount: code.length,
            lineCount: endLine - startLine + 1,
          });
          registeredRanges.push({ start: startIndex, end: endIndex });
        }
        matched = true;
        break;
      }
    }

    // If not matched by class, check if it has a unique id
    if (!matched) {
      const idHit = attrs.match(/\bid=["']([^"']+)["']/i);
      if (idHit && idHit[1]) {
        const endIndex = findMatchingCloseTag(html, openTagEnd, tagName);
        if (endIndex !== -1 && !isOverlapping(startIndex, endIndex)) {
          const code = html.substring(startIndex, endIndex);
          // Only register if it has meaningful content (> 30 chars)
          if (code.length > 30) {
            const startLine = getLineFromIndex(html, startIndex);
            const endLine = getLineFromIndex(html, endIndex);
            const idVal = idHit[1];

            snippets.push({
              id: `comp-id-${startIndex}`,
              name: `#${idVal}`,
              tagType: 'custom',
              tagName,
              summary: `区块 #${idVal}`,
              startLine,
              endLine,
              startIndex,
              endIndex,
              code,
              charCount: code.length,
              lineCount: endLine - startLine + 1,
            });
            registeredRanges.push({ start: startIndex, end: endIndex });
          }
        }
      }
    }
  }

  // Sort components by appearance order in document (startLine ascending)
  snippets.sort((a, b) => a.startIndex - b.startIndex);

  return snippets;
}
