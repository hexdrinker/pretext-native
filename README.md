# pretext-native

> Pre-render text layout measurement for React Native — calculate line count, height, and line breaks **before rendering**.

[한국어](./README.ko.md)

## Why?

In React Native, knowing the actual height and line breaks of text requires rendering it first (`onLayout`, `onTextLayout`). This causes:

- **Layout jumps** on initial render
- **Inefficient virtualization** in FlatList/FlashList
- **Hidden render passes** to measure text
- **Poor performance** in chat, feed, and card UIs

**pretext-native** solves this by measuring text layout off-screen using the platform's native text engine — the same one React Native uses internally.

## How It Works

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
- **Android**: `StaticLayout` — same engine React Native uses
- **JS Fallback**: Heuristic character-width estimation (for testing only)
- **Caching**: Two-tier LRU cache (word-level + layout-level) with 95%+ hit rate

## Installation

```bash
yarn add pretext-native
```

For iOS:

```bash
cd ios && pod install
```

## Quick Start

### `useTextLayout` Hook

```tsx
import { useTextLayout } from 'pretext-native'

function MessageBubble({ text, width }) {
  const { height, lineCount, isTruncated } = useTextLayout({
    text,
    width,
    fontSize: 15,
    lineHeight: 22,
    maxLines: 3,
  })

  return (
    <View style={{ height }}>
      <Text
        style={{ fontSize: 15, lineHeight: 22 }}
        numberOfLines={3}
      >
        {text}
      </Text>
    </View>
  )
}
```

### FlatList `getItemLayout`

```tsx
import { measureTextSync } from 'pretext-native';

const getItemLayout = (data, index) => {
  const item = data[index];
  const { height } = measureTextSync({
    text: item.body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  });

  return { length: height + PADDING, offset: /* cumulative */, index };
};

<FlatList data={messages} getItemLayout={getItemLayout} ... />
```

### Batch Pre-warming

```tsx
import { prewarmCache } from 'pretext-native'

// Pre-calculate before rendering a large list
await prewarmCache(
  messages.map((msg) => ({
    text: msg.body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  })),
)
```

## API Reference

### `useTextLayout(options): UseTextLayoutResult`

React hook for pre-render text measurement.

**Options** (`UseTextLayoutOptions`):

| Property        | Type      | Required | Description                                           |
| --------------- | --------- | -------- | ----------------------------------------------------- |
| `text`          | `string`  | Yes      | Text to measure                                       |
| `width`         | `number`  | Yes      | Container width in pixels                             |
| `fontSize`      | `number`  | Yes      | Font size in pixels                                   |
| `fontFamily`    | `string`  | No       | Font family name                                      |
| `fontWeight`    | `string`  | No       | Font weight (`"100"` - `"900"`, `"bold"`, `"normal"`) |
| `lineHeight`    | `number`  | No       | Line height in pixels                                 |
| `letterSpacing` | `number`  | No       | Letter spacing in pixels                              |
| `maxLines`      | `number`  | No       | Maximum number of lines                               |
| `enabled`       | `boolean` | No       | Set `false` to skip measurement (default: `true`)     |

**Returns** (`UseTextLayoutResult`):

| Property      | Type                        | Description                                   |
| ------------- | --------------------------- | --------------------------------------------- |
| `height`      | `number`                    | Computed text height (0 if not measured)      |
| `lineCount`   | `number`                    | Number of lines (0 if not measured)           |
| `isTruncated` | `boolean`                   | Whether text was truncated by `maxLines`      |
| `result`      | `TextMeasureResult \| null` | Full result object                            |
| `isLoading`   | `boolean`                   | `true` while async measurement is in progress |
| `error`       | `Error \| null`             | Error if measurement failed                   |

### `measureTextSync(input): TextMeasureResult`

Synchronous measurement. Uses native JSI when available, falls back to JS engine.

### `measureText(input): Promise<TextMeasureResult>`

Async measurement. Runs on a background thread when using native modules.

### `measureTextBatch(inputs): Promise<TextMeasureResult[]>`

Measure multiple texts at once. Efficient for pre-warming before list render.

### `prewarmCache(inputs): Promise<void>`

Pre-calculate and cache layout results for a set of inputs.

### `clearCache(): void`

Clear all caches (JS-tier and native-tier).

### `isNativeAvailable(): boolean`

Check if the native TurboModule is loaded.

## Performance

Benchmarked on Apple M-series (Node.js, JS engine only):

| Scenario                | Without Cache | With Cache (warm) |
| ----------------------- | ------------- | ----------------- |
| Short text (13 chars)   | 815K ops/s    | 5.8M ops/s        |
| Medium text (180 chars) | 112K ops/s    | 2.3M ops/s        |
| Long text (1.2K chars)  | 17K ops/s     | 503K ops/s        |
| CJK text (120 chars)    | 159K ops/s    | 2.7M ops/s        |

Cache hit rate with 50 unique texts across 1,000 lookups: **95%**

Native measurement is even faster as it bypasses JS tokenization entirely.

## Packages

| Package                                       | Description                                                 |
| --------------------------------------------- | ----------------------------------------------------------- |
| [`@pretext-native/core`](./packages/core)     | Platform-independent text layout engine (zero dependencies) |
| [`pretext-native`](./packages/pretext-native) | React Native wrapper with native modules                    |

## Architecture

```
pretext-native/
├── packages/
│   ├── core/                  # Pure TS engine (zero dependency)
│   │   ├── src/
│   │   │   ├── tokenizer.ts   # Text → tokens (word, space, CJK, break)
│   │   │   ├── lineBreaker.ts # Greedy line-break algorithm
│   │   │   ├── layoutEngine.ts# Orchestrator: tokenize → measure → break → truncate
│   │   │   ├── truncation.ts  # maxLines + ellipsis
│   │   │   ├── cache.ts       # Two-tier LRU cache
│   │   │   └── types.ts       # Shared type definitions
│   │   ├── __tests__/         # 48 unit tests
│   │   └── benchmark/         # Performance benchmarks
│   │
│   ├── pretext-native/        # React Native package
│   │   ├── src/
│   │   │   ├── measureText.ts # Sync/async/batch measurement APIs
│   │   │   ├── useTextLayout.ts # React hook (sync-first, async-fallback)
│   │   │   ├── jsAdapter.ts   # Heuristic JS fallback
│   │   │   └── NativePretextNative.ts # TurboModule codegen spec
│   │   ├── ios/               # CoreText-based native module
│   │   ├── android/           # StaticLayout-based native module
│   │   └── __tests__/         # 32 unit tests
│   │
│   └── example/               # Demo app
```

## Supported Platforms

- iOS 13+
- Android API 21+ (fine-grained font weight on API 28+)
- React Native 0.71+ (New Architecture & Legacy Bridge)

## License

[MIT](./LICENSE)
