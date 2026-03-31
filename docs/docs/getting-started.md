---
sidebar_position: 1
slug: /getting-started
title: Getting Started
---

# Getting Started

pretext-native lets you measure text height and line breaks **before rendering** in React Native.

## Installation

```bash
yarn add pretext-native
# or
npm install pretext-native
```

### iOS

```bash
cd ios && pod install
```

### Android

No additional setup needed.

## Requirements

- React Native 0.71+
- iOS 13+
- Android API 21+
- Supports both **New Architecture** (TurboModules) and **Legacy Bridge**

## Quick Example

```tsx
import { useTextLayout } from 'pretext-native';

function ChatBubble({ text }) {
  const { height, lineCount, isTruncated } = useTextLayout({
    text,
    width: 280,
    fontSize: 15,
    lineHeight: 22,
    maxLines: 5,
  });

  return (
    <View style={{ height }}>
      <Text numberOfLines={5} style={{ fontSize: 15, lineHeight: 22 }}>
        {text}
      </Text>
    </View>
  );
}
```

## How It Works

pretext-native talks directly to the platform's native text engine — the same one React Native uses internally:

- **iOS**: CoreText (`CTFramesetter`) — thread-safe, no UIKit dependency
- **Android**: `StaticLayout` — the exact engine React Native uses
- **JS Fallback**: Heuristic character-width estimation (for testing/SSR)

Results are cached with a two-tier LRU cache (word-level + layout-level), achieving 95%+ hit rate on real-world data.

## Next Steps

- [API Reference](/docs/api) — full API documentation
- [FlatList Guide](/docs/guides/flatlist) — use with `getItemLayout`
- [Chat Layout Guide](/docs/guides/chat) — pre-calculate message heights
- [Truncation Guide](/docs/guides/truncation) — detect "Show More" scenarios
