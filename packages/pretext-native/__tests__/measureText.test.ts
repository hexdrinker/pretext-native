/**
 * Tests for measureText module.
 *
 * Since the native TurboModule is not available in a Node test environment,
 * these tests exercise the JS fallback path (jsAdapter + core engine).
 */

// Mock the native module as unavailable
jest.mock('../src/NativePretextNative', () => ({
  __esModule: true,
  default: null,
}));

import {
  measureTextSync,
  measureText,
  measureTextBatch,
  prewarmCache,
  clearCache,
  getCacheStats,
  isNativeAvailable,
} from '../src/measureText';

describe('measureText (JS fallback)', () => {
  beforeEach(() => {
    clearCache();
  });

  it('isNativeAvailable returns false in test env', () => {
    expect(isNativeAvailable()).toBe(false);
  });

  describe('measureTextSync', () => {
    it('returns result with height, lineCount, lines, truncated', () => {
      const result = measureTextSync({
        text: 'Hello world',
        width: 300,
        fontSize: 14,
      });

      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('lineCount');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('truncated');
      expect(typeof result.height).toBe('number');
      expect(typeof result.lineCount).toBe('number');
      expect(Array.isArray(result.lines)).toBe(true);
      expect(typeof result.truncated).toBe('boolean');
    });

    it('single word in wide container yields 1 line', () => {
      const result = measureTextSync({
        text: 'Hello',
        width: 300,
        fontSize: 14,
      });
      expect(result.lineCount).toBe(1);
      expect(result.truncated).toBe(false);
    });

    it('long text wraps into multiple lines', () => {
      const result = measureTextSync({
        text: 'This is a long sentence that should wrap to multiple lines when the container is narrow enough to force wrapping',
        width: 100,
        fontSize: 14,
      });
      expect(result.lineCount).toBeGreaterThan(1);
    });

    it('respects maxLines truncation', () => {
      const full = measureTextSync({
        text: 'Line one. Line two. Line three. Line four. Line five.',
        width: 80,
        fontSize: 14,
      });

      const truncated = measureTextSync({
        text: 'Line one. Line two. Line three. Line four. Line five.',
        width: 80,
        fontSize: 14,
        maxLines: 2,
      });

      expect(truncated.lineCount).toBeLessThanOrEqual(2);
      expect(truncated.height).toBeLessThanOrEqual(full.height);
      if (full.lineCount > 2) {
        expect(truncated.truncated).toBe(true);
      }
    });

    it('handles empty text', () => {
      const result = measureTextSync({
        text: '',
        width: 300,
        fontSize: 14,
      });
      expect(result.lineCount).toBeGreaterThanOrEqual(1);
      expect(result.lines.length).toBeGreaterThanOrEqual(1);
    });

    it('handles newlines', () => {
      const result = measureTextSync({
        text: 'Line 1\nLine 2\nLine 3',
        width: 300,
        fontSize: 14,
      });
      expect(result.lineCount).toBe(3);
    });

    it('height increases with lineHeight', () => {
      const small = measureTextSync({
        text: 'Hello\nWorld',
        width: 300,
        fontSize: 14,
        lineHeight: 18,
      });
      const large = measureTextSync({
        text: 'Hello\nWorld',
        width: 300,
        fontSize: 14,
        lineHeight: 30,
      });
      expect(large.height).toBeGreaterThan(small.height);
    });
  });

  describe('measureText (async)', () => {
    it('returns same result as sync', async () => {
      const input = { text: 'Hello world', width: 300, fontSize: 14 };
      const sync = measureTextSync(input);
      const async_ = await measureText(input);
      expect(async_).toEqual(sync);
    });
  });

  describe('measureTextBatch', () => {
    it('measures multiple inputs', async () => {
      const inputs = [
        { text: 'Short', width: 300, fontSize: 14 },
        { text: 'A longer piece of text', width: 300, fontSize: 14 },
        { text: 'Third item', width: 300, fontSize: 14 },
      ];
      const results = await measureTextBatch(inputs);
      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r).toHaveProperty('height');
        expect(r).toHaveProperty('lineCount');
      });
    });
  });

  describe('prewarmCache', () => {
    it('populates cache', async () => {
      const statsBefore = getCacheStats();
      await prewarmCache([
        { text: 'Warm 1', width: 300, fontSize: 14 },
        { text: 'Warm 2', width: 300, fontSize: 14 },
      ]);
      const statsAfter = getCacheStats();
      expect(statsAfter.js.layoutEntries).toBeGreaterThan(
        statsBefore.js.layoutEntries,
      );
    });
  });

  describe('getCacheStats', () => {
    it('returns js stats and null native stats', () => {
      const stats = getCacheStats();
      expect(stats.js).toHaveProperty('wordEntries');
      expect(stats.js).toHaveProperty('layoutEntries');
      expect(stats.js).toHaveProperty('hits');
      expect(stats.js).toHaveProperty('misses');
      expect(stats.native).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('resets cache stats', async () => {
      await prewarmCache([{ text: 'test', width: 300, fontSize: 14 }]);
      clearCache();
      const stats = getCacheStats();
      expect(stats.js.wordEntries).toBe(0);
      expect(stats.js.layoutEntries).toBe(0);
    });
  });
});
