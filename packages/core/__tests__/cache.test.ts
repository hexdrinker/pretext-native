import { LRUCache, LayoutCache } from '../src/cache';
import type { TextMeasureInput } from '../src/types';

describe('LRUCache', () => {
  it('stores and retrieves values', () => {
    const cache = new LRUCache<string, number>(10);
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('returns undefined for missing keys', () => {
    const cache = new LRUCache<string, number>(10);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('evicts least recently used when at capacity', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // should evict 'a'
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('d')).toBe(4);
  });

  it('refreshes key on get (moves to most recent)', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.get('a'); // refresh 'a'
    cache.set('d', 4); // should evict 'b' (least recent)
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('updates value on duplicate key set', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('a', 2);
    expect(cache.get('a')).toBe(2);
    expect(cache.size).toBe(1);
  });

  it('clears all entries', () => {
    const cache = new LRUCache<string, number>(10);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('reports correct size', () => {
    const cache = new LRUCache<string, number>(10);
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    expect(cache.size).toBe(1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
  });
});

describe('LayoutCache', () => {
  const baseInput: TextMeasureInput = {
    text: 'hello world',
    width: 200,
    fontSize: 16,
  };

  it('caches and retrieves word widths', () => {
    const cache = new LayoutCache();
    cache.setWordWidth('hello', 16, undefined, undefined, undefined, 50);
    expect(cache.getWordWidth('hello', 16, undefined, undefined, undefined)).toBe(50);
  });

  it('differentiates word widths by font properties', () => {
    const cache = new LayoutCache();
    cache.setWordWidth('hello', 16, 'Arial', '400', 0, 50);
    cache.setWordWidth('hello', 16, 'Arial', '700', 0, 55);
    expect(cache.getWordWidth('hello', 16, 'Arial', '400', 0)).toBe(50);
    expect(cache.getWordWidth('hello', 16, 'Arial', '700', 0)).toBe(55);
  });

  it('caches and retrieves layout results', () => {
    const cache = new LayoutCache();
    const result = {
      height: 20,
      lineCount: 1,
      lines: ['hello world'],
      truncated: false,
    };
    cache.setLayout(baseInput, result);
    expect(cache.getLayout(baseInput)).toEqual(result);
  });

  it('tracks hit/miss stats', () => {
    const cache = new LayoutCache();
    const result = {
      height: 20,
      lineCount: 1,
      lines: ['hello world'],
      truncated: false,
    };

    cache.getLayout(baseInput); // miss
    cache.setLayout(baseInput, result);
    cache.getLayout(baseInput); // hit

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.layoutEntries).toBe(1);
  });

  it('clears all caches and resets stats', () => {
    const cache = new LayoutCache();
    cache.setWordWidth('hello', 16, undefined, undefined, undefined, 50);
    cache.setLayout(baseInput, {
      height: 20,
      lineCount: 1,
      lines: ['hello'],
      truncated: false,
    });
    cache.clear();
    const stats = cache.getStats();
    expect(stats.wordEntries).toBe(0);
    expect(stats.layoutEntries).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});
