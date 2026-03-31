import { createJsAdapter } from '../src/jsAdapter';
import type { TextMeasureInput } from '@hexdrinker/pretext-native-core';

describe('createJsAdapter', () => {
  const measure = createJsAdapter();

  const baseInput: TextMeasureInput = {
    text: '',
    width: 300,
    fontSize: 16,
  };

  it('returns a function', () => {
    expect(typeof measure).toBe('function');
  });

  it('measures empty string as zero width', () => {
    expect(measure('', baseInput)).toBe(0);
  });

  it('measures single space', () => {
    const width = measure(' ', baseInput);
    expect(width).toBeCloseTo(16 * 0.3, 5);
  });

  it('measures narrow characters smaller than normal', () => {
    const narrowWidth = measure('i', baseInput);
    const normalWidth = measure('a', baseInput);
    expect(narrowWidth).toBeLessThan(normalWidth);
  });

  it('measures CJK characters as full fontSize width', () => {
    const width = measure('가', baseInput);
    expect(width).toBe(16);
  });

  it('measures Korean characters as wide', () => {
    const width = measure('한글', baseInput);
    expect(width).toBe(32); // 2 chars * fontSize
  });

  it('measures Japanese Katakana as wide', () => {
    const width = measure('ア', baseInput);
    expect(width).toBe(16);
  });

  it('measures CJK Unified Ideograph as wide', () => {
    const width = measure('中', baseInput);
    expect(width).toBe(16);
  });

  it('scales with fontSize', () => {
    const small = measure('hello', { ...baseInput, fontSize: 10 });
    const large = measure('hello', { ...baseInput, fontSize: 20 });
    expect(large).toBe(small * 2);
  });

  it('adds letter spacing between characters', () => {
    const without = measure('abc', baseInput);
    const withSpacing = measure('abc', { ...baseInput, letterSpacing: 2 });
    // 3 chars, 2 gaps => +4px
    expect(withSpacing).toBe(without + 4);
  });

  it('does not add letter spacing for single character', () => {
    const without = measure('a', baseInput);
    const withSpacing = measure('a', { ...baseInput, letterSpacing: 2 });
    expect(withSpacing).toBe(without);
  });

  it('handles mixed content', () => {
    const width = measure('Hi 가', baseInput);
    // H: 0.55*16, i: 0.35*16, space: 0.3*16, 가: 1.0*16
    const expected = 16 * (0.55 + 0.35 + 0.3 + 1.0);
    expect(width).toBeCloseTo(expected, 5);
  });
});
