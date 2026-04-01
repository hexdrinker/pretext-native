# pretext-native

React Native port of [pretext](https://github.com/chenglou/pretext) — measure text height and line breaks **before rendering**.

[한국어](./README.ko.md)

## Why?

In React Native, you can't know a text component's height until after it renders. The common workarounds are:

- `onLayout` / `onTextLayout` — fires after render, causing **layout jumps**
- Hidden render pass — renders offscreen first just to measure, **wasting a frame**
- Hardcoded estimates — breaks with dynamic content, different fonts, or locales

This makes `FlatList`'s `getItemLayout` impossible to implement correctly, hurts virtualization performance, and causes visible UI flicker in chat, feed, and card layouts.

## How It Works

pretext-native talks directly to the same native text engine React Native uses internally — no rendering required.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Your Text  │ ──▶ │  Native Engine   │ ──▶ │   Result    │
│  + Style    │     │  iOS: CoreText   │     │  height     │
│  + Width    │     │  Android: Static │     │  lineCount  │
│             │     │    Layout        │     │  lines[]    │
│             │     │  JS: Heuristic   │     │  truncated  │
└─────────────┘     └──────────────────┘     └─────────────┘
```

- **iOS**: CoreText (`CTFramesetter`) — thread-safe, no UIKit dependency
- **Android**: `StaticLayout` — the exact engine React Native uses
- **JS Fallback**: Heuristic character-width estimation (for testing/SSR only)
- **Cache**: Two-tier LRU (word-level + layout-level). 95%+ hit rate on real-world data. Warm cache runs at 2–5M ops/s.

## Install

```bash
yarn add pretext-native
# iOS only
cd ios && pod install
```

## Usage

### Hook

```tsx
import { useTextLayout } from 'pretext-native'

const { height, lineCount, isTruncated } = useTextLayout({
  text,
  width: 320,
  fontSize: 15,
  lineHeight: 22,
  maxLines: 3,
})
```

### FlatList getItemLayout

```tsx
import { measureTextSync } from 'pretext-native'

const getItemLayout = (data, index) => {
  const { height } = measureTextSync({
    text: data[index].body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  })
  return { length: height + PADDING, offset: ..., index }
}
```

### Pre-warm cache before a large list

```tsx
import { prewarmCache } from 'pretext-native'

await prewarmCache(messages.map((msg) => ({
  text: msg.body,
  width: CONTENT_WIDTH,
  fontSize: 15,
  lineHeight: 22,
})))
```

## API

### `useTextLayout(options): UseTextLayoutResult`

React hook for pre-render text measurement. Runs synchronously via JSI when native is available, falls back to async.

**Options:**

| Option          | Type      | Required | Description                                           |
| --------------- | --------- | -------- | ----------------------------------------------------- |
| `text`          | `string`  | Yes      | Text to measure                                       |
| `width`         | `number`  | Yes      | Container width in pixels                             |
| `fontSize`      | `number`  | Yes      | Font size in pixels                                   |
| `fontFamily`    | `string`  | No       | Font family name                                      |
| `fontWeight`    | `string`  | No       | `"100"`–`"900"`, `"bold"`, or `"normal"`              |
| `lineHeight`    | `number`  | No       | Line height in pixels                                 |
| `letterSpacing` | `number`  | No       | Letter spacing in pixels                              |
| `maxLines`      | `number`  | No       | Truncate after this many lines                        |
| `allowFontScaling` | `boolean` | No    | Apply system font scale (default: `true`)             |
| `enabled`       | `boolean` | No       | Set `false` to skip measurement (default: `true`)     |

**Returns:**

| Property      | Type                        | Description                                   |
| ------------- | --------------------------- | --------------------------------------------- |
| `height`      | `number`                    | Computed text height in pixels                |
| `lineCount`   | `number`                    | Number of lines after wrapping                |
| `isTruncated` | `boolean`                   | `true` if text was cut by `maxLines`          |
| `result`      | `TextMeasureResult \| null` | Full result including line-by-line data       |
| `isLoading`   | `boolean`                   | `true` while async measurement is in progress |
| `error`       | `Error \| null`             | Set if measurement failed                     |

### `measureTextSync(input): TextMeasureResult`

Synchronous measurement. Uses native JSI when available, falls back to the JS heuristic engine. Safe to call in `getItemLayout` or render functions.

### `measureText(input): Promise<TextMeasureResult>`

Async measurement. Runs on a background thread when using native modules, avoiding any JS thread blocking.

### `measureTextBatch(inputs): Promise<TextMeasureResult[]>`

Measure multiple texts in a single native call. More efficient than calling `measureText` in a loop — use this for pre-warming before list render.

### `prewarmCache(inputs): Promise<void>`

Same as `measureTextBatch` but discards the results — just fills the cache. Call this during data fetch so results are instant when the list renders.

### `clearCache(): void`

Clears both the JS-tier and native-tier LRU caches.

### `isNativeAvailable(): boolean`

Returns `true` if the native TurboModule is loaded. When `false`, all APIs fall back to the JS heuristic engine.

### `isFontAvailable(fontFamily): boolean`

Check if a custom font is registered on the device. Useful for validating font names before measurement. Logs a warning if a font is not found during measurement.

## Platforms

- iOS 13+
- Android API 21+
- React Native 0.71+ (New Architecture & Legacy Bridge)

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a pull request.

## License

[MIT](./LICENSE)
