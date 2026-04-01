---
title: Changelog
---

# Changelog

## [0.0.2] - 2026-04-01

### Added
- `allowFontScaling` option — automatically applies system font scale (`PixelRatio.getFontScale()`) to fontSize and lineHeight, matching React Native's `<Text>` behavior. Defaults to `true`.
- `isFontAvailable(fontFamily)` API — check if a custom font is registered on the device before measurement.
- Warning logs when a custom font is not found (iOS: `RCTLogWarn`, Android: `Log.w`). Previously fell back to system font silently.
- Obstacle Text Demo with real-time stats panel (FPS, reflow time, line count, measure count).
- Pretendard Regular/Bold font in example app with custom font comparison demo.

### Fixed
- iOS crash when measuring empty text — `ctLines` array was empty but accessed at index 0.
- React dual-instance error — deduplicated React across monorepo workspaces via `resolutions`.
- Metro module resolution — added `react-native` and `source` entry points to package.json.
- Frame-rate-dependent ball speed in ObstacleTextDemo — now uses delta time (120px/s).
- CI stability — eslint configs, turbo filters, docs workspace separation, Jest passWithNoTests.

### Changed
- README simplified with reference to original [pretext](https://github.com/chenglou/pretext).

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
