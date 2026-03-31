---
sidebar_position: 2
title: How It Works
---

# How It Works

## The Problem

In React Native, you can't know a text component's height until after it renders. The common workarounds all have issues:

- **`onLayout` / `onTextLayout`** — fires after render, causing layout jumps
- **Hidden render pass** — renders offscreen first just to measure, wasting a frame
- **Hardcoded estimates** — breaks with dynamic content, different fonts, or locales

This makes `FlatList`'s `getItemLayout` impossible to implement correctly, hurts virtualization performance, and causes visible UI flicker.

## The Solution

pretext-native bypasses the React Native rendering pipeline entirely and talks directly to the native text engine.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Your Text  │ ──▶ │  Native Engine   │ ──▶ │   Result    │
│  + Style    │     │  iOS: CoreText   │     │  height     │
│  + Width    │     │  Android: Static │     │  lineCount  │
│             │     │    Layout        │     │  lines[]    │
│             │     │  JS: Heuristic   │     │  truncated  │
└─────────────┘     └──────────────────┘     └─────────────┘
```

### iOS — CoreText

On iOS, we use `CTFramesetter` from CoreText. This is the same low-level typesetting engine that UIKit's `UILabel` and React Native's `RCTTextView` use internally. Our implementation is thread-safe with no UIKit dependency, so it can run on any thread.

### Android — StaticLayout

On Android, we use `StaticLayout`, which is the exact same class React Native uses for text measurement. We configure it with the same parameters (font, size, line height, letter spacing) to produce identical results.

### JS Fallback

When native modules aren't available (testing, SSR, or Expo Go without dev client), a heuristic engine estimates text dimensions using character-width tables. It's not pixel-perfect but handles most use cases reasonably well.

## Caching

pretext-native uses a two-tier LRU cache:

1. **Word cache** — caches the measured width of individual words/tokens. Since the same words appear repeatedly across different texts, this provides significant speedup.

2. **Layout cache** — caches the full layout result (height, lines, truncation) keyed by the complete input parameters. If you measure the same text with the same config twice, the second call is a direct cache hit.

### Performance

- **Cold** (first measurement): ~0.1ms per text
- **Warm** (cache hit): ~0.001ms per text (2–5M ops/s)
- **Hit rate**: 95%+ on real-world chat/feed data

## Architecture

```
pretext-native (React Native package)
├── useTextLayout()          — React hook
├── measureTextSync()        — Sync via JSI
├── measureText()            — Async via native bridge
├── measureTextBatch()       — Batch measurement
└── prewarmCache()           — Pre-fill cache

@hexdrinker/pretext-native-core (platform-independent)
├── tokenizer                — word/CJK/emoji tokenization
├── lineBreaker              — line breaking algorithm
├── layoutCalc               — height/line calculation
└── cache                    — two-tier LRU cache
```

The core layout engine is a separate package (`@hexdrinker/pretext-native-core`) that has no React Native dependency. It receives a `measureFunc` adapter that provides word-width measurement — from native on device, or from the JS heuristic in tests.
