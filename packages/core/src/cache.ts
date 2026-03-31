import type { TextMeasureInput, TextMeasureResult, CacheStats } from './types';

/**
 * Generic LRU cache using Map's insertion-order iteration.
 * O(1) get/set with max-size eviction.
 */
export class LRUCache<K, V> {
  private map = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) {
      return undefined;
    }
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict least recently used (first entry)
      const firstKey = this.map.keys().next().value!;
      this.map.delete(firstKey);
    }
    this.map.set(key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

/**
 * Two-tier layout cache:
 * - Tier 1 (word): Caches word width measurements
 * - Tier 2 (layout): Caches full layout results
 */
export class LayoutCache {
  private wordCache: LRUCache<string, number>;
  private layoutCache: LRUCache<string, TextMeasureResult>;
  private hits = 0;
  private misses = 0;

  constructor(wordCacheSize = 2000, layoutCacheSize = 500) {
    this.wordCache = new LRUCache(wordCacheSize);
    this.layoutCache = new LRUCache(layoutCacheSize);
  }

  /** Generate cache key for word width lookup */
  private wordKey(
    word: string,
    fontSize: number,
    fontFamily?: string,
    fontWeight?: string,
    letterSpacing?: number
  ): string {
    return `${word}\0${fontSize}\0${fontFamily ?? ''}\0${fontWeight ?? ''}\0${letterSpacing ?? ''}`;
  }

  /** Generate cache key for full layout lookup */
  private layoutKey(input: TextMeasureInput): string {
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

  getWordWidth(
    word: string,
    fontSize: number,
    fontFamily?: string,
    fontWeight?: string,
    letterSpacing?: number
  ): number | undefined {
    return this.wordCache.get(this.wordKey(word, fontSize, fontFamily, fontWeight, letterSpacing));
  }

  setWordWidth(
    word: string,
    fontSize: number,
    fontFamily: string | undefined,
    fontWeight: string | undefined,
    letterSpacing: number | undefined,
    width: number
  ): void {
    this.wordCache.set(
      this.wordKey(word, fontSize, fontFamily, fontWeight, letterSpacing),
      width
    );
  }

  getLayout(input: TextMeasureInput): TextMeasureResult | undefined {
    const key = this.layoutKey(input);
    const result = this.layoutCache.get(key);
    if (result !== undefined) {
      this.hits++;
    } else {
      this.misses++;
    }
    return result;
  }

  setLayout(input: TextMeasureInput, result: TextMeasureResult): void {
    this.layoutCache.set(this.layoutKey(input), result);
  }

  getStats(): CacheStats {
    return {
      wordEntries: this.wordCache.size,
      layoutEntries: this.layoutCache.size,
      hits: this.hits,
      misses: this.misses,
    };
  }

  clear(): void {
    this.wordCache.clear();
    this.layoutCache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
