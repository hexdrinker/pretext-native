import {
  computeLayout,
  LayoutCache,
  type TextMeasureInput,
  type TextMeasureResult,
  type CacheStats,
} from '@hexdrinker/pretext-native-core';
import NativePretextNative from './NativePretextNative';
import type { NativeCacheStats } from './NativePretextNative';
import { createJsAdapter } from './jsAdapter';

function getFontScale(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PixelRatio } = require('react-native');
    return PixelRatio.getFontScale();
  } catch {
    return 1;
  }
}

/**
 * Apply system font scaling to measurement input.
 * When allowFontScaling is true (default), fontSize and lineHeight
 * are multiplied by the system font scale to match React Native's
 * Text rendering behavior.
 */
function applyFontScaling(input: TextMeasureInput): TextMeasureInput {
  if (input.allowFontScaling === false) return input;
  const fontScale = getFontScale();
  if (fontScale === 1) return input;
  return {
    ...input,
    fontSize: input.fontSize * fontScale,
    lineHeight: input.lineHeight ? input.lineHeight * fontScale : undefined,
  };
}

/** Shared layout cache instance */
const cache = new LayoutCache();

/** JS fallback adapter (created lazily) */
let jsAdapter: ReturnType<typeof createJsAdapter> | null = null;

function getJsAdapter() {
  if (!jsAdapter) {
    jsAdapter = createJsAdapter();
  }
  return jsAdapter;
}

/**
 * Check if the native TurboModule is available.
 */
export function isNativeAvailable(): boolean {
  return NativePretextNative != null;
}

/**
 * Synchronous text measurement.
 *
 * Uses the native TurboModule via JSI when available.
 * Falls back to the pure-JS layout engine with heuristic measurements.
 *
 * Ideal for FlatList's getItemLayout where synchronous access is required.
 */
export function measureTextSync(input: TextMeasureInput): TextMeasureResult {
  const scaled = applyFontScaling(input);
  if (isNativeAvailable()) {
    return NativePretextNative!.measureTextSync(scaled);
  }
  // Fallback: use pure-JS engine with heuristic adapter
  return computeLayout(scaled, getJsAdapter(), cache);
}

/**
 * Asynchronous text measurement.
 *
 * Uses the native TurboModule when available.
 * Falls back to the pure-JS layout engine.
 *
 * Useful for background pre-warming of layout caches.
 */
export async function measureText(input: TextMeasureInput): Promise<TextMeasureResult> {
  const scaled = applyFontScaling(input);
  if (isNativeAvailable()) {
    return NativePretextNative!.measureText(scaled);
  }
  return computeLayout(scaled, getJsAdapter(), cache);
}

/**
 * Batch measurement for pre-warming (e.g., entire list data).
 *
 * Uses native batch API when available for efficiency.
 * Falls back to sequential JS computation.
 */
export async function measureTextBatch(
  inputs: TextMeasureInput[]
): Promise<TextMeasureResult[]> {
  const scaledInputs = inputs.map(applyFontScaling);
  if (isNativeAvailable()) {
    return NativePretextNative!.measureTextBatch(scaledInputs);
  }
  const adapter = getJsAdapter();
  return scaledInputs.map((input) => computeLayout(input, adapter, cache));
}

/**
 * Pre-warm the cache with a set of inputs.
 * Recommended to call before rendering large lists.
 */
export async function prewarmCache(inputs: TextMeasureInput[]): Promise<void> {
  await measureTextBatch(inputs);
}

/**
 * Clear all caches (both JS-tier and native-tier).
 */
export function clearCache(): void {
  cache.clear();
  if (isNativeAvailable()) {
    NativePretextNative!.clearCache();
  }
}

/**
 * Get cache statistics.
 */
export interface CombinedCacheStats {
  js: CacheStats;
  native: NativeCacheStats | null;
}

/**
 * Check if a font family is available on the device.
 * Returns false when native module is unavailable (e.g., in tests).
 */
export function isFontAvailable(fontFamily: string): boolean {
  if (!isNativeAvailable()) return false;
  return NativePretextNative!.isFontAvailable(fontFamily);
}

export function getCacheStats(): CombinedCacheStats {
  return {
    js: cache.getStats(),
    native: isNativeAvailable() ? NativePretextNative!.getCacheStats() : null,
  };
}
