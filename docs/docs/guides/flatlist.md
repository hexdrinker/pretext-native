---
sidebar_position: 1
title: FlatList Integration
---

# Using with FlatList

One of the most impactful use cases for pretext-native is implementing `getItemLayout` for `FlatList`. This eliminates scroll jumps and dramatically improves virtualization performance.

## The Problem

Without `getItemLayout`, `FlatList` doesn't know item heights in advance. This causes:

- Scroll bar jumping as items are measured
- Slow `scrollToIndex` (needs to render all items in between)
- Poor virtualization (can't accurately calculate which items are visible)

## Solution

Use `measureTextSync` in `getItemLayout` to calculate item heights synchronously:

```tsx
import { FlatList } from 'react-native';
import { measureTextSync } from 'pretext-native';

const CONTENT_WIDTH = Dimensions.get('window').width - 32; // padding
const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const VERTICAL_PADDING = 24;

function MessageList({ messages }) {
  const getItemLayout = useCallback(
    (data, index) => {
      const item = data[index];
      const { height } = measureTextSync({
        text: item.body,
        width: CONTENT_WIDTH,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });

      const itemHeight = height + VERTICAL_PADDING;

      return {
        length: itemHeight,
        offset: itemHeight * index, // simplified — see below for variable heights
        index,
      };
    },
    []
  );

  return (
    <FlatList
      data={messages}
      getItemLayout={getItemLayout}
      renderItem={({ item }) => <MessageItem message={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

## Pre-warming the Cache

For the best experience, pre-warm the cache when you fetch data:

```tsx
import { prewarmCache } from 'pretext-native';

async function fetchMessages() {
  const messages = await api.getMessages();

  // Pre-warm in the background while the list renders
  await prewarmCache(
    messages.map((msg) => ({
      text: msg.body,
      width: CONTENT_WIDTH,
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT,
    }))
  );

  return messages;
}
```

## Variable Heights with Offset Calculation

For variable-height items, you need to sum heights for the offset:

```tsx
const getItemLayout = useCallback(
  (data, index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const { height } = measureTextSync({
        text: data[i].body,
        width: CONTENT_WIDTH,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });
      offset += height + VERTICAL_PADDING;
    }

    const { height } = measureTextSync({
      text: data[index].body,
      width: CONTENT_WIDTH,
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT,
    });

    return {
      length: height + VERTICAL_PADDING,
      offset,
      index,
    };
  },
  []
);
```

This looks expensive, but with the warm cache (2–5M ops/s), summing 1000 items takes < 1ms.
