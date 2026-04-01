---
sidebar_position: 4
title: API — Core Engine
---

# API Reference — @hexdrinker/pretext-native-core

The core layout engine is a platform-independent package that handles tokenization, line breaking, and layout calculation. It has no React Native dependency and can be used in any JavaScript environment.

## `computeLayout(input, measureFunc, cache?)`

Compute text layout given an input, a measurement function, and an optional cache.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `input` | `TextMeasureInput` | Text and style parameters |
| `measureFunc` | `MeasureFunc` | Function that measures word width |
| `cache` | `LayoutCache` | Optional cache instance |

### Returns `TextMeasureResult`

```typescript
import { computeLayout } from '@hexdrinker/pretext-native-core';

const result = computeLayout(
  { text: 'Hello, world!', width: 300, fontSize: 14 },
  measureFunc
);
```

---

## `LayoutCache`

Two-tier LRU cache for word measurements and layout results.

### Constructor

```typescript
const cache = new LayoutCache(maxWordEntries?, maxLayoutEntries?);
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `maxWordEntries` | `number` | 2000 | Max word-level cache entries |
| `maxLayoutEntries` | `number` | 500 | Max layout-level cache entries |

### Methods

#### `getStats()`

```typescript
const stats = cache.getStats();
// { hits: number, misses: number, wordEntries: number, layoutEntries: number }
```

#### `clear()`

```typescript
cache.clear();
```

---

## `tokenize(text)`

Split text into tokens (words, whitespace, CJK characters, emoji).

```typescript
import { tokenize } from '@hexdrinker/pretext-native-core';

const tokens = tokenize('Hello 안녕하세요 🎉');
// ['Hello', ' ', '안', '녕', '하', '세', '요', ' ', '🎉']
```

---

## `breakLines(tokens, widths, maxWidth)`

Given tokens and their measured widths, determine line breaks.

```typescript
import { breakLines } from '@hexdrinker/pretext-native-core';

const lines = breakLines(tokens, measuredWidths, 300);
```

---

## Types

### `MeasureFunc`

```typescript
type MeasureFunc = (text: string, fontSize: number) => number;
```

A function that returns the pixel width of a given string at a given font size. On device, this is backed by CoreText/StaticLayout. In tests, you can provide a mock or the JS heuristic adapter.

### `TextMeasureInput`

```typescript
interface TextMeasureInput {
  text: string;
  width: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  maxLines?: number;
  allowFontScaling?: boolean;
}
```

### `TextMeasureResult`

```typescript
interface TextMeasureResult {
  height: number;
  lineCount: number;
  lines: LineInfo[];
  truncated: boolean;
}
```
