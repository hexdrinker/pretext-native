import { tokenize } from '../src/tokenizer';
import type { Token } from '../src/types';

const texts = (tokens: Token[]) => tokens.map((t) => t.text);
const types = (tokens: Token[]) => tokens.map((t) => t.type);

describe('tokenizer', () => {
  it('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('tokenizes a single word', () => {
    const tokens = tokenize('hello');
    expect(texts(tokens)).toEqual(['hello']);
    expect(types(tokens)).toEqual(['word']);
  });

  it('tokenizes words separated by spaces', () => {
    const tokens = tokenize('hello world');
    expect(texts(tokens)).toEqual(['hello', ' ', 'world']);
    expect(types(tokens)).toEqual(['word', 'space', 'word']);
  });

  it('tokenizes multiple spaces', () => {
    const tokens = tokenize('hello   world');
    expect(texts(tokens)).toEqual(['hello', '   ', 'world']);
    expect(types(tokens)).toEqual(['word', 'space', 'word']);
  });

  it('handles newlines as mandatory-break tokens', () => {
    const tokens = tokenize('line1\nline2');
    expect(texts(tokens)).toEqual(['line1', '\n', 'line2']);
    expect(types(tokens)).toEqual(['word', 'mandatory-break', 'word']);
  });

  it('handles multiple newlines', () => {
    const tokens = tokenize('a\n\nb');
    expect(types(tokens)).toEqual(['word', 'mandatory-break', 'mandatory-break', 'word']);
  });

  it('handles trailing newline', () => {
    const tokens = tokenize('hello\n');
    expect(texts(tokens)).toEqual(['hello', '\n']);
    expect(types(tokens)).toEqual(['word', 'mandatory-break']);
  });

  it('handles leading newline', () => {
    const tokens = tokenize('\nhello');
    expect(texts(tokens)).toEqual(['\n', 'hello']);
    expect(types(tokens)).toEqual(['mandatory-break', 'word']);
  });

  it('tokenizes CJK characters individually', () => {
    const tokens = tokenize('你好世界');
    expect(texts(tokens)).toEqual(['你', '好', '世', '界']);
    expect(types(tokens)).toEqual(['word', 'word', 'word', 'word']);
  });

  it('tokenizes mixed CJK and Latin text', () => {
    const tokens = tokenize('hello你好world');
    expect(texts(tokens)).toEqual(['hello', '你', '好', 'world']);
    expect(types(tokens)).toEqual(['word', 'word', 'word', 'word']);
  });

  it('handles Korean (Hangul)', () => {
    const tokens = tokenize('안녕하세요');
    expect(texts(tokens)).toEqual(['안', '녕', '하', '세', '요']);
    expect(types(tokens)).toEqual(['word', 'word', 'word', 'word', 'word']);
  });

  it('handles Japanese hiragana/katakana', () => {
    const tokens = tokenize('こんにちは');
    expect(texts(tokens)).toEqual(['こ', 'ん', 'に', 'ち', 'は']);
    expect(types(tokens)).toEqual(['word', 'word', 'word', 'word', 'word']);
  });

  it('handles zero-width spaces', () => {
    const tokens = tokenize('hello\u200Bworld');
    expect(texts(tokens)).toEqual(['hello', '\u200B', 'world']);
    expect(types(tokens)).toEqual(['word', 'zero-width-space', 'word']);
  });

  it('handles non-breaking spaces as regular spaces', () => {
    const tokens = tokenize('hello\u00A0world');
    expect(texts(tokens)).toEqual(['hello', '\u00A0', 'world']);
    expect(types(tokens)).toEqual(['word', 'space', 'word']);
  });

  it('handles complex mixed content', () => {
    const tokens = tokenize('Hello 你好\nWorld');
    expect(texts(tokens)).toEqual(['Hello', ' ', '你', '好', '\n', 'World']);
    expect(types(tokens)).toEqual([
      'word',
      'space',
      'word',
      'word',
      'mandatory-break',
      'word',
    ]);
  });

  it('initializes token widths to 0', () => {
    const tokens = tokenize('hello world');
    for (const token of tokens) {
      expect(token.width).toBe(0);
    }
  });
});
