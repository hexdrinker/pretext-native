import type { TextMeasureInput, TextMeasureResult, MeasureFunc } from './types';
import { tokenize } from './tokenizer';
import { breakLines, lineToString } from './lineBreaker';
import { truncateLines } from './truncation';
import { LayoutCache } from './cache';

/** Default line height multiplier when lineHeight is not provided */
const DEFAULT_LINE_HEIGHT_MULTIPLIER = 1.3;

/** Resolve the effective line height in pixels */
function resolveLineHeight(input: TextMeasureInput): number {
  if (input.lineHeight !== undefined && input.lineHeight > 0) {
    return input.lineHeight;
  }
  return input.fontSize * DEFAULT_LINE_HEIGHT_MULTIPLIER;
}

/**
 * Create a cached measure function that wraps the raw measure function
 * with word-level caching from the LayoutCache.
 */
function createCachedMeasure(
  measure: MeasureFunc,
  cache: LayoutCache,
  input: TextMeasureInput
): MeasureFunc {
  return (text: string, inp: TextMeasureInput): number => {
    const cached = cache.getWordWidth(
      text,
      inp.fontSize,
      inp.fontFamily,
      inp.fontWeight,
      inp.letterSpacing
    );
    if (cached !== undefined) {
      return cached;
    }
    const width = measure(text, inp);
    cache.setWordWidth(
      text,
      inp.fontSize,
      inp.fontFamily,
      inp.fontWeight,
      inp.letterSpacing,
      width
    );
    return width;
  };
}

/**
 * Compute text layout: tokenize → measure → break lines → truncate.
 *
 * @param input - Text measurement input parameters
 * @param measure - Function to measure text width (provided by native adapter or JS fallback)
 * @param cache - Optional LayoutCache for caching results
 */
export function computeLayout(
  input: TextMeasureInput,
  measure: MeasureFunc,
  cache?: LayoutCache
): TextMeasureResult {
  // Check full layout cache first
  if (cache) {
    const cached = cache.getLayout(input);
    if (cached) {
      return cached;
    }
  }

  const cachedMeasure = cache ? createCachedMeasure(measure, cache, input) : measure;

  // Step 1: Tokenize
  const tokens = tokenize(input.text);

  // Step 2: Measure all tokens
  for (const token of tokens) {
    if (token.type === 'word' || token.type === 'space') {
      token.width = cachedMeasure(token.text, input);
    }
    // mandatory-break and zero-width-space have width = 0
  }

  // Step 3: Break lines
  const rawLines = breakLines(tokens, input.width);

  // Step 4: Truncate if needed
  const { lines, truncated } = truncateLines(
    rawLines,
    input.maxLines,
    input.width,
    cachedMeasure,
    input
  );

  // Step 5: Calculate height
  const lineHeight = resolveLineHeight(input);
  const height = lines.length * lineHeight;

  const result: TextMeasureResult = {
    height,
    lineCount: lines.length,
    lines: lines.map(lineToString),
    truncated,
  };

  // Store in cache
  if (cache) {
    cache.setLayout(input, result);
  }

  return result;
}
