import type { Token, MeasureFunc, TextMeasureInput } from './types';
import { lineToString } from './lineBreaker';

const ELLIPSIS = '\u2026'; // …

export interface TruncationResult {
  lines: Token[][];
  truncated: boolean;
}

/**
 * Apply maxLines truncation to broken lines.
 *
 * If the number of lines exceeds maxLines:
 * 1. Slice to maxLines count
 * 2. Mark as truncated
 * 3. On the last visible line, try to fit an ellipsis by removing tokens from the end
 */
export function truncateLines(
  lines: Token[][],
  maxLines: number | undefined,
  containerWidth: number,
  measure: MeasureFunc,
  input: TextMeasureInput
): TruncationResult {
  if (maxLines === undefined || maxLines <= 0 || lines.length <= maxLines) {
    return { lines, truncated: false };
  }

  const truncatedLines = lines.slice(0, maxLines);
  const lastLine = [...truncatedLines[maxLines - 1]];

  // Measure ellipsis width
  const ellipsisWidth = measure(ELLIPSIS, input);

  // Calculate current last line width
  let lastLineWidth = 0;
  for (const token of lastLine) {
    lastLineWidth += token.width;
  }

  // Remove tokens from end until ellipsis fits
  while (lastLine.length > 0 && lastLineWidth + ellipsisWidth > containerWidth) {
    const removed = lastLine.pop()!;
    lastLineWidth -= removed.width;
  }

  // Append ellipsis as a word token
  lastLine.push({
    type: 'word',
    text: ELLIPSIS,
    width: ellipsisWidth,
  });

  truncatedLines[maxLines - 1] = lastLine;

  return {
    lines: truncatedLines,
    truncated: true,
  };
}
