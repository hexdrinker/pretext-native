---
sidebar_position: 3
title: Benchmarks
---

# Benchmarks

## JS Layout Engine Performance

Measured on the JS heuristic layout engine (`@hexdrinker/pretext-native-core`). Native measurement (iOS CoreText / Android StaticLayout) bypasses JS tokenization entirely and is faster.

| Scenario | Cold | Warm (cached) |
|----------|------|---------------|
| Short text (13 chars) | 815K ops/s | 5.8M ops/s |
| Medium text (180 chars) | 112K ops/s | 2.3M ops/s |
| Long text (1.2K chars) | 17K ops/s | 503K ops/s |
| CJK text (120 chars) | 159K ops/s | 2.7M ops/s |

Warm cache = **2–5M ops/s** — fast enough to measure thousands of items per frame at 60fps.

### How to Reproduce

```bash
cd packages/core && npx ts-node benchmark/run.ts
```

Results vary by hardware. Numbers above were measured on Apple M-series.

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

### How We Verified

- **Package size**: `npm pack` output for each package
- **react-native-text-size**: `npm info react-native-text-size` and [GitHub README](https://github.com/aMarCruz/react-native-text-size) for API/feature verification
- **Benchmark**: `cd packages/core && npx ts-node benchmark/run.ts`

All claims are reproducible. If you find any inaccuracy, please [open an issue](https://github.com/hexdrinker/pretext-native/issues).
