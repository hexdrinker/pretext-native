---
sidebar_position: 7
title: Limitations
---

# Limitations

pretext-native is designed for a specific set of text measurement use cases. This page documents what it doesn't cover and known constraints.

## What It Doesn't Support

- **Rich text / mixed styles** — Measurement assumes a single style per text block. Inline bold, italic, or mixed font sizes within one string are not handled.
- **Inline images or views** — Only plain text is measured. Embedded `<Image>` or custom inline views are not accounted for.
- **HTML / Markdown rendering** — Input must be plain strings. Markup is treated as literal text.
- **RTL layout** — Right-to-left text (Arabic, Hebrew) is not fully supported. Line breaking works, but bidi reordering is not implemented.

## JS Fallback Accuracy

When native modules are unavailable (testing, SSR, Expo Go without dev client), the JS heuristic engine estimates text dimensions using character-width tables. This is **not pixel-perfect** — expect ±5–10% variance compared to native measurement, especially with:

- Custom fonts (the JS engine uses generic width tables)
- Complex scripts (Thai, Devanagari, etc.)
- Very long words without break opportunities

For production accuracy, always use with native modules enabled.

## Platform Measurement Differences

iOS (CoreText) and Android (StaticLayout) may produce slightly different height/line results for the same input. This is inherent to each platform's text rendering engine, not a bug — React Native's own `<Text>` component has the same behavior.

## API Stability

pretext-native is at **v0.0.2**. The core API (`useTextLayout`, `measureTextSync`, `measureText`) is stable and unlikely to change, but secondary APIs may evolve before v1.0.

## When `onLayout` Is Better

If you need to measure text that includes:

- Mixed inline styles (`<Text>` nesting with different fontSize/fontWeight)
- Inline images or custom views
- Complex accessibility annotations

Then `onLayout` / `onTextLayout` is the right tool. pretext-native complements these APIs — it doesn't replace them in every scenario.
