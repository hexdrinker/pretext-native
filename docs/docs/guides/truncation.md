---
sidebar_position: 3
title: Truncation & Show More
---

# Truncation & "Show More"

A common UI pattern: show a preview of long text with a "Show More" button. pretext-native lets you know if text will be truncated **before rendering**, so you can conditionally show the button without a hidden render pass.

## Basic Example

```tsx
import { useState } from 'react';
import { useTextLayout } from 'pretext-native';

const MAX_LINES = 3;

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);

  const { height, isTruncated } = useTextLayout({
    text,
    width: 300,
    fontSize: 14,
    lineHeight: 20,
    maxLines: expanded ? undefined : MAX_LINES,
  });

  return (
    <View>
      <View style={{ height }}>
        <Text
          numberOfLines={expanded ? undefined : MAX_LINES}
          style={{ fontSize: 14, lineHeight: 20 }}
        >
          {text}
        </Text>
      </View>
      {isTruncated && !expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={{ color: '#007AFF', marginTop: 4 }}>Show More</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

## Card UI with Truncation Detection

```tsx
function ContentCard({ title, body }) {
  const { isTruncated } = useTextLayout({
    text: body,
    width: CARD_WIDTH - 32,
    fontSize: 14,
    lineHeight: 20,
    maxLines: 4,
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text numberOfLines={4} style={styles.body}>
        {body}
      </Text>
      {isTruncated && (
        <Text style={styles.readMore}>Read more</Text>
      )}
    </View>
  );
}
```

## Why Not Just Use `onTextLayout`?

The traditional approach:

```tsx
// ❌ This causes a layout flash
function BadExpandableText({ text }) {
  const [showButton, setShowButton] = useState(false);

  return (
    <View>
      <Text
        numberOfLines={3}
        onTextLayout={(e) => {
          // This fires AFTER render — the button appears a frame late
          setShowButton(e.nativeEvent.lines.length > 3);
        }}
      >
        {text}
      </Text>
      {showButton && <Text>Show More</Text>}
    </View>
  );
}
```

Problems:
1. The "Show More" button appears a frame after the text renders
2. In a list, this causes every item to re-render and shift
3. `onTextLayout` only tells you about the truncated lines, not the full text

With pretext-native, the height and truncation info are available **before the first render**, so the UI is correct from frame one.
