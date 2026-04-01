import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface TextMeasureNativeInput {
  text: string;
  width: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  maxLines?: number;
}

export interface TextMeasureNativeResult {
  height: number;
  lineCount: number;
  lines: string[];
  truncated: boolean;
}

export interface NativeFontMetrics {
  capHeight: number;
  ascender: number;
  descender: number;
  xHeight: number;
  lineGap: number;
  unitsPerEm: number;
}

export interface NativeCacheStats {
  fontMetricsEntries: number;
  measurementEntries: number;
  hitRate: number;
}

export interface Spec extends TurboModule {
  measureTextSync(input: TextMeasureNativeInput): TextMeasureNativeResult;
  measureText(input: TextMeasureNativeInput): Promise<TextMeasureNativeResult>;
  measureTextBatch(inputs: TextMeasureNativeInput[]): Promise<TextMeasureNativeResult[]>;
  getFontMetrics(
    fontFamily: string,
    fontWeight: string,
    fontSize: number
  ): NativeFontMetrics;
  clearCache(): void;
  getCacheStats(): NativeCacheStats;
  isFontAvailable(fontFamily: string): boolean;
}

export default TurboModuleRegistry.get<Spec>('PretextNative');
