/** Input configuration for text measurement */
export interface TextMeasureInput {
  text: string;
  width: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  maxLines?: number;
  allowFontScaling?: boolean;
}

/** Result of text layout measurement */
export interface TextMeasureResult {
  height: number;
  lineCount: number;
  lines: string[];
  truncated: boolean;
}

/** Font intrinsic metrics */
export interface FontMetrics {
  capHeight: number;
  ascender: number;
  descender: number;
  xHeight: number;
  lineGap: number;
  unitsPerEm: number;
}

/** Token types produced by the tokenizer */
export type TokenType = 'word' | 'space' | 'mandatory-break' | 'zero-width-space';

/** A single token from tokenization */
export interface Token {
  type: TokenType;
  text: string;
  width: number;
}

/** A function that measures the width of a text string */
export type MeasureFunc = (text: string, input: TextMeasureInput) => number;

/** Cache statistics */
export interface CacheStats {
  wordEntries: number;
  layoutEntries: number;
  hits: number;
  misses: number;
}
