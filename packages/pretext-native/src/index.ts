export {
  measureTextSync,
  measureText,
  measureTextBatch,
  prewarmCache,
  clearCache,
  getCacheStats,
  isNativeAvailable,
} from './measureText';
export type { CombinedCacheStats } from './measureText';

export { useTextLayout } from './useTextLayout';
export type { UseTextLayoutOptions, UseTextLayoutResult } from './useTextLayout';

export { createJsAdapter } from './jsAdapter';

// Re-export core types for convenience
export type {
  TextMeasureInput,
  TextMeasureResult,
  FontMetrics,
  CacheStats,
} from '@pretext-native/core';
