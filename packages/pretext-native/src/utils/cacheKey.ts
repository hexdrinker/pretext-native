import type { TextMeasureInput } from '@pretext-native/core';

/**
 * Generate a deterministic cache key for a TextMeasureInput.
 * Uses null byte separator to avoid collisions.
 */
export function makeCacheKey(input: TextMeasureInput): string {
  return [
    input.text,
    input.width,
    input.fontSize,
    input.fontFamily ?? '',
    input.fontWeight ?? '',
    input.lineHeight ?? '',
    input.letterSpacing ?? '',
    input.maxLines ?? '',
  ].join('\0');
}
