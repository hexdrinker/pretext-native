[![npm version](https://img.shields.io/npm/v/pretext-native.svg)](https://www.npmjs.com/package/pretext-native)
[![CI](https://github.com/hexdrinker/pretext-native/actions/workflows/ci.yml/badge.svg)](https://github.com/hexdrinker/pretext-native/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)

# pretext-native

[pretext](https://github.com/chenglou/pretext)의 React Native 포트 — 텍스트 높이와 줄바꿈을 **렌더링 전에** 계산합니다.

[English](./README.md) · [문서](https://hexdrinker.github.io/pretext-native/ko/)

## 문제

React Native에서는 텍스트 컴포넌트의 높이를 렌더링 전에 알 수 없습니다. 흔히 쓰는 우회 방법들은 모두 문제가 있습니다:

- `onLayout` / `onTextLayout` — 렌더링 이후에 실행되어 **레이아웃 점프** 발생
- 숨겨진 렌더 패스 — 측정을 위해 오프스크린 렌더링을 먼저 함, **프레임 낭비**
- 하드코딩 추정값 — 동적 콘텐츠, 다른 폰트, 다른 언어에서 틀림

그 결과 `FlatList`의 `getItemLayout`을 정확히 구현하기가 불가능하고, UI가 튀는 현상이 생깁니다.

## 해결책

pretext-native는 각 플랫폼의 네이티브 텍스트 엔진(iOS CoreText, Android StaticLayout)과 JSI를 통해 직접 통신합니다. 렌더링이 필요 없습니다. 2단 LRU 캐시가 95% 이상 히트율과 2–5M ops/s 성능을 제공합니다.

```
기존 (onLayout):
  렌더 (높이 모름) → onLayout 실행 → 올바른 높이로 재렌더
  = 2회 렌더, 레이아웃 점프 발생

pretext-native:
  측정 → 렌더 (높이 이미 앎)
  = 1회 렌더, 점프 없음
```

React Native New Architecture(Fabric + TurboModule)와 완전히 호환됩니다.

## 빠른 시작

```bash
yarn add pretext-native
# iOS만 해당
cd ios && pod install
```

```tsx
import { useTextLayout } from 'pretext-native'

const { height, lineCount, isTruncated } = useTextLayout({
  text,
  width: 320,
  fontSize: 15,
  lineHeight: 22,
  maxLines: 3,
})
```

[전체 설정 가이드 →](https://hexdrinker.github.io/pretext-native/ko/getting-started)

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

## 벤치마크

| 시나리오 | Cold | Warm (캐시) |
|---------|------|------------|
| 짧은 텍스트 (13자) | 815K ops/s | 5.8M ops/s |
| 중간 텍스트 (180자) | 112K ops/s | 2.3M ops/s |
| 긴 텍스트 (1.2K자) | 17K ops/s | 503K ops/s |
| CJK 텍스트 (120자) | 159K ops/s | 2.7M ops/s |

[측정 방법 및 재현 →](https://hexdrinker.github.io/pretext-native/ko/benchmarks)

## API

```ts
// React 훅 — JSI를 통한 동기, 비동기 폴백
useTextLayout(options): UseTextLayoutResult

// 직접 측정
measureTextSync(input): TextMeasureResult
measureText(input): Promise<TextMeasureResult>
measureTextBatch(inputs): Promise<TextMeasureResult[]>

// 캐시 관리
prewarmCache(inputs): Promise<void>
clearCache(): void

// 유틸리티
isNativeAvailable(): boolean
isFontAvailable(fontFamily): boolean
```

[전체 API 레퍼런스 →](https://hexdrinker.github.io/pretext-native/ko/api)

## 가이드

- [FlatList `getItemLayout`](https://hexdrinker.github.io/pretext-native/ko/guides/flatlist) — 부드러운 스크롤을 위한 아이템 높이 사전 계산
- [채팅 버블](https://hexdrinker.github.io/pretext-native/ko/guides/chat) — 한 줄 너비 최적화와 메시지 리스트 사전 캐싱
- [말줄임 / "더 보기"](https://hexdrinker.github.io/pretext-native/ko/guides/truncation) — 렌더링 없이 오버플로우 감지

## 제한사항

- 단일 스타일 텍스트 블록만 측정 (혼합 인라인 스타일이나 인라인 이미지는 미지원)
- JS 폴백은 휴리스틱 기반이며 픽셀 단위로 완벽하지 않음 — 프로덕션 정확도를 위해 네이티브 모듈 사용 권장
- API는 v0.0.2 — 핵심 API는 안정적이나 보조 API는 v1.0 전에 변경될 수 있음

[자세히 보기 →](https://hexdrinker.github.io/pretext-native/ko/limitations)

## 지원 플랫폼

- iOS 13+
- Android API 21+
- React Native 0.71+ (New Architecture 및 Legacy Bridge)

## 기여하기

기여를 환영합니다! Pull Request를 보내기 전에 [기여 가이드](./CONTRIBUTING.md)를 읽어주세요.

## 라이선스

[MIT](./LICENSE)
