import { ExtractedImage, ImageLocation } from '../types';

/**
 * Calculates 1-based line and column from text and character index
 */
export function getLineAndCol(text: string, index: number): { line: number; col: number } {
  const safeIndex = Math.max(0, Math.min(index, text.length));
  const textBefore = text.slice(0, safeIndex);
  const lines = textBefore.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

/**
 * Derives a human-readable display name from an image URL or SVG identifier
 */
export function getFileNameFromUrl(url: string, svgTitle?: string): string {
  if (svgTitle) {
    return svgTitle;
  }
  if (url.startsWith('inline-svg://')) {
    return 'inline-vector.svg';
  }
  if (url.startsWith('data:image/svg+xml')) {
    return 'inline-vector.svg';
  }
  if (url.startsWith('data:image/')) {
    const mime = url.substring(5, url.indexOf(';')) || 'image/png';
    const ext = mime.split('/')[1]?.split('+')[0] || 'png';
    return `inline-data.${ext}`;
  }
  try {
    const cleanUrl = url.split(/[?#]/)[0];
    const parts = cleanUrl.split('/');
    const last = parts[parts.length - 1];
    if (last && last.trim().length > 0) {
      return decodeURIComponent(last);
    }
  } catch {
    // fallback
  }
  return url.length > 28 ? url.substring(0, 25) + '...' : url;
}

/**
 * Comprehensive and intelligent image URL & SVG extraction from HTML and CSS.
 * Recognizes:
 * 1. Inline <svg>...</svg> elements with direct vector visualization.
 * 2. Standard image attributes: src, data-src, srcset, background, poster.
 * 3. .svg file links and data:image/svg+xml.
 * 4. CSS url(...) including SVG icons and patterns.
 */
export function parseImagesFromHtml(html: string): ExtractedImage[] {
  if (!html) return [];

  const rawMatches: Array<{
    url: string;
    index: number;
    length: number;
    type: ExtractedImage['type'];
    snippet: string;
    svgContent?: string;
    fileName?: string;
    parsedWidth?: string;
    parsedHeight?: string;
  }> = [];

  const seenIndices = new Set<number>();

  const addMatch = (
    rawUrl: string,
    index: number,
    type: ExtractedImage['type'],
    snippet: string,
    svgContent?: string,
    fileName?: string,
    parsedWidth?: string,
    parsedHeight?: string
  ) => {
    if (!rawUrl || index < 0) return;
    const cleanUrl = rawUrl.trim().replace(/^['"]|['"]$/g, '');
    if (
      !cleanUrl ||
      cleanUrl.startsWith('#') ||
      cleanUrl.startsWith('javascript:') ||
      cleanUrl.startsWith('mailto:') ||
      cleanUrl.startsWith('tel:')
    ) {
      return;
    }

    if (seenIndices.has(index)) return;
    seenIndices.add(index);

    rawMatches.push({
      url: cleanUrl,
      index,
      length: cleanUrl.length,
      type,
      snippet: snippet || cleanUrl,
      svgContent,
      fileName,
      parsedWidth,
      parsedHeight,
    });
  };

  // 1. Match Inline <svg>...</svg> elements directly in HTML
  const svgTagRegex = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi;
  let svgMatch: RegExpExecArray | null;
  let svgIndexCount = 1;

  while ((svgMatch = svgTagRegex.exec(html)) !== null) {
    const fullSvg = svgMatch[0];
    const startIndex = svgMatch.index;
    const attrs = svgMatch[1];

    // Try finding title or id or class for nice naming
    const titleMatch = fullSvg.match(/<title>([^<]+)<\/title>/i);
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const classMatch = attrs.match(/\bclass=["']([^"']+)["']/i);

    // Extract width / height / viewBox attributes
    const widthMatch = attrs.match(/\bwidth=["']([^"']+)["']/i);
    const heightMatch = attrs.match(/\bheight=["']([^"']+)["']/i);
    const viewBoxMatch = attrs.match(/\bviewBox=["']([^"']+)["']/i);

    let parsedWidth = widthMatch ? widthMatch[1] : undefined;
    let parsedHeight = heightMatch ? heightMatch[1] : undefined;

    if ((!parsedWidth || !parsedHeight) && viewBoxMatch) {
      const parts = viewBoxMatch[1].trim().split(/[\s,]+/);
      if (parts.length === 4) {
        if (!parsedWidth) parsedWidth = parts[2];
        if (!parsedHeight) parsedHeight = parts[3];
      }
    }

    let svgName = `SVG 图标 #${svgIndexCount++}`;
    if (titleMatch && titleMatch[1]) {
      svgName = titleMatch[1].trim();
    } else if (idMatch && idMatch[1]) {
      svgName = `#${idMatch[1].trim()}`;
    } else if (classMatch && classMatch[1]) {
      svgName = `.${classMatch[1].trim().split(/\s+/)[0]}`;
    }

    // Generate reliable safe data URI for SVG rendering
    const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;

    addMatch(
      encodedSvg,
      startIndex,
      'inline-svg',
      fullSvg.length > 80 ? fullSvg.substring(0, 80) + '...' : fullSvg,
      fullSvg,
      svgName,
      parsedWidth,
      parsedHeight
    );
  }

  // 2. Match HTML elements containing src, data-src, etc. with optional width/height attributes
  const imgTagRegex = /<img\b([^>]*)>/gi;
  let imgTagMatch: RegExpExecArray | null;

  while ((imgTagMatch = imgTagRegex.exec(html)) !== null) {
    const fullTag = imgTagMatch[0];
    const attrs = imgTagMatch[1];
    const tagIndex = imgTagMatch.index;

    const widthMatch = attrs.match(/\bwidth=["']([^"']+)["']/i);
    const heightMatch = attrs.match(/\bheight=["']([^"']+)["']/i);
    const parsedWidth = widthMatch ? widthMatch[1] : undefined;
    const parsedHeight = heightMatch ? heightMatch[1] : undefined;

    // Check src or data-src
    const srcMatch = attrs.match(/\b(?:src|data-src|data-original)=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      const val = srcMatch[1];
      const valOffset = fullTag.indexOf(val);
      const exactIndex = tagIndex + (valOffset !== -1 ? valOffset : 0);

      let matchType: ExtractedImage['type'] = 'img-src';
      if (val.startsWith('data:image/svg+xml') || /\.svg($|[?#])/i.test(val)) {
        matchType = 'svg-image';
      } else if (val.startsWith('data:image/')) {
        matchType = 'base64';
      }

      addMatch(val, exactIndex, matchType, fullTag, undefined, undefined, parsedWidth, parsedHeight);
    }
  }

  // 3. Match HTML attributes globally (poster, background, other non-img tags)
  const attrRegex = /\b(src|data-src|data-original|data-actualsrc|data-url|data-lazy|data-ks-lazyload|data-original-src|data-thumb|data-img|poster|background|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let attrMatch: RegExpExecArray | null;

  while ((attrMatch = attrRegex.exec(html)) !== null) {
    const attrName = attrMatch[1].toLowerCase();
    const val = (attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3] !== undefined ? attrMatch[3] : attrMatch[4]) || '';
    if (!val) continue;

    // For href, verify it represents an image, icon or svg
    if (attrName === 'href') {
      const isImg =
        val.startsWith('data:image/') ||
        /\.(png|jpe?g|webp|gif|svg|avif|ico|bmp)($|[?#])/i.test(val) ||
        val.includes('/image/') ||
        val.includes('/img/') ||
        val.includes('images.unsplash.com') ||
        val.includes('picsum.photos');
      if (!isImg) continue;
    }

    const fullMatch = attrMatch[0];
    const valOffset = fullMatch.indexOf(val);
    const exactIndex = attrMatch.index + (valOffset !== -1 ? valOffset : fullMatch.length - val.length);

    let matchType: ExtractedImage['type'] = 'img-src';
    if (val.startsWith('data:image/svg+xml') || /\.svg($|[?#])/i.test(val)) {
      matchType = 'svg-image';
    } else if (val.startsWith('data:image/')) {
      matchType = 'base64';
    } else if (attrName === 'poster') {
      matchType = 'video-poster';
    } else if (attrName === 'href' && (val.endsWith('.ico') || val.includes('icon'))) {
      matchType = 'icon';
    } else if (attrName !== 'src') {
      matchType = 'data-src';
    }

    addMatch(val, exactIndex, matchType, fullMatch);
  }

  // 4. Match CSS url(...) in <style> blocks or inline styles
  const cssUrlRegex = /url\(\s*(?:'([^']*)'|"([^"]*)"|([^)]*))\s*\)/gi;
  let cssMatch: RegExpExecArray | null;

  while ((cssMatch = cssUrlRegex.exec(html)) !== null) {
    const rawVal = (cssMatch[1] !== undefined ? cssMatch[1] : cssMatch[2] !== undefined ? cssMatch[2] : cssMatch[3])?.trim() || '';
    if (!rawVal || rawVal.startsWith('#') || rawVal.startsWith('@')) continue;

    const fullMatch = cssMatch[0];
    const valOffset = fullMatch.indexOf(rawVal);
    const exactIndex = cssMatch.index + (valOffset !== -1 ? valOffset : 4);

    let type: ExtractedImage['type'] = 'css-url';
    if (rawVal.startsWith('data:image/svg+xml') || /\.svg($|[?#])/i.test(rawVal)) {
      type = 'svg-image';
    } else if (rawVal.startsWith('data:image/')) {
      type = 'base64';
    }

    addMatch(rawVal, exactIndex, type, fullMatch);
  }

  // 5. Match srcset attribute (comma separated URLs)
  const srcsetRegex = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let srcsetMatch: RegExpExecArray | null;

  while ((srcsetMatch = srcsetRegex.exec(html)) !== null) {
    const rawSet = (srcsetMatch[1] !== undefined ? srcsetMatch[1] : srcsetMatch[2] !== undefined ? srcsetMatch[2] : srcsetMatch[3]) || '';
    const candidates = rawSet.split(',');
    for (const cand of candidates) {
      const urlCandidate = cand.trim().split(/\s+/)[0]?.trim();
      if (urlCandidate && urlCandidate.length > 0) {
        const offset = html.indexOf(urlCandidate, srcsetMatch.index);
        if (offset !== -1) {
          const type: ExtractedImage['type'] = /\.svg($|[?#])/i.test(urlCandidate) ? 'svg-image' : 'srcset';
          addMatch(urlCandidate, offset, type, srcsetMatch[0]);
        }
      }
    }
  }

  // 6. Standalone HTTP/HTTPS image URLs in HTML content or scripts
  const rawUrlRegex = /https?:\/\/[^\s<>"'`)]+?\.(?:png|jpe?g|webp|gif|svg|avif|ico|bmp)(?:\?[^\s<>"'`)]*)?/gi;
  let rawUrlMatch: RegExpExecArray | null;

  while ((rawUrlMatch = rawUrlRegex.exec(html)) !== null) {
    const matchedUrl = rawUrlMatch[0];
    const type: ExtractedImage['type'] = /\.svg($|[?#])/i.test(matchedUrl) ? 'svg-image' : 'img-src';
    addMatch(matchedUrl, rawUrlMatch.index, type, matchedUrl);
  }

  // Group by URL or SVG identifier while tracking all occurrences
  const map = new Map<string, ExtractedImage>();

  for (const item of rawMatches) {
    const { line, col } = getLineAndCol(html, item.index);
    const location: ImageLocation = {
      line,
      col,
      index: item.index,
      length: item.length,
      contextSnippet: item.snippet,
    };

    const existing = map.get(item.url);
    if (existing) {
      const hasLoc = existing.locations.some(
        (l) => Math.abs(l.index - location.index) < 2
      );
      if (!hasLoc) {
        existing.locations.push(location);
        existing.occurrenceCount = existing.locations.length;
      }
      if (!existing.parsedWidth && item.parsedWidth) {
        existing.parsedWidth = item.parsedWidth;
      }
      if (!existing.parsedHeight && item.parsedHeight) {
        existing.parsedHeight = item.parsedHeight;
      }
    } else {
      map.set(item.url, {
        id: `img-${map.size + 1}-${Math.random().toString(36).substring(2, 6)}`,
        url: item.url,
        svgContent: item.svgContent,
        type: item.type,
        locations: [location],
        occurrenceCount: 1,
        fileName: getFileNameFromUrl(item.url, item.fileName),
        parsedWidth: item.parsedWidth,
        parsedHeight: item.parsedHeight,
      });
    }
  }

  return Array.from(map.values());
}
