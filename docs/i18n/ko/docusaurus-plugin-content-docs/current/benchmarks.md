---
sidebar_position: 3
title: 벤치마크
---

# 벤치마크

## JS 레이아웃 엔진 성능

JS 휴리스틱 레이아웃 엔진(`@hexdrinker/pretext-native-core`)에서 측정한 결과입니다. 네이티브 측정(iOS CoreText / Android StaticLayout)은 JS 토크나이징을 건너뛰므로 더 빠릅니다.

| 시나리오 | Cold | Warm (캐시) |
|---------|------|------------|
| 짧은 텍스트 (13자) | 815K ops/s | 5.8M ops/s |
| 중간 텍스트 (180자) | 112K ops/s | 2.3M ops/s |
| 긴 텍스트 (1.2K자) | 17K ops/s | 503K ops/s |
| CJK 텍스트 (120자) | 159K ops/s | 2.7M ops/s |

캐시 워밍 후 **2–5M ops/s** — 60fps 기준 한 프레임 안에 수천 개 아이템을 측정할 수 있는 속도입니다.

### 재현 방법

```bash
cd packages/core && npx ts-node benchmark/run.ts
```

하드웨어에 따라 결과가 달라집니다. 위 수치는 Apple M 시리즈에서 측정되었습니다.

## 기능 비교

| | `onLayout` | `react-native-text-size` | **pretext-native** |
|---|---|---|---|
| 렌더 전 측정 | X | O | **O** |
| 동기 API (JSI) | X | X | **O** |
| `getItemLayout` 지원 | X | 수동 구현 | **내장** |
| 캐시 내장 | 해당 없음 | X | **O (95%+ 히트율)** |
| `allowFontScaling` | 해당 없음 | O | **O** |
| 커스텀 폰트 검증 | 해당 없음 | X | **O (`isFontAvailable`)** |
| TurboModule (New Arch) | 해당 없음 | X | **O** |
| 패키지 크기 | 0 (내장) | 167KB | **13KB (core) + 120KB** |
| 런타임 의존성 | 해당 없음 | 0 | **0** |

### 검증 방법

- **패키지 크기**: 각 패키지의 `npm pack` 출력
- **react-native-text-size**: `npm info react-native-text-size` 및 [GitHub README](https://github.com/aMarCruz/react-native-text-size)에서 API/기능 확인
- **벤치마크**: `cd packages/core && npx ts-node benchmark/run.ts`

모든 수치는 재현 가능합니다. 부정확한 내용이 있다면 [이슈를 열어주세요](https://github.com/hexdrinker/pretext-native/issues).
