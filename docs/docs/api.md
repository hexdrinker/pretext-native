---
sidebar_position: 3
title: API — pretext-native
---

# API Reference — pretext-native

## `useTextLayout(options)`

React hook for pre-render text measurement. Runs synchronously via JSI when native is available, falls back to async.

### Options

| Option | Type | Required | Description |
|---|---|---|---|
| `text` | `string` | Yes | Text to measure |
| `width` | `number` | Yes | Container width in pixels |
| `fontSize` | `number` | Yes | Font size in pixels |
| `fontFamily` | `string` | No | Font family name |
| `fontWeight` | `string` | No | `"100"`–`"900"`, `"bold"`, or `"normal"` |
| `lineHeight` | `number` | No | Line height in pixels |
| `letterSpacing` | `number` | No | Letter spacing in pixels |
| `maxLines` | `number` | No | Truncate after this many lines |
| `enabled` | `boolean` | No | Set `false` to skip measurement (default: `true`) |

### Returns `UseTextLayoutResult`

| Property | Type | Description |
|---|---|---|
| `height` | `number` | Computed text height in pixels |
| `lineCount` | `number` | Number of lines after wrapping |
| `isTruncated` | `boolean` | `true` if text was cut by `maxLines` |
| `result` | `TextMeasureResult \| null` | Full result including line-by-line data |
| `isLoading` | `boolean` | `true` while async measurement is in progress |
| `error` | `Error \| null` | Set if measurement failed |

### Example

```tsx
import { useTextLayout } from 'pretext-native';

function MyComponent({ text }) {
  const { height, lineCount, isTruncated } = useTextLayout({
    text,
    width: 300,
    fontSize: 15,
    lineHeight: 22,
    maxLines: 3,
  });

  return (
    <View style={{ height }}>
      <Text numberOfLines={3}>{text}</Text>
      {isTruncated && <Text>Show More</Text>}
    </View>
  );
}
```

---

## `measureTextSync(input)`

Synchronous measurement. Uses native JSI when available, falls back to the JS heuristic engine.

Safe to call in `getItemLayout` or render functions.

```tsx
import { measureTextSync } from 'pretext-native';

const result = measureTextSync({
  text: 'Hello, world!',
  width: 300,
  fontSize: 14,
});

console.log(result.height, result.lineCount);
```

---

## `measureText(input)`

Async measurement. Runs on a background thread when using native modules, avoiding JS thread blocking.

```tsx
import { measureText } from 'pretext-native';

const result = await measureText({
  text: longText,
  width: 300,
  fontSize: 14,
  lineHeight: 20,
});
```

---

## `measureTextBatch(inputs)`

Measure multiple texts in a single native call. More efficient than calling `measureText` in a loop.

```tsx
import { measureTextBatch } from 'pretext-native';

const results = await measureTextBatch(
  messages.map((msg) => ({
    text: msg.body,
    width: 300,
    fontSize: 14,
    lineHeight: 20,
  }))
);
```

---

## `prewarmCache(inputs)`

Same as `measureTextBatch` but discards the results — just fills the cache. Call this during data fetch so results are instant when the list renders.

```tsx
import { prewarmCache } from 'pretext-native';

// During data fetch
await prewarmCache(
  messages.map((msg) => ({
    text: msg.body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  }))
);
```

---

## `clearCache()`

Clears both the JS-tier and native-tier LRU caches.

```tsx
import { clearCache } from 'pretext-native';

clearCache();
```

---

## `getCacheStats()`

Returns current cache statistics.

```tsx
import { getCacheStats } from 'pretext-native';

const stats = getCacheStats();
// { hits, misses, wordEntries, layoutEntries }
```

---

## `isNativeAvailable()`

Returns `true` if the native TurboModule is loaded. When `false`, all APIs fall back to the JS heuristic engine.

```tsx
import { isNativeAvailable } from 'pretext-native';

if (isNativeAvailable()) {
  console.log('Using native text measurement');
}
```

---

## `getFontMetrics(options)`

Get font metrics (ascender, descender, line height) for a given font configuration.

```tsx
import { getFontMetrics } from 'pretext-native';

const metrics = await getFontMetrics({
  fontSize: 16,
  fontFamily: 'System',
});
```

---

## Types

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

### `LineInfo`

```typescript
interface LineInfo {
  text: string;
  width: number;
  height: number;
  y: number;
}
```
