import { breakLines, lineToString } from '../src/lineBreaker';
import type { Token } from '../src/types';

/** Helper: create a word token with a given width */
function word(text: string, width: number): Token {
  return { type: 'word', text, width };
}

/** Helper: create a space token */
function space(width: number): Token {
  return { type: 'space', text: ' ', width };
}

/** Helper: create a mandatory-break token */
function br(): Token {
  return { type: 'mandatory-break', text: '\n', width: 0 };
}

const linesToStrings = (lines: Token[][]) => lines.map(lineToString);

describe('breakLines', () => {
  it('returns one empty line for empty tokens', () => {
    expect(breakLines([], 100)).toEqual([[]]);
  });

  it('places a single word on one line', () => {
    const tokens = [word('hello', 50)];
    const lines = breakLines(tokens, 100);
    expect(linesToStrings(lines)).toEqual(['hello']);
  });

  it('places multiple words that fit on one line', () => {
    const tokens = [word('hello', 40), space(10), word('world', 40)];
    const lines = breakLines(tokens, 100);
    expect(linesToStrings(lines)).toEqual(['hello world']);
  });

  it('breaks line when word does not fit', () => {
    const tokens = [word('hello', 60), space(10), word('world', 60)];
    const lines = breakLines(tokens, 100);
    expect(linesToStrings(lines)).toEqual(['hello', 'world']);
  });

  it('handles mandatory breaks', () => {
    const tokens = [word('line1', 40), br(), word('line2', 40)];
    const lines = breakLines(tokens, 100);
    expect(linesToStrings(lines)).toEqual(['line1', 'line2']);
  });

  it('handles multiple mandatory breaks (empty lines)', () => {
    const tokens = [word('a', 10), br(), br(), word('b', 10)];
    const lines = breakLines(tokens, 100);
    expect(lines).toHaveLength(3);
    expect(linesToStrings(lines)).toEqual(['a', '', 'b']);
  });

  it('allows a word wider than container on its own line', () => {
    const tokens = [word('superlongword', 200)];
    const lines = breakLines(tokens, 100);
    expect(linesToStrings(lines)).toEqual(['superlongword']);
  });

  it('trims trailing spaces when breaking', () => {
    const tokens = [word('hello', 80), space(10), space(10), word('world', 80)];
    const lines = breakLines(tokens, 100);
    // 'hello' is on line 1, trailing spaces should be trimmed
    expect(linesToStrings(lines)).toEqual(['hello', 'world']);
  });

  it('handles many words wrapping across multiple lines', () => {
    // Each word is 30px, space is 10px, container is 100px
    // "a b c d" => "a b c" (30+10+30+10+30=110 > 100 => "a b" fits at 70, then "c d")
    const tokens = [
      word('a', 30),
      space(10),
      word('b', 30),
      space(10),
      word('c', 30),
      space(10),
      word('d', 30),
    ];
    const lines = breakLines(tokens, 80);
    // "a b" = 70 fits in 80, "c d" = 70 fits in 80
    expect(linesToStrings(lines)).toEqual(['a b', 'c d']);
  });

  it('handles CJK-like single-character tokens', () => {
    // Each character is 16px wide, container is 50px
    const tokens = [
      word('你', 16),
      word('好', 16),
      word('世', 16),
      word('界', 16),
    ];
    const lines = breakLines(tokens, 50);
    // 你好世 = 48 fits, 界 on next line
    expect(linesToStrings(lines)).toEqual(['你好世', '界']);
  });
});
