/**
 * Pure TypeScript high-performance HTML/CSS/JS beautifier
 * Formats combined HTML documents with embedded style and script blocks.
 */

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
]);

export function formatHtmlCode(source: string, indentSize = 2): string {
  if (!source) return '';

  const indentStr = ' '.repeat(indentSize);
  let formatted = '';
  let indentLevel = 0;

  // Normalize newlines
  const text = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Tokenize HTML tags and text content
  const tokens: Array<{ type: 'tag' | 'comment' | 'text' | 'style' | 'script'; content: string }> = [];

  let i = 0;
  const len = text.length;

  while (i < len) {
    if (text.startsWith('<!--', i)) {
      const endComment = text.indexOf('-->', i);
      if (endComment !== -1) {
        tokens.push({ type: 'comment', content: text.slice(i, endComment + 3) });
        i = endComment + 3;
        continue;
      }
    }

    if (text[i] === '<') {
      // Check for <style>
      const styleMatch = text.slice(i).match(/^<style\b([^>]*)>([\s\S]*?)<\/style>/i);
      if (styleMatch) {
        tokens.push({ type: 'style', content: styleMatch[0] });
        i += styleMatch[0].length;
        continue;
      }

      // Check for <script>
      const scriptMatch = text.slice(i).match(/^<script\b([^>]*)>([\s\S]*?)<\/script>/i);
      if (scriptMatch) {
        tokens.push({ type: 'script', content: scriptMatch[0] });
        i += scriptMatch[0].length;
        continue;
      }

      const closeTagIdx = text.indexOf('>', i);
      if (closeTagIdx !== -1) {
        tokens.push({ type: 'tag', content: text.slice(i, closeTagIdx + 1) });
        i = closeTagIdx + 1;
        continue;
      }
    }

    // Text node
    let nextTagIdx = text.indexOf('<', i);
    if (nextTagIdx === -1) nextTagIdx = len;
    const textChunk = text.slice(i, nextTagIdx);
    if (textChunk.trim().length > 0) {
      tokens.push({ type: 'text', content: textChunk.trim() });
    }
    i = nextTagIdx;
  }

  // Format tokens into indented lines
  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx];

    if (token.type === 'comment') {
      formatted += indentStr.repeat(Math.max(0, indentLevel)) + token.content.trim() + '\n';
      continue;
    }

    if (token.type === 'style') {
      const parsed = formatStyleBlock(token.content, indentLevel, indentStr);
      formatted += parsed + '\n';
      continue;
    }

    if (token.type === 'script') {
      const parsed = formatScriptBlock(token.content, indentLevel, indentStr);
      formatted += parsed + '\n';
      continue;
    }

    if (token.type === 'text') {
      formatted += indentStr.repeat(Math.max(0, indentLevel)) + token.content + '\n';
      continue;
    }

    if (token.type === 'tag') {
      const tagContent = token.content;
      const isClosing = tagContent.startsWith('</');
      const isSelfClosing = tagContent.endsWith('/>');
      const tagNameMatch = tagContent.match(/^<\/?([a-zA-Z0-9\-!]+)/);
      const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
      const isVoid = VOID_ELEMENTS.has(tagName);

      if (isClosing) {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted += indentStr.repeat(indentLevel) + cleanTagAttributes(tagContent) + '\n';
      } else {
        formatted += indentStr.repeat(indentLevel) + cleanTagAttributes(tagContent) + '\n';
        if (!isSelfClosing && !isVoid) {
          indentLevel++;
        }
      }
    }
  }

  return formatted.trim() + '\n';
}

function cleanTagAttributes(tag: string): string {
  // If single line tag with reasonable length, normalize spaces between attributes
  if (!tag.includes('\n') && tag.length < 120) {
    return tag.replace(/\s+/g, ' ').replace(/\s+>/g, '>').replace(/\s+\/>/g, ' />');
  }
  return tag;
}

function formatStyleBlock(block: string, baseLevel: number, indentStr: string): string {
  const match = block.match(/^<style\b([^>]*)>([\s\S]*?)<\/style>$/i);
  if (!match) return block;

  const openTag = `<style${match[1] ? match[1].trim() ? ' ' + match[1].trim() : '' : ''}>`;
  const cssBody = match[2];
  const closeTag = '</style>';

  const baseIndent = indentStr.repeat(baseLevel);
  const innerIndent = indentStr.repeat(baseLevel + 1);

  // Format CSS rules inside
  const cssLines = cssBody
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*;\s*/g, ';\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  let cssLevel = baseLevel + 1;
  const formattedCss: string[] = [];

  for (const line of cssLines) {
    if (line === '}') {
      cssLevel = Math.max(baseLevel + 1, cssLevel - 1);
      formattedCss.push(indentStr.repeat(cssLevel) + '}');
    } else if (line.endsWith('{')) {
      formattedCss.push(indentStr.repeat(cssLevel) + line);
      cssLevel++;
    } else {
      formattedCss.push(indentStr.repeat(cssLevel) + line);
    }
  }

  if (formattedCss.length === 0) {
    return `${baseIndent}${openTag}\n${baseIndent}${closeTag}`;
  }

  return `${baseIndent}${openTag}\n${formattedCss.join('\n')}\n${baseIndent}${closeTag}`;
}

function formatScriptBlock(block: string, baseLevel: number, indentStr: string): string {
  const match = block.match(/^<script\b([^>]*)>([\s\S]*?)<\/script>$/i);
  if (!match) return block;

  const openTag = `<script${match[1] ? match[1].trim() ? ' ' + match[1].trim() : '' : ''}>`;
  const jsBody = match[2];
  const closeTag = '</script>';

  const baseIndent = indentStr.repeat(baseLevel);

  const lines = jsBody
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return `${baseIndent}${openTag}\n${baseIndent}${closeTag}`;
  }

  let jsLevel = baseLevel + 1;
  const formattedJs: string[] = [];

  for (const line of lines) {
    if (line.startsWith('}') || line.startsWith(']')) {
      jsLevel = Math.max(baseLevel + 1, jsLevel - 1);
    }
    formattedJs.push(indentStr.repeat(jsLevel) + line);
    if ((line.endsWith('{') || line.endsWith('[')) && !line.includes('}') && !line.includes(']')) {
      jsLevel++;
    }
  }

  return `${baseIndent}${openTag}\n${formattedJs.join('\n')}\n${baseIndent}${closeTag}`;
}
