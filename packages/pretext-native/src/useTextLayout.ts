import { useMemo, useState, useEffect } from 'react';
import type { TextMeasureInput, TextMeasureResult } from '@pretext-native/core';
import { measureTextSync, measureText } from './measureText';
import { makeCacheKey } from './utils/cacheKey';

export interface UseTextLayoutOptions extends TextMeasureInput {
  /** Set false to skip measurement. Default: true */
  enabled?: boolean;
}

export interface UseTextLayoutResult {
  /** Full measurement result, or null if not yet available */
  result: TextMeasureResult | null;
  /** True while async measurement is in progress */
  isLoading: boolean;
  /** Error if measurement failed */
  error: Error | null;
  /** Computed height (0 if not yet measured) */
  height: number;
  /** Number of lines (0 if not yet measured) */
  lineCount: number;
  /** Whether text was truncated by maxLines */
  isTruncated: boolean;
}

/**
 * React hook for pre-render text layout measurement.
 *
 * Attempts synchronous measurement first (via JSI/native or cached result).
 * Falls back to async measurement if sync is unavailable.
 *
 * @example
 * ```tsx
 * const { height, lineCount, isTruncated } = useTextLayout({
 *   text: message.body,
 *   width: containerWidth,
 *   fontSize: 15,
 *   lineHeight: 22,
 *   maxLines: 3,
 * });
 * ```
 */
export function useTextLayout(options: UseTextLayoutOptions): UseTextLayoutResult {
  const enabled = options.enabled !== false;

  const stableKey = useMemo(
    () => makeCacheKey(options),
    [
      options.text,
      options.width,
      options.fontSize,
      options.fontFamily,
      options.fontWeight,
      options.lineHeight,
      options.letterSpacing,
      options.maxLines,
    ]
  );

  // Try synchronous path first
  const syncResult = useMemo(() => {
    if (!enabled) return null;
    try {
      return measureTextSync(options);
    } catch {
      return null;
    }
  }, [stableKey, enabled]);

  // Async fallback state
  const [asyncResult, setAsyncResult] = useState<TextMeasureResult | null>(null);
  const [isLoading, setIsLoading] = useState(!syncResult && enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (syncResult || !enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    measureText(options)
      .then((r) => {
        if (!cancelled) {
          setAsyncResult(r);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stableKey, enabled, syncResult]);

  const result = syncResult ?? asyncResult;

  return {
    result,
    isLoading,
    error,
    height: result?.height ?? 0,
    lineCount: result?.lineCount ?? 0,
    isTruncated: result?.truncated ?? false,
  };
}
