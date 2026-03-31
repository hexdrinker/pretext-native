import { computeLayout } from '../src/layoutEngine';
import { LayoutCache } from '../src/cache';
import type { TextMeasureInput, MeasureFunc } from '../src/types';

/**
 * Mock measure function: fixed-width font simulation.
 * Each character is 8px wide, letterSpacing adds per-character.
 */
const fixedWidthMeasure: MeasureFunc = (text, input) => {
  const charWidth = 8;
  const spacing = input.letterSpacing ?? 0;
  return text.length * charWidth + Math.max(0, text.length - 1) * spacing;
};

describe('computeLayout', () => {
  it('computes single-line layout', () => {
    const input: TextMeasureInput = {
      text: 'hello',
      width: 200,
      fontSize: 16,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(1);
    expect(result.lines).toEqual(['hello']);
    expect(result.truncated).toBe(false);
    // height = 1 line * (16 * 1.3) = 20.8
    expect(result.height).toBeCloseTo(20.8);
  });

  it('computes multi-line layout', () => {
    // "hello world" with fixed width: hello=40, space=8, world=40
    // Total = 88, container = 60 → wraps
    const input: TextMeasureInput = {
      text: 'hello world',
      width: 60,
      fontSize: 16,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(2);
    expect(result.lines).toEqual(['hello', 'world']);
    expect(result.truncated).toBe(false);
  });

  it('uses explicit lineHeight for height calculation', () => {
    const input: TextMeasureInput = {
      text: 'hello world',
      width: 60,
      fontSize: 16,
      lineHeight: 24,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(2);
    expect(result.height).toBe(48); // 2 * 24
  });

  it('handles mandatory line breaks', () => {
    const input: TextMeasureInput = {
      text: 'line1\nline2\nline3',
      width: 200,
      fontSize: 16,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(3);
    expect(result.lines).toEqual(['line1', 'line2', 'line3']);
  });

  it('handles empty text', () => {
    const input: TextMeasureInput = {
      text: '',
      width: 200,
      fontSize: 16,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(1);
    expect(result.lines).toEqual(['']);
    expect(result.truncated).toBe(false);
  });

  it('truncates with maxLines', () => {
    const input: TextMeasureInput = {
      text: 'line1\nline2\nline3\nline4',
      width: 200,
      fontSize: 16,
      lineHeight: 20,
      maxLines: 2,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(2);
    expect(result.truncated).toBe(true);
    expect(result.height).toBe(40); // 2 * 20
    // Last line should end with ellipsis
    expect(result.lines[1]).toContain('\u2026');
  });

  it('does not truncate when lines fit within maxLines', () => {
    const input: TextMeasureInput = {
      text: 'hello\nworld',
      width: 200,
      fontSize: 16,
      maxLines: 5,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(2);
    expect(result.truncated).toBe(false);
  });

  it('handles CJK text wrapping', () => {
    // Each CJK char tokenized individually, each 8px wide
    // Container 30px: fits 3 chars per line
    const input: TextMeasureInput = {
      text: '你好世界测试',
      width: 30,
      fontSize: 16,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    // 6 chars, 3 per line = 2 lines
    expect(result.lineCount).toBe(2);
  });

  it('uses cache for repeated computations', () => {
    const cache = new LayoutCache();
    const measureSpy = jest.fn(fixedWidthMeasure);

    const input: TextMeasureInput = {
      text: 'hello world',
      width: 200,
      fontSize: 16,
    };

    // First call: measures text
    const result1 = computeLayout(input, measureSpy, cache);
    const callCount = measureSpy.mock.calls.length;
    expect(callCount).toBeGreaterThan(0);

    // Second call: should hit layout cache (no additional measure calls)
    const result2 = computeLayout(input, measureSpy, cache);
    expect(measureSpy.mock.calls.length).toBe(callCount);
    expect(result2).toEqual(result1);

    // Verify cache stats
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
  });

  it('applies letterSpacing', () => {
    const input: TextMeasureInput = {
      text: 'hi',
      width: 200,
      fontSize: 16,
      letterSpacing: 2,
    };
    const result = computeLayout(input, fixedWidthMeasure);
    expect(result.lineCount).toBe(1);
    expect(result.lines).toEqual(['hi']);
  });
});
