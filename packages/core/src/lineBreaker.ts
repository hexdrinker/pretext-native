import type { Token } from './types';

/**
 * Greedy first-fit line breaking algorithm.
 *
 * Takes measured tokens and a container width, returns an array of lines.
 * Each line is an array of tokens that fit within the container width.
 *
 * Rules:
 * - mandatory-break tokens always force a new line
 * - space tokens at line boundaries are trimmed (not counted toward width)
 * - zero-width-space tokens act as break opportunities with zero width
 * - if a single word is wider than the container, it's placed on its own line (no mid-word break for now)
 */
export function breakLines(tokens: Token[], containerWidth: number): Token[][] {
  if (tokens.length === 0) {
    return [[]];
  }

  const lines: Token[][] = [[]];
  let currentLineWidth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Mandatory break: commit current line and start new
    if (token.type === 'mandatory-break') {
      lines.push([]);
      currentLineWidth = 0;
      continue;
    }

    // Zero-width space: acts as break opportunity, doesn't consume width
    if (token.type === 'zero-width-space') {
      continue;
    }

    // Space token
    if (token.type === 'space') {
      // If space fits, add it to the current line
      if (currentLineWidth + token.width <= containerWidth) {
        lines[lines.length - 1].push(token);
        currentLineWidth += token.width;
      }
      // If space doesn't fit, skip it (trimmed at line boundary)
      continue;
    }

    // Word token
    if (currentLineWidth + token.width <= containerWidth) {
      // Word fits on current line
      lines[lines.length - 1].push(token);
      currentLineWidth += token.width;
    } else {
      // Word doesn't fit
      if (lines[lines.length - 1].length === 0) {
        // Current line is empty — place the word anyway (overflow)
        lines[lines.length - 1].push(token);
        currentLineWidth = token.width;
      } else {
        // Start a new line, trimming trailing spaces from the previous line
        trimTrailingSpaces(lines[lines.length - 1]);
        lines.push([token]);
        currentLineWidth = token.width;
      }
    }
  }

  return lines;
}

/** Remove trailing space tokens from a line */
function trimTrailingSpaces(line: Token[]): void {
  while (line.length > 0 && line[line.length - 1].type === 'space') {
    line.pop();
  }
}

/** Convert a line of tokens back to a string */
export function lineToString(line: Token[]): string {
  return line.map((t) => t.text).join('');
}
