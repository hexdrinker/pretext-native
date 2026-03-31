import type { MeasureFunc, TextMeasureInput } from '@pretext-native/core';

/**
 * Check if a codepoint is a wide character (CJK, fullwidth).
 */
function isWide(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0xff00 && code <= 0xff60)
  );
}

/**
 * Check if a character is narrow (i, l, 1, j, f, t, etc.).
 */
function isNarrow(char: string): boolean {
  return /^[iljft1!|:;.,']$/.test(char);
}

/**
 * Pure-JS fallback measure function.
 *
 * Uses heuristic character widths based on fontSize.
 * Approximate — suitable for testing and web environments,
 * not intended as a production path for native apps.
 */
export function createJsAdapter(): MeasureFunc {
  return (text: string, input: TextMeasureInput): number => {
    const { fontSize, letterSpacing } = input;
    let totalWidth = 0;

    const chars = Array.from(text);
    for (const char of chars) {
      const code = char.codePointAt(0)!;

      if (isWide(code)) {
        totalWidth += fontSize;
      } else if (isNarrow(char)) {
        totalWidth += fontSize * 0.35;
      } else if (char === ' ') {
        totalWidth += fontSize * 0.3;
      } else {
        totalWidth += fontSize * 0.55;
      }
    }

    // Add letter spacing between characters
    if (letterSpacing && chars.length > 1) {
      totalWidth += (chars.length - 1) * letterSpacing;
    }

    return totalWidth;
  };
}
