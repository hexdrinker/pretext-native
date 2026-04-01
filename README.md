[![npm version](https://img.shields.io/npm/v/pretext-native.svg)](https://www.npmjs.com/package/pretext-native)
[![CI](https://github.com/hexdrinker/pretext-native/actions/workflows/ci.yml/badge.svg)](https://github.com/hexdrinker/pretext-native/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)

# pretext-native

React Native port of [pretext](https://github.com/chenglou/pretext) — measure text height and line breaks **before rendering**.

[한국어](./README.ko.md) · [Documentation](https://hexdrinker.github.io/pretext-native/)

## The Problem

In React Native, you can't know a text component's height until after it renders. The common workarounds are:

- `onLayout` / `onTextLayout` — fires after render, causing **layout jumps**
- Hidden render pass — renders offscreen first just to measure, **wasting a frame**
- Hardcoded estimates — breaks with dynamic content, different fonts, or locales

This makes `FlatList`'s `getItemLayout` impossible to implement correctly and causes visible UI flicker.

## The Solution

pretext-native talks directly to each platform's native text engine (iOS CoreText, Android StaticLayout) via JSI — no rendering required. A two-tier LRU cache delivers 95%+ hit rate and 2–5M ops/s on warm lookups.

```
Traditional (onLayout):
  Render (height unknown) → onLayout fires → Re-render with correct height
  = 2 render passes, visible layout jump

pretext-native:
  Measure → Render (height known)
  = 1 render pass, no jump
```

Fully compatible with React Native's New Architecture (Fabric + TurboModule).

## Quick Start

```bash
yarn add pretext-native
# iOS only
cd ios && pod install
```

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

[Full setup guide →](https://hexdrinker.github.io/pretext-native/docs/getting-started)

## Feature Comparison

| | `onLayout` | `react-native-text-size` | **pretext-native** |
|---|---|---|---|
| Pre-render measurement | No | Yes | **Yes** |
| Synchronous API (JSI) | No | No | **Yes** |
| `getItemLayout` support | No | Manual | **Built-in** |
| Built-in cache | N/A | No | **Yes (95%+ hit rate)** |
| `allowFontScaling` | N/A | Yes | **Yes** |
| Custom font validation | N/A | No | **Yes (`isFontAvailable`)** |
| TurboModule (New Arch) | N/A | No | **Yes** |
| Package size | 0 (built-in) | 167KB | **13KB (core) + 120KB** |
| Runtime dependencies | N/A | 0 | **0** |

## Benchmarks

| Scenario | Cold | Warm (cached) |
|----------|------|---------------|
| Short text (13 chars) | 815K ops/s | 5.8M ops/s |
| Medium text (180 chars) | 112K ops/s | 2.3M ops/s |
| Long text (1.2K chars) | 17K ops/s | 503K ops/s |
| CJK text (120 chars) | 159K ops/s | 2.7M ops/s |

[Methodology & reproduction →](https://hexdrinker.github.io/pretext-native/docs/benchmarks)

## API

```ts
// React hook — sync via JSI, async fallback
useTextLayout(options): UseTextLayoutResult

// Direct measurement
measureTextSync(input): TextMeasureResult
measureText(input): Promise<TextMeasureResult>
measureTextBatch(inputs): Promise<TextMeasureResult[]>

// Cache management
prewarmCache(inputs): Promise<void>
clearCache(): void

// Utilities
isNativeAvailable(): boolean
isFontAvailable(fontFamily): boolean
```

[Full API reference →](https://hexdrinker.github.io/pretext-native/docs/api)

## Guides

- [FlatList `getItemLayout`](https://hexdrinker.github.io/pretext-native/docs/guides/flatlist) — pre-calculate item heights for smooth scrolling
- [Chat bubbles](https://hexdrinker.github.io/pretext-native/docs/guides/chat) — single-line width optimization and message list pre-warming
- [Truncation / "Show More"](https://hexdrinker.github.io/pretext-native/docs/guides/truncation) — detect overflow without rendering

## Example App

The [example app](./example) includes 6 demo screens: basic measurement, dynamic width, speed benchmark, FlatList integration, chat bubbles, and "Show More" truncation.

```bash
cd example && yarn install
cd ios && bundle install && bundle exec pod install && cd ..
yarn ios   # or yarn android
```

## Limitations

- Measures single-style text blocks only (no mixed inline styles or inline images)
- JS fallback is heuristic-based, not pixel-perfect — use native modules for production accuracy
- API is at v0.0.2 — core APIs are stable, secondary APIs may evolve before v1.0

[Full details →](https://hexdrinker.github.io/pretext-native/docs/limitations)

## Platforms

- iOS 13+
- Android API 21+
- React Native 0.71+ (New Architecture & Legacy Bridge)

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a pull request.

## License

[MIT](./LICENSE)
