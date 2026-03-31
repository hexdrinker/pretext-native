# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-03-31

### Added
- Core text layout engine with tokenizer, line breaker, and layout calculator
- iOS native module using CoreText for thread-safe text measurement
- Android native module using StaticLayout with Kotlin
- TurboModule support (New Architecture) with legacy bridge fallback
- Synchronous measurement via JSI (`measureTextSync`)
- Async measurement (`measureText`) and batch API (`measureTextBatch`)
- `useTextLayout` React hook with sync-first strategy
- Two-tier LRU cache (word-level + layout-level)
- CJK and emoji tokenization support
- Font metrics API (`getFontMetrics`)
- Cache management (`clearCache`, `getCacheStats`, `prewarmCache`)
- Pure-JS heuristic fallback when native module is unavailable
- Example app with 11 demo screens (Basic, Bubbles, Chat List, Accordion, Show More, Masonry, Truncation, Fonts, Dynamic Width, Batch, Benchmark)
- README in English and Korean
