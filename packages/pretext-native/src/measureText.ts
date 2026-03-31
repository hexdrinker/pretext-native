import {
  computeLayout,
  LayoutCache,
  type TextMeasureInput,
  type TextMeasureResult,
} from '@pretext-native/core';
import NativePretextNative from './NativePretextNative';
import { createJsAdapter } from './jsAdapter';

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
  if (isNativeAvailable()) {
    return NativePretextNative!.measureTextSync(input);
  }
  // Fallback: use pure-JS engine with heuristic adapter
  return computeLayout(input, getJsAdapter(), cache);
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
  if (isNativeAvailable()) {
    return NativePretextNative!.measureText(input);
  }
  return computeLayout(input, getJsAdapter(), cache);
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
  if (isNativeAvailable()) {
    return NativePretextNative!.measureTextBatch(inputs);
  }
  const adapter = getJsAdapter();
  return inputs.map((input) => computeLayout(input, adapter, cache));
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
export function getCacheStats() {
  return {
    js: cache.getStats(),
    native: isNativeAvailable() ? NativePretextNative!.getCacheStats() : null,
  };
}
