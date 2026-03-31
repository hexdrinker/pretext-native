import type { Token, TokenType } from './types';

/**
 * Check if a codepoint is a CJK ideograph.
 * CJK Unified Ideographs: U+4E00–U+9FFF
 * CJK Extension A: U+3400–U+4DBF
 * CJK Extension B: U+20000–U+2A6DF
 * CJK Compatibility Ideographs: U+F900–U+FAFF
 * Hangul Syllables: U+AC00–U+D7AF
 * Katakana: U+30A0–U+30FF
 * Hiragana: U+3040–U+309F
 * Fullwidth Forms: U+FF00–U+FF60
 */
function isCJK(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0xff00 && code <= 0xff60)
  );
}

/**
 * Check if a character is a whitespace (but not a newline).
 */
function isSpace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\u00A0';
}

/**
 * Tokenize text into an array of tokens suitable for line breaking.
 *
 * Strategy:
 * 1. Split on \n → mandatory-break tokens
 * 2. Within each segment, split on spaces → word and space tokens
 * 3. CJK characters become individual word tokens (each is a break opportunity)
 * 4. Zero-width spaces (\u200B) emit zero-width-space tokens
 */
export function tokenize(text: string): Token[] {
  if (text.length === 0) {
    return [];
  }

  const tokens: Token[] = [];
  const segments = text.split('\n');

  for (let i = 0; i < segments.length; i++) {
    if (i > 0) {
      tokens.push({ type: 'mandatory-break', text: '\n', width: 0 });
    }

    const segment = segments[i];
    if (segment.length === 0) {
      continue;
    }

    tokenizeSegment(segment, tokens);
  }

  return tokens;
}

function tokenizeSegment(segment: string, tokens: Token[]): void {
  let current = '';
  let currentType: TokenType = 'word';

  const flush = () => {
    if (current.length > 0) {
      tokens.push({ type: currentType, text: current, width: 0 });
      current = '';
    }
  };

  const chars = Array.from(segment);

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const code = char.codePointAt(0)!;

    // Zero-width space
    if (code === 0x200b) {
      flush();
      tokens.push({ type: 'zero-width-space', text: char, width: 0 });
      currentType = 'word';
      continue;
    }

    // Whitespace
    if (isSpace(char)) {
      if (currentType !== 'space') {
        flush();
        currentType = 'space';
      }
      current += char;
      continue;
    }

    // CJK character — each is its own word token
    if (isCJK(code)) {
      flush();
      tokens.push({ type: 'word', text: char, width: 0 });
      currentType = 'word';
      continue;
    }

    // Regular character — accumulate as word
    if (currentType !== 'word') {
      flush();
      currentType = 'word';
    }
    current += char;
  }

  flush();
}
