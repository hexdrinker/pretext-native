import { makeCacheKey } from '../src/utils/cacheKey';

describe('makeCacheKey', () => {
  it('produces deterministic keys for same input', () => {
    const input = { text: 'hello', width: 300, fontSize: 14 };
    expect(makeCacheKey(input)).toBe(makeCacheKey(input));
  });

  it('produces different keys for different text', () => {
    const a = makeCacheKey({ text: 'hello', width: 300, fontSize: 14 });
    const b = makeCacheKey({ text: 'world', width: 300, fontSize: 14 });
    expect(a).not.toBe(b);
  });

  it('produces different keys for different width', () => {
    const a = makeCacheKey({ text: 'hello', width: 300, fontSize: 14 });
    const b = makeCacheKey({ text: 'hello', width: 400, fontSize: 14 });
    expect(a).not.toBe(b);
  });

  it('produces different keys for different fontSize', () => {
    const a = makeCacheKey({ text: 'hello', width: 300, fontSize: 14 });
    const b = makeCacheKey({ text: 'hello', width: 300, fontSize: 16 });
    expect(a).not.toBe(b);
  });

  it('includes optional fields in key', () => {
    const base = makeCacheKey({ text: 'hello', width: 300, fontSize: 14 });
    const withFamily = makeCacheKey({
      text: 'hello',
      width: 300,
      fontSize: 14,
      fontFamily: 'Arial',
    });
    const withWeight = makeCacheKey({
      text: 'hello',
      width: 300,
      fontSize: 14,
      fontWeight: 'bold',
    });
    const withLineHeight = makeCacheKey({
      text: 'hello',
      width: 300,
      fontSize: 14,
      lineHeight: 20,
    });
    const withLetterSpacing = makeCacheKey({
      text: 'hello',
      width: 300,
      fontSize: 14,
      letterSpacing: 1,
    });
    const withMaxLines = makeCacheKey({
      text: 'hello',
      width: 300,
      fontSize: 14,
      maxLines: 3,
    });

    const keys = [base, withFamily, withWeight, withLineHeight, withLetterSpacing, withMaxLines];
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('uses null byte as separator', () => {
    const key = makeCacheKey({ text: 'hello', width: 300, fontSize: 14 });
    expect(key).toContain('\0');
  });

  it('avoids collision between different field placements', () => {
    // "fontFamily=bold" vs "fontWeight=bold" should differ
    const a = makeCacheKey({
      text: 'x',
      width: 100,
      fontSize: 14,
      fontFamily: 'bold',
    });
    const b = makeCacheKey({
      text: 'x',
      width: 100,
      fontSize: 14,
      fontWeight: 'bold',
    });
    expect(a).not.toBe(b);
  });
});
