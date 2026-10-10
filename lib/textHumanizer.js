/**
 * Deterministic AI Pattern & Watermark Cleaner
 * 
 * 1. Strips invisible Unicode artifacts ("text watermarks"):
 *    - Zero-width spaces, joiners, directional embeddings, exotic whitespace, tag characters.
 * 2. Swaps common AI clichés and robotic filler phrases into crisp, human language.
 * 3. Provides metrics on purged watermarks and replaced patterns.
 */

export const INVISIBLE_CHARS = [
  { regex: /[\u00ad]/g, name: 'soft-hyphen' },
  { regex: /[\u180e]/g, name: 'mongolian-vowel-separator' },
  { regex: /[\u200b]/g, name: 'zero-width-space' },
  { regex: /[\u200e]/g, name: 'left-to-right-mark' },
  { regex: /[\u200f]/g, name: 'right-to-left-mark' },
  { regex: /[\u202a]/g, name: 'lre-embedding' },
  { regex: /[\u202b]/g, name: 'rle-embedding' },
  { regex: /[\u202c]/g, name: 'pop-directional' },
  { regex: /[\u202d]/g, name: 'lro-override' },
  { regex: /[\u202e]/g, name: 'rlo-override' },
  { regex: /[\u2060]/g, name: 'word-joiner' },
  { regex: /[\u2061]/g, name: 'function-application' },
  { regex: /[\u2062]/g, name: 'invisible-times' },
  { regex: /[\u2063]/g, name: 'invisible-separator' },
  { regex: /[\u2064]/g, name: 'invisible-plus' },
  { regex: /[\u2066]/g, name: 'lri-isolate' },
  { regex: /[\u2067]/g, name: 'rli-isolate' },
  { regex: /[\u2068]/g, name: 'fsi-isolate' },
  { regex: /[\u2069]/g, name: 'pop-isolate' },
  { regex: /[\u3164]/g, name: 'hangul-filler' },
  { regex: /[\ufeff]/g, name: 'zero-width-no-break-space' },
  { regex: /[\uffa0]/g, name: 'halfwidth-hangul-filler' },
];

export const EXOTIC_SPACES = [
  { regex: /[\u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f]/g, replacement: ' ' },
  { regex: /[\u2028]/g, replacement: '\n' },
];

export const CLICHE_REPLACEMENTS = [
  { pattern: /\bdelve\s+deeper\s+into\b/gi, replacement: 'explore', label: 'delve-deeper-into' },
  { pattern: /\bdelve\s+into\b/gi, replacement: 'explore', label: 'delve-into' },
  { pattern: /\bin\s+the\s+ever-evolving\s+landscape\s+of\b/gi, replacement: 'in', label: 'ever-evolving-landscape' },
  { pattern: /\bin\s+the\s+ever-evolving\s+world\s+of\b/gi, replacement: 'in', label: 'ever-evolving-world' },
  { pattern: /\bever-evolving\b/gi, replacement: 'changing', label: 'ever-evolving' },
  { pattern: /\bever-changing\b/gi, replacement: 'changing', label: 'ever-changing' },
  { pattern: /\bnavigating\s+the\s+complexities\s+of\b/gi, replacement: 'handling', label: 'navigating-complexities' },
  { pattern: /\btapestry\s+of\b/gi, replacement: 'range of', label: 'tapestry-of' },
  { pattern: /\b(rich|intricate|complex)\s+tapestry\b/gi, replacement: 'range', label: 'rich-tapestry' },
  { pattern: /\bembark\s+on\s+a\s+journey\b/gi, replacement: 'begin', label: 'embark-journey' },
  { pattern: /\ba\s+testament\s+to\b/gi, replacement: 'evidence of', label: 'testament-to' },
  { pattern: /\ba\s+beacon\s+of\b/gi, replacement: 'a leader in', label: 'beacon-of' },
  { pattern: /\b(the\s+|a\s+)?cornerstone\s+of\b/gi, replacement: 'central to', label: 'cornerstone-of' },
  { pattern: /\bat\s+the\s+heart\s+of\b/gi, replacement: 'central to', label: 'at-the-heart-of' },
  { pattern: /\bin\s+essence,\s*/gi, replacement: '', label: 'in-essence' },
  { pattern: /\bin\s+conclusion,\s*/gi, replacement: '', label: 'in-conclusion' },
  { pattern: /\bultimately,\s*/gi, replacement: '', label: 'ultimately-comma' },
  { pattern: /\bmoreover,\s*/gi, replacement: '', label: 'moreover-comma' },
  { pattern: /\bfurthermore,\s*/gi, replacement: '', label: 'furthermore-comma' },
  { pattern: /\bhowever,\s+it'?s\s+worth\s+noting\s+that\b/gi, replacement: 'however,', label: 'worth-noting-clause' },
  { pattern: /\bit'?s\s+worth\s+noting\s+that\b/gi, replacement: 'note:', label: 'worth-noting' },
  { pattern: /\bby\s+leveraging\b/gi, replacement: 'by using', label: 'by-leveraging' },
  { pattern: /\bleverage\s+the\s+power\s+of\b/gi, replacement: 'use', label: 'leverage-power' },
  { pattern: /\bleveraging\s+the\s+power\s+of\b/gi, replacement: 'using', label: 'leveraging-power' },
  { pattern: /\bharness\s+the\s+power\s+of\b/gi, replacement: 'use', label: 'harness-power' },
  { pattern: /\bunlock\s+(?:the\s+(?:full\s+)?)?potential\b/gi, replacement: 'use', label: 'unlock-potential' },
  { pattern: /\bopen\s+up\s+a\s+world\s+of\b/gi, replacement: 'enable', label: 'open-world' },
  { pattern: /\ba\s+world\s+of\s+possibilities\b/gi, replacement: 'options', label: 'world-possibilities' },
  { pattern: /\belevate\s+your\b/gi, replacement: 'improve your', label: 'elevate-your' },
  { pattern: /\btransform\s+your\b/gi, replacement: 'improve your', label: 'transform-your' },
  { pattern: /\brevolutionize\s+the\s+way\b/gi, replacement: 'change how', label: 'revolutionize-the-way' },
  { pattern: /\bgame-?changer\b/gi, replacement: 'important step', label: 'game-changer' },
  { pattern: /\bcutting-?edge\b/gi, replacement: 'modern', label: 'cutting-edge' },
  { pattern: /\bstate-of-the-art\b/gi, replacement: 'modern', label: 'state-of-the-art' },
  { pattern: /\bin\s+summary,\s*/gi, replacement: '', label: 'in-summary' },
  { pattern: /\bto\s+summarize,\s*/gi, replacement: '', label: 'to-summarize' },
  { pattern: /\bto\s+put\s+it\s+simply,\s*/gi, replacement: '', label: 'to-put-simply' },
  { pattern: /\bin\s+a\s+nutshell,\s*/gi, replacement: '', label: 'in-nutshell' },
  { pattern: /\bit'?s\s+important\s+to\s+note\s+that\b/gi, replacement: 'note:', label: 'important-note' },
  { pattern: /\bin\s+today'?s\s+(fast-paced|digital|competitive)\s+(world|age|landscape)\b/gi, replacement: 'today', label: 'today-cliche' },
  { pattern: /\bneedless\s+to\s+say,?\s*/gi, replacement: '', label: 'needless-to-say' },
  { pattern: /\bat\s+the\s+end\s+of\s+the\s+day\b/gi, replacement: 'ultimately', label: 'end-of-the-day' },
  { pattern: /\bwhen\s+it\s+comes\s+to\b/gi, replacement: 'for', label: 'when-it-comes-to' },
  { pattern: /\bfirst\s+and\s+foremost,?\s*/gi, replacement: 'first,', label: 'first-and-foremost' },
  { pattern: /\blast\s+but\s+not\s+least,?\s*/gi, replacement: 'finally,', label: 'last-but-not-least' },
  { pattern: /\blet'?s\s+dive\s+(in|into)\b/gi, replacement: 'starting with', label: 'let-us-dive' },
  { pattern: /\blet'?s\s+take\s+a\s+(closer|deeper)\s+look\b/gi, replacement: 'look at', label: 'let-us-take-look' },
];

/**
 * Strips zero-width characters and watermarks from input text.
 */
export function purgeInvisibleWatermarks(text) {
  if (!text || typeof text !== 'string') return { cleaned: '', removedCount: 0, removedTypes: [] };

  let cleaned = text;
  let totalRemoved = 0;
  const removedTypes = [];

  // 1. Delete invisible/zero-width chars
  for (const item of INVISIBLE_CHARS) {
    const matches = cleaned.match(item.regex);
    if (matches && matches.length > 0) {
      totalRemoved += matches.length;
      removedTypes.push(`${item.name} (${matches.length})`);
      cleaned = cleaned.replace(item.regex, '');
    }
  }

  // 2. Normalize exotic spaces
  for (const item of EXOTIC_SPACES) {
    cleaned = cleaned.replace(item.regex, item.replacement);
  }

  return {
    cleaned,
    removedCount: totalRemoved,
    removedTypes,
  };
}

/**
 * Replaces deterministic AI clichés and robotic transitions.
 */
export function replaceClichePhrasing(text) {
  if (!text || typeof text !== 'string') return { text: '', replacedCount: 0, changes: [] };

  let result = text;
  let replacedCount = 0;
  const changes = [];

  for (const item of CLICHE_REPLACEMENTS) {
    const matches = result.match(item.pattern);
    if (matches && matches.length > 0) {
      replacedCount += matches.length;
      changes.push({ label: item.label, count: matches.length, replacement: item.replacement });
      result = result.replace(item.pattern, (match) => {
        // preserve casing of first letter if replacing
        if (item.replacement.length === 0) return '';
        const isUpper = match[0] === match[0].toUpperCase();
        if (isUpper) {
          return item.replacement.charAt(0).toUpperCase() + item.replacement.slice(1);
        }
        return item.replacement;
      });
    }
  }

  return {
    text: result,
    replacedCount,
    changes,
  };
}

/**
 * Computes simple heuristic metrics for text analysis.
 */
export function computeTextMetrics(text) {
  if (!text || typeof text !== 'string') {
    return { words: 0, characters: 0, sentences: 0, avgSentenceLength: 0, readingTimeMinutes: 0 };
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const charCount = text.length;
  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const avgSentenceLength = Math.round((wordCount / sentenceCount) * 10) / 10;
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return {
    words: wordCount,
    characters: charCount,
    sentences: sentenceCount,
    avgSentenceLength,
    readingTimeMinutes,
  };
}
