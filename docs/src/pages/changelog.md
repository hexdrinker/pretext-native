# Changelog

## [0.0.1] - 2026-03-31

Initial release.

### Added
- Text layout engine (tokenizer, line breaker, layout calculator)
- iOS native module (CoreText) and Android native module (StaticLayout)
- TurboModule (New Architecture) + legacy bridge support
- `measureTextSync`, `measureText`, `measureTextBatch` APIs
- `useTextLayout` React hook
- Two-tier LRU cache with 95%+ hit rate
- CJK and emoji support
- JS heuristic fallback
- Example app with 11 demo screens
